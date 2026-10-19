<script setup lang="ts">
/**
 * Etiquetas fijas del explorador (plan del 17-oct-2026). Van siempre, con datos o sin ellos, arriba
 * del todo: son el marco de lectura de todo lo demás. No se pulsan, así que no parecen botones.
 */
import { ETIQUETAS_FIJAS } from '~/utils/celulaExploradorTexto'

defineProps<{ lang: 'es' | 'en' }>()
</script>

<template>
  <ul class="et" :aria-label="lang === 'en' ? 'How to read everything on this page' : 'Cómo leer todo lo de esta página'">
    <li class="et__item"><Icon name="ph:user-bold" class="et__ico" aria-hidden="true" />{{ ETIQUETAS_FIJAS.n1[lang] }}</li>
    <li class="et__item"><Icon name="ph:dna-bold" class="et__ico" aria-hidden="true" />{{ ETIQUETAS_FIJAS.arn[lang] }}</li>
    <li class="et__item"><Icon name="ph:flask-bold" class="et__ico" aria-hidden="true" />{{ ETIQUETAS_FIJAS.her2[lang] }}</li>
    <li class="et__item"><Icon name="ph:flask-bold" class="et__ico" aria-hidden="true" />{{ ETIQUETAS_FIJAS.re[lang] }}</li>
  </ul>
</template>

<style scoped>
.et { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-8); }
.et__item {
  display: inline-flex; align-items: center; gap: var(--sp-8); min-height: 36px; padding: 0 var(--sp-12);
  border: 0; border-radius: var(--radius-sm); background: var(--superficie);
  font: 700 var(--texto-xs)/1.2 var(--font-mono); letter-spacing: 0.02em; color: var(--texto-1);
}
.et__ico { width: 16px; height: 16px; flex: none; }
@media (max-width: 639px) { .et__item { min-height: 28px; padding: 0; background: none; } }   /* diseño, 18-oct: apiladas restaban sitio al buscador */
</style>
