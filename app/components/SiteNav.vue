<template>
  <header
    ref="headerRef"
    :aria-label="$t('footer.site_header')"
    class="transition-[background-color,box-shadow] duration-transicion ease-salida"
    :class="
      scrolled
        ? 'barra-fija shadow-flotante'
        : 'bg-cream'
    "
    style="border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.08)"
  >
    <!-- menu:gap-2: hueco mínimo de 8 px entre el logo, el menú y el bloque de la derecha. Con `whitespace-nowrap` en las etiquetas, si una
           no cabe se ve como un desborde (el test de la cabecera lo mide), no como un salto de línea. El menú de escritorio empieza en
           `menu:` (70rem, ver tailwind.config.js), no en `lg`: por debajo, hamburguesa. -->
      <div class="section-wide flex items-center justify-between h-16 sm:h-18 menu:gap-2">
      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 group" style="text-decoration: none">
          <!-- Logo redondo: monograma «m» + constelación de destellos (DS, violeta miriam) -->
          <BrandMark class="w-11 h-11 shrink-0" />
          <span class="flex flex-col leading-none sm:whitespace-nowrap" translate="no">
            <span class="font-display font-semibold text-berenjena text-sm tracking-tight">
              {{ $t('site.title') }}
            </span>
            <span class="font-mono text-[11px] tracking-[0.04em] text-miriam mt-1">helpmiriam.com</span>
          </span>
        </NuxtLink>
      <!-- Desktop nav. Chrome mínimo (/links, /gracias): sin menú, ver useChromeMinimo. -->
      <nav
        v-if="!minimo"
        :aria-label="$t('nav.main_label')"
        class="hidden menu:flex items-center gap-1"
      >
        <NuxtLink
          v-for="item in MENU_ESCRITORIO"
          :key="item.key"
          :to="localePath({ name: item.name })"
          :class="navClass(item.key, true)"
          :aria-current="ariaCurrent(item.key)"
          @click="trackNav(item.key)"
        >
          {{ $t(`nav.${item.key}`) }}
        </NuxtLink>
      </nav>

      <!-- Right side: lang switch + CTA + mobile menu -->
      <!-- gap-1.5 bajo `sm`: con el selector a la vista y de 44 px de ancho, a 320 px la cabecera se pasaba 3 px (scroll horizontal) -->
      <div class="flex items-center gap-1.5 sm:gap-3">
        <!-- Language switch — toggle segmentado discreto: muestra ambos idiomas y
             marca el activo con un tinte suave (no una píldora rellena), para no
             competir con el CTA coral. SIEMPRE visible en la cabecera, también en móvil
             (T2a, 24-oct-2026): hasta entonces, bajo `sm`, vivía dentro del menú desplegable
             y quien llegaba en el otro idioma no lo veía. Umami: el 31 % de los visitantes
             tiene el navegador en inglés y casi ninguno visita /en. setLocale() navega a la URL del otro idioma;
             no hay cookie ni detección del navegador. -->
        <div
          role="group"
          :aria-label="$t('nav.language')"
          class="flex items-center rounded-md overflow-hidden font-mono text-2xs font-semibold tracking-widest uppercase"
          style="border: 1px solid rgb(var(--color-text-rgb) / 0.1)"
        >
          <button
            type="button"
            @click="switchLang('es')"
            aria-label="Español"
            :aria-pressed="locale === 'es'"
            class="inline-flex items-center justify-center px-1 py-2 min-h-control min-w-control uppercase transition-colors"
            :class="locale === 'es' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          >ES</button>
          <button
            type="button"
            @click="switchLang('en')"
            aria-label="English"
            :aria-pressed="locale === 'en'"
            class="inline-flex items-center justify-center px-1 py-2 min-h-control min-w-control uppercase transition-colors"
            :class="locale === 'en' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          >EN</button>
        </div>

        <!-- Donate CTA. Con el chrome mínimo (/links, /gracias) no hay botón en la cabecera (useChromeMinimo): en
             /gracias quien llega ya ha donado, y /links lleva el apoyo como su 2.ª fila (F6). Bajo `sm` el botón
             vive dentro del menú desplegable. -->
        <a
          v-if="!minimo"
          href="https://gofund.me/3e25cae99"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackSupport('cabecera')"
          class="donate-cta hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap min-h-[44px] px-4 py-2 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)]"
          style="text-decoration: none"
        >
          <Icon name="ph:heart-fill" class="heart-beat w-3.5 h-3.5" aria-hidden="true" />
          {{ $t('nav.donate') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
        </a>

        <!-- Mobile hamburger -->
        <button
          v-if="!minimo"
          ref="hamburguesaRef"
          @click="mobileOpen = !mobileOpen"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          :aria-label="mobileOpen ? $t('nav.close_menu') : $t('nav.open_menu')"
          class="menu:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-berenjena"
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
      enter-active-class="transition-[opacity,transform] duration-[var(--dur-micro)] ease-[var(--curva-salida)]"
      enter-from-class="opacity-0 -translate-y-2 motion-reduce:translate-y-0"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[opacity,transform] duration-[var(--dur-micro)] ease-[var(--curva-salida)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2 motion-reduce:translate-y-0"
    >
      <div
        v-if="mobileOpen && !minimo"
        id="mobile-nav"
        class="menu:hidden barra-fija"
        style="border-top: 1px solid rgb(var(--color-text-rgb) / 0.08)"
      >
        <nav
          :aria-label="$t('nav.mobile_label')"
          class="section-wide py-4 flex flex-col gap-1"
        >
          <NuxtLink
            v-for="item in MENU_MOVIL"
            :key="item.key"
            :to="localePath({ name: item.name })"
            :class="navClass(item.key)"
            :aria-current="ariaCurrent(item.key)"
            @click="onMobileNav(item.key)"
          >
            {{ $t(`nav.${item.key}`) }}
          </NuxtLink>
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackSupport('menu_movil')"
            class="donate-cta mt-2 flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 bg-coral hover:bg-coral-hover text-berenjena text-sm font-semibold rounded-btn"
            style="text-decoration: none"
          >
            <Icon name="ph:heart-fill" class="heart-beat w-3.5 h-3.5" aria-hidden="true" />
            {{ $t('nav.donate') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
          </a>

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
const { trackSupport, trackNav, trackIdioma } = useSupport()
const { minimo } = useChromeMinimo()

const headerRef = ref<HTMLElement | null>(null)
const hamburguesaRef = ref<HTMLButtonElement | null>(null)
const mobileOpen = ref(false)
const scrolled = computed(() => y.value > 20)

// Ítems del menú: app/utils/navegacion.ts (fuente única con el pie y el índice).
// Estado activo por NOMBRE de ruta, no por prefijo de path: las páginas del caso no
// cuelgan de una raíz común y en inglés las rutas cambian. aria-current="page" en la
// raíz de la sección; "true" (y el mismo estilo) en una página hija, p. ej. /lesiones
// marca «Datos».
const routeBaseName = useRouteBaseName()
const rutaActual = computed(() => routeBaseName(route) ?? undefined)
const ariaCurrent = (key: string) => ariaCurrentSeccion(key, rutaActual.value)

// Estados del enlace de menú:
// · reposo  → gris (tinta)
// · hover   → píldora de fondo miriam-soft + texto berenjena
// · activo  → violeta miriam + subrayado fijo → distinto del hover ("estás aquí")
// Alto mínimo de 44 px también en escritorio: una tableta en horizontal se usa con el dedo. La cabecera mide 64 px, así que cabe.
// En escritorio, las etiquetas no se parten (`whitespace-nowrap`) y el relleno lateral baja de 12 a 8 px entre el corte del menú y 1279 px
// (T2a, revisión del 24-oct-2026): con «Herramientas» (unos 66 px más ancha que «Datos») y el selector de 88 px, a 1024 px el menú en
// español no cabía y «La ciencia», «Cómo ayudar» y «Apoyar a Miriam» saltaban a dos líneas.
// Segunda revisión (24-oct-2026): sin partir etiquetas, con la letra de la raíz al 125 % el bloque de la derecha se salía de la pantalla
// (1037 px de contenido en 1024, y 1106 al 150 %). El menú de escritorio empieza ahora en `menu:` (70rem = 1120 px, tailwind.config.js) y
// por debajo hay hamburguesa; al 125 % sobran unos 60 px en el corte. Como el corte está en rem, si la persona sube la letra de su
// navegador el corte sube con ella. El alto sigue siendo 44 px y el ancho de cada enlace, mayor que 44. El menú móvil conserva sus 12 px.
function navClass(key: string, escritorio = false): (string | undefined)[] {
  return [
    'inline-flex items-center min-h-[44px] py-1.5 text-sm font-medium rounded-lg transition-colors',
    escritorio ? 'px-2 xl:px-3 whitespace-nowrap' : 'px-3',
    // hover (ratón) + active (táctil, sin hover): misma píldora miriam-soft
    'hover:bg-miriam-soft/60 hover:text-berenjena active:bg-miriam-soft/60 active:text-berenjena',
    ariaCurrent(key)
      ? 'text-miriam underline decoration-2 decoration-miriam underline-offset-[6px]'
      : 'text-tinta',
  ]
}

function onMobileNav(key: string) {
  trackNav(key)
  mobileOpen.value = false
}

// Cambiar de idioma manualmente: setLocale escribe el cookie y navega, así la
// elección del usuario prevalece sobre la detección del navegador (que solo
// actúa en la primera visita, sin cookie).
async function switchLang(code: 'es' | 'en') {
  if (code !== locale.value) {
    // «Idioma» { de, a, pagina } (T2d): se mide ANTES de navegar. Después, la ruta ya es la de la página del otro idioma y `locale`
    // ya es el nuevo. Solo cuenta un cambio real: pulsar el idioma que ya está activo no manda nada.
    trackIdioma(locale.value, code, paginaBase(route.name))
    await setLocale(code)
  }
  mobileOpen.value = false
}

// Cerrar el menú móvil con Escape (y devolver el foco a la hamburguesa, que es de
// donde venía) y al pulsar fuera de la cabecera (ahí el foco ya está en otro sitio).
onKeyStroke('Escape', () => {
  if (!mobileOpen.value) return
  mobileOpen.value = false
  nextTick(() => hamburguesaRef.value?.focus())
})
onClickOutside(headerRef, () => {
  if (mobileOpen.value) mobileOpen.value = false
})
</script>
