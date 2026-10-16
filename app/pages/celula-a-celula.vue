<script setup lang="ts">
/**
 * Célula a célula · fase 1 (16-oct-2026). Explica un análisis de célula única QUE TODAVÍA NO
 * TIENE RESULTADOS: qué es, sobre qué tejido, qué preguntas puede contestar y, con el mismo
 * peso, qué no puede decir. Describe y equipa; no concluye ni recomienda tratamiento.
 *
 * Qué NO se publica aquí, a propósito: ninguna cifra del experimento (ni número de células,
 * ni calidad de las muestras, ni resultados), ningún laboratorio ni persona que no sea ya
 * público, ninguna sigla de muestra. Las dianas que se nombran son las ya públicas del caso
 * y van como pregunta, nunca como hallazgo. La fase 2 (con datos) pasa de nuevo por revisión.
 *
 * El título y la descripción SON los de `COPY_HERRAMIENTAS.cell_by_cell` (app/utils/navegacion.ts):
 * si cambian aquí, se cambian allí.
 */
const { locale, t } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const copy = computed(() => copyHerramienta('cell_by_cell', locale.value))
const seoTitle = () => copy.value[0]
const seoDescription = () => copy.value[1]

useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => L('Qué se está midiendo, qué preguntas puede contestar y qué no puede decir. Todavía no hay resultados.',
    'What is being measured, which questions it can answer and what it cannot say. There are no results yet.'),
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Célula a célula: el análisis de célula única', 'Cell by cell: the single-cell analysis')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :parent="{ to: localePath({ name: 'herramientas' }), label: t('nav.tools') }"
          :tag="L('Análisis en marcha', 'Analysis under way')"
          :title="copy[0]"
          :subtitle="L('Un análisis que mira las células del tumor de Miriam una a una, en lugar de hacer la media de todas. Todavía no hay resultados.',
            'An analysis that looks at the cells of Miriam’s tumor one by one, instead of averaging all of them. There are no results yet.')"
        />

        <div class="cel-flujo">
          <CelulaEstado />
          <CelulaQueEs />
          <CelulaTejido />
          <CelulaPreguntas />
          <CelulaLimites />
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
   Sin animaciones: nada que desactivar con prefers-reduced-motion. */
.cel-flujo { display: grid; gap: 48px; max-width: 760px; }
@media (min-width: 640px) { .cel-flujo { gap: 64px; } }
.cel-h2 {
  font-family: var(--font-display); font-weight: 600; color: var(--color-text);
  font-size: clamp(22px, 2.4vw, 28px); line-height: 1.2; letter-spacing: -0.015em; margin-bottom: 12px;
}
.cel-h3 { font-family: var(--font-display); font-weight: 600; color: var(--color-text); font-size: 18px; line-height: 1.3; }
.cel-p { color: var(--color-text-soft); line-height: 1.65; font-size: 17px; max-width: 64ch; }
.cel-p + .cel-p { margin-top: 12px; }
.cel-p--sm { font-size: 15px; margin-top: 4px; }
.cel-card {
  background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08);
  border-radius: 12px; padding: 16px 18px;
}
.cel-card__p { margin-top: 4px; color: var(--color-text-soft); line-height: 1.55; font-size: 15px; }
</style>
