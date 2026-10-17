<script setup lang="ts">
/**
 * Célula a célula · fase 1 (16-oct-2026) y primeros resultados (fase 2, 17-oct-2026, bloques R0, R3,
 * R4, R5 y R6 con el OK de Miriam; el censo R1 no se publica). Explica un análisis de célula única:
 * qué es, sobre qué tejido, qué preguntas puede contestar y, con el mismo
 * peso, qué no puede decir. Describe y equipa; no concluye ni recomienda tratamiento.
 *
 * Qué NO se publica aquí, a propósito: ninguna cifra del experimento que no esté en el texto
 * aprobado por Miriam (las pinta public/celula/resultados.json, ver app/utils/celulaResultados.ts),
 * ningún laboratorio ni persona que no sea ya público, ninguna sigla de muestra.
 *
 * El título y la descripción SON los de `COPY_HERRAMIENTAS.cell_by_cell` (app/utils/navegacion.ts):
 * si cambian aquí, se cambian allí.
 */
const { locale, t } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const copy = computed(() => copyHerramienta('cell_by_cell', locale.value))
const { hayReales } = useCelulaResultados()
const seoTitle = () => copy.value[0]
const seoDescription = () => copy.value[1]

useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => hayReales.value
    ? L('Qué se ha medido, qué preguntas contesta, qué no puede decir y los primeros resultados.', 'What was measured, which questions it answers, what it cannot say and the first results.')
    : L('Qué se está midiendo, qué preguntas puede contestar y qué no puede decir. Todavía no hay resultados.',
      'What is being measured, which questions it can answer and what it cannot say. There are no results yet.'),
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Célula a célula: el análisis de célula única', 'Cell by cell: the single-cell analysis')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          class="!mb-6"
          :parent="{ to: localePath({ name: 'herramientas' }), label: t('nav.tools') }"
          :tag="hayReales ? L('Primeros resultados', 'First results') : L('Análisis en marcha', 'Analysis under way')"
          :title="copy[0]"
          :subtitle="hayReales
            ? L('Un análisis que mira las células del tumor de Miriam una a una, en lugar de hacer la media de todas. Estos son los primeros resultados.',
              'An analysis that looks at the cells of Miriam’s tumor one by one, instead of averaging all of them. These are the first results.')
            : L('Un análisis que mira las células del tumor de Miriam una a una, en lugar de hacer la media de todas. Todavía no hay resultados.',
              'An analysis that looks at the cells of Miriam’s tumor one by one, instead of averaging all of them. There are no results yet.')"
        />

        <CelulaAviso class="mb-8" />
        <EcgDivider class="mb-12" />

        <div class="cel-flujo">
          <CelulaEstado />
          <CelulaQueEs />
          <CelulaTejido />
          <CelulaPreguntas />
          <CelulaResultados />
          <CelulaLimites />
          <CelulaProximosPasos />
          <CelulaDestino />
          <CelulaGlosario />
          <CelulaFicha />
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* Ritmo y piezas comunes de /celula-a-celula (los componentes de app/components/celula/ las usan).
   Todo con tokens del sistema (btp-tokens.css): tipografía --tipo-*, espaciado --sp-*, radios --radius-*.
   Las tarjetas son .card-base (la del sistema), no una propia. Sin animaciones. */
.cel-flujo { display: grid; gap: var(--sp-48); }
@media (min-width: 640px) { .cel-flujo { gap: var(--sp-64); } }
.cel-h2 { font: var(--tipo-h2); color: var(--color-text); margin: 0 0 var(--sp-12); }
.cel-h3 { font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--color-text); margin: 0; }
.cel-p { font: var(--tipo-body); color: var(--color-text-soft); max-width: var(--measure); margin: 0; }
.cel-p + .cel-p { margin-top: var(--sp-12); }
.cel-p--sm { font: var(--tipo-body-sm); margin-top: var(--sp-4); }
.cel-card__p { margin: var(--sp-4) 0 0; color: var(--color-text-soft); font: var(--tipo-body-sm); }
/* tarjetas más compactas que el .card-base por defecto (p-8): son de lectura, no de portada */
.cel-card { padding: var(--sp-16) var(--sp-24); }
@media (min-width: 640px) { .cel-card { padding: var(--sp-24); } }
/* sin corte de línea dentro de un símbolo («HLA-» / «A», «T.» suelto) */
.cel-nb { white-space: nowrap; }
</style>
