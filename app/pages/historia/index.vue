<script setup lang="ts">
/**
 * /historia (· /en/story) — vuelve a ser una página viva (tanda 2 del rediseño, T2a, 24-oct-2026).
 *
 * F4 (23-oct) la había fusionado en /timeline con un 302. Umami lo desmintió el 24-oct: tiene 191 entradas de 263 visitantes y
 * 184 llegan de google.com (más que /equipo o /colabora en el mismo periodo), así que la premisa «llega casi solo desde el pie» era
 * falsa. Miriam decidió no redirigirla: se quita el 302 y la página sigue viva (y en el sitemap, como antes de F4).
 *
 * Es la página de antes, tal cual: el aviso de que la historia personal se está escribiendo y los cuatro párrafos que ya publicaba
 * (story_teaser_1 a 4). No hay capítulos: el único (/historia/01-el-comienzo) estaba vacío, se borró en F4 y su 301 a /timeline se
 * queda; por eso esta página ya no consulta las colecciones historia_es / historia_en, que F4 también borró. Lo único nuevo son dos
 * enlaces con rótulos que ya existen (nav.timeline y nav.science): quien llega de Google buscando la historia de Miriam tenía un
 * callejón sin salida, y la cronología cubre la misma intención.
 *
 * Migrada a las piezas del sistema v3 (Banda, PageHeader, card-base) en lugar de restaurar el .vue viejo con su .alert-callout.
 */
const { locale, t } = useI18n()
const localePath = useLocalePath()
const lang = computed(() => (locale.value === 'en' ? 'en' : 'es'))

const TITULO = { es: 'La historia de Miriam', en: "Miriam's story" }
const DESCRIPCION = {
  es: 'La historia personal de Miriam González: vida con cáncer de mama metastásico en fase 4, su proceso con los tratamientos y la búsqueda de una solución de precisión.',
  en: 'The personal story of Miriam González: life with stage 4 metastatic breast cancer, her treatment journey, and the search for a precision solution.',
}
const DESCRIPCION_CORTA = {
  es: 'Vida con cáncer de mama metastásico en fase 4 y la búsqueda de una solución de precisión.',
  en: 'Life with stage 4 metastatic breast cancer and the search for a precision solution.',
}

useSeoMeta({
  title: () => TITULO[lang.value],
  description: () => DESCRIPCION[lang.value],
  ogTitle: () => TITULO[lang.value],
  ogDescription: () => DESCRIPCION_CORTA[lang.value],
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => TITULO[lang.value],
  twitterDescription: () => DESCRIPCION_CORTA[lang.value],
})

defineOgImage('Default.takumi', {
  title: () => t('story.title'),
  description: () => t('story.subtitle'),
})
</script>

<template>
  <div>
    <Banda tono="crema" compacta>
      <PageHeader :title="$t('story.title')" :lede="$t('story.subtitle')" variante="pagina" />
      <div class="hist">
        <p class="card-base hist__nota">{{ $t('historia.pending_notice') }}</p>
        <div class="hist__texto">
          <p v-for="n in 4" :key="n" class="prosa">{{ $t(`historia.story_teaser_${n}`) }}</p>
        </div>
        <div class="hist__salidas">
          <NuxtLink :to="localePath('timeline')" class="link-action group">
            {{ $t('nav.timeline') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink :to="localePath('ciencia')" class="link-action group">
            {{ $t('nav.science') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </Banda>
  </div>
</template>

<style scoped>
.hist { max-width: var(--measure); display: flex; flex-direction: column; gap: var(--sp-32); }
.hist__nota { margin: 0; font: italic var(--tipo-body-sm); color: var(--texto-2); }
.hist__texto { display: flex; flex-direction: column; gap: var(--sp-24); }
.hist__texto .prosa { margin: 0; }
.hist__salidas { display: flex; flex-wrap: wrap; gap: 0 var(--sp-24); }
</style>
