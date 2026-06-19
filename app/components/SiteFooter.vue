<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-cream-card" style="border-top: 1px solid rgba(45,27,61,0.08)">
    <!-- Con el apoyo de — muro de logos uniforme: todos en blanco monocromo, misma
         altura óptica, centrados en rejilla. Cada logo se aplana a silueta crema
         (logo-wall__mark) para que GitHub/Notion/Tahe/Never Surrender se lean como
         un solo conjunto sobre la banda berenjena, sin cajas ni colores dispares. -->
    <section class="bg-berenjena" :aria-label="$t('index.supported_by')">
      <div class="section-wide py-10 sm:py-12 text-center">
        <p class="text-cream/70 text-xs font-mono font-medium uppercase tracking-[0.12em] mb-9">
          {{ $t('index.supported_by') }}
        </p>
        <ul class="grid grid-cols-2 sm:grid-cols-4 items-center justify-items-center gap-x-10 sm:gap-x-12 gap-y-10 max-w-2xl mx-auto">
          <li v-for="s in supporters" :key="s.name" class="flex items-center justify-center">
            <component
              :is="s.url ? 'a' : 'span'"
              v-bind="s.url ? { href: s.url, target: '_blank', rel: 'sponsored noopener' } : {}"
              class="logo-wall__item inline-flex items-center justify-center"
              :aria-label="s.url ? s.name : undefined"
            >
              <img
                :src="s.img"
                :alt="s.name"
                class="logo-wall__mark w-auto object-contain"
                :class="s.raster ? 'logo-wall__mark--raster' : 'logo-wall__mark--vector'"
                loading="lazy"
                decoding="async"
              />
            </component>
          </li>
        </ul>
      </div>
    </section>
    <div class="section-wide py-12 sm:py-16">
      <!-- D6: marca (2fr) + Navegación/Social (1fr c/u) repartidas a lo ancho del
           shell. En < md se apila (1 col); en móvil 375-390 es idéntico a hoy. -->
      <div class="grid gap-10 md:grid-cols-[2fr_1fr_1fr] lg:gap-16 items-start">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2.5 mb-3">
            <BrandMark class="w-8 h-8 shrink-0" />
            <span class="font-display font-semibold text-berenjena text-sm">
              {{ $t('site.title') }}
            </span>
          </div>
          <p class="text-xs text-tinta leading-relaxed max-w-xs">
            {{ $t('footer.disclaimer') }}
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="eyebrow mb-3 block">
            {{ $t('footer.nav_heading') }}
          </h3>
          <nav :aria-label="$t('nav.footer_label')" class="flex flex-col gap-1.5">
            <NuxtLink v-for="item in navItems" :key="item.key" :to="localePath(item.to)"
              class="text-sm text-tinta hover:text-miriam transition-colors"
              style="text-decoration: none">
              {{ $t(`nav.${item.key}`) }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Social -->
        <div>
          <h3 class="eyebrow mb-3 block">
            {{ $t('footer.social_heading') }}
          </h3>
          <div class="flex flex-col gap-1.5">
            <a
              href="https://x.com/miriamgonp"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
              @click="trackShare('x', 'footer')"
            >
              X / Twitter<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
            <a
              href="https://www.instagram.com/miriamgonp"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
              @click="trackShare('instagram', 'footer')"
            >
              Instagram<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
            <a
              href="https://www.linkedin.com/in/miriamgonp"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
              @click="trackShare('linkedin', 'footer')"
            >
              LinkedIn<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
            <a href="https://gofund.me/3e25cae99" target="_blank" rel="noopener noreferrer"
              @click="trackSupport('footer')"
              class="inline-flex items-center gap-1 text-sm text-coral-deep hover:text-coral-hover hover:underline underline-offset-2 font-semibold transition-colors">
              GoFundMe<Icon name="ph:arrow-up-right-bold" class="w-3 h-3" aria-hidden="true" /><span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Legal -->
      <nav
        :aria-label="$t('footer.legal_heading')"
        class="mt-8 pt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
        style="border-top: 1px solid rgba(45,27,61,0.08)"
      >
        <NuxtLink :to="localePath('aviso-legal')" class="text-[11px] font-mono text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
          {{ $t('footer.legal_notice') }}
        </NuxtLink>
        <NuxtLink :to="localePath('privacidad')" class="text-[11px] font-mono text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
          {{ $t('footer.privacy') }}
        </NuxtLink>
        <NuxtLink :to="localePath('cookies')" class="text-[11px] font-mono text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
          {{ $t('footer.cookies') }}
        </NuxtLink>
      </nav>

      <div class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-[11px] font-mono text-tinta">
          {{ $t('footer.updated') }}: {{ $t('footer.month_updated') }} 2026
        </p>
        <p class="text-[11px] font-mono text-tinta">
          {{ $t('footer.made_with') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { trackSupport, trackShare } = useSupport()

// "Con el apoyo de" — todos iguales (logos de empresas/colaboradores). Todos se
// pintan en blanco monocromo (CSS) para leerse como un conjunto sobre berenjena.
// `raster: true` marca el logo en mapa de bits CON fondo blanco horneado (el JPEG
// de Never Surrender): se le quita la caja por CSS (invert + mix-blend screen).
// NOTA: para nitidez perfecta, Never Surrender pediría un PNG blanco/transparente;
// con CSS queda como silueta limpia sin recuadro, suficiente para el muro.
const supporters = [
  { name: 'GitHub', img: '/svg/github.svg' },
  { name: 'Notion', img: '/svg/notion.svg' },
  { name: 'Never Surrender', img: '/img/neversurrender.jpeg', raster: true },
  { name: 'Tahe', img: '/img/thae.png', url: 'https://tahecosmetics.com' },
]

// Mismo orden que el menú superior + "Cómo ayudar" y "Contacto" al final.
const navItems = [
  { key: 'home', to: '/' },
  { key: 'science', to: '/ciencia' },
  { key: 'timeline', to: '/timeline' },
  { key: 'team', to: '/equipo' },
  { key: 'press', to: '/prensa' },
  { key: 'collaborate', to: '/colabora' },
  { key: 'brands', to: '/marcas' },
  { key: 'expenses', to: '/gastos' },
  { key: 'contact', to: '/contacto' },
]
</script>

<style scoped>
/* ── Muro "Con el apoyo de" ───────────────────────────────────────────────────
   Todos los logos como silueta crema monocromo, misma altura óptica y opacidad,
   para que se lean como un conjunto sobre la banda berenjena. Hover → opacidad
   plena. (SiteFooter es global: este tratamiento afecta a todo el sitio.) */
/* La opacidad va en la PROPIA imagen (no en el wrapper) para no aislar el grupo:
   así mix-blend-mode sigue componiendo contra la banda berenjena, no contra un
   contenedor transparente. */
.logo-wall__mark {
  height: 1.9rem; /* altura óptica común; SVG/PNG comparten escala */
  max-width: 140px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
a.logo-wall__item:hover .logo-wall__mark,
a.logo-wall__item:focus-visible .logo-wall__mark {
  opacity: 1;
}

/* Vectores y PNG transparentes (GitHub, Notion, Tahe): monocromo claro.
   `grayscale` quita el color; `mix-blend-mode: lighten` deja en blanco las zonas
   claras del arte y deja ver la banda en las zonas oscuras → conserva el detalle
   interno (p.ej. la "N" calada de Notion) en lugar de aplanarlo a un bloque. */
.logo-wall__mark--vector {
  filter: grayscale(1) brightness(1.05);
  mix-blend-mode: lighten;
}

/* Raster con fondo blanco horneado (JPEG Never Surrender): invertimos (fondo
   blanco → negro, logo → claro) y con mix-blend screen el negro cae a la banda
   → desaparece la caja; queda la silueta clara del logo, sin recuadro. */
.logo-wall__mark--raster {
  filter: invert(1) grayscale(1) brightness(2.1) contrast(1.1);
  mix-blend-mode: screen;
  height: 2.4rem; /* el JPEG trae mucho margen interno: compensa la altura óptica */
  max-width: 150px;
}

@media (prefers-reduced-motion: reduce) {
  .logo-wall__mark {
    transition: none;
  }
}
</style>
