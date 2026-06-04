<template>
  <header
    :aria-label="$t('footer.site_header')"
    class="sticky top-0 z-50 transition-all duration-300"
    :class="
      scrolled
        ? 'bg-cream/95 backdrop-blur-lg shadow-sm'
        : 'bg-cream'
    "
    style="border-bottom: 1px solid rgba(45,27,61,0.08)"
  >
    <div class="section-wide flex items-center justify-between h-16 sm:h-18">
      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 group" style="text-decoration: none">
          <span
            class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            aria-hidden="true"
            style="background: #2d1b3d;"
          >
            <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#2D1B3D" />
              <text
                x="32"
                y="46"
                font-family="Fraunces, Georgia, serif"
                font-weight="600"
                font-style="italic"
                font-size="40"
                fill="#FAF6F0"
                text-anchor="middle"
                letter-spacing="-0.02em"
              >
                m
              </text>
              <path
                d="M 12 16 L 12.7 18 L 14.7 18.7 L 12.7 19.4 L 12 21.4 L 11.3 19.4 L 9.3 18.7 L 11.3 18 Z"
                fill="#A44DB2"
              />
              <path
                d="M 52 14 L 53 17 L 56 18 L 53 19 L 52 22 L 51 19 L 48 18 L 51 17 Z"
                fill="#FAF6F0"
              />
              <path
                d="M 50 50 L 50.7 52 L 52.7 52.7 L 50.7 53.4 L 50 55.4 L 49.3 53.4 L 47.3 52.7 L 49.3 52 Z"
                fill="#A44DB2"
              />
            </svg>
          </span>
          <span class="flex flex-col leading-none">
            <span
              class="font-display font-semibold text-berenjena text-sm sm:text-base tracking-tight"
            >
              {{ $t('site.title') }}
            </span>
            <span
              class="font-mono text-[10px] tracking-[0.04em] text-miriam mt-1"
            >
              helpmiriam.com
            </span>
          </span>
        </NuxtLink>
      <!-- Desktop nav -->
      <nav
        :aria-label="$t('nav.main_label')"
        class="hidden lg:flex items-center gap-1"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          :to="localePath(item.to)"
          class="px-3 py-1.5 text-sm font-medium text-tinta hover:text-miriam rounded-lg transition-all"
          style="text-decoration: none"
          active-class="!text-miriam"
        >
          {{ $t(`nav.${item.key}`) }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('colabora')"
          class="px-3 py-1.5 text-sm font-medium text-tinta hover:text-miriam rounded-lg transition-all"
          style="text-decoration: none"
          active-class="!text-miriam"
        >
          {{ $t('nav.collaborate') }}
        </NuxtLink>
      </nav>

      <!-- Right side: lang switch + CTA + mobile menu -->
      <div class="flex items-center gap-3">
        <!-- Language switch -->
        <button
          @click="toggleLocale"
          :aria-label="langAriaLabel"
          class="text-[11px] font-mono font-medium tracking-widest uppercase px-2.5 py-1 rounded-md text-tinta hover:text-berenjena transition-colors"
          style="border: 1px solid rgba(45,27,61,0.15)"
        >
          {{ locale === 'es' ? 'EN' : 'ES' }}
        </button>

        <!-- Donate CTA -->
        <a
          href="https://gofund.me/3e25cae99"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn transition-all"
          style="text-decoration: none"
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
          class="lg:hidden p-2 -mr-2 text-berenjena"
        >
          <Icon
            :name="mobileOpen ? 'ph:x-bold' : 'ph:list-bold'"
            class="w-5 h-5"
            aria-hidden="true"
          />
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
        class="lg:hidden bg-cream/95 backdrop-blur-lg"
        style="border-top: 1px solid rgba(45,27,61,0.08)"
      >
        <nav
          :aria-label="$t('nav.mobile_label')"
          class="section-wide py-4 flex flex-col gap-1"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="localePath(item.to)"
            class="px-4 py-2.5 text-sm font-medium text-tinta hover:text-miriam rounded-lg transition-all"
            style="text-decoration: none"
            active-class="!text-miriam"
            @click="mobileOpen = false"
          >
            {{ $t(`nav.${item.key}`) }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('colabora')"
            class="px-4 py-2.5 text-sm font-medium text-tinta hover:text-miriam rounded-lg transition-all"
            style="text-decoration: none"
            active-class="!text-miriam"
            @click="mobileOpen = false"
          >
            {{ $t('nav.collaborate') }}
          </NuxtLink>
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn"
            style="text-decoration: none"
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
const { y } = useWindowScroll()

const mobileOpen = ref(false)
const scrolled = computed(() => y.value > 20)

const langAriaLabel = computed(() =>
  locale.value === 'es' ? t('nav.switch_to_en') : t('nav.switch_to_es')
)

const navItems = [
  { key: 'home', to: { name: 'index' } },
  { key: 'science', to: { name: 'ciencia' } },
  { key: 'timeline', to: { name: 'timeline' } },
  { key: 'team', to: { name: 'equipo' } },
]

function toggleLocale() {
  const newLocale = locale.value === 'es' ? 'en' : 'es'
  navigateTo(switchLocalePath(newLocale))
}
</script>
