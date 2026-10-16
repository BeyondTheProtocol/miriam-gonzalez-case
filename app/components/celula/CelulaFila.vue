<script setup lang="ts">
/**
 * Una fila de resultado «de cada 100»: nombre, la cifra, la tira de puntos y, en pequeño, n e IC.
 * La usan R3 (dianas), R4 (presentación) y R5 (hígado frente a hueso). Todo sale del JSON.
 */
import { fmtN, type Gen } from '~/utils/celulaResultados'
const props = defineProps<{ nombre: string; g: Gen; base: number; nivel: number; sub?: boolean }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
</script>

<template>
  <li class="fila" :class="{ 'fila--sub': sub }">
    <template v-if="g.en_panel !== false && g.por_100 != null">
      <div class="fila__cab">
        <span class="fila__nombre">{{ nombre }}</span>
        <span class="fila__cifra">{{ f(g.por_100) }} <span class="fila__de">{{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }}</span></span>
      </div>
      <CelulaTira :por="g.por_100" :base="base" :ic-inf="g.ic_inf" :ic-sup="g.ic_sup" />
      <p class="fila__meta">
        n = {{ f(g.n!) }} · {{ L(`IC ${nivel} %: ${f(g.ic_inf!)} a ${f(g.ic_sup!)}`, `${nivel}% CI: ${f(g.ic_inf!)} to ${f(g.ic_sup!)}`) }}
      </p>
    </template>
    <template v-else>
      <div class="fila__cab">
        <span class="fila__nombre">{{ nombre }}</span>
        <span class="fila__sin">{{ L('Sin sonda', 'No probe') }}</span>
      </div>
      <p class="fila__meta">{{ L('Esta prueba no puede leerlo.', 'This test cannot read it.') }}</p>
    </template>
  </li>
</template>

<style scoped>
.fila { padding: var(--sp-12) 0; border-top: 1px solid var(--trazo-medio); list-style: none; }
.fila:first-child { border-top: 0; padding-top: 0; }
.fila__cab { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--sp-4) var(--sp-12); margin-bottom: var(--sp-8); }
.fila__nombre { font: 700 var(--texto-base)/1.3 var(--font-body); color: var(--texto-1); }
.fila--sub .fila__nombre { font-weight: 600; font-size: var(--texto-sm); color: var(--texto-2); }
.fila__cifra { font: 700 var(--texto-xl)/1 var(--font-display); color: var(--texto-1); letter-spacing: var(--track-cifra); }
.fila__de { font: 400 var(--texto-xs)/1 var(--font-body); color: var(--texto-2); letter-spacing: 0; }
.fila__sin { font: 600 var(--texto-xs)/1 var(--font-mono); color: var(--texto-2); }
.fila__meta { margin: var(--sp-4) 0 0; font: 500 12px/1.4 var(--font-mono); color: var(--texto-2); }
</style>
