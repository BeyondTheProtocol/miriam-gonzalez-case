<template>
  <div class="relative overflow-hidden section-container max-w-xl py-8 sm:py-20">
    <!-- py-8 en móvil (antes py-14): la fila de apoyo, la 2.ª, tiene que asomar en la primera pantalla de un móvil pequeño. -->
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

      <!-- Lista de enlaces. Botones grandes y tappables (≥56px), uno por fila, en el orden decidido en el
           rediseño (F6): seis destacados (el apoyo, el 2.º y en coral, es el único botón de acción de la página:
           la cabecera ya no lo repite) y dos secundarios. -->
      <nav
        class="mt-7 sm:mt-9 flex flex-col gap-3 stagger-children"
        :aria-label="$t('links.aria_nav')"
      >
        <a
          v-for="link in featured"
          :key="link.id"
          :href="link.to"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
          class="bio-link bio-link--featured group"
          :class="link.apoyo ? 'bio-link--apoyo' : undefined"
          :data-support-cta="link.apoyo ? '' : undefined"
          @click="onBioLink(link.id)"
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
          @click="onBioLink(link.id)"
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
  border: 1px solid rgb(var(--color-text-rgb) / 0.1);
  background: var(--color-bg); /* cream */
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

/* Destacados — los seis primeros: superficie cream-card + acento violeta en el
   icono, un punto más de presencia. El borde se tiñe de miriam al pasar/enfocar. */
.bio-link--featured {
  background: var(--color-bg-card); /* cream-card */
  border-color: rgb(var(--color-miriam-rgb) / 0.22);
}

/* La fila de apoyo (F6): el único botón de acción de la página, en el coral del DS (--color-cta) con texto berenjena,
   como .btn-cta (5,6:1 en reposo). Sin cambio de fondo al pasar: el coral de hover (#e5573a) deja a berenjena en 4,3:1,
   por debajo de AA para el texto pequeño de la fila; el feedback es el lift, la flecha y el foco (que sigue siendo el
   global). */
.bio-link--apoyo {
  background: var(--color-cta);
  border-color: transparent;
}
.bio-link--apoyo .bio-link__icon {
  background: rgb(var(--color-text-rgb) / 0.12);
  color: var(--color-text);
}
.bio-link--apoyo .bio-link__title,
.bio-link--apoyo .bio-link__sub,
.bio-link--apoyo .bio-link__arrow {
  color: var(--color-text);
}

.bio-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgb(var(--color-miriam-rgb) / 0.12); /* miriam soft tint */
  color: var(--color-miriam); /* miriam */
}
.bio-link__icon--soft {
  background: rgb(var(--color-text-rgb) / 0.06);
  color: var(--color-text); /* berenjena */
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
  color: var(--color-text); /* berenjena */
  text-wrap: balance;
}
.bio-link__sub {
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-soft); /* tinta — AA sobre cream/cream-card */
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
    box-shadow: 0 14px 34px rgb(var(--color-text-rgb) / 0.1);
  }
  .bio-link--featured:hover {
    border-color: rgb(var(--color-miriam-rgb) / 0.4);
  }
  .bio-link--apoyo:hover {
    border-color: transparent;
  }
  .bio-link--soft:hover {
    border-color: rgb(var(--color-text-rgb) / 0.18);
  }
}
.bio-link:hover .bio-link__arrow,
.bio-link:focus-visible .bio-link__arrow,
.bio-link:active .bio-link__arrow {
  color: var(--color-miriam); /* miriam */
  transform: translateX(2px);
}
/* En la fila de apoyo la flecha se queda berenjena (el violeta de miriam sobre coral no llega a contraste). */
.bio-link.bio-link--apoyo:hover .bio-link__arrow,
.bio-link.bio-link--apoyo:focus-visible .bio-link__arrow,
.bio-link.bio-link--apoyo:active .bio-link__arrow {
  color: var(--color-text);
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
  border-top: 1px solid rgb(var(--color-text-rgb) / 0.08);
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
    border-color: rgb(var(--color-text-rgb) / 0.28);
  }
  .bio-link__sub {
    color: var(--color-text);
  }
}
</style>
