<script setup lang="ts">
/**
 * Bloque 0 · Estado. Lo primero que se lee: dónde está el análisis y que todavía no hay
 * resultados. Sin ninguna cifra del experimento. El sello dice de dónde sale la descripción
 * de la técnica (comprobada el 16-oct-2026), no que haya datos.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
</script>

<template>
  <section class="cel-estado card-base" :aria-labelledby="id">
    <p class="eyebrow cel-estado__fecha">{{ L('Estado a 16 de octubre de 2026', 'Status as of 16 October 2026') }}</p>
    <h2 :id="id" class="cel-estado__t">
      <span class="block">{{ L('Datos recibidos. Análisis en marcha.', 'Data received. Analysis under way.') }}</span>
      <span class="block cel-estado__res">{{ L('Resultados: todavía no.', 'Results: not yet.') }}</span>
    </h2>
    <p class="cel-estado__p">
      {{ L(
        'El análisis está en marcha. Antes de que haya resultados, esta página cuenta qué se está midiendo y qué no se puede medir. Así, cuando lleguen, se podrán leer sabiendo ya qué puede decir esta prueba y qué no.',
        'The analysis is under way. Before any results exist, this page explains what is being measured and what cannot be measured. That way, when they arrive, they can be read already knowing what this test can and cannot say.') }}
    </p>
    <p class="cel-estado__sello">
      {{ L('Técnica y muestras descritas aquí:', 'Technique and samples described here:') }}
      <DatosSello s="verificado" :lang="lang" />
    </p>
  </section>
</template>

<style scoped>
.cel-estado__fecha { margin-bottom: var(--sp-8); }
.cel-estado__t { font: var(--tipo-h2); color: var(--color-text); margin: 0; }
.cel-estado__res { color: var(--color-miriam); }
.cel-estado__p { margin: var(--sp-12) 0 0; font: var(--tipo-body); color: var(--color-text-soft); max-width: var(--measure); }
.cel-estado__sello { margin: var(--sp-12) 0 0; font-size: var(--texto-xs); color: var(--color-text-soft); display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
</style>
