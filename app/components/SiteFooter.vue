<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-cream-card" style="border-top: 1px solid rgba(45,27,61,0.08)">
    <!-- Supported by -->
    <section class="bg-berenjena" :aria-label="$t('index.supported_by')">
      <div class="section-container py-10 sm:py-12 text-center">
        <p class="text-cream/70 text-xs font-mono font-medium uppercase tracking-[0.12em] mb-8">
          {{ $t('index.supported_by') }}
        </p>
        <div class="flex flex-wrap justify-center items-center gap-12 sm:gap-20">
          <div class="flex flex-col items-center gap-3">
            <img src="/svg/github.svg" alt="GitHub" class="h-10 w-auto object-contain opacity-90" width="40" height="40" loading="lazy" decoding="async" />
            <span class="text-cream/80 text-xs font-medium tracking-wide" translate="no">GitHub</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <img src="/svg/notion.svg" alt="Notion" class="h-10 w-auto object-contain opacity-90" width="40" height="40" loading="lazy" decoding="async" />
            <span class="text-cream/80 text-xs font-medium tracking-wide" translate="no">Notion</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <img src="/img/neversurrender.jpeg" alt="Never Surrender" class="h-10 w-auto object-contain rounded-lg"
              style="filter: grayscale(1); opacity: 0.85" width="auto" height="40" loading="lazy" decoding="async" />
            <span class="text-cream/80 text-xs font-medium tracking-wide" translate="no">Never Surrender</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <a href="https://tahecosmetics.com" target="_blank" rel="sponsored noopener"
              class="flex flex-col items-center gap-3" style="text-decoration: none">
              <img src="/img/thae.png" alt="Thae" class="h-10 w-auto object-contain" width="auto" height="40" loading="lazy" decoding="async" />
              <span class="text-cream/80 text-xs font-medium tracking-wide" translate="no">Thae</span>
            </a>
          </div>
        </div>
      </div>
    </section>
    <div class="section-wide py-12 sm:py-16">
      <div class="grid sm:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2.5 mb-3">
            <span
              class="w-7 h-7 rounded-lg bg-berenjena flex items-center justify-center text-cream font-display font-semibold text-xs"
              aria-hidden="true">
              M
            </span>
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
