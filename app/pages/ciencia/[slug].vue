<template>
  <div>
    <section class="section-spacing" :aria-label="article?.title">
      <div class="section-container">

        <!-- Back link -->
        <NuxtLink
          :to="localePath('/ciencia')"
          class="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-8 transition-colors"
        >
          <Icon name="ph:arrow-left" class="w-4 h-4" aria-hidden="true" />
          {{ locale === 'es' ? 'Volver a la ciencia' : 'Back to science' }}
        </NuxtLink>

        <!-- Language fallback notice -->
        <div
          v-if="isFallback"
          class="card-base border-l-4 border-l-gold-400 mb-8 bg-gold-50/40"
        >
          <p class="text-sm text-ink-600 italic">
            {{ locale === 'es'
              ? 'Este artículo aún no está disponible en inglés. Se muestra la versión en español.'
              : 'This article is not yet available in English. Showing the Spanish version.'
            }}
          </p>
        </div>

        <!-- 404 -->
        <div v-if="!article" class="card-base text-center py-16">
          <Icon name="ph:file-x" class="w-12 h-12 text-ink-300 mx-auto mb-4" aria-hidden="true" />
          <p class="text-ink-600">{{ locale === 'es' ? 'Artículo no encontrado.' : 'Article not found.' }}</p>
          <NuxtLink :to="localePath('/ciencia')" class="mt-4 inline-block text-sm text-ocean-600 hover:text-ocean-800 transition-colors">
            {{ locale === 'es' ? 'Ver todos los análisis' : 'View all analyses' }}
          </NuxtLink>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="max-w-2xl mb-10">
            <div class="flex flex-wrap items-center gap-1.5 mb-4">
              <span v-for="tag in article.tags" :key="tag" class="tag-ocean">{{ tag }}</span>
            </div>
            <h1 class="heading-display text-3xl sm:text-4xl text-ink-950 mb-4">{{ article.title }}</h1>
            <p class="text-ink-600 text-sm font-mono">
              {{ formatDate(article.date) }}
            </p>
          </div>

          <!-- Body -->
          <div class="max-w-2xl">
            <ContentRenderer
              :value="article"
              class="prose prose-ink"
            />

            <!-- References -->
            <div v-if="article.references?.length" class="mt-12 pt-8 border-t border-ink-200">
              <h2 class="font-display font-semibold text-ink-900 text-base mb-4">
                {{ locale === 'es' ? 'Referencias' : 'References' }}
              </h2>
              <ul class="space-y-2">
                <li
                  v-for="ref in article.references"
                  :key="ref.id"
                  class="flex items-start gap-2 text-sm"
                >
                  <span class="tag-ocean shrink-0">{{ ref.id }}</span>
                  <a
                    :href="ref.link"
                    target="_blank"
                    rel="noopener"
                    class="text-ocean-600 hover:text-ocean-800 transition-colors break-all"
                  >{{ ref.link }}</a>
                </li>
              </ul>
            </div>
          </div>
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
  `ciencia-article-${slug}-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enArticle = await queryCollection('science_articles')
        .where('stem', '=', `en/science/${slug}`)
        .first()
      if (enArticle) return { article: enArticle, isFallback: false }
      // fallback to ES version with matching translationKey
      const esArticle = await queryCollection('ciencia_articles')
        .where('translationKey', '=', slug)
        .first()
      if (esArticle) return { article: esArticle, isFallback: true }
      return { article: null, isFallback: false }
    }
    const esArticle = await queryCollection('ciencia_articles')
      .where('stem', '=', `es/ciencia/${slug}`)
      .first()
    return { article: esArticle ?? null, isFallback: false }
  },
)

const article = computed(() => data.value?.article)
const isFallback = computed(() => data.value?.isFallback ?? false)

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

useSeoMeta({
  title: computed(() => article.value ? `${article.value.title} — Miriam González` : 'Miriam González'),
  description: computed(() => article.value?.excerpt ?? ''),
  ogTitle: computed(() => article.value ? `${article.value.title} — Miriam González` : 'Miriam González'),
  ogDescription: computed(() => article.value?.excerpt ?? ''),
  ogType: 'article',
  twitterCard: 'summary_large_image',
})
</script>
