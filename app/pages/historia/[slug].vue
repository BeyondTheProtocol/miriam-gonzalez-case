<template>
  <div>
    <section class="section-spacing" :aria-label="chapter?.title">
      <div class="section-container">
        <NuxtLink
          :to="localePath('/historia')"
          class="inline-flex items-center gap-1.5 text-sm text-tinta hover:text-miriam mb-8 transition-colors"
        >
          <Icon name="ph:arrow-left" class="w-4 h-4" aria-hidden="true" />
          {{ $t('historia.back_to_story') }}
        </NuxtLink>

        <div
          v-if="isFallback"
          class="alert-callout mb-8"
        >
          <p class="text-sm text-tinta italic">
            {{ $t('historia.fallback_notice') }}
          </p>
        </div>

        <div v-if="!chapter" class="card-base text-center py-16">
          <Icon
            name="ph:book-open"
            class="w-12 h-12 text-tinta opacity-40 mx-auto mb-4"
            aria-hidden="true"
          />
          <p class="text-tinta">{{ $t('historia.chapter_not_found') }}</p>
          <NuxtLink
            :to="localePath('/historia')"
            class="mt-4 inline-block text-sm text-miriam hover:text-berenjena transition-colors"
          >
            {{ $t('historia.back_to_chapters') }}
          </NuxtLink>
        </div>

        <template v-else>
          <div class="max-w-2xl mb-10">
            <span class="eyebrow mb-3 block">
              {{ $t('historia.chapter') }} {{ chapter.order }}
            </span>
            <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-3" style="letter-spacing:-0.03em">
              {{ chapter.title }}
            </h1>
            <p
              v-if="chapter.subtitle"
              class="text-tinta text-lg leading-relaxed"
            >
              {{ chapter.subtitle }}
            </p>
          </div>

          <ContentRenderer :value="chapter" class="prose prose-ink max-w-2xl" />

          <nav
            :aria-label="$t('historia.chapter_navigation')"
            class="max-w-2xl mt-16 pt-8 grid grid-cols-2 gap-4"
            style="border-top: 1px solid rgba(45,27,61,0.12)"
          >
            <NuxtLink
              v-if="prevChapter"
              :to="
                localePath(`/historia/${prevChapter.stem?.split('/').pop()}`)
              "
              class="card-base flex flex-col gap-1 transition-all group hover:-translate-y-0.5"
              style="text-decoration:none"
            >
              <span class="text-xs text-tinta flex items-center gap-1">
                <Icon name="ph:arrow-left" class="w-3 h-3" aria-hidden="true" />
                {{ $t('historia.previous') }}
              </span>
              <span
                class="text-sm font-semibold text-berenjena group-hover:text-miriam transition-colors line-clamp-2"
              >
                {{ prevChapter.title }}
              </span>
            </NuxtLink>
            <div v-else />

            <NuxtLink
              v-if="nextChapter"
              :to="
                localePath(`/historia/${nextChapter.stem?.split('/').pop()}`)
              "
              class="card-base flex flex-col gap-1 text-right transition-all group hover:-translate-y-0.5"
              style="text-decoration:none"
            >
              <span
                class="text-xs text-tinta flex items-center justify-end gap-1"
              >
                {{ $t('historia.next') }}
                <Icon
                  name="ph:arrow-right"
                  class="w-3 h-3"
                  aria-hidden="true"
                />
              </span>
              <span
                class="text-sm font-semibold text-berenjena group-hover:text-miriam transition-colors line-clamp-2"
              >
                {{ nextChapter.title }}
              </span>
            </NuxtLink>
            <div v-else />
          </nav>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const localePath = useLocalePath()

const slug = route.params.slug as string

import type {
  HistoriaEsCollectionItem,
  HistoriaEnCollectionItem,
} from '@nuxt/content'

type ChapterItem = HistoriaEsCollectionItem | HistoriaEnCollectionItem

const { data } = await useAsyncData(
  `historia-chapter-${slug}-${locale.value}`,
  async () => {
    let current: ChapterItem | null = null
    let isFallback = false
    let allChapters: ChapterItem[] = []

    if (locale.value === 'en') {
      const enChapter = await queryCollection('historia_en')
        .path(`/en/story/${slug}`)
        .first()
      if (enChapter) {
        current = enChapter
        allChapters = await queryCollection('historia_en')
          .order('order', 'ASC')
          .all()
      } else {
        // fallback: find by translationKey in ES collection
        const esChapter = await queryCollection('historia_es')
          .where('translationKey', '=', slug)
          .first()
        if (esChapter) {
          current = esChapter
          isFallback = true
          allChapters = await queryCollection('historia_es')
            .order('order', 'ASC')
            .all()
        }
      }
    } else {
      const esChapter = await queryCollection('historia_es')
        .path(`/es/historia/${slug}`)
        .first()
      if (esChapter) {
        current = esChapter
        allChapters = await queryCollection('historia_es')
          .order('order', 'ASC')
          .all()
      }
    }

    if (!current)
      return {
        chapter: null,
        prevChapter: null,
        nextChapter: null,
        isFallback: false,
      }

    const idx = allChapters.findIndex((c) => c?.stem === current!.stem)
    return {
      chapter: current,
      prevChapter: idx > 0 ? allChapters[idx - 1] : null,
      nextChapter: idx < allChapters.length - 1 ? allChapters[idx + 1] : null,
      isFallback,
    }
  },
  {
    default: () => ({
      chapter: null,
      prevChapter: null,
      nextChapter: null,
      isFallback: false,
    }),
    watch: [locale],
  }
)

const chapter = computed(() => data.value?.chapter)
const prevChapter = computed(() => data.value?.prevChapter)
const nextChapter = computed(() => data.value?.nextChapter)
const isFallback = computed(() => data.value?.isFallback ?? false)

const fallbackDesc = computed(() =>
  locale.value === 'es'
    ? 'La historia personal de Miriam González más allá del diagnóstico de cáncer de mama metastásico.'
    : "Miriam González's personal story beyond her metastatic breast cancer diagnosis."
)

useSeoMeta({
  title: () =>
    chapter.value
      ? chapter.value.title
      : locale.value === 'es'
        ? 'Capítulo no encontrado'
        : 'Chapter not found',
  description: () => chapter.value?.excerpt || fallbackDesc.value,
  ogTitle: () => (chapter.value ? chapter.value.title : 'Miriam González'),
  ogDescription: () => chapter.value?.excerpt || fallbackDesc.value,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => (chapter.value ? chapter.value.title : 'Miriam González'),
  twitterDescription: () => chapter.value?.excerpt || fallbackDesc.value,
  robots: () => (chapter.value ? undefined : 'noindex, follow'),
})

defineOgImage('Default.takumi', {
  title: () => chapter.value?.title || 'Miriam González',
  description: () => chapter.value?.excerpt || '',
})

useSchemaOrg([
  defineArticle({
    headline: () => chapter.value?.title,
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
    author: { name: 'Miriam González' },
  }),
])
</script>
