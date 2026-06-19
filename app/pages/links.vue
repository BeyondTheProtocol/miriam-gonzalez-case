<template>
  <main
    class="relative overflow-hidden section-container max-w-xl py-14 sm:py-20"
    :aria-label="$t('links.aria_page')"
  >
    <!-- Constelación de fondo (decorativa, on-brand) — el mismo cielo de /gracias,
         densidad baja para no competir con los botones. -->
    <Constellation :count="28" />

    <div class="relative z-10">
      <!-- Cabecera: avatar + nombre + una línea de quién es. Móvil-first, centrado. -->
      <header class="text-center">
        <NuxtImg
          src="/img/miriam-avatar.webp"
          :alt="$t('links.avatar_alt')"
          width="112"
          height="112"
          sizes="112px"
          class="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
          style="
            aspect-ratio: 1 / 1;
            box-shadow:
              0 0 0 4px #faf6f0,
              0 0 0 6px rgba(157, 68, 171, 0.22);
          "
          loading="eager"
        />

        <h1
          class="mt-5 heading-display text-2xl sm:text-3xl text-berenjena"
          translate="no"
        >
          Miriam González
        </h1>
        <p class="mt-2 text-[15px] leading-relaxed text-tinta max-w-sm mx-auto">
          {{ $t('links.tagline') }}
        </p>

        <p
          class="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-miriam"
        >
          helpmiriam.com
        </p>
      </header>

      <!-- Lista de enlaces. Botones grandes y tappables (≥56px), uno por fila,
           jerarquía clara: los 3 primeros son los prominentes (destacados). -->
      <nav
        class="mt-9 flex flex-col gap-3 stagger-children"
        :aria-label="$t('links.aria_nav')"
      >
        <a
          v-for="link in featured"
          :key="link.id"
          :href="link.to"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
          class="bio-link bio-link--featured group"
          @click="trackBioLink(link.id)"
        >
          <span class="bio-link__icon" aria-hidden="true">
            <Icon :name="link.icon" class="w-5 h-5" />
          </span>
          <span class="bio-link__body">
            <span class="bio-link__title">{{ $t(link.title) }}</span>
            <span class="bio-link__sub">{{ $t(link.sub) }}</span>
          </span>
          <Icon
            :name="
              link.external ? 'ph:arrow-up-right-bold' : 'ph:arrow-right-bold'
            "
            class="bio-link__arrow"
            aria-hidden="true"
          />
          <span v-if="link.external" class="sr-only">
            {{ $t('a11y.new_tab') }}</span
          >
        </a>

        <!-- Separador editorial fino entre los destacados y los secundarios. -->
        <hr class="bio-rule" aria-hidden="true" />

        <a
          v-for="link in secondary"
          :key="link.id"
          :href="link.to"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
          class="bio-link bio-link--soft group"
          :data-support-cta="link.id === 'apoyar' ? '' : undefined"
          @click="trackBioLink(link.id)"
        >
          <span class="bio-link__icon bio-link__icon--soft" aria-hidden="true">
            <Icon :name="link.icon" class="w-5 h-5" />
          </span>
          <span class="bio-link__body">
            <span class="bio-link__title">{{ $t(link.title) }}</span>
            <span class="bio-link__sub">{{ $t(link.sub) }}</span>
          </span>
          <Icon
            :name="
              link.external ? 'ph:arrow-up-right-bold' : 'ph:arrow-right-bold'
            "
            class="bio-link__arrow"
            aria-hidden="true"
          />
          <span v-if="link.external" class="sr-only">
            {{ $t('a11y.new_tab') }}</span
          >
        </a>
      </nav>

      <!-- Nota sobria al pie: marco honesto (apoyo, no consejo médico) sin saturar. -->
      <p
        class="mt-9 text-center font-mono text-[11px] leading-relaxed text-tinta/80"
      >
        {{ $t('links.footnote') }}
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { trackBioLink } = useSupport()

// El Español — artículo del 19/06/2026 (enlace externo, propiedad del medio).
const EL_ESPANOL_URL =
  'https://www.elespanol.com/alicante/vivir/salud/20260619/miren-ingeniera-anos-usa-ia-luchar-cancer-mama-unico-contactan-oncologos-mundo/1003744290903_0.html'

type BioLink = {
  id: string
  title: string
  sub: string
  icon: string
  to: string
  external?: boolean
}

