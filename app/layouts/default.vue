<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main-content" class="skip-link">{{
      $t('nav.skip_to_content')
    }}</a>
    <SiteNav />
    <main
      id="main-content"
      class="flex-1"
      tabindex="-1"
      :aria-label="$t('nav.main_content_label')"
    >
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

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
