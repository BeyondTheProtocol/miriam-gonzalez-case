<template>
  <div>
    <SectionHero />
    <SectionCampaign />

    <section class="section-spacing" :aria-label="$t('index.molecular_profile')">
      <div class="section-container">
        <div class="flex items-center justify-between mb-8">
          <h2 class="heading-display text-2xl sm:text-3xl text-ink-950">
            {{ $t('index.molecular_profile') }}
          </h2>
          <NuxtLink
            :to="localePath({ name: 'ciencia' })"
            class="link-underline text-sm"
          >
            {{ $t('index.see_full_science') }}
          </NuxtLink>
        </div>
        <MolecularProfile />
      </div>
    </section>

    <section class="section-spacing bg-white/50" :aria-label="$t('index.in_the_press')">
      <div class="section-container">
        <h2 class="heading-display text-2xl sm:text-3xl text-ink-950 mb-10 text-center">
          {{ $t('index.in_the_press') }}
        </h2>
        <div class="flex flex-wrap justify-center gap-8 sm:gap-12" v-if="pressData?.articles">
          <a
            v-for="article in pressData.articles"
            :key="article.url"
            :href="article.url" 
            target="_blank"
            rel="noopener noreferrer"
            class="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 min-w-[280px] max-w-[400px]"
          >
            <span class="font-display font-bold text-lg text-ink-600 group-hover:text-ink-900 transition-colors">
              {{ article.outlet }}
            </span>
            <span class="text-sm text-ink-600 text-center leading-relaxed">
              {{ article.title }}
            </span>
          </a>
        </div>
        <div v-else>
          <p class="text-center text-ink-600">
            {{ $t('index.no_press_articles') }}
          </p>
        </div>
      </div>
    </section>

    <section class="py-20 bg-ink-950 text-white relative overflow-hidden" :aria-label="$t('index.core_thesis')">
      <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px;" />

      <div class="relative section-container text-center">
        <span class="tag bg-gold-500/20 text-gold-300 border-gold-500/30 mb-6 inline-flex">
          {{ $t('index.core_thesis') }}
        </span>
        <blockquote class="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug max-w-3xl mx-auto">
          {{ $t('ciencia.thesis') }}
        </blockquote>
        <p class="mt-6 text-ink-400 max-w-xl mx-auto leading-relaxed">
          {{ $t('ciencia.thesis_goal') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, PressEnCollectionItem } from '@nuxt/content'
const { locale } = useI18n()
const localePath = useLocalePath()

const { data: pressData } = await useAsyncData('press-data', () => {
  const collection = `press_${locale.value || 'en'}` as keyof Collections
  return queryCollection(collection).first() as Promise<PressEnCollectionItem | null>
})

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
    : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  description: () => locale.value === 'es'
    ? 'BC-NED con amplificación FGFR1 ×13. Una paciente con cáncer de mama metastásico que usa IA y una red internacional de expertos para acceder a la oncología de precisión. Apoya la rebiopsia molecular.'
    : 'BC-NED with FGFR1 ×13 amplification. A metastatic breast cancer patient using AI and an international expert network to access precision oncology. Support the molecular rebiopsy.',
  ogTitle: () => locale.value === 'es'
    ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
    : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  ogDescription: () => locale.value === 'es'
    ? 'BC-NED con amplificación FGFR1 ×13. Apoya la rebiopsia molecular avanzada que puede cambiar su tratamiento.'
    : 'BC-NED with FGFR1 ×13 amplification. Support the advanced molecular rebiopsy that could change her treatment.',
  ogType: 'website',
  ogUrl: () => locale.value === 'es' ? 'https://helpmiriam.com' : 'https://helpmiriam.com/en',
  twitterCard: 'summary_large_image',
  twitterTitle: () => locale.value === 'es'
    ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
    : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  twitterDescription: () => locale.value === 'es'
    ? 'BC-NED con amplificación FGFR1 ×13. Apoya la rebiopsia molecular avanzada.'
    : 'BC-NED with FGFR1 ×13 amplification. Support the advanced molecular rebiopsy.',
})
</script>
