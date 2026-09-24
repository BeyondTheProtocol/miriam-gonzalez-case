<script setup lang="ts">
/**
 * RangoBarra — dónde cae un valor respecto al rango normal DE SU LABORATORIO, en una barra.
 * Formato de analíticas para pacientes con más evidencia detrás (van der Mee, JMIR 2024,
 * revisión de 18 estudios): barra horizontal, franja de referencia, marca del valor y una
 * palabra que lo evalúa. Sin inventar nada: el rango es el del informe de ese día.
 */
import type { Lang, Punto } from '~/utils/datosCaso'

const props = defineProps<{ p: Punto; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const W = 96
const g = computed(() => {
  const lo = props.p.lo ?? 0
  const hi = props.p.hi
  if (hi == null) return null
  const ancho = hi - lo || 1
  const d0 = Math.min(lo - ancho * 0.5, props.p.v)
  const d1 = Math.max(hi + ancho * 0.5, props.p.v)
  const X = (v: number) => rc(4 + ((v - d0) / (d1 - d0)) * (W - 8))
  return { a: X(lo), b: X(hi), x: X(props.p.v) }
})
const palabra = computed(() => (props.p.fuera === 'alto' ? L('por encima', 'above') : props.p.fuera === 'bajo' ? L('por debajo', 'below') : props.p.fuera ? L('fuera', 'outside') : L('dentro', 'within')))
</script>

<template>
  <span v-if="g" class="rb">
    <svg :viewBox="`0 0 ${W} 14`" :width="W" height="14" aria-hidden="true">
      <rect x="4" y="5" :width="W - 8" height="4" rx="2" class="rb__pista" />
      <rect :x="g.a" y="3" :width="Math.max(2, g.b - g.a)" height="8" rx="2" class="rb__rango" />
      <path :d="`M${g.x},1 l4,6 l-4,6 l-4,-6 Z`" :class="p.fuera ? 'rb__v rb__v--fuera' : 'rb__v'" />
    </svg>
    <span class="rb__txt" :class="{ 'rb__txt--fuera': p.fuera }">{{ palabra }}</span>
  </span>
</template>

<style scoped>
.rb { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }
.rb__pista { fill: rgb(var(--color-text-rgb) / 0.1); }
.rb__rango { fill: rgb(var(--color-text-rgb) / 0.28); }
.rb__v { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.3; }
.rb__v--fuera { fill: var(--color-miriam); stroke: var(--color-text); }
.rb__txt { font: 600 11.5px var(--font-body); color: var(--color-text-soft); }
.rb__txt--fuera { color: var(--color-miriam); }
</style>
