<script setup lang="ts">
/**
 * PeliSerie — una analítica dentro de «La película del caso».
 *
 * Misma escala y mismas marcas que MiniSerie (▲▼ fuera de rango, banda del rango, 1× en modo
 * `lsn`), pero pensada para mirarla mientras el cabezal avanza: la línea se descubre hasta el
 * cabezal, un aro marca el ÚLTIMO VALOR REAL y la cabecera lo escribe con su fecha. (La etiqueta
 * flotante sobre el punto se probó y tapaba el tramo más reciente: diseno, 10-oct-2026.)
 *
 * La cifra no se interpola nunca: es la del último punto de caso.json con fecha ≤ cabezal, y salta
 * de uno al siguiente. La línea llega solo hasta ese punto. `data-k`, `data-f` y `data-v` dejan que el test de cifras coteje lo
 * pintado contra caso.json.
 */
import type { Analito, Contexto, Lang, Punto } from '~/utils/datosCaso'
import { unidadTxt, valCaso } from '~/utils/datosCaso'

const props = defineProps<{
  a: Analito
  nombre: string
  modo: 'real' | 'lsn'
  desde: number
  hasta: number
  cabezal: number
  contexto: Contexto
  lang: Lang
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const recorte = useId()
const H = 88
const X0 = EJE_IZQ
const Y0 = 8
const Y1 = H - 16
const val = (p: Punto) => (props.modo === 'lsn' ? xlsn(p) : p.v)

/* la geometría depende de la ventana, no del cabezal: el eje no baila y solo se recalcula al cambiar el ancho */
const geo = computed(() => {
  const X = linEscala(props.desde, props.hasta, X0, W.value - EJE_DER)
  const enVentana = props.a.puntos.filter((p) => { const t = msFecha(p.f); return t >= props.desde && t <= props.hasta })
  const vs = enVentana.map(val).filter((v): v is number => v != null)
  let Y: (v: number) => number
  let ticks: { v: number; y: number; txt: string }[]
  let banda: { y0: number; y1: number } | null = null
  if (props.modo === 'lsn') {
    const min = Math.min(0.25, ...vs) * 0.9
    const max = Math.max(2, ...vs) * 1.1
    Y = logEscala(min, max, Y1, Y0)
    ticks = [0.25, 1, 5, 20].filter((v) => v >= min && v <= max).map((v) => ({ v, y: Y(v), txt: `${numCaso(v, props.lang)}×` }))
  } else {
    const ref0 = props.a.ref
    const todos = vs.concat(ref0 ? [ref0.low, ref0.high] : [])
    const lo = Math.min(...todos)
    const hi = Math.max(...todos)
    const pad = (hi - lo) * 0.1 || 1
    Y = linEscala(Math.max(0, lo - pad), hi + pad, Y1, Y0)
    ticks = (ref0 ? [ref0.low, ref0.high] : [lo, hi]).map((v) => ({ v, y: Y(v), txt: numCaso(Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10, props.lang) }))
    if (ref0) banda = { y0: Y(ref0.high), y1: Y(ref0.low) }
  }
  const pts = enVentana.map((p) => ({ p, v: val(p), t: msFecha(p.f) })).filter((q): q is { p: Punto; v: number; t: number } => q.v != null)
    .map((q) => ({ ...q, x: X(q.t), y: Y(q.v) }))
  return {
    X, pts, ticks, banda,
    d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join(''),
    bandas: props.contexto.bandas.filter((b) => b.fin > props.desde && b.ini < props.hasta)
      .map((b) => ({ id: b.id, x: X(Math.max(b.ini, props.desde)), w: Math.max(0, X(Math.min(b.fin, props.hasta)) - X(Math.max(b.ini, props.desde))) })),
  }
})
const xCabezal = computed(() => geo.value.X(props.cabezal))
const pasados = computed(() => geo.value.pts.filter((q) => q.t <= props.cabezal))
/** el último valor real por el que ya pasó el cabezal: lo único que se lee */
const actual = computed(() => pasados.value[pasados.value.length - 1] ?? null)
const valorTxt = (p: Punto) => {
  const base = `${valCaso(p, props.lang)} ${unidadTxt(props.a.unidad)}`
  const r = xlsn(p)
  return props.modo === 'lsn' && r != null ? `${base} · ${numCaso(Math.round(r * 10) / 10, props.lang)}×` : base
}
/** hasta dónde se ve la línea (px): hasta el último análisis real, nunca hasta el cabezal. Un tramo
 *  dibujado más allá se leería como un valor que nadie midió. Va como atributo `width` y sin
 *  transición: sigue al dedo 1:1 al arrastrar y no depende de `transform` dentro de un clipPath. */
const trazado = computed(() => (actual.value ? rc(actual.value.x + 1) : 0))
const marca = (p: Punto) => (p.fuera === 'bajo' ? '▼ ' : p.fuera === 'alto' ? '▲ ' : p.fuera ? '◆ ' : '')
</script>

<template>
  <article class="ps" :data-k="a.key" :data-f="actual?.p.f ?? ''" :data-v="actual ? String(actual.p.v) : ''">
    <header class="ps__cab">
      <h3 class="ps__nombre">{{ nombre }}</h3>
      <p v-if="actual" class="ps__lee nums">
        <span class="ps__valor">{{ marca(actual.p) }}{{ valorTxt(actual.p) }}</span> · {{ fechaCorta(actual.p.f, lang) }}
      </p>
      <p v-else class="ps__lee">{{ L('aún sin análisis', 'no test yet') }}</p>
    </header>
    <div ref="caja" class="ps__caja">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="ps__svg" aria-hidden="true">
        <defs><clipPath :id="recorte"><rect x="0" y="0" :width="trazado" :height="H" /></clipPath></defs>
        <rect v-for="b in geo.bandas" :key="b.id" :x="b.x" :y="Y0" :width="b.w" :height="Y1 - Y0" class="ps__banda-linea" />
        <rect v-if="geo.banda" :x="X0" :y="geo.banda.y0" :width="W - 6 - X0" :height="Math.max(1, geo.banda.y1 - geo.banda.y0)" class="ps__rango" />
        <line :x1="X0" :x2="W - 6" :y1="Y1" :y2="Y1" class="ps__eje" />
        <template v-for="tk in geo.ticks" :key="tk.v">
          <line :x1="X0" :x2="W - 6" :y1="tk.y" :y2="tk.y" :class="tk.v === 1 && modo === 'lsn' ? 'ps__uno' : 'ps__rej'" />
          <text :x="X0 - 4" :y="tk.y + 3.5" text-anchor="end" class="ps__tick">{{ tk.txt }}</text>
        </template>
        <path :d="geo.d" class="ps__linea" :clip-path="`url(#${recorte})`" />
        <template v-for="q in pasados" :key="q.p.f">
          <path v-if="q.p.fuera === 'bajo'" :d="`M${rc(q.x - 4.5)},${rc(q.y - 3.5)}h9l-4.5,8Z`" class="ps__fuera" />
          <path v-else-if="q.p.fuera === 'alto'" :d="`M${rc(q.x - 4.5)},${rc(q.y + 3.5)}h9l-4.5,-8Z`" class="ps__fuera" />
          <path v-else-if="q.p.fuera" :d="pathForma('rombo', q.x, q.y, 3.5)" class="ps__marcado" />
        </template>
        <circle v-if="actual" :cx="actual.x" :cy="actual.y" r="4.5" class="ps__ahora" />
        <line :x1="xCabezal" :x2="xCabezal" :y1="Y0 - 6" :y2="Y1" class="ps__cabezal" />
      </svg>
    </div>
  </article>
</template>

<style scoped>
.ps { padding: 8px 0 2px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.08); }
.ps__cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ps__nombre { font: 700 14px/1.25 var(--font-body); color: var(--color-text); margin: 0; }
.ps__lee { font: 400 12px var(--font-body); color: var(--color-text-soft); margin: 0; text-align: right; }
.ps__caja { position: relative; }
.ps__svg { display: block; }
.ps__valor { font: 700 13px var(--font-mono); color: var(--color-text); white-space: nowrap; }
.ps__banda-linea { fill: var(--color-miriam); fill-opacity: 0.05; }
.ps__rango { fill: var(--color-text); fill-opacity: 0.09; }
.ps__eje { stroke: var(--viz-eje); }
.ps__rej { stroke: var(--viz-rejilla); }
.ps__uno { stroke: var(--color-text); stroke-opacity: 0.55; stroke-width: 1.2; }
.ps__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.ps__linea { fill: none; stroke: var(--color-text); stroke-width: 1.8; stroke-linejoin: round; }
.ps__fuera { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.7; }
.ps__marcado { fill: var(--color-bg); stroke: var(--color-miriam); stroke-width: 1.5; }
.ps__ahora { fill: var(--color-bg); stroke: var(--color-miriam); stroke-width: 2.5; }
.ps__cabezal { stroke: var(--color-miriam); stroke-width: 1.5; }
</style>
