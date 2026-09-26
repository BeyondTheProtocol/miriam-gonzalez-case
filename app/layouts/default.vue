<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main-content" class="skip-link" @click="focusMain">{{
      $t('nav.skip_to_content')
    }}</a>
    <div class="sticky top-0 z-50">
      <LatestUpdateBar />
      <SiteNav />
    </div>
    <main
      id="main-content"
      class="flex-1"
      :class="{ 'has-support-bar': hasSupportBar }"
      tabindex="-1"
      :aria-label="$t('nav.main_content_label')"
    >
      <slot />
    </main>
    <SiteFooter />
    <!-- /marcas (· /en/brands) negocia colaboración, NO donativo: ahí no se monta
         ningún CTA de donación global (ni la barra "Donar" móvil ni el aviso de
         retorno). En esa ruta la página monta su propio MarcasContactPrompt. -->
    <MobileSupportBar v-if="!isBrandsRoute" />
    <DonationReturnPrompt v-if="!isBrandsRoute" />
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

// ¿Estamos en la landing de marcas? (es: /marcas · en: /en/brands). Guarda por
// ruta: NO afecta al resto del sitio, donde los CTA de donación se mantienen.
// hasSupportBar: ¿puede aparecer la barra en esta ruta? Decide si <main> reserva
// su hueco (por ruta, no por visibilidad: sin saltos de layout al hacer scroll).
const { isBrandsRoute, hasSupportBar } = useSupportBarRoute()

function focusMain() {
  nextTick(() => {
    const main = document.getElementById('main-content')
    main?.focus()
  })
}

const head = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(head)

// Sufijo de marca consistente sin duplicarla cuando el título ya la incluye.
useHead({
  titleTemplate: (title?: string) =>
    title && title.includes('Miriam González')
      ? title
      : title
        ? `${title} · Miriam González`
        : 'Miriam González · helpmiriam.com',
})

// Datos estructurados base (Schema.org / JSON-LD) en todo el sitio.
useSchemaOrg([
  defineOrganization({
    name: 'Beyond the Protocol',
    url: 'https://helpmiriam.com',
    logo: 'https://helpmiriam.com/img/miriam-avatar.webp',
    sameAs: [
      'https://github.com/beyondtheprotocol/miriam-gonzalez-case',
      'https://x.com/miriamgonp',
      'https://www.instagram.com/miriamgonp',
      'https://www.linkedin.com/in/miriamgonp',
    ],
  }),
  defineWebSite({
    name: 'Help Miriam',
    description:
      locale.value === 'es'
        ? 'Caso de Miriam González: oncología de precisión para un cáncer de mama metastásico de perfil molecular ultra-raro.'
        : "Miriam González's case: precision oncology for a metastatic breast cancer with an ultra-rare molecular profile.",
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
  }),
  definePerson({
    name: 'Miriam González',
    description:
      locale.value === 'es'
        ? 'Paciente con cáncer de mama metastásico de perfil molecular ultra-raro (BC-NED, FGFR1 ×13, SSTR2+).'
        : 'Patient with metastatic breast cancer of an ultra-rare molecular profile (BC-NED, FGFR1 ×13, SSTR2+).',
    sameAs: [
      'https://x.com/miriamgonp',
      'https://www.instagram.com/miriamgonp',
      'https://www.linkedin.com/in/miriamgonp',
    ],
  }),
])
</script>
