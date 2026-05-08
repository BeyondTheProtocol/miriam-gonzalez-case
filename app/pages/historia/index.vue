<template>
  <div>
    <section class="section-spacing" :aria-label="$t('story.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('story.title')"
          :subtitle="$t('story.subtitle')"
        />

        <article class="prose prose-ink max-w-2xl">
           <div class="card-base border-l-4 border-l-gold-400 mb-10">
            <p class="text-sm text-ink-600 italic leading-relaxed">
              {{ $t('historia.pending_notice') }}
            </p>
          </div>
          <div class="space-y-6 text-ink-700">
            <p>{{ $t('historia.story_teaser_1') }}</p>
            <p>{{ $t('historia.story_teaser_2') }}</p>
            <p>{{ $t('historia.story_teaser_3') }}</p>
            <p>{{ $t('historia.story_teaser_4') }}</p>
          </div>
        </article>

        <!-- Here is where the story chapters that live under content/es/historia content/en/story will render -->
        <div v-if="false && chapters && chapters.length > 0" class="max-w-2xl mt-12">
          <nav :aria-label="$t('historia.chapters')" class="space-y-3 mb-12">
            <NuxtLink
              v-for="chapter in chapters"
              :key="chapter.path"
              :to="localePath(`/historia/${chapter.stem?.split('/').pop()}`)"
              class="card-base flex items-start justify-between gap-4 hover:border-gold-300 transition-colors group"
            >
              <div class="flex-1 min-w-0">
                <span class="text-xs font-mono text-ink-400 mb-1 block">
                  {{ $t('historia.chapter') }} {{ chapter.order }}
                </span>
                <h2 class="font-semibold text-ink-900 text-sm mb-1 group-hover:text-gold-700 transition-colors">
                  {{ chapter.title }}
                </h2>
                <p v-if="chapter.subtitle" class="text-xs text-ink-600 mb-1.5">{{ chapter.subtitle }}</p>
                <p class="text-xs text-ink-600 leading-relaxed line-clamp-2">{{ chapter.excerpt }}</p>
              </div>
              <Icon name="ph:arrow-right" class="shrink-0 w-4 h-4 text-ink-400 group-hover:text-gold-600 transition-colors mt-0.5" aria-hidden="true" />
            </NuxtLink>
          </nav>
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
    ? 'La historia de Miriam — Miriam González'
    : 'Miriam\'s Story — Miriam González',
  description: () => locale.value === 'es'
    ? 'La historia personal de Miriam González: vida con cáncer de mama metastásico en fase 4, su proceso con los tratamientos y la búsqueda de una solución de precisión.'
    : 'The personal story of Miriam González: life with stage 4 metastatic breast cancer, her treatment journey, and the search for a precision solution.',
  ogTitle: () => locale.value === 'es'
    ? 'La historia de Miriam — Miriam González'
    : 'Miriam\'s Story — Miriam González',
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

const { data: chapters } = await useAsyncData(
  `historia-index-${locale.value}`,
  () => {
    if (locale.value === 'en') return queryCollection('historia_en').order('order', 'ASC').all()
    return queryCollection('historia_es').order('order', 'ASC').all()
  },
  { watch: [locale], default: () => [] },
)
</script>
