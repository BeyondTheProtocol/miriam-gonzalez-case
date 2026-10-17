<script setup lang="ts">
/**
 * Una lesión como ESQUEMA (no es un mapa de células): puntos tumorales repartidos en un óvalo con una
 * espiral áurea, posiciones fijas y calculadas (nada de azar: el HTML estático y el cliente coinciden).
 * Ni el número ni la posición de los puntos son datos; lo dice la nota de cada bloque que la usa.
 *  · `halo`: contorno discontinuo alrededor de toda la lesión (R5: FGFR1 activo).
 *  · `ne`: algunos puntos pasan a «rasgo neuroendocrino» (rombo con aro), repartidos por todo el
 *    tumor sin formar grupo (R6). La forma, no solo el color, los distingue.
 */
const props = defineProps<{ halo?: boolean; ne?: boolean; alt: string }>()
const TOTAL = 64
const NE = new Set([4, 13, 22, 29, 37, 45, 52, 60])
const puntos = computed(() => Array.from({ length: TOTAL }, (_, i) => {
  const r = Math.sqrt((i + 0.6) / TOTAL)
  const a = i * 2.399963
  return { i, x: +(50 + Math.cos(a) * r * 41).toFixed(2), y: +(36 + Math.sin(a) * r * 27).toFixed(2), ne: props.ne === true && NE.has(i) }
}))
</script>

<template>
  <svg class="les" viewBox="0 0 100 72" role="img" :aria-label="alt">
    <ellipse cx="50" cy="36" rx="46" ry="32" class="les__borde" />
    <ellipse v-if="halo" cx="50" cy="36" rx="48.6" ry="34.6" class="les__halo" />
    <template v-for="p in puntos" :key="p.i">
      <g v-if="p.ne">
        <circle :cx="p.x" :cy="p.y" r="4.4" class="les__aro" />
        <path :d="`M${p.x} ${p.y - 2.6} L${p.x + 2.6} ${p.y} L${p.x} ${p.y + 2.6} L${p.x - 2.6} ${p.y} Z`" class="les__ne" />
      </g>
      <circle v-else :cx="p.x" :cy="p.y" r="2.1" class="les__t" />
    </template>
  </svg>
</template>

<style scoped>
.les { display: block; width: 100%; height: auto; }
.les__borde { fill: color-mix(in srgb, var(--color-text) 60%, transparent); stroke: var(--trazo-interactivo); stroke-width: 1; vector-effect: non-scaling-stroke; }
.les__halo { fill: none; stroke: var(--cta-texto); stroke-width: 2; stroke-dasharray: 5 3.5; vector-effect: non-scaling-stroke; }
.les__t { fill: var(--identidad); }
.les__aro { fill: none; stroke: var(--cta-texto); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
.les__ne { fill: var(--cta-texto); }
</style>
