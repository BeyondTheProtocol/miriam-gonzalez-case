<script setup lang="ts">
/**
 * Etiquetas fijas del explorador (plan del 17-oct-2026). Van siempre, con datos o sin ellos, arriba
 * del todo: son el marco de lectura de todo lo demás. Sin cifras del experimento.
 */
defineProps<{ lang: 'es' | 'en' }>()
</script>

<template>
  <ul class="et" :aria-label="lang === 'en' ? 'How to read everything on this page' : 'Cómo leer todo lo de esta página'">
    <li class="et__item"><Icon name="ph:user-bold" class="et__ico" aria-hidden="true" />{{ lang === 'en' ? 'n=1, FFPE, exploratory' : 'n=1, FFPE, exploratorio' }}</li>
    <li class="et__item"><Icon name="ph:dna-bold" class="et__ico" aria-hidden="true" />{{ lang === 'en' ? 'RNA ≠ protein; IHC decides' : 'ARN ≠ proteína; manda la IHQ' }}</li>
    <li class="et__item"><Icon name="ph:flask-bold" class="et__ico" aria-hidden="true" />{{ lang === 'en' ? 'HER2 IHC: 0' : 'IHQ de HER2: 0' }}</li>
  </ul>
</template>

<style scoped>
.et { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-8); }
.et__item {
  display: inline-flex; align-items: center; gap: var(--sp-8); min-height: 36px; padding: 0 var(--sp-12);
  border: 1.5px solid var(--texto-1); border-radius: var(--radius-pill);
  font: 700 var(--texto-xs)/1.2 var(--font-mono); letter-spacing: 0.02em; color: var(--texto-1); background: var(--fondo);
}
.et__ico { width: 16px; height: 16px; flex: none; }
</style>
