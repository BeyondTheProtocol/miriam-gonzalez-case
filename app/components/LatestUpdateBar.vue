<template>
  <!--
    Barra global "lo último" (propuesta 1 del comité, 26-sep-2026): reusa la
    MISMA fuente de datos y el mismo patrón visual que hero__latest en
    SectionHero.vue (home), pero como franja fina de una sola línea, visible
    en TODAS las páginas, montada sobre el header (ver app/layouts/default.vue
    y el sticky del wrapper ahí). A propósito NO envuelve texto (nowrap +
    ellipsis en el título): así nunca crece en móvil y nunca puede tapar el
    logo ni el CTA del header, ni reducir su altura táctil.
  -->
  <div v-if="latest && !isHome" class="latest-bar bg-cream-card">
    <div class="section-wide latest-bar__inner">
      <NuxtLink
        :to="localePath({ name: 'timeline' }) + '#lo-ultimo'"
        class="latest-bar__link group"
        :aria-label="`${$t('hero.latest_label')}: ${latest.title}`"
        @click="trackLatest('barra')"
      >
        <span class="hero-live-dot h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
        <span class="etiqueta shrink-0">{{ $t('hero.latest_label') }}</span>
        <span v-if="latestAgo" class="font-mono text-xs text-tinta shrink-0 hidden sm:inline">· {{ latestAgo }}</span>
        <span class="latest-bar__title">
          {{ latest.title }}
          <Icon
            name="ph:arrow-right"
            class="ml-1 inline-block w-3 h-3 align-[-2px] transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()
const { latest, latestAgo } = useLatestUpdate()
const { trackLatest } = useSupport()

// El home ya muestra "lo último" dentro del propio hero (SectionHero.vue,
// misma fuente de datos vía useLatestUpdate). La propuesta 1 del comité
// (26-sep-2026) pide llevar esa señal a las páginas que HOY no la tienen —
// no duplicarla en el home, donde ya vive de forma más rica (con cifras al
// lado). Por eso la barra se oculta ahí y aparece en el resto del sitio.
const isHome = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/en'
})
</script>

<style scoped>
.latest-bar {
  border-bottom: 1px solid var(--trazo-sutil);
}
.latest-bar__inner {
  --latest-bar-pad: 0.4rem;
  display: flex;
  align-items: center;
  padding-top: var(--latest-bar-pad);
  padding-bottom: var(--latest-bar-pad);
  min-height: 32px;
}
.latest-bar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  width: 100%;
  text-decoration: none;
  color: inherit;
  /* El área clicable es toda la fila (no solo el texto pequeño). El enlace mide 25 px de alto; la zona pulsable de 44 px (`--control-min`, la vara de marca,
     DESIGN-SYSTEM.md sección 4) es el `::after` de abajo, que no mueve nada: la barra sigue midiendo 39 px. */
  padding-block: 0.15rem;
}
/* Zona pulsable de 44 px sin que la barra crezca (decisión de diseño del 26-oct-2026, DESIGN-SYSTEM.md sección 8). La barra va pegada al borde de arriba de la pantalla,
   así que lo que sobresaliera por arriba no se podría tocar: la zona arranca en el borde de arriba de la barra (el relleno de `__inner`) y baja 44 px, unos 5 px por
   debajo de la barra. Ahí está el aire de la cabecera y no sus controles (empiezan a 10 px de la barra o más). `scripts/test-diseno-render.mjs` lo comprueba con
   `elementFromPoint`: la zona mide 44 y no tapa el borde de ningún enlace ni botón de la cabecera. Sin `pointer-events: none`: tiene que recibir el toque. */
.latest-bar__link::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: calc(-1 * var(--latest-bar-pad));
  height: var(--control-min);
}
.latest-bar__title {
  display: block;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--texto-xs);
  color: var(--color-miriam);
  text-decoration: underline;
  text-decoration-color: rgb(var(--color-miriam-rgb) / 0.5);
  text-underline-offset: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: text-decoration-color var(--dur-micro) var(--curva-salida);
}
.latest-bar__link:focus-visible .latest-bar__title {
  text-decoration-color: var(--color-miriam);
}
@media (hover: hover) and (pointer: fine) {
  .latest-bar__link:hover .latest-bar__title {
    text-decoration-color: var(--color-miriam);
  }
}
</style>
