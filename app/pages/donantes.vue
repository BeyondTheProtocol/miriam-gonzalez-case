<template>
  <div>
    <DonationsWall />
    <div class="section-container pb-16 -mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
      <a
        :href="GOFUNDME_URL"
        target="_blank"
        rel="noopener"
        data-support-cta
        class="btn-cta"
        @click="trackSupport('donantes')"
      >
        <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
        {{ $t('nav.donate') }}
      </a>
      <NuxtLink :to="localePath('colabora')" class="link-inline">{{ $t('nav.collaborate') }} →</NuxtLink>
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
