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
/** las fechas con analítica en la ventana, una vez cada una: son los pasos del teclado y del slider ARIA */
const fechasOrd = computed(() => [...new Set(geo.value.celdas.map((c) => c.p.f))].sort())
// si la fecha fijada no tiene analítica hepática, no hay posición que anunciar: sin aria-valuenow (el texto lo dice)
const idxSel = computed(() => { const i = fechaSel.value ? fechasOrd.value.indexOf(fechaSel.value) : -1; return i >= 0 ? i : undefined })
const fechaSel = computed(() => props.cursor ?? (geo.value.celdas.length ? geo.value.celdas.reduce((m, c) => (c.p.f > m ? c.p.f : m), '') : null))
const lecturaDe = (fecha: string | null) => props.filas.map((f) => {
  const p = f.a.puntos.find((q) => q.f === fecha) as Punto | undefined
  const r = p ? xlsn(p) : null
  return { nombre: f.nombre, txt: r != null ? `${numCaso(Math.round(r * 10) / 10, props.lang)}×` : '—', fuera: p?.fuera === 'alto' || p?.fuera === 'bajo',
    forma: p?.fuera === 'alto' ? '▲' : p?.fuera === 'bajo' ? '▼' : p?.fuera ? '◆' : '' }
})
const lectura = computed(() => lecturaDe(fechaSel.value))
/** forma de una celda fuera de rango, centrada arriba en la celda (ancho = el de la celda, tope 8 px) */
const formaCelda = (c: { i: number; x: number; p: Punto }) => {
  const w = Math.min(8, geo.value.ancho), y = TOP + c.i * FILA + 5, x = c.x
  if (c.p.fuera === 'alto') return `M${rc(x - w / 2)},${rc(y + w * 0.85)}h${rc(w)}l${rc(-w / 2)},${rc(-w * 0.85)}Z`
  if (c.p.fuera === 'bajo') return `M${rc(x - w / 2)},${y}h${rc(w)}l${rc(-w / 2)},${rc(w * 0.85)}Z`
  return pathForma('rombo', x, y + w / 2, w / 2.4)
}
// tocar fija una fecha; arrastrar con el dedo o el ratón la recorre (scrubbing)
let arrastrando = false
function empezar(ev: PointerEvent) { arrastrando = true; (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId); tocar(ev) }
function arrastrar(ev: PointerEvent) {
  if (arrastrando) { tocar(ev); return }
  if (ev.pointerType === 'mouse') hover.value = fechaCercana(ev) // ratón sin botón: tooltip; el dedo sigue fijando
}
const hover = ref<string | null>(null)
const enfocado = ref(false)
function fechaCercana(ev: PointerEvent) {
  const svg = ev.currentTarget as SVGSVGElement
  const x = ((ev.clientX - svg.getBoundingClientRect().left) / svg.getBoundingClientRect().width) * W.value
  let mejor: string | null = null
  let dmin = 24
  for (const c of geo.value.celdas) { const d = Math.abs(c.x - x); if (d < dmin) { dmin = d; mejor = c.p.f } }
  return mejor
}
const tip = computed(() => {
  const f = hover.value ?? (enfocado.value ? fechaSel.value : null)
  return f ? { f, x: geo.value.X(msFecha(f)), filas: lecturaDe(f) } : null
})
function soltar() { arrastrando = false }
function tecla(ev: KeyboardEvent) {
  const fs = fechasOrd.value
  if (!fs.length) return
  let i = props.cursor ? fs.indexOf(props.cursor) : -1
  if (ev.key === 'ArrowLeft') i = Math.max(0, (i < 0 ? fs.length : i) - 1)
  else if (ev.key === 'ArrowRight') i = Math.min(fs.length - 1, i + 1)
  else if (ev.key === 'Home') i = 0
  else if (ev.key === 'End') i = fs.length - 1
  else if (ev.key === 'Escape') { emit('cursor', null); return }
  else return
  ev.preventDefault(); emit('cursor', fs[i]!)
}
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
    <div ref="caja" class="cinta__caja">
      <DatosTip v-if="tip" :x="tip.x" :y="TOP + 4" :ancho="W" :alto="H">
        <span class="tip__v">{{ fechaCorta(tip.f, lang) }}</span>
        <span v-for="l in tip.filas" :key="l.nombre" class="tip__l">{{ l.nombre }} {{ l.forma }}{{ l.txt }}</span>
        <span class="tip__l">{{ L('veces el límite de cada informe', 'times each report’s limit') }} · ↧ {{ L('extraído', 'extracted') }}</span>
      </DatosTip>
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="cinta__svg" role="slider" tabindex="0"
           :aria-valuemin="0" :aria-valuemax="Math.max(0, fechasOrd.length - 1)" :aria-valuenow="idxSel"
           :aria-valuetext="fechaSel ? `${fechaCorta(fechaSel, lang)}: ${lectura.map((l) => `${l.nombre} ${l.txt}`).join(', ')}` : ''"
           @keydown="tecla" @pointerdown="empezar" @pointermove="arrastrar" @pointerup="soltar" @pointercancel="soltar" @pointerleave="hover = null" @focus="enfocado = true" @blur="enfocado = false"
           :aria-label="L('Pruebas hepáticas en veces el límite normal, una celda por analítica. Flechas para recorrer las fechas.', 'Liver tests in multiples of the upper limit of normal, one cell per lab report. Arrow keys move through dates.')">
        <defs>
          <filter id="cinta-brillo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <line v-for="(x, i) in geo.progs" :key="`p${i}`" :x1="x" :x2="x" :y1="0" :y2="TOP + filas.length * FILA" class="cinta__prog" />
        <text v-for="(f, i) in filas" :key="f.nombre" x="0" :y="TOP + i * FILA + FILA / 2 + 4" class="cinta__fila">{{ f.nombre }}</text>
        <rect v-for="c in geo.celdas" :key="`${c.i}-${c.p.f}`" :x="rc(c.x - geo.ancho / 2)" :y="TOP + c.i * FILA + 3"
              :width="rc(geo.ancho)" :height="FILA - 6" rx="1.5" class="cinta__celda" :style="{ ...estilo(c.r), animationDelay: `${Math.round((c.x / W) * 1400)}ms` }" />
        <!-- fuera de rango también por FORMA, no solo por brillo (▲ alto, ▼ bajo, ◆ marcado), según el informe de esa celda -->
        <template v-if="geo.ancho >= 4">
          <path v-for="c in geo.celdas.filter((q) => q.p.fuera)" :key="`f${c.i}-${c.p.f}`" :d="formaCelda(c)" class="cinta__forma" />
        </template>
        <line v-if="cursor" :x1="geo.X(msFecha(cursor))" :x2="geo.X(msFecha(cursor))" y1="0" :y2="TOP + filas.length * FILA" class="cinta__cursor" />
        <line v-if="cabezal != null" :x1="geo.X(cabezal)" :x2="geo.X(cabezal)" y1="0" :y2="TOP + filas.length * FILA" class="cinta__cursor" />
        <text v-for="an in geo.anios" :key="an.a" :x="an.x" :y="H - 4" text-anchor="middle" class="cinta__anio">{{ an.a }}</text>
      </svg>
    </div>
    <figcaption class="cinta__lectura">
      <span v-if="fechaSel" class="cinta__fecha nums">{{ fechaCorta(fechaSel, lang) }}</span>
      <span v-for="l in lectura" :key="l.nombre" class="nums" :class="{ 'cinta__alto': l.fuera }">{{ l.nombre }} <span v-if="l.forma" aria-hidden="true">{{ l.forma }}</span>{{ l.txt }}</span>
    </figcaption>
    <p class="cinta__ley">
      <span v-for="(m, i) in [
        [L('bajo el límite', 'below limit'), 'background: rgb(var(--color-bg-rgb) / 0.3)'],
        ['1×', 'background: rgb(var(--color-miriam-claro-rgb) / 0.45)'],
        ['2×', 'background: rgb(var(--color-miriam-claro-rgb) / 0.75); box-shadow: 0 0 5px rgb(var(--color-miriam-claro-rgb))'],
        [L('4× o más', '4× or more'), 'background: rgb(var(--color-miriam-claro-rgb)); box-shadow: 0 0 7px rgb(var(--color-miriam-claro-rgb))']]" :key="i" class="cinta__paso">
        <i :style="m[1]" />{{ m[0] }}
      </span>
      <span class="cinta__paso"><span aria-hidden="true">▲ ▼</span> {{ L('fuera del rango de su informe', 'outside its report’s range') }}</span>
    </p>
  </figure>
