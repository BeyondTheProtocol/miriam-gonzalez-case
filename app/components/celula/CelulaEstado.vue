<script setup lang="ts">
/**
 * Bloque 0 · Estado. Lo primero que se lee: dónde está el análisis y si ya hay
 * resultados. Sin ninguna cifra del experimento. El sello dice de dónde sale la descripción
 * de la técnica (comprobada el 16-oct-2026), no que haya datos.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
const { hayReales } = useCelulaResultados()
const fecha = computed(() => fechaEstado(lang.value))
</script>

<template>
  <section class="cel-estado card-base" :aria-labelledby="id">
    <p class="eyebrow cel-estado__fecha">{{ L(`Estado a ${fecha}`, `Status as of ${fecha}`) }}</p>
    <h2 :id="id" class="cel-estado__t">
      <template v-if="hayReales">
        <span class="block">{{ L('Datos recibidos, primeros resultados.', 'Data received, first results.') }}</span>
        <span class="block cel-estado__res">{{ L('Cada bloque, con su sello.', 'Each block, with its seal.') }}</span>
      </template>
      <template v-else>
        <span class="block">{{ L('Datos recibidos, análisis en marcha.', 'Data received, analysis under way.') }}</span>
        <span class="block cel-estado__res">{{ L('Resultados: todavía no.', 'Results: not yet.') }}</span>
      </template>
    </h2>
    <p v-if="hayReales" class="cel-estado__p">
      {{ L('Ya hay resultados de una parte del análisis. Se publican por bloques, cuando están verificados y Miriam les ha dado el visto bueno. Lo demás sigue en marcha.',
        'Part of the analysis already has results. They are published block by block, once verified and approved by Miriam. The rest is still under way.') }}
      <a href="#resultados" class="cel-estado__ir">{{ L('Ir a los resultados', 'Go to the results') }}</a>
    </p>
    <p v-else class="cel-estado__p">
      {{ L(
        'Mientras llegan los resultados, esta página cuenta qué se está midiendo y qué se queda fuera, para que cuando lleguen se lean sabiendo qué puede decir esta prueba y qué no.',
        'While the results are on their way, this page explains what is being measured and what is left out, so that when they arrive they can be read knowing what this test can and cannot say.') }}
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
.cel-estado__ir { display: inline-flex; align-items: center; min-height: 44px; margin-left: var(--sp-4); color: var(--color-miriam); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
.cel-estado__sello { margin: var(--sp-12) 0 0; font-size: var(--texto-xs); color: var(--color-text-soft); display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
</style>
