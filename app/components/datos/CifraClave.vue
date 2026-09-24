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
  lang: 'es' | 'en'
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const W = 120
const H = 30
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
  <div class="ck">
    <p class="ck__etq">{{ etiqueta }}</p>
    <p class="ck__valor" :class="{ 'ck__valor--texto': valor.length > 8 }">
      <span class="nums">{{ valor }}</span>
      <span v-if="unidad" class="ck__unidad">{{ unidad }}</span>
    </p>
    <p v-if="fuera" class="ck__fuera">
      <span aria-hidden="true">{{ fuera === 'bajo' ? '▼' : '▲' }}</span>
      {{ fuera === 'bajo' ? L('por debajo del rango', 'below range') : L('por encima del rango', 'above range') }}
    </p>
    <p v-if="detalle" class="ck__det">{{ detalle }}</p>
    <svg v-if="spark" :viewBox="`0 0 ${W} ${H}`" class="ck__spark" aria-hidden="true">
      <path :d="spark.d" class="ck__linea" />
      <circle :cx="spark.x" :cy="spark.y" r="3.5" class="ck__ultimo" />
    </svg>
    <p class="ck__pie">
      <span v-if="fecha" class="nums">{{ fecha }}</span>
      <DatosSello v-if="sello" :s="sello" :lang="lang" />
    </p>
  </div>
</template>

<style scoped>
.ck { background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 14px;
  padding: 12px 12px 10px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ck__etq { font: 600 12.5px/1.3 var(--font-body); color: var(--color-text-soft); margin: 0; }
.ck__valor { margin: 2px 0 0; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
.ck__valor .nums { font: var(--tipo-cifra); font-size: clamp(26px, 7vw, 36px); letter-spacing: var(--track-cifra); color: var(--color-text); }
.ck__valor--texto .nums { font-size: clamp(20px, 5.4vw, 26px); line-height: 1.1; }
.ck__pie :deep(.sello) { white-space: normal; }
.ck__unidad { font: 500 12px var(--font-mono); color: var(--color-text-soft); }
.ck__fuera { font: 700 12px/1.3 var(--font-body); color: var(--color-miriam); margin: 0; }
.ck__det { font: 400 12.5px/1.35 var(--font-body); color: var(--color-text); margin: 2px 0 0; }
.ck__spark { width: 100%; max-width: 160px; height: auto; margin-top: 6px; }
.ck__linea { fill: none; stroke: var(--viz-div-2); stroke-width: 1.6; }
.ck__ultimo { fill: var(--color-miriam); }
.ck__pie { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; margin: 6px 0 0; font: 500 11px var(--font-mono); color: var(--color-text-soft); }
</style>
