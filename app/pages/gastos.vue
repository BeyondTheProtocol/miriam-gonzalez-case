<template>
  <div>
    <section class="section-spacing bg-cream" :aria-label="$t('expenses.title')">
      <div class="section-container max-w-3xl">
        <PageHeader :title="$t('expenses.title')" :subtitle="$t('expenses.subtitle')" />

        <p class="text-base text-tinta leading-relaxed mb-8 max-w-2xl">
          {{ $t('expenses.intro') }}
        </p>

        <!-- Coste de la rebiopsia: dos bloques (analizar ahora / preservar y bancar) -->
        <div class="card-base mb-6">
          <h2 class="font-display font-semibold text-berenjena text-lg mb-2">
            {{ $t('expenses.rebiopsy_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-2xl">
            {{ $t('expenses.rebiopsy_intro') }}
          </p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div
              class="rounded-card bg-cream p-4"
              style="border: 1px solid rgba(45,27,61,0.08)"
            >
              <p
                class="font-mono uppercase text-[11px] tracking-[0.12em] font-medium text-tinta mb-1"
              >
                {{ $t('expenses.rebiopsy_now_label') }}
              </p>
              <p
                class="font-display font-semibold text-berenjena text-xl mb-2"
                style="font-variant-numeric: tabular-nums"
              >
                {{ $t('expenses.rebiopsy_now_range') }}
              </p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ $t('expenses.rebiopsy_now_desc') }}
              </p>
            </div>
            <div
              class="rounded-card bg-cream p-4"
              style="border: 1px solid rgba(45,27,61,0.08)"
            >
              <p
                class="font-mono uppercase text-[11px] tracking-[0.12em] font-medium text-tinta mb-1"
              >
                {{ $t('expenses.rebiopsy_bank_label') }}
              </p>
              <p
                class="font-display font-semibold text-berenjena text-xl mb-2"
                style="font-variant-numeric: tabular-nums"
              >
                {{ $t('expenses.rebiopsy_bank_range') }}
              </p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ $t('expenses.rebiopsy_bank_desc') }}
              </p>
            </div>
          </div>
          <p class="mt-5 flex items-start gap-2 text-sm text-berenjena font-medium">
            <Icon
              name="ph:seal-check-fill"
              class="w-4 h-4 mt-0.5 shrink-0 text-miriam"
              aria-hidden="true"
            />
            <span>{{ $t('expenses.rebiopsy_value') }}</span>
          </p>
          <p class="mt-3 text-xs text-tinta italic">
            {{ $t('expenses.rebiopsy_note') }}
          </p>
        </div>

        <!-- Coste vs objetivo: cierra la duda "¿40k lo cubre todo?" -->
        <p class="text-sm text-tinta italic mb-6 max-w-2xl">
          {{ $t('expenses.cost_vs_goal') }}
        </p>

        <!-- Desglose completo · cuenta itemizada -->
        <div class="card-base mb-6">
          <h2 class="font-display font-semibold text-berenjena text-lg mb-4">
            {{ $t('home.s4_list_intro') }}
          </h2>
          <ul class="grid sm:grid-cols-2 gap-x-10">
            <li
              v-for="(item, i) in $tm('home.s4_list')"
              :key="i"
              class="flex items-start gap-3 py-2.5 border-t border-berenjena/[0.07]"
            >
              <Icon
                name="ph:check-circle-fill"
                class="mt-0.5 w-4 h-4 text-miriam shrink-0"
                aria-hidden="true"
              />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
        </div>

        <!-- Preguntas frecuentes de donantes -->
        <div class="card-base mb-6">
          <h2 class="font-display font-semibold text-berenjena text-lg mb-4">
            {{ $t('expenses.faq_title') }}
          </h2>
          <div class="space-y-4">
            <div
              v-for="n in 4"
              :key="n"
              class="border-t border-berenjena/[0.07] pt-4 first:border-t-0 first:pt-0"
            >
              <h3 class="text-sm font-semibold text-berenjena mb-1">
                {{ $t(`expenses.faq_q${n}`) }}
              </h3>
              <div class="text-sm text-tinta leading-relaxed">
                {{ $t(`expenses.faq_a${n}`) }}
                <NuxtLink
                  v-if="n === 4"
                  :to="localePath('colabora')"
                  class="link-inline"
                  >{{ $t('expenses.faq_a4_link') }}</NuxtLink
                ><template v-if="n === 4">.</template>
              </div>
            </div>
          </div>
          <p class="mt-5 text-sm text-tinta">
            {{ $t('expenses.faq_help') }}
            <NuxtLink :to="localePath('contacto')" class="link-inline">{{
              $t('expenses.faq_help_link')
            }}</NuxtLink>.
          </p>
        </div>

        <p class="text-sm text-tinta italic max-w-2xl">
          {{ $t('expenses.note') }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener"
            @click="trackSupport('gastos')"
            data-support-cta
            class="btn-cta w-full sm:w-auto"
          >
            <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
            {{ $t('home.s4_cta_button') }}
          </a>
          <p class="text-xs text-tinta">{{ $t('home.s4_cta_caption') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { trackSupport } = useSupport()

useSeoMeta({
  title: () => t('expenses.title'),
  description: () => t('expenses.meta_description'),
  ogTitle: () => t('expenses.title'),
  ogDescription: () => t('expenses.subtitle'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('expenses.title'),
  twitterDescription: () => t('expenses.subtitle'),
})

defineOgImage('Default.takumi', {
  title: () => t('expenses.title'),
  description: () => t('expenses.subtitle'),
})

// FAQPage JSON-LD: las 4 preguntas/respuestas de donantes para rich results (C.6).
const faqJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4].map((n) => ({
      '@type': 'Question',
      name: t(`expenses.faq_q${n}`),
      acceptedAnswer: { '@type': 'Answer', text: t(`expenses.faq_a${n}`) },
    })),
  })
)
useHead({
  script: [{ type: 'application/ld+json', innerHTML: faqJsonLd }],
})
</script>
