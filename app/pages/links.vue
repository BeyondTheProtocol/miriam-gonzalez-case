<template>
  <!-- Cielo a sangre (sistema v3, P1): la constelación pinta todo el ancho de la página, no solo la columna. La columna sigue siendo
       .section-container (centrada a propósito, como /gracias). -->
  <div class="relative overflow-hidden">
    <!-- Constelación de fondo (decorativa, on-brand) — el mismo cielo de /gracias,
         densidad baja para no competir con los botones. -->
    <Constellation :count="28" />

    <!-- py-8 en móvil (antes py-14): la fila de apoyo, la 2.ª, tiene que asomar en la primera pantalla de un móvil pequeño. -->
    <div class="relative z-10 section-container max-w-xl py-8 sm:py-20">
      <!-- Cabecera: avatar + nombre + una línea de quién es. Móvil-first, centrado. -->
      <header class="text-center">
        <NuxtImg
          src="/img/miriam-avatar.webp"
          :alt="$t('links.avatar_alt')"
          width="112"
          height="112"
          sizes="112px"
          class="bio-avatar mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
          loading="eager"
        />

        <h1
          class="mt-5 heading-display text-2xl sm:text-3xl text-berenjena"
          translate="no"
        >
          Miriam González
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-tinta max-w-sm mx-auto">
          {{ $t('links.tagline') }}
        </p>

        <p class="eyebrow mt-3 text-miriam">helpmiriam.com</p>
      </header>

      <!-- Lista de enlaces. Botones grandes y tappables (≥64px), uno por fila, en el orden decidido en el
           rediseño (F6): seis destacados (el apoyo, el 2.º y en coral, es el único botón de acción de la página:
           la cabecera ya no lo repite) y dos secundarios. Cada fila es una TarjetaEnlace (sistema v3, P1): la fila de apoyo, tono «apoyo»;
           el resto, «suave». -->
      <nav
        class="mt-7 sm:mt-9 flex flex-col gap-3"
        :aria-label="$t('links.aria_nav')"
      >
        <TarjetaEnlace
          v-for="link in featured"
          :key="link.id"
          :to="link.external ? undefined : link.to"
          :href="link.external ? link.to : undefined"
          :icono="link.icon"
          :titulo="$t(link.title)"
          :meta="$t(link.sub)"
          :tono="link.apoyo ? 'apoyo' : 'suave'"
          :data-support-cta="link.apoyo ? '' : undefined"
          @click="onBioLink(link.id)"
        />

        <!-- Separador editorial fino entre los destacados y los secundarios. -->
        <hr class="bio-rule" aria-hidden="true" />

        <TarjetaEnlace
          v-for="link in secondary"
          :key="link.id"
          :to="link.external ? undefined : link.to"
          :href="link.external ? link.to : undefined"
          :icono="link.icon"
          :titulo="$t(link.title)"
          :meta="$t(link.sub)"
          @click="onBioLink(link.id)"
        />
      </nav>

      <!-- Nota sobria al pie: marco honesto (apoyo, no consejo médico) sin saturar. -->
      <p class="mt-9 text-center font-mono text-xs leading-relaxed text-tinta">
        {{ $t('links.footnote') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackBioLink, trackDatos, trackSupport } = useSupport()

// «Bio-link» mide el hub; la entrada a /datos cuenta además en «VerDatos», con las demás, y el clic a GoFundMe en
// «Donar» (con el botón «links» como origen), igual que cualquier otro botón de apoyo del sitio.
function onBioLink(id: string) {
  trackBioLink(id)
  if (id === 'datos') trackDatos('links')
  if (id === 'apoyar') trackSupport('links')
}

const PODCAST_URL = 'https://www.youtube.com/watch?v=zVUECrux6zA'

type BioLink = {
  id: string
  title: string
  sub: string
  icon: string
  to: string
  external?: boolean
  /** la fila de apoyo: coral, y la marca `data-support-cta` que apaga la barra «Donar» del móvil mientras está a la vista */
  apoyo?: boolean
}

// Orden decidido en el rediseño de arquitectura (F6, 23-oct-2026): célula a célula (lo más nuevo, desde el 17-oct) ·
// APOYAR (GoFundMe directo; antes llevaba a /colabora y vivía entre los secundarios, con el botón de la cabecera como
// única puerta) · mama, hígado y hueso · el caso en datos · prensa · podcast; y de secundarios, la cronología y las marcas.
// `id` = la propiedad que viaja a Umami (Bio-link · destino): estable y en minúsculas-sin-acentos. Continuidad de la serie:
// `apoyar` cambia de destino (de /colabora a GoFundMe); `elespanol` (un enlace al artículo) pasa a `prensa` (la cobertura
// entera, en /prensa#cobertura); `caso` (que llevaba a la home) deja paso a `cronologia`. La serie se corta ahí.
const featured = computed<BioLink[]>(() => [
  {
    id: 'celula',
    title: 'links.celula_title',
    sub: 'links.celula_sub',
    icon: 'ph:circles-three-fill',
    to: localePath('celula-a-celula'),
  },
  {
    id: 'apoyar',
    title: 'links.apoyar_title',
    sub: 'links.apoyar_sub',
    icon: 'ph:heart-fill',
    to: GOFUNDME_URL,
    external: true,
    apoyo: true,
  },
  {
    id: 'lesiones',
    title: 'links.lesiones_title',
    sub: 'links.lesiones_sub',
    icon: 'ph:cube-fill',
    to: localePath('lesiones'),
  },
  {
    id: 'datos',
    title: 'links.datos_title',
    sub: 'links.datos_sub',
    icon: 'ph:chart-line-fill',
    to: localePath('datos'),
  },
  {
    id: 'prensa',
    title: 'links.prensa_title',
    sub: 'links.prensa_sub',
    icon: 'ph:newspaper-clipping-fill',
    to: localePath({ name: 'prensa', hash: '#cobertura' }),
  },
  {
    id: 'podcast',
    title: 'links.podcast_title',
    sub: 'links.podcast_sub',
    icon: 'ph:youtube-logo-fill',
    to: PODCAST_URL,
    external: true,
  },
])

// Secundarios — completan el hub sin robar protagonismo a los de arriba.
// T2a (24-oct-2026): «Todas mis herramientas» entra la primera de los secundarios, a /herramientas. Las tres del bloque de arriba
// (célula a célula, lesiones y datos) ya son herramientas; esta fila es la puerta al resto y al índice.
const secondary = computed<BioLink[]>(() => [
  {
    id: 'herramientas',
    title: 'links.herramientas_title',
    sub: 'links.herramientas_sub',
    icon: 'ph:wrench-fill',
    to: localePath('herramientas'),
  },
  {
    id: 'cronologia',
    title: 'links.cronologia_title',
    sub: 'links.cronologia_sub',
    icon: 'ph:calendar-blank-fill',
    to: localePath('timeline'),
  },
  {
    id: 'marcas',
    title: 'links.marcas_title',
    sub: 'links.marcas_sub',
    icon: 'ph:handshake-fill',
    to: localePath('marcas'),
  },
])

// SEO/OG — la página es compartible (vive en la bio), así que merece tarjeta
// social decente. Reusa el OG por defecto del sitio (Default.takumi).
useSeoMeta({
  title: () => t('links.meta_title'),
  description: () => t('links.meta_description'),
  ogTitle: () => t('links.meta_title'),
  ogDescription: () => t('links.meta_description'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
defineOgImage('Default.takumi', {
  title: 'Miriam González',
  description: () => t('links.tagline'),
})
</script>

<style scoped>
/* ────────────────────────────────────────────────────────────
   Link-in-bio — hub de enlaces (bio de Instagram/redes).
   Móvil-first: filas grandes y tappables (alto ≥ 64px), un destino
   por fila, jerarquía clara (el apoyo en coral, el resto en papel).
   Las filas son TarjetaEnlace (sistema v3, P1); aquí solo queda lo que es de la página:
   el aro del avatar y el filete entre grupos.
   ──────────────────────────────────────────────────────────── */
.bio-avatar {
  aspect-ratio: 1 / 1;
  box-shadow:
    0 0 0 4px var(--fondo),
    0 0 0 6px color-mix(in srgb, var(--identidad) 22%, transparent);
}

.bio-rule {
  border: 0;
  border-top: 1px solid var(--trazo-sutil);
  margin: 0.4rem 0;
}
</style>
