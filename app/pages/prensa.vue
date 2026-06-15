<template>
  <div>
    <section class="section-spacing" :aria-label="$t('press.title')">
      <div class="section-wide">
        <PageHeader
          :tag="$t('press.tag')"
          :title="$t('press.title')"
          :subtitle="$t('press.subtitle')"
        />

        <!-- Ficha del caso · hechos clave (izq) + retrato y campaña en vivo (der) -->
        <div class="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14 items-start">
          <!-- Hechos clave -->
          <div>
            <h2 id="press-facts" class="eyebrow mb-5 block">
              {{ $t('press.facts_title') }}
            </h2>
            <dl
              aria-labelledby="press-facts"
              class="divide-y"
              style="border-color: rgba(45,27,61,0.08)"
            >
              <div
                v-for="fact in facts"
                :key="fact.label"
                class="grid sm:grid-cols-[160px_1fr] gap-x-6 gap-y-1 py-4"
              >
                <dt class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta pt-0.5">
                  {{ fact.label }}
                </dt>
                <dd class="text-[15px] text-berenjena leading-relaxed">
                  {{ fact.value }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Retrato + estado de campaña en vivo -->
          <aside class="card-base">
            <figure class="m-0">
              <NuxtImg
                src="/img/miriam-avatar.webp"
                alt="Miriam González"
                width="480"
                height="480"
                sizes="sm:100vw md:360px"
                class="w-full h-auto rounded-[16px]"
                style="aspect-ratio: 1 / 1; object-fit: cover"
                loading="lazy"
              />
              <figcaption class="mt-3 font-mono text-[11.5px] leading-relaxed text-tinta">
                {{ $t('press.photo_caption') }}
              </figcaption>
            </figure>
            <div class="mt-5 pt-5" style="border-top: 1px solid rgba(45,27,61,0.08)">
              <GoFundMeProgress />
            </div>
          </aside>
        </div>

        <!-- El caso en los medios -->
        <div class="mt-16">
          <h2 id="press-mentions" class="eyebrow mb-2 block">
            {{ $t('press.mentions_title') }}
          </h2>
          <p class="text-sm text-tinta mb-6">{{ $t('press.mentions_note') }}</p>
          <ul aria-labelledby="press-mentions" class="space-y-3">
            <li v-for="item in mentions" :key="item.url">
              <a
                :href="item.url"
                target="_blank"
                rel="noopener"
                class="press-mention card-base flex items-start gap-4 group"
                @click="trackPress(item.outlet)"
              >
                <Icon
                  name="ph:newspaper-clipping"
                  class="size-5 shrink-0 mt-0.5 text-miriam"
                  aria-hidden="true"
                />
                <span class="flex-1">
                  <span class="block font-display font-semibold text-berenjena text-[15px] leading-snug">
                    {{ item.title }}
                  </span>
                  <span class="mt-1 block font-mono text-[11.5px] uppercase tracking-[0.08em] text-tinta">
                    {{ item.outlet }}<template v-if="item.date"> · {{ fmtDate(item.date) }}</template>
                  </span>
                </span>
                <Icon
                  name="ph:arrow-up-right"
                  class="size-4 shrink-0 mt-0.5 text-tinta transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
                <span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Boilerplate listo para copiar (kit prensa) -->
        <div class="mt-16">
          <h2 id="press-boilerplate" class="eyebrow mb-2 block">
            {{ $t('press.boilerplate_title') }}
          </h2>
          <p class="text-sm text-tinta mb-4 max-w-2xl">{{ $t('press.boilerplate_note') }}</p>
          <div class="card-base">
            <p id="press-boilerplate-text" class="text-sm text-berenjena leading-relaxed whitespace-pre-line">
              {{ boilerplateText }}
            </p>
            <button
              type="button"
              class="btn-secondary mt-5"
              data-print-hide
              @click="copyBoilerplate"
            >
              <Icon name="ph:copy" class="w-4 h-4" aria-hidden="true" />
              {{ copyLabel }}
            </button>
          </div>
        </div>

        <!-- Material descargable / enlaces de referencia -->
        <div class="mt-16">
          <h2 id="press-resources" class="eyebrow mb-6 block">
            {{ $t('press.resources_title') }}
          </h2>
          <div aria-labelledby="press-resources" class="grid sm:grid-cols-2 gap-4">
            <NuxtLink :to="localePath('ciencia')" class="press-resource card-base group">
              <Icon name="ph:flask" class="size-5 text-miriam mb-3" aria-hidden="true" />
              <span class="block font-display font-semibold text-berenjena text-[15px]">
                {{ $t('press.resource_science') }}
              </span>
              <span class="mt-1 block text-[13px] text-tinta leading-relaxed">
                {{ $t('press.resource_science_desc') }}
              </span>
            </NuxtLink>
            <a href="/llms.txt" target="_blank" rel="noopener" class="press-resource card-base group">
              <Icon name="ph:robot" class="size-5 text-miriam mb-3" aria-hidden="true" />
              <span class="block font-display font-semibold text-berenjena text-[15px]">
                {{ $t('press.resource_llms') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
              </span>
              <span class="mt-1 block text-[13px] text-tinta leading-relaxed">
                {{ $t('press.resource_llms_desc') }}
              </span>
            </a>
            <NuxtLink :to="localePath('gastos')" class="press-resource card-base group">
              <Icon name="ph:receipt" class="size-5 text-miriam mb-3" aria-hidden="true" />
              <span class="block font-display font-semibold text-berenjena text-[15px]">
                {{ $t('press.resource_expenses') }}
              </span>
              <span class="mt-1 block text-[13px] text-tinta leading-relaxed">
                {{ $t('press.resource_expenses_desc') }}
              </span>
            </NuxtLink>
            <NuxtLink :to="localePath('colabora')" class="press-resource card-base group">
              <Icon name="ph:hand-heart" class="size-5 text-miriam mb-3" aria-hidden="true" />
              <span class="block font-display font-semibold text-berenjena text-[15px]">
                {{ $t('press.resource_collaborate') }}
              </span>
              <span class="mt-1 block text-[13px] text-tinta leading-relaxed">
                {{ $t('press.resource_collaborate_desc') }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <!-- Contacto de prensa -->
        <section
          class="mt-16 relative overflow-hidden rounded-card p-8 sm:p-12 max-w-4xl"
          style="background: #2d1b3d; color: #faf6f0"
          aria-labelledby="press-contact-title"
        >
          <div
            aria-hidden="true"
            class="absolute inset-0 opacity-[0.04]"
            style="background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0); background-size: 32px 32px"
          />
          <div class="relative max-w-2xl">
            <h2
              id="press-contact-title"
              class="heading-display text-2xl sm:text-3xl mb-4"
              style="color: #faf6f0; letter-spacing: -0.02em"
            >
              {{ $t('press.contact_title') }}
            </h2>
            <p class="text-[15px] leading-relaxed" style="color: rgba(250,246,240,0.85)">
              {{ $t('press.contact_body') }}
            </p>
            <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-cta mt-7">
              <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
              {{ $t('press.contact_cta') }}
            </NuxtLink>
          </div>
        </section>

        <Nota class="mt-12 pt-6" style="border-top: 1px solid rgba(45,27,61,0.08)">
          {{ $t('footer.updated') }}: {{ $t('footer.month_updated') }} 2026
        </Nota>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, PressEnCollectionItem } from '@nuxt/content'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackPress } = useSupport()

const boilerplateText = computed(() =>
  t('press.boilerplate_text', {
    age: caseData.currentAge,
    countries: caseData.countries,
  })
)

const copyLabel = ref(t('press.boilerplate_copy'))
async function copyBoilerplate() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(boilerplateText.value)
    copyLabel.value = t('press.boilerplate_copied')
    setTimeout(() => {
      copyLabel.value = t('press.boilerplate_copy')
    }, 2000)
  } catch {
    /* sin clipboard */
  }
}

