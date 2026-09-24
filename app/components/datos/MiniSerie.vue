<script setup lang="ts">
/**
 * MiniSerie — un analito a lo ancho (formato A del médico: «cuál se ha salido, y cuándo»).
 *
 * Móvil primero: se dibuja al ancho real del contenedor (letra de 10-11 px de verdad) y todos
 * los minis comparten la ventana de tiempo y la línea de tiempo de arriba, así que se comparan
 * en vertical con el pulgar. Dos modos:
 *  · `real`: unidades del informe, banda del rango de referencia sombreada;
 *  · `lsn`: veces el límite superior normal del informe de ESE punto, escala log, línea en 1×.
 * Fuera de rango: triángulo relleno de 8 px hacia donde se sale (▲/▼). Dentro: solo la línea
 * (y un punto hueco pequeño si hay pocos valores). Contexto: bandas de las líneas sistémicas y
 * rayas en cada progresión. Tocar el gráfico fija una fecha, que se marca en TODOS los minis.
 */
import type { Analito, Contexto, Lang, Punto } from '~/utils/datosCaso'

const props = defineProps<{
  a: Analito
  nombre?: string
  modo: 'real' | 'lsn'
  desde: number
  hasta: number
  contexto: Contexto
  cursor: string | null
  /** Reproducción: solo se dibuja lo ocurrido hasta este instante (ms), y se marca con una raya. */
  cabezal?: number | null
  lang: Lang
}>()
const emit = defineEmits<{ cursor: [f: string | null] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const { armado, visto } = useAlVer(caja)
const H = 92
const X0 = EJE_IZQ
const Y0 = 8
const Y1 = H - 16

const tope = computed(() => props.cabezal ?? props.hasta)
const vis = computed(() => props.a.puntos.filter((p) => { const t = msFecha(p.f); return t >= props.desde && t <= Math.min(props.hasta, tope.value) }))
const val = (p: Punto) => (props.modo === 'lsn' ? xlsn(p) : p.v)

const geo = computed(() => {
  const X = linEscala(props.desde, props.hasta, X0, W.value - EJE_DER)
  // la escala se fija con toda la ventana (no con lo ya reproducido): así el eje no baila
  const vs = props.a.puntos.filter((p) => { const t = msFecha(p.f); return t >= props.desde && t <= props.hasta })
    .map(val).filter((v): v is number => v != null)
  let Y: (v: number) => number
  let ticks: { v: number; y: number; txt: string }[]
  let banda: { y0: number; y1: number } | null = null
  if (props.modo === 'lsn') {
    const min = Math.min(0.25, ...vs) * 0.9
    const max = Math.max(2, ...vs) * 1.1
    Y = logEscala(min, max, Y1, Y0)
    ticks = [0.25, 0.5, 1, 2, 5, 10, 20].filter((v) => v >= min && v <= max).map((v) => ({ v, y: Y(v), txt: `${numCaso(v, props.lang)}×` }))
  } else {
    const ref0 = props.a.ref
    const todos = vs.concat(ref0 ? [ref0.low, ref0.high] : [])
    const lo = Math.min(...todos)
    const hi = Math.max(...todos)
    const pad = (hi - lo) * 0.1 || 1
    Y = linEscala(Math.max(0, lo - pad), hi + pad, Y1, Y0)
    const redondo = (v: number) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10)
    ticks = (ref0 ? [ref0.low, ref0.high] : [lo, hi]).map((v) => ({ v, y: Y(v), txt: numCaso(redondo(v), props.lang) }))
    if (ref0) banda = { y0: Y(ref0.high), y1: Y(ref0.low) }
  }
  const pts = vis.value.map((p) => ({ p, v: val(p) })).filter((q): q is { p: Punto; v: number } => q.v != null)
    .map((q) => ({ ...q, x: X(msFecha(q.p.f)), y: Y(q.v) }))
  const anios: { x: number; a: number }[] = []
  for (let a = new Date(props.desde).getUTCFullYear() + 1; a <= new Date(props.hasta).getUTCFullYear(); a++)
    anios.push({ x: X(Date.UTC(a, 0, 1)), a })
  return {
    X, pts, ticks, banda, anios, uno: props.modo === 'lsn' ? Y(1) : null,
    d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join(''),
    bandas: props.contexto.bandas.filter((b) => b.fin > props.desde && b.ini < props.hasta)
      .map((b) => ({ id: b.id, x: X(Math.max(b.ini, props.desde)), w: Math.max(0, X(Math.min(b.fin, props.hasta)) - X(Math.max(b.ini, props.desde))) })),
    progs: props.contexto.progresiones.filter((t) => t >= props.desde && t <= props.hasta).map((t) => X(t)),
  }
})
const pocos = computed(() => geo.value.pts.length <= 24)
const ultimo = computed(() => vis.value[vis.value.length - 1])
const enCursor = computed(() => (props.cursor ? vis.value.find((p) => p.f === props.cursor) ?? null : null))
const mostrado = computed(() => enCursor.value ?? ultimo.value)
const cursorX = computed(() => (props.cabezal != null ? geo.value.X(props.cabezal) : props.cursor ? geo.value.X(msFecha(props.cursor)) : null))
const nFuera = computed(() => vis.value.filter((p) => p.fuera === 'alto' || p.fuera === 'bajo').length)

