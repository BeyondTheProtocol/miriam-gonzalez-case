<template>
  <div>
    <section class="section-spacing bg-cream" :aria-label="$t('expenses.title')">
      <div class="section-wide">
        <PageHeader :title="$t('expenses.title')" :subtitle="$t('money.transparencia')" />

        <p class="text-base text-tinta leading-relaxed mb-8 measure">
          {{ $t('expenses.intro') }}
        </p>

        <div class="card-base mb-8" data-print-hide>
          <p class="eyebrow mb-3 block">{{ $t('expenses.campaign_eyebrow') }}</p>
          <GoFundMeProgress />
          <CampanaOficial location="gastos" />
        </div>

        <!-- Informe de gastos: cifras reales reconstruidas desde los extractos bancarios -->
        <div class="card-base mb-8">
          <p class="eyebrow mb-3 block">{{ $t('expenses.report_eyebrow', { fecha: corte }) }}</p>
          <h2 class="font-display font-semibold text-berenjena text-lg mb-2">
            {{ $t('expenses.report_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-3 measure">
            {{ $t('expenses.report_intro', { fecha: corte }) }}
          </p>
          <!-- Línea de cuadre: lo recaudado (arriba, en directo y bruto) y este informe (lo gastado y lo disponible a su corte) son
               cifras distintas; sin esta línea parecería que no cuadran. Decisión de Miriam, 24-oct-2026. -->
          <p class="text-sm text-tinta leading-relaxed mb-5 measure">
            {{ $t('expenses.cuadre') }}
          </p>

          <ul class="mb-5 measure">
            <li
              v-for="item in DINERO.partidas"
              :key="item.clave"
              class="flex items-baseline justify-between gap-4 py-2.5 border-t border-berenjena/[0.07]"
            >
              <span class="text-sm text-tinta leading-relaxed">
                {{ $t(`expenses.report_item_${item.clave}`) }}
              </span>
              <span
                class="text-sm font-mono text-berenjena shrink-0"
                style="font-variant-numeric: tabular-nums"
              >
                {{ money(item.importe) }}
              </span>
            </li>
            <li
              class="flex items-baseline justify-between gap-4 py-2.5 border-t border-berenjena/20"
            >
              <span class="text-sm font-semibold text-berenjena">
                {{ $t('expenses.report_total') }}
              </span>
              <span
                class="text-sm font-mono font-semibold text-berenjena shrink-0"
                style="font-variant-numeric: tabular-nums"
              >
                {{ money(DINERO.comprometido) }}
              </span>
            </li>
          </ul>

          <div
            class="rounded-card bg-cream p-4 flex items-baseline justify-between gap-4 flex-wrap measure"
            style="border: 1px solid rgba(45,27,61,0.08)"
          >
            <div>
              <p
                class="font-mono uppercase text-2xs tracking-[0.12em] font-medium text-tinta mb-1"
              >
                {{ $t('expenses.report_available_label') }}
              </p>
              <p class="text-sm text-tinta leading-relaxed measure">
                {{ $t('expenses.report_available_desc', { fecha: corte }) }}
              </p>
            </div>
            <p
              class="font-display font-semibold text-berenjena text-xl shrink-0"
              style="font-variant-numeric: tabular-nums"
            >
              {{ money(DINERO.disponible) }}
            </p>
          </div>
        </div>

        <div class="card-base mb-8">
          <h2 class="font-display font-semibold text-berenjena text-lg mb-2">
            {{ $t('expenses.phases_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 measure">
            {{ $t('expenses.phases_intro') }}
          </p>
          <ol class="space-y-4">
            <li
              v-for="n in 3"
              :key="n"
              class="flex items-start gap-3 border-t border-berenjena/[0.07] pt-4 first:border-t-0 first:pt-0"
            >
              <span class="font-mono text-2xs uppercase tracking-[0.1em] text-tinta shrink-0 pt-0.5">
                {{ String(n).padStart(2, '0') }}
              </span>
              <div>
                <h3 class="text-sm font-semibold text-berenjena mb-1">
                  {{ $t(`expenses.phase${n}_title`) }}
                </h3>
                <p class="text-sm text-tinta leading-relaxed measure">
                  {{ $t(`expenses.phase${n}_desc`, { gastado: money(DINERO.rebiopsia.ejecutado), fecha: fechaRebiopsia }) }}
                </p>
              </div>
            </li>
          </ol>
        </div>

        <EcgDivider class="mb-8" />

        <!-- Coste de la rebiopsia: dos bloques (analizar ahora / preservar y bancar) -->
        <div class="card-base mb-8">
          <h2 class="font-display font-semibold text-berenjena text-lg mb-2">
            {{ $t('expenses.rebiopsy_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 measure">
            {{ $t('expenses.rebiopsy_intro') }}
          </p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div
              class="rounded-card bg-cream p-4"
              style="border: 1px solid rgba(45,27,61,0.08)"
            >
              <p
                class="font-mono uppercase text-2xs tracking-[0.12em] font-medium text-tinta mb-1"
              >
                {{ $t('expenses.rebiopsy_now_label', { fecha: fechaRebiopsia }) }}
              </p>
              <p
                class="font-display font-semibold text-berenjena text-xl mb-2"
                style="font-variant-numeric: tabular-nums"
              >
                {{ money(DINERO.rebiopsia.ejecutado) }}
              </p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ $t('expenses.rebiopsy_now_desc', lineasRebiopsia) }}
              </p>
            </div>
            <div
              class="rounded-card bg-cream p-4"
              style="border: 1px solid rgba(45,27,61,0.08)"
            >
              <p
                class="font-mono uppercase text-2xs tracking-[0.12em] font-medium text-tinta mb-1"
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
          <p class="mt-5 flex items-start gap-2 text-sm text-berenjena font-medium measure">
            <Icon
              name="ph:seal-check-fill"
              class="w-4 h-4 mt-0.5 shrink-0 text-miriam"
              aria-hidden="true"
            />
            <span>{{ $t('expenses.rebiopsy_value') }}</span>
          </p>
          <p class="mt-3 text-xs text-tinta italic measure">
            {{ $t('expenses.rebiopsy_note', { fecha: fechaRebiopsia, corte }) }}
          </p>
        </div>

        <!-- Desglose completo · cuenta itemizada -->
        <div class="card-base mb-8">
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
                class="mt-[3px] w-4 h-4 text-miriam shrink-0"
                aria-hidden="true"
              />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
        </div>

        <!-- Preguntas frecuentes de donantes -->
        <div class="card-base mb-8">
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
              <div class="text-sm text-tinta leading-relaxed measure">
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

        <p class="text-sm text-tinta italic measure">
          {{ $t('expenses.note', { fecha: corte }) }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            :href="GOFUNDME_URL"
            target="_blank"
            rel="noopener"
            @click="trackSupport('gastos')"
            data-support-cta
            class="btn-cta w-full sm:w-auto"
          >
            <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
            {{ $t('expenses.help_cta') }}
            <span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
          </a>
          <NuxtLink :to="localePath('colabora')" class="btn-secondary w-full sm:w-auto justify-center">
            {{ $t('expenses.transparency_link') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport } = useSupport()

// Informe de gastos. Las cifras, con su fecha de corte, viven en app/data/dinero.json (app/utils/dinero.ts): aquí no se escribe
// ninguna a mano (lo vigila scripts/test-dinero-fuente.ts). El informe se reconstruye movimiento a movimiento desde los extractos.
const money = (n: number) => euros(n, locale.value)
const corte = computed(() => fechaDeCorte(DINERO.corte, locale.value))
// El bloque de la rebiopsia lleva su fecha, que no es la del corte del informe.
const fechaRebiopsia = computed(() => fechaDeCorte(DINERO.rebiopsia.fecha, locale.value))
// Los tres importes de la rebiopsia, listos para la frase («Biopsia en Zúrich ({biopsia}), secuenciación ({secuenciacion})…»).
const lineasRebiopsia = computed(() => ({
  biopsia: money(DINERO.rebiopsia.biopsia),
  secuenciacion: money(DINERO.rebiopsia.secuenciacion),
  imagen: money(DINERO.rebiopsia.imagen),
}))

useSeoMeta({
  title: () => t('expenses.title'),
  description: () => t('expenses.meta_description'),
  ogTitle: () => t('expenses.title'),
  ogDescription: () => t('money.transparencia'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('expenses.title'),
  twitterDescription: () => t('money.transparencia'),
})

defineOgImage('Default.takumi', {
  title: () => t('expenses.title'),
  description: () => t('money.transparencia'),
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
const donateJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: locale.value === 'es' ? 'Donar para el caso de Miriam González' : "Donate to Miriam González's case",
    recipient: { '@type': 'Person', name: 'Miriam González', url: 'https://helpmiriam.com' },
    target: { '@type': 'EntryPoint', urlTemplate: GOFUNDME_URL },
  })
)

useHead({
  script: [
    { type: 'application/ld+json', innerHTML: faqJsonLd },
    { type: 'application/ld+json', innerHTML: donateJsonLd },
  ],
})
</script>
