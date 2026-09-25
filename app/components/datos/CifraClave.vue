<script setup lang="ts">
/**
 * CifraClave — una cifra que importa hoy: valor grande, qué es, de cuándo, y su tendencia en
 * miniatura. Una cifra suelta no se grafica (dataviz: «the number is the chart»); la mini línea
 * solo dice hacia dónde va. Fuera de rango se dice con ▲/▼ y palabra, no solo con color.
 */
const props = defineProps<{
  etiqueta: string
  valor: string
  unidad?: string
  detalle?: string
  fecha?: string
  sello?: string
  fuera?: 'alto' | 'bajo' | 'fuera' | null
  serie?: number[]
  /** fuera de rango de cada valor de la serie (▲▼◆ en la minilínea, no solo color) */
  formas?: ('alto' | 'bajo' | 'fuera' | null)[]
  /** rango normal del informe de CADA valor, en la unidad de la serie: banda gris en escalones */
  bandas?: ([number, number] | null)[]
  /** tira de días (true = en una línea de tratamiento), mismo lenguaje que «Cada día» */
  franja?: boolean[]
  /** valor anterior para comparar: «antes: 215,4 · 19 ago» */
  previo?: string
  /** nota corta con su propio sello (p. ej. la Hb tras la transfusión) */
  nota?: string
  notaSello?: string
  lang: 'es' | 'en'
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const W = 120
const H = 34
/* marca de cada valor: ▲ alto, ▼ bajo, ◆ marcado; el último, más grande y relleno */
const marca = (m: { x: number; y: number; fuera: string | null; ultimo: boolean }) => {
  const r = m.ultimo ? 3.6 : 2.4
  if (m.fuera === 'alto') return `M${rc(m.x - r)},${rc(m.y + r * 0.8)}h${rc(2 * r)}l${rc(-r)},${rc(-r * 1.7)}Z`
  if (m.fuera === 'bajo') return `M${rc(m.x - r)},${rc(m.y - r * 0.8)}h${rc(2 * r)}l${rc(-r)},${rc(r * 1.7)}Z`
  if (m.fuera) return pathForma('rombo', m.x, m.y, r * 0.85)
  return m.ultimo ? pathForma('circulo', m.x, m.y, r * 0.9) : ''
}

/* animación: la cifra cuenta desde 0 y la mini línea se dibuja al entrar en pantalla */
const raiz = ref<HTMLElement | null>(null)
const { armado, visto } = useAlVer(raiz)
// Sin contador desde 0: pasaría por cifras que nunca existieron (lo avisó la investigación de
// dashboards). La cifra entra ya con su valor real; lo que se anima es la minilínea.
const mostrado = computed(() => props.valor)
const spark = computed(() => {
  const s = props.serie ?? []
  if (s.length < 2) return null
  // la banda entra en la escala: así se ve si la línea está dentro, encima o debajo del rango
  const bs = (props.bandas ?? []).slice(0, s.length)
  const lim = bs.flatMap((b) => b ?? [])
  const lo = Math.min(...s, ...lim)
  const hi = Math.max(...s, ...lim)
  const X = (i: number) => rc(5 + (i / (s.length - 1)) * (W - 10))
  const Y = (v: number) => rc(H - 5 - ((v - lo) / (hi - lo || 1)) * (H - 10))
  const f = props.formas ?? []
  const marcas = s.map((v, i) => ({ x: X(i), y: Y(v), fuera: f[i] ?? null, ultimo: i === s.length - 1 }))
  // cada informe manda en su tramo: de la mitad con el anterior a la mitad con el siguiente
  const banda = bs.map((b, i) => {
    if (!b) return ''
    const x0 = i === 0 ? 0 : (X(i - 1) + X(i)) / 2, x1 = i === s.length - 1 ? W : (X(i) + X(i + 1)) / 2
    const y0 = Y(b[1]), h = Math.max(1.5, Y(b[0]) - Y(b[1]))
    return `M${rc(x0)},${rc(y0)}h${rc(x1 - x0)}v${rc(h)}h${rc(x0 - x1)}Z`
  }).join('')
  return { d: s.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(''), marcas, banda }
})
</script>

<template>
  <div ref="raiz" class="ck" :class="{ 'ck--armado': armado, 'ck--visto': visto }">
    <p class="ck__etq">{{ etiqueta }}</p>
    <p class="ck__valor" :class="{ 'ck__valor--texto': valor.length > 8 }">
      <span class="nums">{{ mostrado }}</span>
      <span v-if="unidad" class="ck__unidad">{{ unidad }}</span>
    </p>
    <p v-if="fuera" class="ck__fuera">
      <span aria-hidden="true">{{ fuera === 'bajo' ? '▼' : fuera === 'alto' ? '▲' : '◆' }}</span>
      {{ fuera === 'bajo' ? L('por debajo del rango', 'below range') : fuera === 'alto' ? L('por encima del rango', 'above range') : L('marcado en el informe', 'flagged on report') }}
    </p>
    <p v-if="detalle" class="ck__det">{{ detalle }}</p>
    <p v-if="previo" class="ck__previo nums">{{ previo }}</p>
    <p v-if="nota" class="ck__nota">{{ nota }} <DatosSello v-if="notaSello" :s="notaSello" :lang="lang" /></p>
    <svg v-if="franja?.length" :viewBox="`0 0 ${franja.length * 3} 14`" class="ck__franja" preserveAspectRatio="none" aria-hidden="true">
      <rect v-for="(d, i) in franja" :key="i" :x="i * 3" :y="d ? 0 : 5" width="2" :height="d ? 14 : 4" :class="d ? 'ck__on' : 'ck__off'" />
    </svg>
    <p v-if="franja?.length" class="ck__franja-txt">{{ L('últimos 90 días · alto = con tratamiento', 'last 90 days · tall = on treatment') }}</p>
    <svg v-if="spark" :viewBox="`0 0 ${W} ${H}`" class="ck__spark" aria-hidden="true">
      <path v-if="spark.banda" :d="spark.banda" class="ck__banda" />
      <path :d="spark.d" class="ck__linea" pathLength="1" />
      <template v-for="(m, i) in spark.marcas" :key="i">
        <path v-if="marca(m)" :d="marca(m)" :class="m.ultimo ? 'ck__ultimo' : 'ck__marca'" :style="{ '--i': i }" />
      </template>
    </svg>
    <p class="ck__pie">
      <span v-if="fecha" class="nums">{{ fecha }}</span>
      <DatosSello v-if="sello && sello !== 'extraido'" :s="sello" :lang="lang" />
    </p>
  </div>
</template>

<style scoped>
.ck { background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 14px;
  padding: 16px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ck__etq { font: 600 12.5px/1.3 var(--font-body); color: var(--color-text-soft); margin: 0; }
.ck__valor { margin: 2px 0 0; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
.ck__valor .nums { font: var(--tipo-cifra); font-size: clamp(26px, 7vw, 36px); letter-spacing: var(--track-cifra); color: var(--color-text); }
.ck__valor--texto .nums { font-size: clamp(20px, 5.4vw, 26px); line-height: 1.1; }
.ck__pie :deep(.sello) { white-space: normal; }
.ck__unidad { font: 500 12px var(--font-mono); color: var(--color-text-soft); }
.ck__fuera { font: 700 12px/1.3 var(--font-body); color: var(--color-miriam); margin: 0; }
.ck__previo { font: 500 11.5px var(--font-mono); color: var(--color-text-soft); margin: 2px 0 0; }
.ck__nota { font: 400 11.5px/1.35 var(--font-body); color: var(--color-text); margin: 4px 0 0; }
.ck__det { font: 400 12.5px/1.35 var(--font-body); color: var(--color-text); margin: 2px 0 0; }
.ck__spark { width: 100%; max-width: 160px; height: auto; margin-top: 6px; }
.ck__franja { width: 100%; max-width: 160px; height: 22px; margin-top: 8px; }
.ck__on { fill: var(--color-miriam); }
.ck__franja-txt { font: 400 10.5px var(--font-body); color: var(--color-text-soft); margin: 2px 0 0; }
.ck__off { fill: rgb(var(--color-text-rgb) / 0.25); }
.ck__linea { fill: none; stroke: var(--viz-div-2); stroke-width: 1.6; }
.ck__ultimo { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.6; transform-box: fill-box; transform-origin: center; }
.ck__marca { fill: var(--color-miriam); fill-opacity: 0.75; transform-box: fill-box; transform-origin: center; }
.ck__banda { fill: rgb(var(--color-text-rgb) / 0.1); }
.ck--armado:not(.ck--visto) .ck__banda { opacity: 0; }
.ck--visto .ck__banda { transition: opacity 600ms var(--curva-salida); }
.ck--armado:not(.ck--visto) .ck__marca { transform: scale(0); }
/* cada ▲▼ salta cuando la línea pasa por él (la línea tarda 1,1 s en cruzar) */
.ck--visto .ck__marca { animation: ck-pop 380ms calc(var(--i) * 85ms) var(--curva-salida) both; }
.ck--armado:not(.ck--visto) .ck__linea { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ck--armado:not(.ck--visto) .ck__ultimo { transform: scale(0); }
.ck--visto .ck__linea { stroke-dasharray: 1; animation: ck-trazo 1.1s var(--curva-salida) both; }
.ck--visto .ck__ultimo { animation: ck-pop 500ms 1s var(--curva-salida) both; }
.ck--armado:not(.ck--visto) .ck__valor { opacity: 0; transform: translateY(6px); }
.ck--visto .ck__valor { transition: opacity 500ms var(--curva-salida), transform 500ms var(--curva-salida); }
@keyframes ck-trazo { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ck-pop { 0% { transform: scale(0); } 60% { transform: scale(1.8); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .ck--visto .ck__linea, .ck--visto .ck__ultimo, .ck--visto .ck__marca { animation: none; } }
.ck__pie { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; margin: 6px 0 0; font: 500 11px var(--font-mono); color: var(--color-text-soft); }
</style>
