<script setup lang="ts">
/**
 * Una célula dibujada, como pieza SVG (<g>) para usar DENTRO de otro <svg>. Cada tipo tiene su forma
 * (círculo, cuadrado, triángulo, rombo: las mismas que el frutero de «Qué es célula a célula»), de
 * modo que el color nunca es la única señal. Colores por roles del sistema (--identidad, --texto-1,
 * --texto-2): se ven bien sobre crema y sobre el cielo oscuro. `r` es el radio de la figura.
 */
import type { Categoria } from '~/utils/celulaResultados'
const props = defineProps<{ clave: Categoria; x: number; y: number; r: number }>()
const d = computed(() => {
  const { x, y, r } = props
  if (props.clave === 'sosten') return `M${x} ${y - r * 1.05} L${x + r * 1.05} ${y + r * 0.85} L${x - r * 1.05} ${y + r * 0.85} Z`
  if (props.clave === 'otras') return `M${x} ${y - r * 1.1} L${x + r * 1.1} ${y} L${x} ${y + r * 1.1} L${x - r * 1.1} ${y} Z`
  return ''
})
</script>

<template>
  <circle v-if="clave === 'tumoral'" :cx="x" :cy="y" :r="r" class="cf cf--tumoral" />
  <rect v-else-if="clave === 'inmune'" :x="x - r * 0.9" :y="y - r * 0.9" :width="r * 1.8" :height="r * 1.8" :rx="r * 0.2" class="cf cf--inmune" />
  <path v-else :d="d" :class="`cf cf--${clave}`" />
</template>

<style scoped>
.cf { stroke-linejoin: round; }
.cf--tumoral { fill: var(--identidad); }
.cf--inmune { fill: var(--texto-1); }
.cf--sosten { fill: color-mix(in srgb, var(--texto-1) 30%, transparent); stroke: var(--texto-1); stroke-width: 0.6; vector-effect: non-scaling-stroke; }
.cf--otras { fill: none; stroke: var(--texto-2); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
</style>
