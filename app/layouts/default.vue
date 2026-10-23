<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main-content" class="skip-link" @click="focusMain">{{
      $t('nav.skip_to_content')
    }}</a>
    <div class="sticky top-0 z-50" data-cabecera-fija>
      <!-- Chrome mínimo (/links, /gracias): sin la barra «lo último» (useChromeMinimo). -->
      <LatestUpdateBar v-if="!minimo" />
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
const { minimo } = useChromeMinimo()

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

// Datos estructurados base (Schema.org / JSON-LD) en todo el sitio. Las redes salen de REDES
// (app/utils/navegacion.ts), la misma lista que el pie y /colabora.
const urlsRedes = REDES.map((r) => r.url)
useSchemaOrg([
  defineOrganization({
    name: 'Beyond the Protocol',
    url: 'https://helpmiriam.com',
    logo: 'https://helpmiriam.com/img/miriam-avatar.webp',
    sameAs: [REPO_URL, ...urlsRedes],
  }),
  defineWebSite({
    name: 'Help Miriam',
    description:
      locale.value === 'es'
        ? 'Caso de Miriam González: un cáncer de mama metastásico estudiado en abierto, en busca de un tratamiento hecho a partir de su propio tumor.'
        : "Miriam González's case: a metastatic breast cancer studied in the open, in search of a treatment made from her own tumor.",
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
  }),
  definePerson({
    name: 'Miriam González',
    jobTitle:
      locale.value === 'es'
        ? 'Ingeniera de software y divulgadora tech'
        : 'Software engineer and tech communicator',
    description:
      locale.value === 'es'
        ? 'Ingeniera de software y divulgadora tech. Investiga su propio cáncer de mama metastásico con inteligencia artificial y un equipo internacional, en abierto.'
        : 'Software engineer and tech communicator. She investigates her own metastatic breast cancer with artificial intelligence and an international team, in the open.',
    sameAs: urlsRedes,
  }),
])
</script>
