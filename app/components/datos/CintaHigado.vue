<script setup lang="ts">
/**
 * CintaHigado — el hígado entero en una cinta de calor, con el lenguaje de píxeles del cielo de
 * arriba. Una fila por prueba (AST, ALT, fosfatasa alcalina, GGT, bilirrubina), una celda por
 * analítica, en su fecha (mismo eje que la línea de tiempo). El tono dice cuántas veces supera
 * el límite superior normal DE SU INFORME: tenue por debajo de 1×, violeta cada vez más intenso
 * por encima, y brilla desde 2×. Leer «qué hizo el hígado con cada línea» de un golpe es lo que
 * cinco gráficos de líneas no dan. Las cifras exactas: al tocar, y en los gráficos de debajo.
 */
import type { Analito, Contexto, Lang, Punto } from '~/utils/datosCaso'

const props = defineProps<{
  filas: { a: Analito; nombre: string }[]
  desde: number
  hasta: number
  contexto: Contexto
  cursor: string | null
  cabezal?: number | null
  lang: Lang
}>()
const emit = defineEmits<{ cursor: [f: string | null] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const { armado, visto } = useAlVer(caja)
const FILA = 26
const TOP = 6
const H = computed(() => TOP + props.filas.length * FILA + 22)
const tope = computed(() => Math.min(props.hasta, props.cabezal ?? Infinity))

const geo = computed(() => {
  const X = linEscala(props.desde, props.hasta, EJE_IZQ, W.value - EJE_DER)
  const fechas = new Set<string>()
  const celdas = props.filas.flatMap((f, i) => f.a.puntos
    .filter((p) => { const t = msFecha(p.f); return t >= props.desde && t <= tope.value })
    .map((p) => { fechas.add(p.f); return { p, i, x: X(msFecha(p.f)), r: xlsn(p) } }))
  const n = Math.max(1, fechas.size)
  const ancho = Math.max(3, Math.min(12, ((W.value - EJE_IZQ - EJE_DER) / n) * 0.8))
  const anios: { x: number; a: number }[] = []
  for (let a = new Date(props.desde).getUTCFullYear() + 1; a <= new Date(props.hasta).getUTCFullYear(); a++) anios.push({ x: X(Date.UTC(a, 0, 1)), a })
  return { X, celdas, ancho, anios,
    progs: props.contexto.progresiones.filter((t) => t >= props.desde && t <= props.hasta).map((t) => X(t)) }
})
/** Tono por veces el LSN: una sola rampa (violeta), la forma la da el brillo desde 2×. */
const estilo = (r: number | null) => {
  if (r == null) return { fill: 'rgb(var(--color-bg-rgb) / 0.12)' }
  if (r < 1) return { fill: `rgb(var(--color-bg-rgb) / ${(0.14 + 0.36 * r).toFixed(2)})` }
  const k = Math.min(1, 0.45 + Math.log2(r) / 2.5)
  return { fill: `rgb(var(--color-miriam-claro-rgb) / ${k.toFixed(2)})`, filter: r >= 2 ? 'url(#cinta-brillo)' : undefined }
}
const fechaSel = computed(() => props.cursor ?? (geo.value.celdas.length ? geo.value.celdas.reduce((m, c) => (c.p.f > m ? c.p.f : m), '') : null))
const lectura = computed(() => props.filas.map((f) => {
  const p = f.a.puntos.find((q) => q.f === fechaSel.value) as Punto | undefined
  const r = p ? xlsn(p) : null
  return { nombre: f.nombre, txt: r != null ? `${numCaso(Math.round(r * 10) / 10, props.lang)}×` : '—', fuera: !!p?.fuera }
}))
function tocar(ev: PointerEvent) {
  const svg = ev.currentTarget as SVGSVGElement
  const x = ((ev.clientX - svg.getBoundingClientRect().left) / svg.getBoundingClientRect().width) * W.value
  let mejor: string | null = null
  let dmin = 16
  for (const c of geo.value.celdas) { const d = Math.abs(c.x - x); if (d < dmin) { dmin = d; mejor = c.p.f } }
  emit('cursor', mejor)
}
</script>

<template>
  <figure class="cinta" :class="{ 'cinta--armado': armado, 'cinta--visto': visto }">
    <div ref="caja">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="cinta__svg" role="img" @pointerdown="tocar"
           :aria-label="L('Pruebas hepáticas en veces el límite normal, una celda por analítica.', 'Liver tests in multiples of the upper limit of normal, one cell per lab report.')">
        <defs>
          <filter id="cinta-brillo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <line v-for="(x, i) in geo.progs" :key="`p${i}`" :x1="x" :x2="x" :y1="0" :y2="TOP + filas.length * FILA" class="cinta__prog" />
        <text v-for="(f, i) in filas" :key="f.nombre" x="0" :y="TOP + i * FILA + FILA / 2 + 4" class="cinta__fila">{{ f.nombre }}</text>
        <rect v-for="c in geo.celdas" :key="`${c.i}-${c.p.f}`" :x="rc(c.x - geo.ancho / 2)" :y="TOP + c.i * FILA + 3"
              :width="rc(geo.ancho)" :height="FILA - 6" rx="1.5" class="cinta__celda" :style="{ ...estilo(c.r), animationDelay: `${Math.round((c.x / W) * 1400)}ms` }" />
        <line v-if="cursor" :x1="geo.X(msFecha(cursor))" :x2="geo.X(msFecha(cursor))" y1="0" :y2="TOP + filas.length * FILA" class="cinta__cursor" />
        <line v-if="cabezal != null" :x1="geo.X(cabezal)" :x2="geo.X(cabezal)" y1="0" :y2="TOP + filas.length * FILA" class="cinta__cursor" />
        <text v-for="an in geo.anios" :key="an.a" :x="an.x" :y="H - 4" text-anchor="middle" class="cinta__anio">{{ an.a }}</text>
      </svg>
    </div>
    <figcaption class="cinta__lectura">
      <span v-if="fechaSel" class="cinta__fecha nums">{{ fechaCorta(fechaSel, lang) }}</span>
      <span v-for="l in lectura" :key="l.nombre" class="nums" :class="{ 'cinta__alto': l.fuera }">{{ l.nombre }} {{ l.txt }}</span>
    </figcaption>
    <p class="cinta__ley">
      <span v-for="(m, i) in [
        [L('bajo el límite', 'below limit'), 'background: rgb(var(--color-bg-rgb) / 0.3)'],
        ['1×', 'background: rgb(var(--color-miriam-claro-rgb) / 0.45)'],
        ['2×', 'background: rgb(var(--color-miriam-claro-rgb) / 0.75); box-shadow: 0 0 5px rgb(var(--color-miriam-claro-rgb))'],
        [L('4× o más', '4× or more'), 'background: rgb(var(--color-miriam-claro-rgb)); box-shadow: 0 0 7px rgb(var(--color-miriam-claro-rgb))']]" :key="i" class="cinta__paso">
        <i :style="m[1]" />{{ m[0] }}
      </span>
    </p>
  </figure>
