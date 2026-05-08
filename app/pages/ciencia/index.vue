<template>
  <div>
    <section class="section-spacing" :aria-label="$t('science.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('science.title')"
          :subtitle="$t('science.subtitle')"
          tag="BC-NED + FGFR1 × 13"
        />

        <h2 class="sr-only">{{ locale === 'es' ? 'Perfil molecular' : 'Molecular profile' }}</h2>
        <MolecularProfile class="mb-12" />

        <section class="card-base mb-8 border-l-4 border-l-gold-400">
          <h2 class="font-display font-semibold text-ink-900 text-lg mb-3">
            {{ $t('ciencia.why_no_fit_guidelines') }}
          </h2>
          <p class="text-sm text-ink-700 leading-relaxed mb-4">
            {{ $t('ciencia.why_no_fit_guidelines_text') }}
          </p>
          <p class="text-sm text-ink-700 leading-relaxed font-medium">
            {{ $t('ciencia.thesis') }}
          </p>
        </section>

        <h2 class="heading-display text-2xl text-ink-950 mb-6 mt-14">
          {{ $t('ciencia.treatment_history') }}
        </h2>
        <div class="space-y-4 mb-14">
          <div v-for="tx in treatments" :key="tx.line" class="card-base flex items-start gap-4">
            <span
              class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
              :class="tx.active ? 'bg-gold-100 text-gold-800' : 'bg-ink-100 text-ink-600'"
            >
              {{ tx.line }}
            </span>
            <div>
              <h4 class="font-semibold text-ink-900 text-sm">{{ tx.regimen }}</h4>
              <p class="text-xs text-ink-600 mt-1 leading-relaxed">{{ tx.outcome }}</p>
            </div>
          </div>
        </div>

        <h2 class="heading-display text-2xl text-ink-950 mb-6">
          {{ $t('ciencia.key_evidence') }}
        </h2>
        <div class="space-y-4 mb-14">
          <div v-for="paper in papers" :key="paper.ref" class="card-base">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="tag-ocean">{{ paper.ref }}</span>
                </div>
                <h4 class="font-semibold text-ink-900 text-sm mb-1.5">{{ paper.finding }}</h4>
                <p class="text-xs text-ink-600 leading-relaxed">{{ paper.relevance }}</p>
              </div>
              <a
                v-if="paper.link"
                :href="paper.link"
                target="_blank"
                rel="noopener"
                :aria-label="`${$t('ciencia.view_reference')} ${paper.ref} ${locale === 'es' ? '(nueva pestaña)' : '(new tab)'}`"
                class="shrink-0 mt-1 text-ocean-500 hover:text-ocean-700 transition-colors"
              >
                <Icon name="ph:arrow-square-out" class="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <section v-if="false">
          <h2 id="panel-title" class="heading-display text-2xl text-ink-950 mb-6">
            {{ $t('ciencia.proposed_panel') }}
          </h2>
          <div class="card-base overflow-hidden mb-14">
            <div class="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table class="w-full text-sm" :aria-labelledby="locale === 'es' ? 'panel-title' : undefined">
                <caption class="sr-only">{{ $t('ciencia.proposed_panel_caption') }}</caption>
                <thead>
                  <tr class="border-b-2 border-ink-200">
                    <th scope="col" class="text-left py-2 pr-3 font-semibold text-ink-800 text-xs whitespace-nowrap">
                      {{ $t('ciencia.component') }}
                    </th>
                    <th scope="col" class="text-left py-2 pr-3 font-semibold text-ink-800 text-xs whitespace-nowrap">
                      {{ $t('ciencia.method') }}
                    </th>
                    <th scope="col" class="text-left py-2 pr-3 font-semibold text-ink-800 text-xs">
                      {{ $t('ciencia.targets') }}
                    </th>
                    <th scope="col" class="text-left py-2 font-semibold text-ink-800 text-xs">
                      {{ $t('ciencia.implication') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, i) in panelRows"
                    :key="i"
                    class="border-b border-ink-100 last:border-0"
                    :class="i % 2 === 0 ? 'bg-ocean-50/20' : ''"
                  >
                    <td class="py-2.5 pr-3 text-xs font-medium text-ink-900 whitespace-nowrap">{{ row.component }}</td>
                    <td class="py-2.5 pr-3 text-xs text-ink-600 whitespace-nowrap">{{ row.method }}</td>
                    <td class="py-2.5 pr-3 text-xs text-ink-600">{{ row.targets }}</td>
                    <td class="py-2.5 text-xs text-ink-600">{{ row.implication }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div class="card-base bg-ink-950 text-white border-0 mb-16">
          <div class="flex items-center gap-2.5 mb-4">
            <span class="w-9 h-9 rounded-xl bg-gold-500/20 flex items-center justify-center">
              <Icon name="ph:target-fill" class="w-5 h-5 text-gold-400" />
            </span>
            <h3 class="font-display font-semibold text-lg">
              {{ $t('ciencia.goal_n_of_1') }}
            </h3>
          </div>
          <p class="text-sm text-ink-300 leading-relaxed mb-3">
            {{ $t('ciencia.goal_n_of_1_desc') }}
          </p>
          <p class="text-sm text-ink-400 leading-relaxed mb-3">
            {{ $t('ciencia.win_consortium_desc') }}
          </p>
          <p class="text-sm text-gold-400 font-medium">
            {{ $t('ciencia.win_consortium_precedent') }}
          </p>
        </div>

        <div v-if="articles && articles.length > 0">
          <h2 class="heading-display text-2xl text-ink-950 mb-6">
            {{ $t('ciencia.detailed_analyses') }}
          </h2>
          <div class="space-y-4">
            <NuxtLink
              v-for="article in articles"
              :key="article.path"
              :to="localePath(`/ciencia/${article.stem?.split('/').pop()}`)"
              class="card-base flex items-start justify-between gap-4 hover:border-gold-300 transition-colors group"
            >
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  <span v-for="tag in article.tags" :key="tag" class="tag-ocean text-xs">{{ tag }}</span>
                </div>
                <h3 class="font-semibold text-ink-900 text-sm mb-1 group-hover:text-ocean-700 transition-colors">{{ article.title }}</h3>
                <p class="text-xs text-ink-600 leading-relaxed line-clamp-2">{{ article.excerpt }}</p>
              </div>
              <Icon name="ph:arrow-right" class="shrink-0 w-4 h-4 text-ink-400 group-hover:text-ocean-600 transition-colors mt-0.5" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'Perfil Molecular BC-NED + FGFR1 ×13 — Ciencia | Miriam González'
    : 'Molecular Profile BC-NED + FGFR1 ×13 — Science | Miriam González',
  description: () => locale.value === 'es'
    ? 'Análisis científico completo del caso: cáncer de mama con ~80% diferenciación neuroendocrina, amplificación FGFR1 ×13, CCND1 ×20. Historia de tratamientos, rebiopsia propuesta y ensayos clínicos relevantes.'
    : 'Full scientific analysis: breast cancer with ~80% neuroendocrine differentiation, FGFR1 ×13 amplification, CCND1 ×20. Treatment history, proposed rebiopsy, and relevant clinical trials.',
  ogTitle: () => locale.value === 'es'
    ? 'Perfil Molecular BC-NED + FGFR1 ×13 | Miriam González'
    : 'Molecular Profile BC-NED + FGFR1 ×13 | Miriam González',
  ogDescription: () => locale.value === 'es'
    ? 'Análisis científico del caso: BC-NED, FGFR1 ×13, CCND1 ×20. Metástasis óseas, ECOG 0, sin crisis visceral. Rebiopsia molecular avanzada como siguiente paso.'
    : 'Scientific case analysis: BC-NED, FGFR1 ×13, CCND1 ×20. Bone metastases, ECOG 0, no visceral crisis. Advanced molecular rebiopsy as the next step.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

const { data: articles } = await useAsyncData(
  `ciencia-index-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enArticles = await queryCollection('science_articles')
        .order('date', 'DESC')
        .all()
      if (enArticles.length) return enArticles
    }
    return queryCollection('ciencia_articles').order('date', 'DESC').all()
  },
  { watch: [locale] },
)

import type { Collections, ScienceEnCollectionItem } from '@nuxt/content'

const { data: scienceData } = await useAsyncData('science-data', () => {
  const collection = `science_${locale.value || 'en'}` as keyof Collections
  return queryCollection(collection).first() as Promise<ScienceEnCollectionItem | null>
}, { watch: [locale] })

const treatments = computed(() => scienceData.value?.treatments ?? [])
const papers = computed(() => scienceData.value?.papers ?? [])
const panelRows = computed(() => scienceData.value?.panelRows ?? [])
</script>
