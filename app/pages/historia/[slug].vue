<template>
  <div>
    <section class="section-spacing" :aria-label="chapter?.title">
      <div class="section-container">

        <NuxtLink
          :to="localePath('/historia')"
          class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-8 transition-colors"
        >
          <Icon name="ph:arrow-left" class="w-4 h-4" aria-hidden="true" />
          {{ $t('historia.back_to_story') }}
        </NuxtLink>

        <div
          v-if="isFallback"
          class="card-base border-l-4 border-l-gold-400 mb-8 bg-gold-50/40"
        >
          <p class="text-sm text-ink-600 italic">
            {{ $t('historia.fallback_notice') }}
          </p>
        </div>

        <div v-if="!chapter" class="card-base text-center py-16">
          <Icon name="ph:book-open" class="w-12 h-12 text-ink-300 mx-auto mb-4" aria-hidden="true" />
          <p class="text-ink-600">{{ $t('historia.chapter_not_found') }}</p>
          <NuxtLink :to="localePath('/historia')" class="mt-4 inline-block text-sm text-ocean-600 hover:text-ocean-800 transition-colors">
            {{ $t('historia.back_to_chapters') }}
          </NuxtLink>
        </div>

        <template v-else>
          <div class="max-w-2xl mb-10">
            <span class="text-xs font-mono text-ink-400 mb-3 block">
              {{ $t('historia.chapter') }} {{ chapter.order }}
            </span>
            <h1 class="heading-display text-3xl sm:text-4xl text-ink-950 mb-3">{{ chapter.title }}</h1>
            <p v-if="chapter.subtitle" class="text-ink-600 text-lg leading-relaxed">{{ chapter.subtitle }}</p>
          </div>

          <ContentRenderer
            :value="chapter"
            class="prose prose-ink max-w-2xl"
          />

          <nav
            :aria-label="$t('historia.chapter_navigation')"
            class="max-w-2xl mt-16 pt-8 border-t border-ink-200 grid grid-cols-2 gap-4"
          >
            <NuxtLink
              v-if="prevChapter"
              :to="localePath(`/historia/${prevChapter.stem?.split('/').pop()}`)"
              class="card-base flex flex-col gap-1 hover:border-gold-300 transition-colors group"
            >
              <span class="text-xs text-ink-400 flex items-center gap-1">
                <Icon name="ph:arrow-left" class="w-3 h-3" aria-hidden="true" />
                {{ $t('historia.previous') }}
              </span>
              <span class="text-sm font-semibold text-ink-900 group-hover:text-gold-700 transition-colors line-clamp-2">
                {{ prevChapter.title }}
              </span>
            </NuxtLink>
            <div v-else />

            <NuxtLink
              v-if="nextChapter"
              :to="localePath(`/historia/${nextChapter.stem?.split('/').pop()}`)"
              class="card-base flex flex-col gap-1 text-right hover:border-gold-300 transition-colors group"
            >
              <span class="text-xs text-ink-400 flex items-center justify-end gap-1">
                {{ $t('historia.next') }}
                <Icon name="ph:arrow-right" class="w-3 h-3" aria-hidden="true" />
              </span>
              <span class="text-sm font-semibold text-ink-900 group-hover:text-gold-700 transition-colors line-clamp-2">
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

const { data } = await useAsyncData(
  `historia-chapter-${slug}-${locale.value}`,
  async () => {
    let current = null
    let isFallback = false
    let allChapters: typeof current[] = []

    if (locale.value === 'en') {
      const enChapter = await queryCollection('story')
        .where('stem', '=', `en/story/${slug}`)
        .first()
      if (enChapter) {
        current = enChapter
        allChapters = await queryCollection('story').order('order', 'ASC').all()
      } else {
        // fallback: find by translationKey in ES collection
        const esChapter = await queryCollection('historia')
          .where('translationKey', '=', slug)
          .first()
        if (esChapter) {
          current = esChapter
          isFallback = true
          allChapters = await queryCollection('historia').order('order', 'ASC').all()
        }
      }
    } else {
      const esChapter = await queryCollection('historia')
        .where('stem', '=', `es/historia/${slug}`)
        .first()
      if (esChapter) {
        current = esChapter
        allChapters = await queryCollection('historia').order('order', 'ASC').all()
      }
    }

    if (!current) return { chapter: null, prevChapter: null, nextChapter: null, isFallback: false }

    const idx = allChapters.findIndex((c) => c?.stem === current!.stem)
    return {
      chapter: current,
      prevChapter: idx > 0 ? allChapters[idx - 1] : null,
      nextChapter: idx < allChapters.length - 1 ? allChapters[idx + 1] : null,
      isFallback,
    }
  },
)

const chapter = computed(() => data.value?.chapter)
const prevChapter = computed(() => data.value?.prevChapter)
const nextChapter = computed(() => data.value?.nextChapter)
const isFallback = computed(() => data.value?.isFallback ?? false)

useHead({
  title: computed(() => chapter.value ? `${chapter.value.title} — Miriam González` : 'Miriam González'),
  meta: [
    { name: 'description', content: computed(() => chapter.value?.excerpt ?? '') },
  ],
})
</script>
