<script setup lang="ts">
/**
 * Tira de puntos: un punto alargado por cada célula de «cada 100» (en vertical, para que se lea también
 * en un móvil de 375 px). Los altos y rellenos son las que sí; los bajos y tenues, las que no (altura
 * y relleno además del color). Debajo, si hay IC, el
 * intervalo como una raya con topes. Ni redondea ni calcula: pinta los enteros que trae el JSON.
 * Es dibujo (aria-hidden): las cifras van en el texto de la fila que la lleva.
 */
const props = defineProps<{ por: number; base: number; icInf?: number; icSup?: number }>()
const puntos = computed(() => Array.from({ length: props.base }, (_, i) => i))
</script>

<template>
  <svg class="cel-tira" :viewBox="`0 0 ${base} 8`" preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false">
    <rect v-for="i in puntos" :key="i" :x="i + 0.19" :y="i < por ? 0.5 : 1.8" width="0.62" :height="i < por ? 5 : 2.4" rx="0.31" :class="i < por ? 'on' : 'off'" />
    <g v-if="icInf != null && icSup != null" class="ic">
      <line :x1="icInf" :x2="icSup" y1="6.6" y2="6.6" />
      <line :x1="icInf" :x2="icInf" y1="5.6" y2="7.6" />
      <line :x1="icSup" :x2="icSup" y1="5.6" y2="7.6" />
    </g>
  </svg>
</template>

<style scoped>
.cel-tira { display: block; width: 100%; height: auto; overflow: visible; }
.on { fill: var(--identidad); }
.off { fill: var(--trazo-interactivo); }
.ic line { stroke: var(--texto-1); stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linecap: round; }
</style>
