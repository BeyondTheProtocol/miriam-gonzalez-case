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
  /** tira de días (true = en una línea de tratamiento), mismo lenguaje que «Cada día» */
  franja?: boolean[]
  lang: 'es' | 'en'
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const W = 120
const H = 30

/* animación: la cifra cuenta desde 0 y la mini línea se dibuja al entrar en pantalla */
const raiz = ref<HTMLElement | null>(null)
const { armado, visto } = useAlVer(raiz)
const numerico = computed(() => /^[\d.,]+/.test(props.valor))
const mostrado = ref(props.valor)
watch(visto, (v) => {
  if (!v || !numerico.value) return
  const m = props.valor.match(/^([\d.,]+)(.*)$/)!
  const txt = m[1]
  const dec = (txt.split(/[.,]/)[1] ?? '').length
  const obj = Number(txt.replace(',', '.'))
  const sep = txt.includes(',') ? ',' : '.'
  tween(1100, (f) => { mostrado.value = (obj * f).toFixed(dec).replace('.', sep) + m[2] })
})
const spark = computed(() => {
  const s = props.serie ?? []
  if (s.length < 2) return null
  const lo = Math.min(...s)
  const hi = Math.max(...s)
  const X = (i: number) => rc(3 + (i / (s.length - 1)) * (W - 6))
  const Y = (v: number) => rc(H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8))
  return { d: s.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(''), x: X(s.length - 1), y: Y(s[s.length - 1]) }
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
      <span aria-hidden="true">{{ fuera === 'bajo' ? '▼' : '▲' }}</span>
      {{ fuera === 'bajo' ? L('por debajo del rango', 'below range') : L('por encima del rango', 'above range') }}
    </p>
    <p v-if="detalle" class="ck__det">{{ detalle }}</p>
    <svg v-if="franja?.length" :viewBox="`0 0 ${franja.length * 3} 14`" class="ck__franja" preserveAspectRatio="none" aria-hidden="true">
      <rect v-for="(d, i) in franja" :key="i" :x="i * 3" :y="d ? 0 : 5" width="2" :height="d ? 14 : 4" :class="d ? 'ck__on' : 'ck__off'" />
    </svg>
    <p v-if="franja?.length" class="ck__franja-txt">{{ L('últimos 90 días · alto = con tratamiento', 'last 90 days · tall = on treatment') }}</p>
    <svg v-if="spark" :viewBox="`0 0 ${W} ${H}`" class="ck__spark" aria-hidden="true">
      <path :d="spark.d" class="ck__linea" pathLength="1" />
      <circle :cx="spark.x" :cy="spark.y" r="3.5" class="ck__ultimo" />
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
.ck__det { font: 400 12.5px/1.35 var(--font-body); color: var(--color-text); margin: 2px 0 0; }
.ck__spark { width: 100%; max-width: 160px; height: auto; margin-top: 6px; }
.ck__franja { width: 100%; max-width: 160px; height: 22px; margin-top: 8px; }
.ck__on { fill: var(--color-miriam); }
.ck__franja-txt { font: 400 10.5px var(--font-body); color: var(--color-text-soft); margin: 2px 0 0; }
.ck__off { fill: rgb(var(--color-text-rgb) / 0.25); }
.ck__linea { fill: none; stroke: var(--viz-div-2); stroke-width: 1.6; }
.ck__ultimo { fill: var(--color-miriam); transform-box: fill-box; transform-origin: center; }
.ck--armado:not(.ck--visto) .ck__linea { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ck--armado:not(.ck--visto) .ck__ultimo { transform: scale(0); }
.ck--visto .ck__linea { stroke-dasharray: 1; animation: ck-trazo 1.1s var(--curva-salida) both; }
.ck--visto .ck__ultimo { animation: ck-pop 500ms 1s var(--curva-salida) both; }
@keyframes ck-trazo { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ck-pop { 0% { transform: scale(0); } 60% { transform: scale(1.8); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .ck--visto .ck__linea, .ck--visto .ck__ultimo { animation: none; } }
.ck__pie { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; margin: 6px 0 0; font: 500 11px var(--font-mono); color: var(--color-text-soft); }
</style>
