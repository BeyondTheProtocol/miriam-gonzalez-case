<template>
  <div>
    <section class="section-spacing" :aria-label="$t('timeline.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('timeline.title')"
          :subtitle="$t('timeline.subtitle')"
        />

        <div class="relative max-w-2xl">
          <!-- Continuous gradient rail (strong at top = most recent, fading into the past) -->
          <span
            aria-hidden="true"
            class="absolute left-[11px] top-2 bottom-3 w-[2px] rounded-full"
            style="background: linear-gradient(180deg, #a44db2 0%, rgba(164,77,178,0.15) 100%)"
          />
          <ul :aria-label="$t('timeline.title')" class="relative">
            <TimelineEntry
              v-for="(entry, i) in orderedEntries"
              :key="entry.date"
              :entry="entry"
              :live="i === 0 && entry.highlight"
            />
          </ul>
        </div>

        <div class="mt-12 card-base max-w-2xl" style="border-left: 4px solid #a44db2">
          <p class="text-sm text-tinta leading-relaxed">
            {{ $t('timeline.notice') }}
          </p>
          <a
            href="https://x.com/miriamgonp"
            target="_blank"
            rel="noopener"
            class="link-action mt-3 text-sm text-miriam"
          >
            <Icon name="ph:x-logo-fill" class="w-4 h-4" aria-hidden="true" />
            {{ $t('timeline.follow_twitter') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()

useSeoMeta({
  title: () =>
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  description: () =>
    locale.value === 'es'
      ? 'Seguimiento cronológico del caso de Miriam González: diagnóstico, tratamientos, progresión y avances en la búsqueda de oncología de precisión para BC-NED con FGFR1 ×13 y SSTR+.'
      : "Chronological follow-up of Miriam González's case: diagnosis, treatments, progression, and advances in the search for precision oncology for BC-NED with FGFR1 ×13 and SSTR+.",
  ogTitle: () =>
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Diagnóstico, tratamientos, progresión y avances, hito a hito.'
      : 'Diagnosis, treatments, progression and advances, milestone by milestone.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Diagnóstico, tratamientos, progresión y avances, hito a hito.'
      : 'Diagnosis, treatments, progression and advances, milestone by milestone.',
})

defineOgImage('Default.takumi', {
  title: () => t('timeline.title'),
  description: () => t('timeline.subtitle'),
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
  { watch: [locale] }
)

// Reverse chronological order: most recent first (matches the design direction).
// Source data stays oldest→newest; we flip only the presentation.
const orderedEntries = computed(() => [...(timelineEntries.value ?? [])].reverse())
</script>
