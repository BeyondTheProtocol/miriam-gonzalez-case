<template>
  <header
    :aria-label="$t('footer.site_header')"
    class="sticky top-0 z-50 transition-all duration-300"
    :class="scrolled ? 'bg-ink-50/90 backdrop-blur-lg border-b border-ink-200/50 shadow-sm' : 'bg-transparent'"
  >
    <div class="section-wide flex items-center justify-between h-16 sm:h-18">
      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 group">
        <span class="w-8 h-8 rounded-lg bg-gold-600 text-white flex items-center justify-center font-display font-bold text-sm group-hover:bg-gold-700 transition-colors" aria-hidden="true">
          M
        </span>
        <span class="font-display font-semibold text-ink-900 text-sm sm:text-base tracking-tight hidden sm:block">
          {{ $t('site.title') }}
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav :aria-label="$t('nav.main_label')" class="hidden lg:flex items-center gap-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          :to="localePath(item.to)"
          class="px-3 py-1.5 text-sm font-medium text-ink-700 hover:text-ink-950 rounded-lg hover:bg-ink-100/60 transition-all"
          active-class="!text-ink-950 !bg-ink-100/80"
        >
          {{ $t(`nav.${item.key}`) }}
        </NuxtLink>
      </nav>

      <!-- Right side: lang switch + CTA + mobile menu -->
      <div class="flex items-center gap-3">
        <!-- Language switch -->
        <button
          @click="toggleLocale"
          :aria-label="langAriaLabel"
          class="text-2xs font-mono font-medium tracking-widest uppercase px-2.5 py-1 rounded-md border border-ink-200 text-ink-700 hover:text-ink-950 hover:border-ink-300 transition-colors"
        >
          {{ locale === 'es' ? 'EN' : 'ES' }}
        </button>

        <!-- Donate CTA -->
        <a
          href="https://gofund.me/3e25cae99"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Icon name="ph:heart-fill" class="w-3.5 h-3.5" aria-hidden="true" />
          {{ $t('nav.donate') }}
        </a>

        <!-- Mobile hamburger -->
        <button
          @click="mobileOpen = !mobileOpen"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          :aria-label="mobileOpen ? $t('nav.close_menu') : $t('nav.open_menu')"
          class="lg:hidden p-2 -mr-2 text-ink-700 hover:text-ink-950"
        >
          <Icon :name="mobileOpen ? 'ph:x-bold' : 'ph:list-bold'" class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileOpen"
        id="mobile-nav"
        class="lg:hidden border-t border-ink-200/50 bg-ink-50/95 backdrop-blur-lg"
      >
        <nav :aria-label="$t('nav.mobile_label')" class="section-wide py-4 flex flex-col gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="localePath(item.to)"
            class="px-4 py-2.5 text-sm font-medium text-ink-700 hover:text-ink-950 rounded-lg hover:bg-ink-100/60 transition-all"
            active-class="!text-ink-950 !bg-ink-100/80"
            @click="mobileOpen = false"
          >
            {{ $t(`nav.${item.key}`) }}
          </NuxtLink>
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-xl"
          >
            <Icon name="ph:heart-fill" class="w-3.5 h-3.5" aria-hidden="true" />
            {{ $t('nav.donate') }}
          </a>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const mobileOpen = ref(false)
const scrolled = ref(false)

const langAriaLabel = computed(() =>
  locale.value === 'es' ? t('nav.switch_to_en') : t('nav.switch_to_es')
)

const navItems = [
  { key: 'home', to: { name: 'index' } },
  { key: 'science', to: { name: 'ciencia' } },
  { key: 'team', to: { name: 'equipo' } },
  { key: 'timeline', to: { name: 'timeline' } },
  { key: 'story', to: { name: 'historia' } },
  { key: 'contact', to: { name: 'contacto' } },
]

function toggleLocale() {
  const newLocale = locale.value === 'es' ? 'en' : 'es'
  navigateTo(switchLocalePath(newLocale))
}

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
})
</script>
