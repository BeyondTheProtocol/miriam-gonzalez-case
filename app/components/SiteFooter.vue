<template>
  <footer :aria-label="$t('footer.site_footer')" class="bg-cream-card" style="border-top: 1px solid rgb(var(--color-text-rgb) / 0.08)">
    <!-- Chrome mínimo (/links, /gracias; useChromeMinimo): la marca, el aviso, las redes y lo legal, en una sola
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
                {{ red.pie ?? red.nombre }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
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
        <p class="text-[11px] font-mono text-tinta">
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
        <!-- Marca y aviso, en una fila; debajo, cinco columnas (rediseño de arquitectura, F3): tres de
             navegación por intención (13 enlaces; salen de app/utils/navegacion.ts, la misma fuente que el
             menú), Redes y Legal. En móvil, dos columnas. Cada enlace mide 44 px de alto (vara táctil de la casa). -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-8">
          <div class="flex items-center gap-2.5 shrink-0">
            <BrandMark class="w-8 h-8 shrink-0" />
            <span class="font-display font-semibold text-berenjena text-sm">
              {{ $t('site.title') }}
            </span>
          </div>
          <p class="text-xs text-tinta leading-relaxed max-w-xl">
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
                  class="inline-flex items-center min-h-[44px] text-sm text-tinta hover:text-miriam transition-colors"
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
                  class="inline-flex items-center min-h-[44px] text-sm text-tinta hover:text-miriam hover:underline underline-offset-2 transition-colors"
                  @click="trackShare(red.id, 'footer')"
                >
                  {{ red.pie ?? red.nombre }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
                </a>
              </li>
              <li>
                <a href="https://gofund.me/3e25cae99" target="_blank" rel="noopener noreferrer"
                  @click="trackSupport('footer')"
                  class="inline-flex items-center min-h-[44px] gap-1 text-sm text-coral-deep hover:text-coral-hover hover:underline underline-offset-2 font-semibold transition-colors">
                  GoFundMe<Icon name="ph:arrow-up-right-bold" class="w-3 h-3" aria-hidden="true" /><span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
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
                  class="inline-flex items-center min-h-[44px] text-sm text-tinta hover:text-miriam transition-colors"
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

        <p class="mt-10 text-[11px] font-mono text-tinta">
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
  // UCAM: SVG oficial "horizontal / blanco / sin fondo" de su página de identidad
  // visual (ucam.edu/universidad/identidad), el enlace que pasó Marta Rodríguez
  // (marketing UCAM) autorizando el uso del logo. Blanco puro → entra directo en
  // el tratamiento --vector, sin caja que quitar.
  { name: 'UCAM', img: '/svg/ucam.svg', url: 'https://www.ucam.edu' },
]

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
/* Objetivo táctil de 44 px en los logos que son enlace (Tahe, UCAM): el logo mide
   30 px de alto; el padding agranda la zona pulsable y el margen negativo lo
   compensa, así el muro no se mueve ni el logo crece (diseno, tras el PR #269). */
a.logo-wall__item {
  min-width: 44px;
  padding-block: 0.45rem;
  margin-block: -0.45rem;
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