// Destacados — orden: el MAPA primero (el gancho novedoso e INTERNO: lo que la gente viene
// a buscar y lo que la retiene en el sitio), luego la prensa (credibilidad) y marcas.
// `id` = la propiedad que viaja a Umami (Bio-link · destino) → debe ser estable
// y en minúsculas-sin-acentos para agrupar bien en el panel.
const featured = computed<BioLink[]>(() => [
  {
    id: 'mapa',
    title: 'links.mapa_title',
    sub: 'links.mapa_sub',
    icon: 'ph:globe-hemisphere-west-fill',
    to: localePath('mapa-metastasis'),
  },
  {
    id: 'elespanol',
    title: 'links.elespanol_title',
    sub: 'links.elespanol_sub',
    icon: 'ph:newspaper-clipping-fill',
    to: EL_ESPANOL_URL,
    external: true,
  },
  {
    id: 'marcas',
    title: 'links.marcas_title',
    sub: 'links.marcas_sub',
    icon: 'ph:handshake-fill',
    to: localePath('marcas'),
  },
])

// Secundarios — completan el hub sin robar protagonismo a los 3 de arriba.
const secondary = computed<BioLink[]>(() => [
  {
    id: 'apoyar',
    title: 'links.apoyar_title',
    sub: 'links.apoyar_sub',
    icon: 'ph:heart-fill',
    to: localePath('colabora'),
  },
  {
    id: 'caso',
    title: 'links.caso_title',
    sub: 'links.caso_sub',
    icon: 'ph:house-fill',
    to: localePath('/'),
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
   Móvil-first: filas grandes y tappables (alto ≥ 56px), un destino
   por fila, jerarquía clara (destacados vs secundarios). Construido
   sobre los tokens del DS (cream / berenjena / miriam / coral) y el
   lenguaje de tarjeta (.card-base): bordes finos, radio de tarjeta,
   lift sutil al pasar el cursor (gated a hover + reduced-motion).
   ──────────────────────────────────────────────────────────── */
.bio-link {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 64px;
  padding: 0.85rem 1rem;
  border-radius: 16px; /* rounded-card */
  text-decoration: none;
  border: 1px solid rgba(45, 27, 61, 0.1);
  background: #faf6f0; /* cream */
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

/* Destacados — los 3 prioritarios: superficie cream-card + acento violeta en el
   icono, un punto más de presencia. El borde se tiñe de miriam al pasar/enfocar. */
.bio-link--featured {
  background: #f5efe6; /* cream-card */
  border-color: rgba(157, 68, 171, 0.22);
}

.bio-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(157, 68, 171, 0.12); /* miriam soft tint */
  color: #9d44ab; /* miriam */
}
.bio-link__icon--soft {
  background: rgba(45, 27, 61, 0.06);
  color: #2d1b3d; /* berenjena */
}

.bio-link__body {
  flex: 1;
  min-width: 0; /* permite el truncado/wrap sin desbordar */
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.bio-link__title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: #2d1b3d; /* berenjena */
  text-wrap: balance;
}
.bio-link__sub {
  font-size: 0.8rem;
  line-height: 1.4;
  color: #3a3340; /* tinta — AA sobre cream/cream-card */
}
.bio-link__arrow {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  color: #6b5d75; /* gris malva atenuado */
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

/* Hover/foco — solo en punteros finos para el lift; el color + flecha valen
   siempre (también en táctil vía :active). */
@media (hover: hover) {
  .bio-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba(45, 27, 61, 0.1);
  }
  .bio-link--featured:hover {
    border-color: rgba(157, 68, 171, 0.4);
  }
  .bio-link--soft:hover {
    border-color: rgba(45, 27, 61, 0.18);
  }
}
.bio-link:hover .bio-link__arrow,
.bio-link:focus-visible .bio-link__arrow,
.bio-link:active .bio-link__arrow {
  color: #9d44ab; /* miriam */
  transform: translateX(2px);
}
/* Enlaces externos: la flecha apunta arriba-derecha → al pasar «se va» en diagonal. */
.bio-link[target='_blank']:hover .bio-link__arrow,
.bio-link[target='_blank']:focus-visible .bio-link__arrow,
.bio-link[target='_blank']:active .bio-link__arrow {
  transform: translate(2px, -2px);
}

/* Táctil: feedback físico al pulsar (mismo lenguaje que los botones del DS). */
.bio-link:active {
  transform: scale(0.99);
}

.bio-rule {
  border: 0;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
  margin: 0.4rem 0;
}

/* Menos movimiento: sin lift ni desplazamientos; el cambio de color permanece. */
@media (prefers-reduced-motion: reduce) {
  .bio-link,
  .bio-link__arrow {
    transition:
      color 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;
  }
  .bio-link:hover,
  .bio-link:active {
    transform: none;
  }
  .bio-link:hover .bio-link__arrow,
  .bio-link:focus-visible .bio-link__arrow,
  .bio-link:active .bio-link__arrow {
    transform: none;
  }
}

/* Alto contraste: refuerza los bordes sin romper la marca. */
@media (prefers-contrast: more) {
  .bio-link {
    border-color: rgba(45, 27, 61, 0.28);
  }
  .bio-link__sub {
    color: #2d1b3d;
  }
}
</style>