function tocar(ev: PointerEvent) {
  const svg = ev.currentTarget as SVGSVGElement
  const r = svg.getBoundingClientRect()
  const x = ((ev.clientX - r.left) / r.width) * W.value
  let mejor: string | null = null
  let dmin = 18
  for (const q of geo.value.pts) { const d = Math.abs(q.x - x); if (d < dmin) { dmin = d; mejor = q.p.f } }
  emit('cursor', mejor)
}
const valorTxt = (p: Punto) => {
  const base = `${numCaso(p.v, props.lang)} ${props.a.unidad}`
  const r = xlsn(p)
  return props.modo === 'lsn' && r != null ? `${base} · ${numCaso(Math.round(r * 10) / 10, props.lang)}×` : base
}
</script>

<template>
  <article class="ms" :class="{ 'ms--armado': armado, 'ms--visto': visto }">
    <header class="ms__cab">
      <h4 class="ms__nombre">{{ nombre ?? a.nombre }}</h4>
      <p v-if="mostrado" class="ms__valor nums" :class="{ 'ms__valor--cursor': enCursor }">
        <span v-if="mostrado.fuera" class="ms__marca" aria-hidden="true">{{ mostrado.fuera === 'bajo' ? '▼' : mostrado.fuera === 'alto' ? '▲' : '◆' }}</span>
        {{ valorTxt(mostrado) }}
        <span class="ms__fecha">{{ fechaCorta(mostrado.f, lang) }}</span>
      </p>
      <p v-else-if="cursor" class="ms__valor ms__fecha">{{ L('sin dato ese día', 'no value that day') }}</p>
      <DatosRangoBarra v-if="mostrado" :p="mostrado" :lang="lang" />
    </header>
    <div ref="caja">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="ms__svg" role="img"
           :aria-label="`${nombre ?? a.nombre}: ${vis.length} ${L('valores', 'values')}, ${nFuera} ${L('fuera de rango', 'out of range')}`"
           @pointerdown="tocar">
        <rect v-for="b in geo.bandas" :key="b.id" :x="b.x" :y="Y0" :width="b.w" :height="Y1 - Y0" class="ms__banda-linea" />
        <rect v-if="geo.banda" :x="X0" :y="geo.banda.y0" :width="W - 6 - X0" :height="Math.max(1, geo.banda.y1 - geo.banda.y0)" class="ms__rango" />
        <line v-for="(x, i) in geo.progs" :key="`p${i}`" :x1="x" :x2="x" :y1="Y0" :y2="Y1" class="ms__prog" />
        <line v-for="an in geo.anios" :key="an.a" :x1="an.x" :x2="an.x" :y1="Y1" :y2="Y1 + 4" class="ms__eje" />
        <text v-for="an in geo.anios" :key="`t${an.a}`" :x="an.x" :y="H - 2" text-anchor="middle" class="ms__tick">{{ an.a }}</text>
        <line :x1="X0" :x2="W - 6" :y1="Y1" :y2="Y1" class="ms__eje" />
        <template v-for="tk in geo.ticks" :key="tk.v">
          <line :x1="X0" :x2="W - 6" :y1="tk.y" :y2="tk.y" :class="tk.v === 1 && modo === 'lsn' ? 'ms__uno' : 'ms__rej'" />
          <text :x="X0 - 4" :y="tk.y + 3.5" text-anchor="end" class="ms__tick">{{ tk.txt }}</text>
        </template>
        <path :key="`${desde}-${hasta}`" :d="geo.d" class="ms__linea" pathLength="1" />
        <template v-for="q in geo.pts" :key="q.p.f">
          <path v-if="q.p.fuera === 'bajo'" :d="`M${rc(q.x - 4.5)},${rc(q.y - 3.5)}h9l-4.5,8Z`" class="ms__fuera" :style="{ animationDelay: `${Math.round((q.x / W) * 1200)}ms` }" />
          <path v-else-if="q.p.fuera === 'alto'" :d="`M${rc(q.x - 4.5)},${rc(q.y + 3.5)}h9l-4.5,-8Z`" class="ms__fuera" :style="{ animationDelay: `${Math.round((q.x / W) * 1200)}ms` }" />
          <!-- ◆ el informe lo marcó pero no se sale del rango extraído (p. ej. justo en el límite) -->
          <path v-else-if="q.p.fuera" :d="pathForma('rombo', q.x, q.y, 3.5)" class="ms__marcado" />
          <circle v-else-if="pocos" :cx="q.x" :cy="q.y" r="2.5" class="ms__dentro" />
        </template>
        <line v-if="cursorX != null" :x1="cursorX" :x2="cursorX" :y1="Y0 - 4" :y2="Y1" class="ms__cursor" />
      </svg>
    </div>
    <details class="ms__det">
      <summary>{{ L(`Los ${vis.length} valores`, `All ${vis.length} values`) }}<span v-if="nFuera"> · {{ nFuera }} {{ L('fuera de rango', 'out of range') }}</span></summary>
      <table class="ms__tabla nums">
        <thead><tr><th>{{ L('Fecha', 'Date') }}</th><th>{{ L('Valor', 'Value') }}</th><th>{{ L('Rango del informe', 'Reference range') }}</th></tr></thead>
        <tbody>
          <tr v-for="p in [...vis].reverse()" :key="p.f">
            <td>{{ p.f }}</td>
            <td :class="{ 'ms__td-fuera': p.fuera }">{{ numCaso(p.v, lang) }}{{ p.fuera === 'bajo' ? ' ▼' : p.fuera === 'alto' ? ' ▲' : p.fuera ? ' ◆' : '' }}</td>
            <td>{{ p.hi != null ? `${numCaso(p.lo ?? 0, lang)}–${numCaso(p.hi, lang)}` : '—' }}{{ p.ref_de === 'banda' ? ' *' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </article>
</template>

<style scoped>
.ms { padding: 10px 0 8px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.08); }
.ms__cab { display: flex; flex-direction: column; gap: 1px; }
@media (min-width: 520px) { .ms__cab { flex-direction: row; justify-content: space-between; align-items: baseline; gap: 8px; } }
.ms__nombre { font: 700 14px/1.25 var(--font-body); color: var(--color-text); margin: 0; }
.ms__valor { font: 600 13px var(--font-mono); color: var(--color-text); margin: 0; }
.ms__valor--cursor { color: var(--color-miriam); }
.ms__marca { color: var(--color-miriam); }
.ms__fecha { font: 400 11px var(--font-body); color: var(--color-text-soft); margin-left: 4px; }
.ms__svg { display: block; margin-top: 4px; touch-action: pan-y; cursor: crosshair; }
.ms__banda-linea { fill: var(--color-miriam); fill-opacity: 0.05; }
.ms__rango { fill: var(--color-text); fill-opacity: 0.09; }
.ms__prog { stroke: var(--color-text); stroke-opacity: 0.4; stroke-dasharray: 3 3; }
.ms__eje { stroke: var(--viz-eje); }
.ms__rej { stroke: var(--viz-rejilla); }
.ms__uno { stroke: var(--color-text); stroke-opacity: 0.55; stroke-width: 1.2; }
.ms__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.ms__linea { fill: none; stroke: var(--color-text); stroke-width: 1.6; stroke-linejoin: round; }
.ms__dentro { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.2; }
.ms__fuera { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.7; }
.ms__cursor { stroke: var(--color-miriam); stroke-width: 1.5; }
/* entrada: la línea se dibuja de izquierda a derecha y los ▲▼ saltan cuando la línea pasa */
.ms__fuera { transform-box: fill-box; transform-origin: center; }
.ms__marcado { fill: var(--color-bg); stroke: var(--color-miriam); stroke-width: 1.5; }
.ms--armado:not(.ms--visto) .ms__linea { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ms--armado:not(.ms--visto) .ms__fuera { opacity: 0; }
.ms--visto .ms__linea { stroke-dasharray: 1; animation: ms-trazo 1.3s var(--curva-salida) both; }
.ms--visto .ms__fuera { animation: ms-pop 380ms var(--curva-salida) both; }
@keyframes ms-trazo { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ms-pop { 0% { opacity: 0; transform: scale(0.2); } 70% { opacity: 1; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .ms--visto .ms__linea, .ms--visto .ms__fuera { animation: none; } }
.ms__det summary { font: 600 12.5px var(--font-body); color: var(--color-miriam); cursor: pointer; margin-top: 2px; min-height: 44px; display: flex; align-items: center; gap: 8px; list-style: none; }
.ms__det summary::-webkit-details-marker { display: none; }
.ms__det summary::after { content: ''; width: 6px; height: 6px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg) translateY(-2px); transition: transform var(--dur-micro) var(--curva-salida); }
.ms__det[open] summary::after { transform: rotate(-135deg) translateY(-2px); }
.ms__tabla { width: 100%; font: 400 12px var(--font-mono); border-collapse: collapse; margin-top: 4px; }
.ms__tabla th { text-align: left; font: 600 11px var(--font-body); color: var(--color-text-soft); padding: 4px; }
.ms__tabla td { padding: 3px 4px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.06); }
.ms__td-fuera { font-weight: 700; }
</style>
