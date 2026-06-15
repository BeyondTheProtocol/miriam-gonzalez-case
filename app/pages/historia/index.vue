<template>
  <div>
    <section class="section-spacing" :aria-label="$t('story.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('story.title')"
          :subtitle="$t('story.subtitle')"
        />

        <article class="prose prose-ink max-w-2xl">
          <div class="alert-callout mb-10">
            <p class="text-sm text-tinta italic leading-relaxed">
              {{ $t('historia.pending_notice') }}
            </p>
          </div>
          <div class="space-y-6 text-tinta">
            <p>{{ $t('historia.story_teaser_1') }}</p>
            <p>{{ $t('historia.story_teaser_2') }}</p>
            <p>{{ $t('historia.story_teaser_3') }}</p>
            <p>{{ $t('historia.story_teaser_4') }}</p>
          </div>
        </article>

        <!-- Capítulos publicados bajo content/es/historia · content/en/story -->
        <div
          v-if="chapters && chapters.length > 0"
          class="max-w-2xl mt-12"
        >
          <nav :aria-label="$t('historia.chapters')" class="space-y-3">
            <NuxtLink
              v-for="chapter in chapters"
              :key="chapter.path"
              :to="localePath(`/historia/${chapter.stem?.split('/').pop()}`)"
              class="card-base flex items-start justify-between gap-4 transition-all group hover:-translate-y-0.5"
              style="text-decoration:none"
            >
              <div class="flex-1 min-w-0">
                <span class="eyebrow mb-1 block">
                  {{ $t('historia.chapter') }} {{ chapter.order }}
                </span>
                <h2
                  class="font-display font-semibold text-berenjena text-base mb-1 group-hover:text-miriam transition-colors"
                >
                  {{ chapter.title }}
                </h2>
                <p v-if="chapter.subtitle" class="text-xs text-tinta mb-1.5">
                  {{ chapter.subtitle }}
                </p>
                <p class="text-xs text-tinta leading-relaxed line-clamp-2">
                  {{ chapter.excerpt }}
                </p>
              </div>
              <Icon
                name="ph:arrow-right"
                class="shrink-0 w-4 h-4 text-tinta group-hover:text-miriam transition-colors mt-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </nav>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () =>
    locale.value === 'es' ? 'La historia de Miriam' : "Miriam's story",
  description: () =>
    locale.value === 'es'
      ? 'La historia personal de Miriam González: vida con cáncer de mama metastásico en fase 4, su proceso con los tratamientos y la búsqueda de una solución de precisión.'
      : 'The personal story of Miriam González: life with stage 4 metastatic breast cancer, her treatment journey, and the search for a precision solution.',
  ogTitle: () =>
    locale.value === 'es' ? 'La historia de Miriam' : "Miriam's story",
  ogDescription: () =>
    locale.value === 'es'
      ? 'Vida con cáncer de mama metastásico en fase 4 y la búsqueda de una solución de precisión.'
      : 'Life with stage 4 metastatic breast cancer and the search for a precision solution.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es' ? 'La historia de Miriam' : "Miriam's story",
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Vida con cáncer de mama metastásico en fase 4 y la búsqueda de una solución de precisión.'
      : 'Life with stage 4 metastatic breast cancer and the search for a precision solution.',
})

defineOgImage('Default.takumi', {
  title: () => t('story.title'),
  description: () => t('story.subtitle'),
})

const { data: chapters } = await useAsyncData(
  `historia-index-${locale.value}`,
  () => {
    if (locale.value === 'en')
      return queryCollection('historia_en').order('order', 'ASC').all()
    return queryCollection('historia_es').order('order', 'ASC').all()
  },
  { watch: [locale], default: () => [] }
)
</script>
