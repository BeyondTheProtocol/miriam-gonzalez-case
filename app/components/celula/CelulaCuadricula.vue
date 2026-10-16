<script setup lang="ts">
/**
 * Cuadrícula de «cada 100 células»: diez por diez, una figura por célula, agrupadas por tipo (cada
 * tipo con su forma). Los enteros vienen del JSON y suman `base` (si no, el bloque no se pinta: lo
 * comprueba la puerta). No redondea. Es dibujo; los números van en la leyenda de al lado.
 */
import { CATEGORIAS, type Categoria } from '~/utils/celulaResultados'
const props = defineProps<{ categorias: { clave: Categoria; por_100: number }[]; base: number }>()
const lado = computed(() => Math.round(Math.sqrt(props.base)))
const celdas = computed(() => {
  const out: Categoria[] = []
  for (const k of CATEGORIAS) {
    const c = props.categorias.find((q) => q.clave === k)
    for (let i = 0; i < (c?.por_100 ?? 0); i++) out.push(k)
  }
  return out
})
</script>

<template>
  <svg class="cel-cuad" :viewBox="`0 0 ${lado * 10} ${lado * 10}`" aria-hidden="true" focusable="false">
    <CelulaForma v-for="(k, i) in celdas" :key="i" :clave="k" :x="(i % lado) * 10 + 5" :y="Math.floor(i / lado) * 10 + 5" :r="3.4" />
  </svg>
</template>

<style scoped>
.cel-cuad { display: block; width: 100%; max-width: 220px; height: auto; }
</style>
