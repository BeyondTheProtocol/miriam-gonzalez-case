<template>
  <div>
    <section class="section-spacing" :aria-labelledby="'evidence-title'">
      <div class="section-container">
        <!-- Back link -->
        <NuxtLink
          :to="localePath('/ciencia')"
          class="inline-flex items-center gap-1.5 text-sm text-tinta hover:text-miriam mb-8 transition-colors"
          style="text-decoration: none"
        >
          <Icon name="ph:arrow-left" class="w-4 h-4" aria-hidden="true" />
          {{ $t('ciencia.back_to_science') }}
        </NuxtLink>

        <!-- Header -->
        <p class="eyebrow mb-2 block">{{ $t('ciencia.evidence_hook_eyebrow') }}</p>
        <h1
          id="evidence-title"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-4"
          style="letter-spacing: -0.03em"
        >
          {{ $t('ciencia.key_evidence') }}
        </h1>
        <p class="text-sm text-tinta leading-relaxed mb-12 max-w-2xl">
          {{ $t('ciencia.evidence_page_intro') }}
        </p>

        <!-- Evidence dossier -->
        <div class="space-y-8 mb-14">
          <section
            v-for="(section, sectionIndex) in paperSections"
            :key="`${section.title}-${sectionIndex}`"
          >
            <div v-if="section.title" class="mb-4">
              <div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h2 :id="`papers-title-${sectionIndex}`" class="heading-display text-lg text-berenjena">{{ section.title }}</h2>
                <span
                  v-if="section.tag"
                  :class="['pill-data', `pill-data--${section.tone || 'neutral'}`]"
                >{{ section.tag }}</span>
              </div>
              <p v-if="section.subtitle" class="text-sm text-tinta leading-relaxed">{{ section.subtitle }}</p>
            </div>
            <ul class="space-y-4" :aria-labelledby="`papers-title-${sectionIndex}`">
              <li v-for="paper in section.papers" :key="paper.ref" class="card-base">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="status-badge status-badge--reference">{{ paper.ref }}</span>
                    </div>
                    <h3 class="font-semibold text-berenjena text-sm mb-1.5">
                      {{ paper.finding }}
                    </h3>
                    <p class="text-xs text-tinta leading-relaxed">
                      {{ paper.relevance }}
                    </p>
                  </div>
                  <a
                    v-if="paper.link"
                    :href="paper.link"
                    target="_blank"
                    rel="noopener"
                    :aria-label="`${$t('ciencia.view_reference')} ${paper.ref} ${locale === 'es' ? '(nueva pestaña)' : '(new tab)'}`"
                    class="shrink-0 mt-1 text-miriam hover:text-berenjena transition-colors"
                  >
                    <Icon
                      name="ph:arrow-square-out"
                      class="w-4 h-4"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <!-- Back to the case -->
        <NuxtLink
          :to="localePath('/ciencia')"
          class="inline-flex items-center gap-1.5 text-sm text-miriam hover:text-berenjena transition-colors"
          style="text-decoration: none"
        >
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
      ? 'Evidencia científica: FGFR1, PRRT/SSTR y BC-NED'
      : 'Scientific evidence: FGFR1, PRRT/SSTR and BC-NED',
  description: () =>
    locale.value === 'es'
      ? 'Literatura revisada por pares y ensayos clínicos que respaldan cada hipótesis del caso: amplificación FGFR1, radioligandos PRRT/SSTR, diferenciación neuroendocrina (BC-NED) y oncología de precisión N-of-1.'
      : 'Peer-reviewed literature and clinical trials backing each hypothesis in the case: FGFR1 amplification, PRRT/SSTR radioligands, neuroendocrine differentiation (BC-NED) and N-of-1 precision oncology.',
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