</template>

<style scoped>
.cinta { margin: 0; background: radial-gradient(120% 120% at 80% 0%, var(--cielo-resplandor) 0%, var(--color-text) 75%); border-radius: 16px; padding: 14px 0 12px; color: var(--color-bg); }
/* sin relleno lateral en el gráfico: así su eje X cae en la misma x que la línea de tiempo */
.cinta__lectura, .cinta__ley { padding: 0 12px; }
.cinta__svg { display: block; overflow: visible; touch-action: pan-y; cursor: crosshair; }
.cinta__fila { font: 700 10.5px var(--font-mono); fill: rgb(var(--color-bg-rgb) / 0.85); }
.cinta__anio { font: 600 10px var(--font-mono); fill: rgb(var(--color-bg-rgb) / 0.6); }
.cinta__prog { stroke: rgb(var(--color-bg-rgb) / 0.35); stroke-dasharray: 3 3; }
.cinta__cursor { stroke: var(--color-miriam-claro); stroke-width: 1.5; }
.cinta__celda { transform-box: fill-box; transform-origin: center bottom; }
.cinta--armado:not(.cinta--visto) .cinta__celda { opacity: 0; }
.cinta--visto .cinta__celda { animation: cinta-sube 520ms var(--curva-salida) both; }
@keyframes cinta-sube { from { opacity: 0; transform: scaleY(0.1); } to { opacity: 1; transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .cinta--visto .cinta__celda { animation: none; } }
.cinta__lectura { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font: 600 12.5px var(--font-mono); color: rgb(var(--color-bg-rgb) / 0.85); }
.cinta__fecha { color: var(--color-miriam-claro); }
.cinta__alto { color: var(--color-bg); }
.cinta__ley { display: flex; align-items: center; gap: 8px; margin: 6px 0 0; font: 400 11.5px var(--font-body); color: rgb(var(--color-bg-rgb) / 0.7); }
.cinta__ley { flex-wrap: wrap; gap: 4px 14px; }
.cinta__paso { display: inline-flex; align-items: center; gap: 6px; }
.cinta__paso i { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
</style>
