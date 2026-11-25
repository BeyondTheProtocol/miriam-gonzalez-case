<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-cream-card" style="border-top: 1px solid rgb(var(--color-text-rgb) / 0.08)">
    <!-- Chrome mínimo (/links, /gracias, /expertos; useChromeMinimo): la marca, el aviso, las redes y lo legal, en una sola
         columna centrada. Sin el muro de logos ni las columnas de navegación: son páginas de una sola acción. -->
    <div v-if="minimo" class="section-wide py-8 sm:py-10">
      <div class="flex flex-col items-center gap-3 text-center">
        <div class="flex items-center gap-2.5">
          <BrandMark class="w-8 h-8 shrink-0" />
          <span class="font-display font-semibold text-berenjena text-sm">
            {{ $t('site.title') }}
          </span>
        </div>
        <p class="text-xs text-tinta leading-relaxed max-w-md">
          {{ $t('footer.disclaimer') }}
        </p>
        <nav :aria-label="$t('nav.footer_label')" class="flex flex-col items-center">
          <ul :aria-label="$t('footer.social_heading')" class="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5">
            <li v-for="red in REDES" :key="red.id">
              <a
                :href="red.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center min-h-[44px] text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
                @click="trackShare(red.id, 'footer_minimo')"
              >
                {{ red.pie ?? red.nombre }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
              </a>
            </li>
          </ul>
          <ul :aria-label="$t('footer.legal_heading')" class="flex flex-wrap items-center justify-center gap-x-5">
            <li v-for="l in LEGAL" :key="l.name">
              <NuxtLink
                :to="localePath({ name: l.name })"
                class="inline-flex items-center min-h-[44px] text-xs font-mono text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
              >
                {{ $t(l.etiqueta) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <p class="text-xs font-mono text-tinta">
          {{ $t('footer.made_with') }}
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Con el apoyo de — muro de logos uniforme: todos en blanco monocromo, misma
           altura óptica, centrados. Cada logo se aplana a silueta crema
           (logo-wall__mark) para que GitHub/Notion/Tahe/Never Surrender/UCAM se lean
           como un solo conjunto sobre la banda berenjena, sin cajas ni colores dispares.
           Flex-wrap en vez de rejilla fija: con 5 logos (o los que vengan) la última
           fila queda centrada en vez de dejar un huérfano pegado a la izquierda.
           Rediseño de arquitectura (F3): sin el rótulo visible «Con el apoyo de»; el nombre de la
           sección lo conserva `aria-label`, así que el lector de pantalla lo sigue oyendo. -->
      <section class="bg-berenjena" :aria-label="$t('index.supported_by')">
        <div class="section-wide py-9 sm:py-10 text-center">
          <ul class="flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-12 gap-y-10 max-w-3xl mx-auto">
            <!-- shrink-0: sin él los <li> se encogen antes de que el flex-wrap salte
                 de línea, y en móvil los logos se desbordan de la banda. -->
            <li v-for="s in supporters" :key="s.name" class="flex shrink-0 items-center justify-center">
              <component
                :is="s.url ? 'a' : 'span'"
                v-bind="s.url ? { href: s.url, target: '_blank', rel: 'sponsored noopener' } : {}"
                class="logo-wall__item inline-flex items-center justify-center"
                :aria-label="s.url ? s.name : undefined"
              >
                <img
                  :src="s.img"
                  :alt="s.name"
                  class="logo-wall__mark w-auto"
                  :style="{ height: `${s.alto}px` }"
                  loading="lazy"
                  decoding="async"
                />
              </component>
            </li>
          </ul>
        </div>
      </section>
      <div class="section-wide py-12 sm:py-16">
        <!-- Marca y aviso, en una fila; debajo, cinco columnas (rediseño de arquitectura, F3): tres de
             navegación por intención (13 enlaces; salen de app/utils/navegacion.ts, la misma fuente que el
             menú), Redes y Legal. En móvil, dos columnas. Cada enlace mide 44 px de alto (vara táctil de la casa). -->
        <!-- Desde lg la fila es la misma rejilla de 5 columnas (y el mismo hueco) que el <nav> de abajo: la marca en la primera y el aviso en
             la segunda, que es donde empieza «Herramientas». Debajo de lg no cambia nada (pila en móvil, fila desde sm). -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-8 lg:grid lg:grid-cols-5 lg:gap-x-6">
          <div class="flex items-center gap-2.5 shrink-0">
            <BrandMark class="w-8 h-8 shrink-0" />
            <span class="font-display font-semibold text-berenjena text-sm">
              {{ $t('site.title') }}
            </span>
          </div>
          <p class="text-xs text-tinta leading-relaxed measure lg:col-start-2 lg:col-span-4">
            {{ $t('footer.disclaimer') }}
          </p>
        </div>

        <nav :aria-label="$t('nav.footer_label')" class="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-8">
          <div v-for="grupo in PIE" :key="grupo.id">
            <h3 :id="`pie-${grupo.id}`" class="eyebrow mb-1 block">
              {{ $t(grupo.heading) }}
            </h3>
            <ul :aria-labelledby="`pie-${grupo.id}`" class="flex flex-col">
              <li v-for="item in grupo.enlaces.filter(visible)" :key="item.key">
                <NuxtLink :to="localePath({ name: item.name })"
                  class="inline-flex items-center min-h-[44px] min-w-[44px] text-sm text-tinta hover:text-miriam transition-colors"
                  style="text-decoration: none"
                  @click="medirPie(item.key)">
                  {{ $t(item.etiqueta ?? `nav.${item.key}`) }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Redes (REDES) y, al final, la campaña -->
          <div>
            <h3 id="pie-redes" class="eyebrow mb-1 block">
              {{ $t('footer.social_heading') }}
            </h3>
            <ul aria-labelledby="pie-redes" class="flex flex-col items-start">
              <li v-for="red in REDES" :key="red.id">
                <a
                  :href="red.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center min-h-[44px] min-w-[44px] text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
                  @click="trackShare(red.id, 'footer')"
                >
                  {{ red.pie ?? red.nombre }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
                </a>
              </li>
              <li>
                <a href="https://gofund.me/3e25cae99" target="_blank" rel="noopener noreferrer"
                  @click="trackSupport('footer')"
                  class="inline-flex items-center min-h-[44px] gap-1 text-sm text-berenjena hover:text-miriam hover:underline underline-offset-2 font-semibold transition-colors">
                  GoFundMe<Icon name="ph:arrow-up-right-bold" class="w-3 h-3" aria-hidden="true" /><span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Legal (LEGAL) -->
          <div>
            <h3 id="pie-legal" class="eyebrow mb-1 block">
              {{ $t('footer.legal_heading') }}
            </h3>
            <ul aria-labelledby="pie-legal" class="flex flex-col">
              <li v-for="l in LEGAL" :key="l.name">
                <NuxtLink :to="localePath({ name: l.name })"
                  class="inline-flex items-center min-h-[44px] min-w-[44px] text-sm text-tinta hover:text-miriam transition-colors"
                  style="text-decoration: none">
                  {{ $t(l.etiqueta) }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Campaña oficial (23-oct-2026): el pie es lo único que cubre todas las
             páginas; en la home se calla porque ya va bajo la barra de la campaña. -->
        <CampanaOficial footer location="footer" />

        <p class="mt-10 text-xs font-mono text-tinta">
          {{ $t('footer.made_with') }}
        </p>
      </div>
    </template>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { trackSupport, trackShare, trackDatos, trackCelula, trackExplorador } = useSupport()
const { minimo } = useChromeMinimo()

// El pie ya no lleva la fecha global del build («Última actualización»): rediseño de arquitectura, F3. Cada página dice la
// suya donde tiene una fecha fiable (ActualizadoEl).

// "Con el apoyo de" — un muro homogéneo. Cada logo vive en public/img/apoyos/ como
// silueta BLANCA sobre transparente, recortada a su contorno (sin margen propio), así
// que no hace falta ningún filtro ni mezcla: todos se pintan igual sobre berenjena.
// Tamaño óptico por ÁREA, no por alto: un alto fijo hace gigantes a los anchos y
// diminutos a los cuadrados. alto = LADO / √proporción × (TINTA_REF / tinta)^0,2,
// donde proporción = ancho/alto del recorte y tinta = fracción opaca del recorte (un
// logo macizo pesa más a igual área). `prop` y `tinta` se midieron al generar el PNG.
// Para añadir uno: silueta blanca recortada en apoyos/, medir prop y tinta, y entra.
//
// Origen de cada silueta:
// - GitHub, Notion: los SVG oficiales que ya había; Notion pasa a su versión de trazo
//   (la tinta negra → blanca, la caja blanca → transparente), la de fondo oscuro.
// - Never Surrender: el JPEG con fondo blanco horneado, invertido a silueta.
// - UCAM: SVG oficial "horizontal / blanco / sin fondo" de su página de identidad
//   visual (ucam.edu/universidad/identidad), el enlace que pasó Marta Rodríguez
//   (marketing UCAM) autorizando el uso del logo.
// - Female Startup Leaders: el logo compacto «FSL››» de la cabecera de su web
//   (femalestartupleaders.com/wp-content/uploads/2026/10/FSL-logo.webp), su identidad
//   vigente; los cuadrados rojos de su biblioteca son la de 2020-22. El cartel cuadrado
//   que mandaron no se lee a este tamaño.
// Anthropic NO va aquí: las reglas de AI for Science (§7) prohíben usar su nombre o logo
// sin permiso; solo permiten decir con verdad que fue seleccionada en el programa.
const LADO = 36
const TINTA_REF = 0.4
const altoOptico = (prop: number, tinta: number) =>
  Math.round((LADO / Math.sqrt(prop)) * (TINTA_REF / Math.max(tinta, 0.15)) ** 0.2)
const supporters = [
  { name: 'GitHub', img: '/img/apoyos/github.png', prop: 1.031, tinta: 0.465 },
  { name: 'Notion', img: '/img/apoyos/notion.png', prop: 0.963, tinta: 0.502 },
  { name: 'Never Surrender', img: '/img/apoyos/never-surrender.png', prop: 1.719, tinta: 0.78 },
  { name: 'Tahe', img: '/img/apoyos/tahe.png', prop: 2.306, tinta: 0.252, url: 'https://tahecosmetics.com' },
  { name: 'UCAM', img: '/img/apoyos/ucam.png', prop: 2.656, tinta: 0.175, url: 'https://www.ucam.edu' },
  { name: 'Female Startup Leaders', img: '/img/apoyos/female-startup-leaders.png', prop: 2.816, tinta: 0.409, url: 'https://femalestartupleaders.com' },
].map(s => ({ ...s, alto: altoOptico(s.prop, s.tinta) }))

// Los enlaces del pie (tres grupos), las redes y lo legal viven en app/utils/navegacion.ts: `PIE`, `REDES`, `LEGAL`.
// El explorador de células solo sale con su puerta abierta (useHerramientas).
const { visible } = useHerramientas()
function medirPie(key: string) {
  if (key === 'data') trackDatos('footer')
  else if (key === 'cell_by_cell') trackCelula('pie')
  else if (key === 'cell_explorer') trackExplorador('pie')
}
</script>

<style scoped>
/* ── Muro "Con el apoyo de" ───────────────────────────────────────────────────
   Las siluetas ya son blancas y recortadas (public/img/apoyos/): aquí solo van la
   opacidad común y el hover. El alto de cada logo lo pone el script (área óptica).
   (SiteFooter es global: este tratamiento afecta a todo el sitio.) */
.logo-wall__mark {
  opacity: 0.85;
  transition: opacity 0.2s ease;
}
/* Objetivo táctil de 44 px en los logos que son enlace: la caja del enlace mide 44
   de alto (el logo, menos) con un margen negativo que la compensa, así el muro no
   se mueve ni el logo crece (diseno, tras el PR #269). */
a.logo-wall__item {
  min-width: 44px;
  min-height: 44px;
  margin-block: -0.5rem;
}
a.logo-wall__item:focus-visible .logo-wall__mark {
  opacity: 1;
}
@media (hover: hover) and (pointer: fine) {
  a.logo-wall__item:hover .logo-wall__mark {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-wall__mark {
    transition: none;
  }
}
</style>
