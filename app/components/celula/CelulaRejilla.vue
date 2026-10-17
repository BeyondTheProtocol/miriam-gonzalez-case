<script setup lang="ts">
/**
 * Cuadrícula de «cada 100 células», diez por diez, una célula por punto. Los rellenos son los que
 * trae el JSON (`por`); el resto, puntos tenues. Con `menos` no se rellena ninguno (menos de uno de
 * cada cien no es «uno»): la primera posición lleva un contorno discontinuo. Es dibujo: aria-hidden,
 * las cifras van en el texto de al lado.
 */
const props = defineProps<{ por: number; base: number; menos?: boolean }>()
const lado = computed(() => Math.round(Math.sqrt(props.base)))
const celdas = computed(() => Array.from({ length: props.base }, (_, i) => i))
</script>

<template>
  <svg class="rej" :viewBox="`0 0 ${lado * 10} ${lado * 10}`" aria-hidden="true" focusable="false">
    <circle v-for="i in celdas" :key="i" :cx="(i % lado) * 10 + 5" :cy="Math.floor(i / lado) * 10 + 5" r="3.3" :class="!menos && i < por ? 'on' : 'off'" />
    <rect v-if="menos" x="0.8" y="0.8" width="8.4" height="8.4" rx="2.6" class="contorno" />
  </svg>
</template>

<style scoped>
.rej { display: block; width: 100%; height: auto; overflow: visible; }
.on { fill: var(--identidad); }
.off { fill: var(--trazo-interactivo); }
.contorno { fill: none; stroke: var(--cta-texto); stroke-width: 1.6; stroke-dasharray: 2.6 1.8; vector-effect: non-scaling-stroke; }
</style>
