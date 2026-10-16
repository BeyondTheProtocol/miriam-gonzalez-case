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
  <section class="cel-estado" :aria-labelledby="id">
    <p class="eyebrow cel-estado__fecha">{{ L('Estado a 16 de octubre de 2026', 'Status as of 16 October 2026') }}</p>
    <h2 :id="id" class="cel-estado__t">
      <span class="block">{{ L('En el laboratorio de análisis.', 'In the analysis lab.') }}</span>
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
.cel-estado {
  background: var(--color-bg-card);
  border: 1px solid rgb(var(--color-text-rgb) / 0.08);
  border-left: 4px solid var(--color-miriam);
  border-radius: 12px;
  padding: 20px 22px;
}
.cel-estado__fecha { margin-bottom: 8px; }
.cel-estado__t {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-text);
  font-size: clamp(22px, 2.6vw, 30px);
  line-height: 1.2;
  letter-spacing: -0.015em;
}
.cel-estado__res { color: var(--color-miriam); }
.cel-estado__p { margin-top: 12px; color: var(--color-text-soft); line-height: 1.6; max-width: 62ch; }
.cel-estado__sello { margin-top: 12px; font-size: 13px; color: var(--color-text-soft); display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
</style>
