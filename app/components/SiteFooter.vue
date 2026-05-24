<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-ink-100/40">
    <!-- Supported by -->
    <section class="bg-ink-900" :aria-label="$t('index.supported_by')">
      <div class="section-container py-10 sm:py-12 text-center">
        <p class="text-ink-200 text-xs font-medium uppercase tracking-widest mb-8">
          {{ $t('index.supported_by') }}
        </p>
        <div class="flex flex-wrap justify-center items-center gap-12 sm:gap-20">
          <div class="flex flex-col items-center gap-3">
            <img src="/svg/github.svg" alt="GitHub" class="h-10 w-auto object-contain" width="40" height="40" />
            <span class="text-ink-200 text-xs font-medium tracking-wide">GitHub</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <a href="https://tahecosmetics.com" target="_blank" rel="sponsored noopener"
              class="flex flex-col items-center gap-3">
              <img src="/img/thae.png" alt="Thae" class="h-10 w-auto object-contain" width="auto" height="40" />
              <span class="text-ink-200 text-xs font-medium tracking-wide">Thae</span>
            </a>
          </div>
          <div class="flex flex-col items-center gap-3">
            <img src="/img/neversurrender.jpeg" alt="Never Surrender" class="h-10 w-auto object-contain rounded-lg"
              width="auto" height="40" />
            <span class="text-ink-200 text-xs font-medium tracking-wide">Never Surrender</span>
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
              class="w-7 h-7 rounded-lg bg-gold-600 flex items-center justify-center text-white font-display font-bold text-xs"
              aria-hidden="true">
              M
            </span>
            <span class="font-display font-semibold text-ink-900 text-sm">
              {{ $t('site.title') }}
            </span>
          </div>
          <p class="text-xs text-ink-700 leading-relaxed max-w-xs">
            {{ $t('footer.disclaimer') }}
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="font-display font-semibold text-ink-800 text-sm mb-3">
            {{ $t('footer.nav_heading') }}
          </h3>
          <nav :aria-label="$t('nav.footer_label')" class="flex flex-col gap-1.5">
            <NuxtLink v-for="item in navItems" :key="item.key" :to="localePath(item.to)"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              {{ $t(`nav.${item.key}`) }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Social -->
        <div>
          <h3 class="font-display font-semibold text-ink-800 text-sm mb-3">
            {{ $t('footer.social_heading') }}
          </h3>
          <div class="flex flex-col gap-1.5">
            <a href="https://x.com/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              X / Twitter
            </a>
            <a href="https://www.instagram.com/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              Instagram
            </a>
            <a href="https://www.linkedin.com/in/miriamgonp" target="_blank" rel="noopener noreferrer"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              LinkedIn
            </a>
            <a href="https://gofund.me/3e25cae99" target="_blank" rel="noopener noreferrer"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              GoFundMe
            </a>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-ink-200/60 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-2xs text-ink-600">
          {{ $t('footer.updated') }}: {{ $t('footer.month_updated') }} 2026
        </p>
        <p class="text-2xs text-ink-600">
          {{ $t('footer.made_with') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const navItems = [
  { key: 'home', to: '/' },
  { key: 'science', to: '/ciencia' },
  { key: 'team', to: '/equipo' },
  { key: 'timeline', to: '/timeline' },
  { key: 'contact', to: '/contacto' },
]
</script>
