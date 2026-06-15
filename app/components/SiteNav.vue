<template>
  <header
    ref="headerRef"
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
          <!-- Logo redondo: monograma «m» + constelación de destellos (DS, violeta miriam) -->
          <BrandMark class="w-11 h-11 shrink-0" />
          <span class="flex flex-col leading-none" translate="no">
            <span class="font-display font-semibold text-berenjena text-sm tracking-tight">
              {{ $t('site.title') }}
            </span>
            <span class="font-mono text-[11px] tracking-[0.04em] text-miriam mt-1">helpmiriam.com</span>
          </span>
        </NuxtLink>
      <!-- Desktop nav -->
      <nav
        :aria-label="$t('nav.main_label')"
        class="hidden lg:flex items-center gap-1"
      >
        <NuxtLink
          v-for="item in allNav"
          :key="item.key"
          :to="localePath(item.to)"
          :class="navClass(item.to)"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ $t(`nav.${item.key}`) }}
        </NuxtLink>
      </nav>

      <!-- Right side: lang switch + CTA + mobile menu -->
      <div class="flex items-center gap-3">
        <!-- Language switch — toggle segmentado discreto: muestra ambos idiomas y
             marca el activo con un tinte suave (no una píldora rellena), para no
             competir con el CTA coral. Oculto en móviles pequeños (<sm): allí vive
             dentro del menú desplegable. setLocale() escribe el cookie
             i18n_redirected → la elección persiste y no rebota con la detección. -->
        <div
          role="group"
          :aria-label="$t('nav.language')"
          class="hidden sm:flex items-center rounded-md overflow-hidden font-mono text-[11px] font-semibold tracking-widest uppercase"
          style="border: 1px solid rgba(45,27,61,0.10)"
        >
          <button
            type="button"
            @click="switchLang('es')"
            aria-label="Español"
            :aria-pressed="locale === 'es'"
            class="inline-flex items-center justify-center px-2.5 py-2 min-h-[36px] transition-colors"
            :class="locale === 'es' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          >ES</button>
          <button
            type="button"
            @click="switchLang('en')"
            aria-label="English"
            :aria-pressed="locale === 'en'"
            class="inline-flex items-center justify-center px-2.5 py-2 min-h-[36px] transition-colors"
            :class="locale === 'en' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          >EN</button>
        </div>

        <!-- Donate CTA -->
        <a
          href="https://gofund.me/3e25cae99"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackSupport('cabecera')"
          class="donate-cta hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)]"
          style="text-decoration: none"
        >
          <Icon name="ph:heart-fill" class="heart-beat w-3.5 h-3.5" aria-hidden="true" />
          {{ $t('nav.donate') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
        </a>

        <!-- Mobile hamburger -->
        <button
          @click="mobileOpen = !mobileOpen"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          :aria-label="mobileOpen ? $t('nav.close_menu') : $t('nav.open_menu')"
          class="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-berenjena"
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
          class="section-wide py-4 flex flex-col gap-1 stagger-children"
        >
          <NuxtLink
            v-for="item in allNav"
            :key="item.key"
            :to="localePath(item.to)"
            :class="navClass(item.to)"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            @click="mobileOpen = false"
          >
            {{ $t(`nav.${item.key}`) }}
          </NuxtLink>
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackSupport('menu_movil')"
            class="donate-cta mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn"
            style="text-decoration: none"
          >
            <Icon name="ph:heart-fill" class="heart-beat w-3.5 h-3.5" aria-hidden="true" />
            {{ $t('nav.donate') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
          </a>

          <!-- Language switch — vive aquí en móvil para descongestionar la cabecera -->
          <div
            class="mt-3 pt-3 flex items-center justify-between"
            style="border-top: 1px solid rgba(45,27,61,0.08)"
          >
            <span class="font-mono text-[11px] uppercase tracking-widest text-tinta">
              {{ $t('nav.language') }}
            </span>
            <div
              role="group"
              :aria-label="$t('nav.language')"
              class="flex items-center rounded-md overflow-hidden font-mono text-[11px] font-semibold tracking-widest uppercase"
              style="border: 1px solid rgba(45,27,61,0.10)"
            >
              <button
                type="button"
                @click="switchLang('es')"
                aria-label="Español"
                :aria-pressed="locale === 'es'"
                class="inline-flex items-center justify-center px-4 py-2 min-h-[44px] transition-colors"
                :class="locale === 'es' ? 'bg-berenjena text-cream' : 'text-tinta'"
              >ES</button>
              <button
                type="button"
                @click="switchLang('en')"
                aria-label="English"
                :aria-pressed="locale === 'en'"
                class="inline-flex items-center justify-center px-4 py-2 min-h-[44px] transition-colors"
                :class="locale === 'en' ? 'bg-berenjena text-cream' : 'text-tinta'"
              >EN</button>
            </div>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { y } = useWindowScroll()
const { trackSupport } = useSupport()

const headerRef = ref<HTMLElement | null>(null)
const mobileOpen = ref(false)
const scrolled = computed(() => y.value > 20)

const navItems = [
  { key: 'home', to: { name: 'index' } },
  { key: 'science', to: { name: 'ciencia' } },
  { key: 'timeline', to: { name: 'timeline' } },
  { key: 'team', to: { name: 'equipo' } },
]
// "Colabora" ahora vive en el array (antes era markup duplicado suelto).
const allNav = [...navItems, { key: 'collaborate', to: 'colabora' as const }]

// Página actual: marca el ítem activo también en subpáginas (p. ej. un
// artículo /ciencia/algo resalta "El caso"). El home solo en coincidencia exacta.
function isActive(to: unknown): boolean {
  const target = (localePath(to as never) || '/').replace(/\/+$/, '') || '/'
  const path = route.path.replace(/\/+$/, '') || '/'
  if (typeof to === 'object' && to !== null && (to as { name?: string }).name === 'index') {
    return path === target
  }
  return path === target || path.startsWith(target + '/')
}

// Estados del enlace de menú:
// · reposo  → gris (tinta)
// · hover   → píldora de fondo miriam-soft + texto berenjena
// · activo  → violeta miriam + subrayado fijo → distinto del hover ("estás aquí")
function navClass(to: unknown): (string | undefined)[] {
  return [
    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
    // hover (ratón) + active (táctil, sin hover): misma píldora miriam-soft
    'hover:bg-miriam-soft/60 hover:text-berenjena active:bg-miriam-soft/60 active:text-berenjena',
    isActive(to)
      ? 'text-miriam underline decoration-2 decoration-miriam underline-offset-[6px]'
      : 'text-tinta',
  ]
}

// Cambiar de idioma manualmente: setLocale escribe el cookie y navega, así la
// elección del usuario prevalece sobre la detección del navegador (que solo
// actúa en la primera visita, sin cookie).
async function switchLang(code: 'es' | 'en') {
  if (code !== locale.value) await setLocale(code)
  mobileOpen.value = false
}

// Cerrar el menú móvil con Escape y al pulsar fuera de la cabecera.
onKeyStroke('Escape', () => {
  if (mobileOpen.value) mobileOpen.value = false
})
onClickOutside(headerRef, () => {
  if (mobileOpen.value) mobileOpen.value = false
})
</script>
