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
      >
        <span class="hero-live-dot h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
        <span class="font-mono uppercase text-[11px] tracking-[0.16em] font-semibold text-coral-deep shrink-0">
          {{ $t('hero.latest_label') }}
        </span>
        <span v-if="latestAgo" class="font-mono text-[11px] text-tinta shrink-0 hidden sm:inline">· {{ latestAgo }}</span>
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
  border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.08);
}
.latest-bar__inner {
  display: flex;
  align-items: center;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  min-height: 32px;
}
.latest-bar__link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  width: 100%;
  text-decoration: none;
  color: inherit;
  /* El área clicable es toda la fila (no solo el texto pequeño): sobra
     margen de toque real aunque el tipo sea de 11-13px. No exige los 44px
     del nav principal porque no es un control de navegación, es informativo. */
  padding-block: 0.15rem;
}
.latest-bar__title {
  display: block;
  min-width: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--color-miriam);
  text-decoration: underline;
  text-decoration-color: rgb(var(--color-miriam-rgb) / 0.5);
  text-underline-offset: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: text-decoration-color 0.15s ease;
}
.latest-bar__link:hover .latest-bar__title,
.latest-bar__link:focus-visible .latest-bar__title {
  text-decoration-color: var(--color-miriam);
}
</style>