</template>

<style scoped>
.cinta { margin: 0; background: radial-gradient(120% 120% at 80% 0%, var(--cielo-resplandor) 0%, var(--color-text) 75%); border-radius: 16px; padding: 14px 0 12px; color: var(--color-bg); }
/* sin relleno lateral en el gráfico: así su eje X cae en la misma x que la línea de tiempo */
.cinta__lectura, .cinta__ley { padding: 0 12px; }
.cinta__caja { position: relative; }
.cinta__svg:focus-visible { outline: 2px solid var(--color-miriam-claro); outline-offset: 2px; }
.cinta__svg { display: block; overflow: visible; touch-action: pan-y; cursor: crosshair; }
.cinta__fila { font: 700 10.5px var(--font-mono); fill: rgb(var(--color-bg-rgb) / 0.85); }
.cinta__anio { font: 600 10px var(--font-mono); fill: rgb(var(--color-bg-rgb) / 0.6); }
.cinta__prog { stroke: rgb(var(--color-bg-rgb) / 0.35); stroke-dasharray: 3 3; }
.cinta__forma { fill: var(--color-text); stroke: rgb(var(--color-bg-rgb) / 0.55); stroke-width: 0.6; pointer-events: none; }
.cinta--armado:not(.cinta--visto) .cinta__forma { opacity: 0; }
.cinta--visto .cinta__forma { transition: opacity 400ms 1.2s; }
.cinta__cursor { stroke: var(--color-miriam-claro); stroke-width: 1.5; }
.cinta__celda { transform-box: fill-box; transform-origin: center bottom; }
.cinta--armado:not(.cinta--visto) .cinta__celda { opacity: 0; }
.cinta--visto .cinta__celda { animation: cinta-sube 520ms var(--curva-salida) both; }
@keyframes cinta-sube { from { opacity: 0; transform: scaleY(0.1); } to { opacity: 1; transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .cinta--visto .cinta__celda { animation: none; } .cinta--visto .cinta__forma { transition: none; } }
.cinta__lectura { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font: 600 12.5px var(--font-mono); color: rgb(var(--color-bg-rgb) / 0.85); }
.cinta__fecha { color: var(--color-miriam-claro); }
.cinta__alto { color: var(--color-bg); }
.cinta__ley { display: flex; align-items: center; gap: 8px; margin: 6px 0 0; font: 400 11.5px var(--font-body); color: rgb(var(--color-bg-rgb) / 0.7); }
.cinta__ley { flex-wrap: wrap; gap: 4px 14px; }
.cinta__paso { display: inline-flex; align-items: center; gap: 6px; }
.cinta__paso i { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
</style>