// Hechos clave · las cifras que pueden desincronizarse (edad, nº de países)
// vienen de la fuente única (caseData), no del texto i18n.
const facts = computed(() => [
  { label: t('press.fact_who_label'), value: t('press.fact_who_value', { age: caseData.currentAge }) },
  { label: t('press.fact_diagnosis_label'), value: t('press.fact_diagnosis_value') },
  { label: t('press.fact_why_label'), value: t('press.fact_why_value') },
  { label: t('press.fact_need_label'), value: t('press.fact_need_value') },
  { label: t('press.fact_network_label'), value: t('press.fact_network_value', { countries: caseData.countries }) },
  { label: t('press.fact_lang_label'), value: t('press.fact_lang_value') },
])

// Apariciones en prensa (content/<locale>/press.yml).
const { data: pressData } = await useAsyncData(
  `press-${locale.value}`,
  () => {
    const collection = `press_${locale.value || 'en'}` as keyof Collections
    return queryCollection(collection).first() as Promise<PressEnCollectionItem | null>
  },
  { watch: [locale] }
)
const mentions = computed(() => pressData.value?.articles ?? [])

// 'YYYY-MM-DD' / 'YYYY-MM' → mes y año legibles según idioma.
const fmtDate = (d?: string) => {
  if (!d) return ''
  const [y, m] = d.split('-')
  if (!m) return y
  const date = new Date(Number(y), Number(m) - 1, 1)
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

useSeoMeta({
  title: () => (locale.value === 'es' ? 'Sala de prensa' : 'Press room'),
  description: () =>
    locale.value === 'es'
      ? 'Kit de prensa del caso de Miriam González: hechos verificados, perfil molecular, cobertura en medios y contacto para periodistas.'
      : "Press kit for Miriam González's case: verified facts, molecular profile, media coverage and a contact for journalists.",
  ogTitle: () => (locale.value === 'es' ? 'Sala de prensa · Miriam González' : 'Press room · Miriam González'),
  ogDescription: () =>
    locale.value === 'es'
      ? 'Hechos verificados, perfil molecular y contacto para medios.'
      : 'Verified facts, molecular profile and a media contact.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

defineOgImage('Default.takumi', {
  title: () => t('press.title'),
  description: () =>
    locale.value === 'es'
      ? 'Hechos verificados y contacto para periodistas.'
      : 'Verified facts and a contact for journalists.',
})

const pressJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: locale.value === 'es' ? 'Sala de prensa · Miriam González' : 'Press room · Miriam González',
    description: t('press.subtitle'),
    url: locale.value === 'es' ? 'https://helpmiriam.com/prensa' : 'https://helpmiriam.com/en/press',
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
    about: {
      '@type': 'Person',
      name: 'Miriam González',
      url: 'https://helpmiriam.com',
      jobTitle: locale.value === 'es' ? 'Paciente e ingeniera de software' : 'Patient and software engineer',
    },
    audience: {
      '@type': 'Audience',
      audienceType: locale.value === 'es' ? 'Periodistas y medios' : 'Journalists and media',
    },
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: pressJsonLd }],
})
</script>

<style scoped>
.press-mention,
.press-resource {
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.press-mention:hover,
.press-resource:hover {
  transform: translateY(-2px);
}
.press-resource {
  display: block;
}
</style>
