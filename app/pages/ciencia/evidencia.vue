<template>
  <div>
    <section class="section-spacing" :aria-label="$t('ciencia.key_evidence')">
      <div class="section-wide">
        <!-- T3-LOTE1 (A15, 25-oct-2026): shell único (el H1 cae bajo el logo) y cabecera v3 (H1 por rol, entradilla en `.lede`, la miga como
             `.link-action` de 44 px). Los textos son los de antes; solo la etiqueta del enlace al estudio es nueva (`ciencia.view_study`). -->
        <PageHeader
          variante="pagina"
          :parent="{ to: localePath('/ciencia'), label: $t('ciencia.back_to_science') }"
          :eyebrow="$t('ciencia.evidence_hook_eyebrow')"
          :title="$t('ciencia.key_evidence')"
          :lede="$t('ciencia.evidence_page_intro')"
        />

        <!-- Evidence dossier -->
        <div class="space-y-8 mb-14">
          <!-- `anchor` (science.yml): el id al que enlazan los ejes terapéuticos de /ciencia. scroll-mt-24 para que la cabecera fija no tape el título. -->
          <section
            v-for="(section, sectionIndex) in paperSections"
            :id="section.anchor"
            :key="`${section.title}-${sectionIndex}`"
            class="scroll-mt-24"
          >
            <div v-if="section.title" class="mb-4">
              <div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h2 :id="`papers-title-${sectionIndex}`" class="h2-seccion">{{ section.title }}</h2>
                <span
                  v-if="section.tag"
                  :class="['pill-data', `pill-data--${section.tone || 'neutral'}`]"
                >{{ section.tag }}</span>
              </div>
              <p v-if="section.subtitle" class="measure text-sm text-tinta leading-relaxed">{{ section.subtitle }}</p>
            </div>
            <ul class="space-y-4" :aria-labelledby="`papers-title-${sectionIndex}`">
              <li v-for="paper in section.papers" :key="paper.ref" class="card-base">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 measure">
                    <!-- La cita en una línea de mono a 13 px, sin mayúsculas ni píldora (la píldora `status-badge--reference` era de 10 px y
                         rompía el DOI en mayúsculas: Referencia.vue explica por qué). La cadena `paper.ref` es la de siempre. -->
                    <p class="ev-ref">{{ paper.ref }}</p>
                    <h3 class="font-semibold text-berenjena text-sm lg:text-base mb-1.5">
                      {{ paper.finding }}
                    </h3>
                    <p class="measure text-xs lg:text-sm text-tinta leading-relaxed">
                      {{ paper.relevance }}
                    </p>
                  </div>
                  <!-- 44 px de alto y de ancho. Hasta `lg` es solo el icono (el móvil queda como estaba: la tarjeta no pierde ancho de texto); desde
                       `lg` lleva «Ver estudio». El nombre accesible empieza por el texto visible (WCAG 2.5.3). -->
                  <a
                    v-if="paper.link"
                    :href="paper.link"
                    target="_blank"
                    rel="noopener"
                    :aria-label="`${$t('ciencia.view_study')} · ${paper.ref} ${locale === 'es' ? '(nueva pestaña)' : '(new tab)'}`"
                    class="ev-doi link-action"
                  >
                    <Icon
                      name="ph:arrow-square-out"
                      class="w-4 h-4"
                      aria-hidden="true"
                    />
                    <span class="hidden lg:inline">{{ $t('ciencia.view_study') }}</span>
                  </a>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <!-- Back to the case -->
        <NuxtLink :to="localePath('/ciencia')" class="link-action ev-volver">
          <Icon name="ph:arrow-left" class="w-4 h-4" aria-hidden="true" />
          {{ $t('ciencia.back_to_science') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, ScienceEnCollectionItem } from '@nuxt/content'

const { locale, t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Evidencia científica: BC-NED, receptores, TROP-2, FGFR1 y PRRT'
      : 'Scientific evidence: BC-NED, receptors, TROP-2, FGFR1 and PRRT',
  description: () =>
    locale.value === 'es'
      ? 'Literatura revisada por pares detrás de cada hipótesis del caso, con su población y sus límites: diferenciación neuroendocrina y RB1, conversión de receptores, ADC anti-TROP-2, amplificación de FGFR1, radioligandos y metástasis hepáticas.'
      : 'Peer-reviewed literature behind each hypothesis in the case, with its population and limits: neuroendocrine differentiation and RB1, receptor conversion, anti-TROP-2 ADC, FGFR1 amplification, radioligands and liver metastases.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

defineOgImage('Default.takumi', {
  title: () => t('ciencia.key_evidence'),
  description: () =>
    locale.value === 'es'
      ? 'La evidencia que sustenta los ejes terapéuticos del caso.'
      : 'The evidence behind the case’s therapeutic axes.',
})

const { data: scienceData } = await useAsyncData(
  `science-evidence-${locale.value}`,
  () => {
    const collection = `science_${locale.value || 'en'}` as keyof Collections
    return queryCollection(
      collection
    ).first() as Promise<ScienceEnCollectionItem | null>
  },
  { watch: [locale] }
)

const paperSections = computed(() => {
  if (scienceData.value?.paperSections?.length) {
    return scienceData.value.paperSections
  }
  return [
    {
      title: '',
      subtitle: '',
      papers: scienceData.value?.papers ?? [],
    },
  ]
})
</script>

<style scoped>
/* La cita de cada estudio: mono de 13 px en minúsculas (el suelo), en el color secundario. Parte línea en vez de ensanchar la tarjeta. */
.ev-ref { margin: 0 0 var(--sp-8); font: 400 var(--texto-xs)/1.55 var(--font-mono); color: var(--texto-2); overflow-wrap: anywhere; }
/* El enlace al estudio: 44 × 44 px (hasta `lg` es solo el icono) y el color de enlace del sistema. Los márgenes negativos meten el exceso en el relleno de la
   tarjeta, para que la zona táctil de 44 px no le quite ancho al texto en el móvil (ocupa en la fila unos 20 px, no 44). Desde `lg` lleva el texto y es una fila normal. */
.ev-doi { flex: none; justify-content: center; min-width: var(--control-min); margin: calc(-1 * var(--sp-12)) calc(-1 * var(--sp-12)) 0; color: var(--identidad); }
@media (min-width: 1024px) { .ev-doi { min-width: 0; margin: 0; padding-inline: var(--sp-4); } }
.ev-volver { color: var(--identidad); }
</style>
