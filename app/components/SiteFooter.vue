<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-cream-card" style="border-top: 1px solid rgba(45,27,61,0.08)">
    <!-- Con el apoyo de — muro de logos uniforme: todos iguales, misma altura,
         centrados en rejilla y sin etiqueta de texto (logo wall limpio). -->
    <section class="bg-berenjena" :aria-label="$t('index.supported_by')">
      <div class="section-container py-10 sm:py-12 text-center">
        <p class="text-cream/70 text-xs font-mono font-medium uppercase tracking-[0.12em] mb-8">
          {{ $t('index.supported_by') }}
        </p>
        <ul class="grid grid-cols-2 sm:grid-cols-4 items-center justify-items-center gap-x-8 sm:gap-x-14 gap-y-9 max-w-2xl mx-auto">
          <li v-for="s in supporters" :key="s.name" class="flex items-center justify-center">
            <a
              v-if="s.url"
              :href="s.url"
              target="_blank"
              rel="sponsored noopener"
              class="inline-flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
              :aria-label="s.name"
            >
              <img
                :src="s.img"
                :alt="s.name"
                class="h-9 w-auto max-w-[130px] object-contain"
                :class="{ 'rounded-lg': s.mono }"
                :style="s.mono ? 'filter: grayscale(1)' : ''"
                loading="lazy"
                decoding="async"
              />
            </a>
            <img
              v-else
              :src="s.img"
              :alt="s.name"
              class="h-9 w-auto max-w-[130px] object-contain opacity-90"
              :class="{ 'rounded-lg': s.mono }"
              :style="s.mono ? 'filter: grayscale(1)' : ''"
              loading="lazy"
              decoding="async"
            />
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
            <a href="https://x.com/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
              X / Twitter<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
            <a href="https://www.instagram.com/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
              Instagram<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </a>
            <a href="https://www.linkedin.com/in/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors">
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
const { trackSupport } = useSupport()

// "Con el apoyo de" — todos iguales (logos de empresas/colaboradores). `mono`
// marca los que son foto/raster y necesitan grayscale para encajar en el muro.
// (Para una uniformidad perfecta, Never Surrender pide un PNG blanco/transparente.)
const supporters = [
  { name: 'GitHub', img: '/svg/github.svg' },
  { name: 'Notion', img: '/svg/notion.svg' },
  { name: 'Never Surrender', img: '/img/neversurrender.jpeg', mono: true },
  { name: 'Tahe', img: '/img/thae.png', url: 'https://tahecosmetics.com' },
]

// Mismo orden que el menú superior + "Cómo ayudar" y "Contacto" al final.
const navItems = [
  { key: 'home', to: '/' },
  { key: 'science', to: '/ciencia' },
  { key: 'timeline', to: '/timeline' },
  { key: 'team', to: '/equipo' },
  { key: 'collaborate', to: '/colabora' },
  { key: 'contact', to: '/contacto' },
]
</script>
