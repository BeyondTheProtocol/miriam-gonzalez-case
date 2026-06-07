<template>
  <div>
    <DonationsWall paginated constellation />
    <!-- CTA en su propia franja, según el sistema: primario coral + microcopy
         de reaseguro debajo, y el terciario estándar (link-action con flecha). -->
    <div class="section-container py-12 flex flex-col sm:flex-row sm:items-start gap-x-8 gap-y-4">
      <div class="flex flex-col gap-2.5">
        <a
          :href="GOFUNDME_URL"
          target="_blank"
          rel="noopener"
          data-support-cta
          class="btn-cta w-full sm:w-auto"
          @click="trackSupport('donantes')"
        >
          <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
          {{ $t('nav.donate') }}
        </a>
        <p class="text-xs leading-relaxed text-tinta sm:max-w-[15rem] px-0.5">
          {{ $t('home.s4_cta_caption') }}
        </p>
      </div>
      <NuxtLink
        :to="localePath('colabora')"
        class="link-action group text-sm text-miriam sm:mt-3.5"
      >
        {{ $t('nav.collaborate') }}
        <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Página pública de agradecimiento: muestra a todas las personas que han
 *  aportado (tablita sencilla), compartible por cualquiera. */
const { t } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport } = useSupport()

useSeoMeta({
  title: () => `${t('thanksWall.title')} · helpmiriam.com`,
  description: () => t('thanksWall.subtitle'),
  ogTitle: () => t('thanksWall.title'),
  ogDescription: () => t('thanksWall.subtitle'),
})
</script>
