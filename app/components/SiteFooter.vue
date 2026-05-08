<template>
  <footer :aria-label="$t('footer.site_footer')" class="border-t border-ink-200/60 bg-ink-100/40">
    <div class="section-wide py-12 sm:py-16">
      <div class="grid sm:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2.5 mb-3">
            <span class="w-7 h-7 rounded-lg bg-gold-600 flex items-center justify-center text-white font-display font-bold text-xs" aria-hidden="true">
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
          <h4 class="font-display font-semibold text-ink-800 text-sm mb-3">{{ $t('footer.nav_heading') }}</h4>
          <nav :aria-label="$t('nav.footer_label')" class="flex flex-col gap-1.5">
            <NuxtLink
              v-for="item in navItems"
              :key="item.key"
              :to="localePath(item.to)"
              class="text-sm text-ink-700 hover:text-ink-950 transition-colors"
            >
              {{ $t(`nav.${item.key}`) }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Social -->
        <div>
          <h4 class="font-display font-semibold text-ink-800 text-sm mb-3">{{ $t('footer.social_heading') }}</h4>
          <div class="flex flex-col gap-1.5">
            <a href="https://x.com/miriamgonp" target="_blank" rel="noopener noreferrer" class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              X / Twitter
            </a>
            <a href="https://www.instagram.com/miriamgonp" target="_blank" rel="noopener noreferrer" class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              Instagram
            </a>
            <a href="https://www.linkedin.com/in/miriamgonp" target="_blank" rel="noopener noreferrer" class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              LinkedIn
            </a>
            <a href="https://gofund.me/3e25cae99" target="_blank" rel="noopener noreferrer" class="text-sm text-ink-700 hover:text-ink-950 transition-colors">
              GoFundMe
            </a>
          </div>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-ink-200/60 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-2xs text-ink-600">
          {{ $t('footer.updated') }}: Abril 2026
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
