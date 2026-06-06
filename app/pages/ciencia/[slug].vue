<template>
  <div>
    <section class="section-spacing" :aria-label="article?.title">
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

        <!-- Language fallback notice -->
        <div
          v-if="isFallback"
          class="card-base mb-8"
          style="border-left: 4px solid #a44db2"
        >
          <p class="text-sm text-tinta italic">
            {{ $t('ciencia.article_fallback_notice') }}
          </p>
        </div>

        <!-- 404 -->
        <div v-if="!article" class="card-base text-center py-16">
          <Icon
            name="ph:file-x"
            class="w-12 h-12 mx-auto mb-4"
            style="color: rgba(45,27,61,0.30)"
            aria-hidden="true"
          />
          <p class="text-tinta">
            {{ $t('ciencia.article_not_found') }}
          </p>
          <NuxtLink
            :to="localePath('/ciencia')"
            class="mt-4 inline-block text-sm text-miriam hover:text-berenjena transition-colors"
            style="text-decoration: none"
          >
            {{ $t('ciencia.view_all_analyses') }}
          </NuxtLink>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="max-w-2xl mb-10">
            <div class="flex flex-wrap items-center gap-1.5 mb-4">
              <span v-for="tag in article.tags" :key="tag" class="status-badge status-badge--reference">{{
                tag
              }}</span>
            </div>
            <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-4" style="letter-spacing: -0.03em">
              {{ article.title }}
            </h1>
            <p class="text-tinta text-sm font-mono">
              {{ formatDate(article.date) }}
            </p>
          </div>

          <!-- Body -->
          <div class="max-w-2xl">
            <ContentRenderer :value="article" class="prose prose-ink" />

            <!-- References -->
            <div
              v-if="article.references?.length"
              class="mt-12 pt-8"
              style="border-top: 1px solid rgba(45,27,61,0.10)"
            >
              <h2
                class="font-display font-semibold text-berenjena text-base mb-4"
              >
                {{ $t('ciencia.references') }}
              </h2>
              <ul class="space-y-2">
                <li
                  v-for="ref in article.references"
                  :key="ref.id"
                  class="flex items-start gap-2 text-sm"
                >
                  <span class="status-badge status-badge--reference shrink-0">{{ ref.id }}</span>
                  <a
                    :href="ref.link"
                    target="_blank"
                    rel="noopener"
                    :aria-label="`${$t('ciencia.reference')} ${ref.id}: ${ref.link}`"
                    class="text-miriam hover:text-berenjena transition-colors"
                    style="text-decoration: none"
                    >{{ refHost(ref.link) }}</a
                  >
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
        .path(`/en/science/${slug}`)
        .first()
      if (enArticle) return { article: enArticle, isFallback: false }

      // fallback to ES version with matching translationKey
      const esArticle = await queryCollection('ciencia_articles')
        .where('translationKey', '=', slug)
        .first()
      return { article: esArticle ?? null, isFallback: !!esArticle }
    }

    const esArticle = await queryCollection('ciencia_articles')
      .path(`/es/ciencia/${slug}`)
      .first()
    return { article: esArticle ?? null, isFallback: false }
  },
  { watch: [locale] }
)

const article = computed(() => data.value?.article)
const isFallback = computed(() => data.value?.isFallback ?? false)

function refHost(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const fallbackDesc = computed(() =>
  locale.value === 'es'
    ? 'Documentación clínica abierta del caso de Miriam González: perfil molecular, tratamientos y evidencia científica.'
    : "Open clinical documentation of Miriam González's case: molecular profile, treatments and scientific evidence."
)

useSeoMeta({
  title: computed(() =>
    article.value
      ? article.value.title
      : locale.value === 'es'
        ? 'Análisis no encontrado'
        : 'Analysis not found'
  ),
  description: computed(() => article.value?.excerpt || fallbackDesc.value),
  ogTitle: computed(() =>
    article.value ? article.value.title : 'Miriam González'
  ),
  ogDescription: computed(() => article.value?.excerpt || fallbackDesc.value),
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: computed(() =>
    article.value ? article.value.title : 'Miriam González'
  ),
  twitterDescription: computed(() => article.value?.excerpt || fallbackDesc.value),
  // Estados sin artículo: no indexar.
  robots: computed(() => (article.value ? undefined : 'noindex, follow')),
})

defineOgImage('Default.takumi', {
  title: () => article.value?.title || 'Miriam González',
  description: () => article.value?.excerpt || '',
})

useSchemaOrg([
  defineArticle({
    headline: () => article.value?.title,
    datePublished: () => article.value?.date,
    description: () => article.value?.excerpt,
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
    author: { name: 'Miriam González' },
  }),
])
</script>
