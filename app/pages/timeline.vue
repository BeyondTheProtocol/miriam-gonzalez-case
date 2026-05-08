<template>
  <div>
    <section class="section-spacing" :aria-label="$t('timeline.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('timeline.title')"
          :subtitle="$t('timeline.subtitle')"
        />

        <ul :aria-label="$t('timeline.title')" class="max-w-2xl">
          <TimelineEntry
            v-for="entry in timelineEntries"
            :key="entry.date"
            :entry="entry"
          />
        </ul>

        <div class="mt-12 card-base bg-gold-50/40 border-gold-200/50 max-w-2xl">
          <p class="text-sm text-ink-600 leading-relaxed">
            {{ $t('timeline.notice') }}
          </p>
          <a
            href="https://x.com/miriamgonp"
            target="_blank"
            rel="noopener"
            class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:text-ocean-800 transition-colors"
          >
            <Icon name="ph:x-logo-fill" class="w-4 h-4" />
            {{ $t('timeline.follow_twitter') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'Cronología del caso — Miriam González'
    : 'Case Timeline — Miriam González',
  description: () => locale.value === 'es'
    ? 'Seguimiento cronológico del caso de Miriam González: diagnóstico, tratamientos, progresión y avances en la búsqueda de oncología de precisión para BC-NED con FGFR1 ×13.'
    : 'Chronological follow-up of Miriam González\'s case: diagnosis, treatments, progression, and advances in the search for precision oncology for BC-NED with FGFR1 ×13.',
  ogTitle: () => locale.value === 'es'
    ? 'Cronología del caso — Miriam González'
    : 'Case Timeline — Miriam González',
  ogType: 'website',
  twitterCard: 'summary',
})

const { data: timelineEntries } = await useAsyncData(
  `timeline-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enData = await queryCollection('timeline_en').first()
      if (enData?.entries?.length) return enData.entries
    }
    const esData = await queryCollection('timeline_es').first()
    return esData?.entries ?? []
  },
  { watch: [locale] },
)
</script>
