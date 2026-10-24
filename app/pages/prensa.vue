<template>
  <div>
    <section class="section-spacing" :aria-label="$t('press.title')">
      <div class="section-wide">
        <PageHeader
          :tag="$t('press.tag')"
          :title="$t('press.title')"
          :subtitle="$t('press.subtitle')"
        />

        <!-- Bifurcador: quien escribe una pieza y quien invita necesitan cosas distintas
             (de 7 peticiones recientes, 6 eran invitaciones). Dos enlaces, 44 px o más. -->
        <nav aria-labelledby="press-fork" class="-mt-4">
          <h2 id="press-fork" class="eyebrow mb-4 block">{{ $t('press.fork_title') }}</h2>
          <ul class="grid gap-4 sm:grid-cols-2">
            <li v-for="f in fork" :key="f.href">
              <a :href="f.href" class="press-fork card-base group flex min-h-[44px] items-start gap-4 h-full">
                <Icon :name="f.icon" class="size-6 shrink-0 mt-0.5 text-miriam" aria-hidden="true" />
                <span class="flex-1">
                  <span class="block font-display font-semibold text-berenjena text-lg leading-snug">
                    {{ f.title }}
                  </span>
                  <span class="mt-1 block text-[14px] text-tinta leading-relaxed">{{ f.desc }}</span>
                </span>
                <Icon name="ph:arrow-down" class="size-4 shrink-0 mt-1.5 text-tinta" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>

        <!-- Cómo trabajo con medios (primera persona): lo que piden quienes invitan -->
        <section id="colaboracion" class="mt-16 scroll-mt-24" aria-labelledby="press-collab">
          <div class="card-base" style="border-left: 4px solid #9d44ab">
            <h2
              id="press-collab"
              class="heading-display text-2xl sm:text-3xl text-berenjena mb-3"
              style="letter-spacing: -0.02em"
            >
              {{ $t('press.collab_title') }}
            </h2>
            <p class="text-[15px] text-berenjena leading-relaxed max-w-2xl">{{ $t('press.collab_intro') }}</p>
            <h3 class="eyebrow mt-6 mb-3 block">{{ $t('press.collab_list_title') }}</h3>
            <ol class="list-decimal pl-5 space-y-1.5 text-[15px] text-berenjena leading-relaxed max-w-2xl">
              <li v-for="n in 7" :key="n">{{ $t(`press.collab_item_${n}`) }}</li>
            </ol>
            <p class="mt-6 text-[15px] text-berenjena leading-relaxed max-w-2xl">{{ $t('press.collab_reply') }}</p>
            <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-dark mt-6 min-h-[44px]">
              <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
              {{ $t('press.collab_cta') }}
            </NuxtLink>
          </div>
        </section>

        <!-- Ficha del caso · hechos clave (izq) + retrato (der) -->
        <div id="hechos" class="mt-16 scroll-mt-24 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14 items-start">
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

          <!-- Retrato (el contador de campaña ya no vive aquí: la sala no lleva importes) -->
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
          </aside>
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
            <CopyButton class="mt-5" v-bind="copyProps(boilerplateText)" />
          </div>
        </div>

        <!-- Fotografías de prensa -->
        <div class="mt-16">
          <h2 id="press-photos" class="eyebrow mb-5 block">
            {{ $t('press.photos_title') }}
          </h2>
          <div class="grid sm:grid-cols-2 gap-6" aria-labelledby="press-photos">
            <figure class="m-0">
              <NuxtImg
                src="/img/miriam-prensa-retrato.jpg"
                :alt="$t('press.photo_retrato_alt')"
                width="800"
                height="1200"
                sizes="sm:100vw md:400px"
                class="w-full h-auto rounded-card"
                style="aspect-ratio: 2 / 3; object-fit: cover"
                loading="lazy"
              />
              <figcaption class="mt-2 font-mono text-[12px] leading-relaxed text-tinta">
                {{ $t('press.photo_retrato_caption') }}
              </figcaption>
            </figure>
            <figure class="m-0">
              <NuxtImg
                src="/img/miriam-prensa-ingeniera.jpg"
                :alt="$t('press.photo_ingeniera_alt')"
                width="800"
                height="1200"
                sizes="sm:100vw md:400px"
                class="w-full h-auto rounded-card"
                style="aspect-ratio: 2 / 3; object-fit: cover"
                loading="lazy"
              />
              <figcaption class="mt-2 font-mono text-[12px] leading-relaxed text-tinta">
                {{ $t('press.photo_ingeniera_caption') }}
              </figcaption>
            </figure>
          </div>
          <p class="mt-4 text-sm text-tinta max-w-2xl">{{ $t('press.photo_download_note') }}</p>
        </div>

        <!-- Vídeo: el promo de Polaris, con su transcripción. Venía de /videos, fusionada aquí en el rediseño (F4,
             23-oct-2026); desde T2c (24-oct-2026) /videos redirige a esta ancla (#video) y el explicativo del ADC vive en el hito
             del 7-oct de /timeline. Mismo vídeo y mismas palabras. -->
        <div id="video" class="mt-16 scroll-mt-24">
          <h2 id="press-video" class="eyebrow mb-5 block">
            {{ $t('videos.title') }}
          </h2>
          <VideoCaso :video="VIDEO_PROMO[locale === 'en' ? 'en' : 'es']" nivel="h3" class="max-w-2xl" />
          <!-- T2a (24-oct-2026): lo que cuenta el vídeo, abierto. El índice de herramientas vuelve a ser una página. -->
          <NuxtLink :to="localePath('herramientas')" class="link-action group mt-4">
            {{ $t('nav.all_tools') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>

        <!-- Citas citables -->
        <div class="mt-16">
          <h2 id="press-quotes" class="eyebrow mb-2 block">
            {{ $t('press.quotes_title') }}
          </h2>
          <p class="text-sm text-tinta mb-6 max-w-2xl">{{ $t('press.quotes_note') }}</p>
          <ul aria-labelledby="press-quotes" class="space-y-4">
            <li
              v-for="(quote, i) in quotes"
              :key="i"
              class="card-base border-l-4"
              style="border-left-color: #9d44ab"
            >
              <blockquote
                class="m-0"
                :aria-label="$t('press.quote_aria', { n: i + 1, total: quotes.length, source: quote.source })"
              >
                <p class="font-display text-lg text-berenjena leading-snug" style="letter-spacing: -0.01em">
                  {{ quote.text }}
                </p>
                <footer class="mt-2 text-sm text-tinta">{{ quote.source }}</footer>
              </blockquote>
              <p v-if="quote.note" class="mt-2 font-mono text-[12px] leading-relaxed text-tinta">
                {{ quote.note }}
              </p>
            </li>
          </ul>
        </div>

        <!-- Plegados: biografía, preguntas frecuentes y cronología (nunca bloquean lo principal) -->
        <div class="mt-16 space-y-1">
          <details class="notes-disclosure press-disclosure">
            <summary>{{ $t('press.bio_title') }}</summary>
            <div class="grid gap-4 pt-4 sm:grid-cols-2">
              <div class="card-base">
                <h3 class="eyebrow mb-3 block">{{ $t('press.bio_short_label') }}</h3>
                <p class="text-sm text-berenjena leading-relaxed">{{ $t('press.bio_short_text') }}</p>
                <CopyButton class="mt-5" v-bind="copyProps($t('press.bio_short_text'))" />
              </div>
              <div class="card-base">
                <h3 class="eyebrow mb-3 block">{{ $t('press.bio_long_label') }}</h3>
                <p class="text-sm text-berenjena leading-relaxed">{{ bioLong }}</p>
                <CopyButton class="mt-5" v-bind="copyProps(bioLong)" />
              </div>
            </div>
          </details>

          <details class="notes-disclosure press-disclosure">
            <summary>{{ $t('press.faq_title') }}</summary>
            <dl class="divide-y pt-2" style="border-color: rgba(45,27,61,0.08)">
              <div v-for="item in faq" :key="item.q" class="py-4">
                <dt class="font-display font-semibold text-berenjena text-[16px] leading-snug">{{ item.q }}</dt>
                <dd class="mt-1 text-[15px] text-berenjena leading-relaxed max-w-2xl">
                  {{ item.a }}
                  <NuxtLink
                    v-if="item.to && !item.to.startsWith('#')"
                    :to="item.to"
                    class="link-action ml-1 min-h-[44px] text-miriam"
                  >
                    {{ item.toLabel }}
                  </NuxtLink>
                  <a
                    v-else-if="item.to"
                    :href="item.to"
                    class="link-action ml-1 min-h-[44px] text-miriam"
                  >
                    {{ item.toLabel }}
                  </a>
                </dd>
              </div>
            </dl>
          </details>

          <details class="notes-disclosure press-disclosure">
            <summary>{{ $t('press.timeline_title') }}</summary>
            <p class="pt-3 text-sm text-tinta">{{ $t('press.timeline_intro') }}</p>
            <ol class="mt-3 divide-y" style="border-color: rgba(45,27,61,0.08)">
              <li
                v-for="item in timeline"
                :key="item.date"
                class="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[170px_1fr]"
              >
                <span class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta pt-0.5">{{ item.date }}</span>
                <span class="text-[15px] text-berenjena leading-relaxed">{{ item.text }}</span>
              </li>
            </ol>
            <NuxtLink :to="localePath('timeline')" class="link-action mt-2 min-h-[44px] text-miriam">
              {{ $t('press.timeline_link') }}
            </NuxtLink>
          </details>
        </div>

        <!-- Guía editorial SÍ/NO -->
        <div class="mt-16">
          <h2 id="press-guide" class="eyebrow mb-5 block">
            {{ $t('press.guide_title') }}
          </h2>
          <div class="grid sm:grid-cols-2 gap-6" aria-labelledby="press-guide">
            <div class="card-base">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="ph:check-circle" class="size-5 text-green-600 shrink-0" aria-hidden="true" />
                <span class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta font-semibold">
                  {{ $t('press.guide_yes_label') }}
                </span>
              </div>
              <p class="text-[14px] text-berenjena leading-relaxed">{{ $t('press.guide_yes', { age: caseData.currentAge }) }}</p>
            </div>
            <div class="card-base">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="ph:x-circle" class="size-5 text-red-600 shrink-0" aria-hidden="true" />
                <span class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta font-semibold">
                  {{ $t('press.guide_no_label') }}
                </span>
              </div>
              <p class="text-[14px] text-berenjena leading-relaxed">{{ $t('press.guide_no') }}</p>
            </div>
          </div>
        </div>

        <!-- El caso en los medios. #cobertura: el destino de «Mi caso en la prensa» de /links (F6). -->
        <div id="cobertura" class="mt-16 scroll-mt-24">
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

        <!-- Material descargable / enlaces de referencia -->
        <div class="mt-16">
          <h2 id="press-resources" class="eyebrow mb-6 block">
            {{ $t('press.resources_title') }}
          </h2>
          <div aria-labelledby="press-resources" class="grid sm:grid-cols-2 gap-4">
            <a
              href="/press-kit-miriam-gonzalez.pdf"
              target="_blank"
              rel="noopener"
              class="press-resource card-base group"
              download
            >
              <Icon name="ph:file-pdf" class="size-5 text-miriam mb-3" aria-hidden="true" />
              <span class="block font-display font-semibold text-berenjena text-[15px]">
                {{ $t('press.kit_download_label') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
              </span>
              <span class="mt-1 block text-[13px] text-tinta leading-relaxed">
                {{ $t('press.kit_download_note') }}
              </span>
            </a>
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
            <NuxtLink :to="localePath('colabora')" class="press-resource card-base group sm:col-span-2">
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
          class="mt-16 relative overflow-hidden rounded-card p-8 sm:p-12"
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
            <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-dark mt-7">
              <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
              {{ $t('press.contact_cta') }}
            </NuxtLink>
          </div>
        </section>

        <ActualizadoEl class="mt-12 pt-6" style="border-top: 1px solid rgba(45,27,61,0.08)" :fecha="caseData.pressAsOf" clave="press.updated_label" />
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

// Las props que comparten todos los botones «copiar» de la página.
const copyProps = (text: string) => ({
  text,
  label: t('press.boilerplate_copy'),
  copiedLabel: t('press.boilerplate_copied'),
  failedLabel: t('press.copy_failed'),
})

const bioLong = computed(() =>
  t('press.bio_long_text', { age: caseData.currentAge, countries: caseData.countries })
)

const fork = computed(() => [
  { href: '#hechos', icon: 'ph:newspaper', title: t('press.fork_piece_title'), desc: t('press.fork_piece_desc') },
  { href: '#colaboracion', icon: 'ph:microphone', title: t('press.fork_invite_title'), desc: t('press.fork_invite_desc') },
])

// Hechos clave · las cifras que pueden desincronizarse (edad, nº de países)
// vienen de la fuente única (caseData), no del texto i18n.
// En inglés, las citas 1 a 3 son traducciones: se dice, y se enseña el original en español.
const quotes = computed(() => {
  const en = locale.value === 'en'
  const original = (n: number) => t(`press.quote_${n}`, {}, { locale: 'es' })
  return [1, 2, 3, 4].map((n) => ({
    text: t(`press.quote_${n}`),
    source: t(`press.quote_${n}_source`),
    note: !en
      ? ''
      : n < 4
        ? `Translated from Spanish · Original: «${original(n)}»`
        : 'Original in English',
  }))
})

const facts = computed(() => [
  { label: t('press.fact_who_label'), value: t('press.fact_who_value', { age: caseData.currentAge }) },
  { label: t('press.fact_diagnosis_label'), value: t('press.fact_diagnosis_value') },
  { label: t('press.fact_why_label'), value: t('press.fact_why_value') },
  { label: t('press.fact_need_label'), value: t('press.fact_need_value') },
  { label: t('press.fact_network_label'), value: t('press.fact_network_value', { countries: caseData.countries }) },
  { label: t('press.fact_lang_label'), value: t('press.fact_lang_value') },
])

const faq = computed(() => {
  const links: Record<number, { to: string; toLabel: string }> = {
    4: { to: localePath('colabora'), toLabel: t('press.resource_collaborate') },
    5: { to: localePath('gastos'), toLabel: t('press.resource_expenses') },
    8: { to: '#colaboracion', toLabel: t('press.collab_title') },
    9: { to: localePath('timeline'), toLabel: t('press.timeline_title') },
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
    q: t(`press.faq_q${i}`),
    a: t(`press.faq_a${i}`, { age: caseData.currentAge }),
    ...links[i],
  }))
})

const timeline = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map((i) => ({ date: t(`press.tl_${i}_date`), text: t(`press.tl_${i}_text`) }))
)

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
      jobTitle: locale.value === 'es' ? 'Ingeniera de software y divulgadora tech' : 'Software engineer and tech communicator',
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
.press-resource,
.press-fork {
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
@media (prefers-reduced-motion: no-preference) {
  .press-mention:hover,
  .press-resource:hover,
  .press-fork:hover {
    transform: translateY(-2px);
  }
}
.press-resource {
  display: block;
}
/* El resumen del plegable es el único control: objetivo táctil de 44 px (WCAG 2.5.8 + vara de la casa)
   y foco visible. El resto del estilo es el de `.notes-disclosure`. */
.press-disclosure > summary {
  min-height: 44px;
  padding-top: 0;
}
.press-disclosure > summary:focus-visible {
  outline: 2px solid var(--color-miriam);
  outline-offset: 2px;
}
</style>
