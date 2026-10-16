<script setup lang="ts">
/**
 * El «cielo» de una muestra: un mapa estelar SOLO ORIENTATIVO. Cada figura es un grupo de células
 * parecidas (con la forma de su tipo); su tamaño sigue el número de células del grupo (relativo al
 * mayor de la muestra). La posición viene del análisis y sirve para ver qué grupos se parecen, no
 * para medir distancias: por eso no lleva ejes ni escala. Las estrellas de fondo son decoración
 * fija (no son datos).
 */
import { fmtN, type Categoria } from '~/utils/celulaResultados'
const props = defineProps<{ grupos: { clave: Categoria; x: number; y: number; n: number }[]; alt: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const maxN = computed(() => Math.max(...props.grupos.map((g) => g.n)))
const radio = (n: number) => 1.8 + 3.4 * Math.sqrt(n / maxN.value)
const nombre = (k: Categoria) => ({
  tumoral: lang.value === 'en' ? 'tumor' : 'tumorales', inmune: lang.value === 'en' ? 'immune' : 'inmunes',
  sosten: lang.value === 'en' ? 'supporting' : 'de sostén', otras: lang.value === 'en' ? 'other' : 'otras',
}[k])
const descr = computed(() => `${props.alt} ${props.grupos.map((g) => `${nombre(g.clave)}: ${fmtN(g.n, lang.value)}`).join('; ')}.`)
// estrellas de fondo: posiciones fijas, sin azar (el HTML estático y el cliente coinciden)
const FONDO: [number, number][] = [[6, 8], [19, 22], [33, 6], [47, 17], [58, 5], [66, 24], [88, 9], [93, 33], [8, 40], [26, 55], [44, 47], [61, 52], [78, 58], [91, 62], [14, 64], [36, 66], [54, 66], [72, 44]]
</script>

<template>
  <svg class="cel-cielo-svg" viewBox="0 0 100 62" role="img" :aria-label="descr">
    <circle v-for="(p, i) in FONDO" :key="i" :cx="p[0]" :cy="p[1]" r="0.35" class="fondo" />
    <CelulaForma v-for="(g, i) in grupos" :key="i" :clave="g.clave" :x="g.x * 0.96 + 2" :y="g.y * 0.58 + 2" :r="radio(g.n)" />
  </svg>
</template>

<style scoped>
.cel-cielo-svg { display: block; width: 100%; height: auto; border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); background: color-mix(in srgb, var(--color-text) 60%, transparent); }
.fondo { fill: var(--texto-3); }
</style>
