<template>
  <!-- Índice de secciones del panel /mapa-metastasis (mismo patrón que
       CienciaSectionNav). Rail pegajoso en lg+ (variant="rail") con scroll-spy
       por IntersectionObserver; desplegable «Saltar a…» en móvil
       (variant="mobile"); activo en berenjena + punto violeta (NUNCA coral);
       foco gestionado al saltar y respeto por prefers-reduced-motion. Las
       secciones apuntan a los id de los <h2> ya presentes en la página. -->
  <nav :aria-label="locale === 'es' ? 'Índice de secciones' : 'Section index'">
    <!-- Móvil: desplegable en el flujo (no pegajoso) -->
    <details v-if="variant === 'mobile'" class="mn-m">
      <summary class="mn-m__summary">
        <Icon name="ph:list-bold" class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ locale === 'es' ? 'Saltar a una sección' : 'Jump to a section' }}
        <Icon name="ph:caret-down" class="mn-m__caret w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      </summary>
      <ul class="mn-m__list">
        <li v-for="c in chapters" :key="c.id">
          <a :href="`#${c.id}`" @click="jumpTo($event, c.id)">{{ c.label }}</a>
        </li>
      </ul>
    </details>

    <!-- Desktop: lista; el contenedor padre aporta el sticky -->
    <div v-else class="mn-d">
      <p class="eyebrow mn-d__title">{{ locale === 'es' ? 'Índice' : 'Contents' }}</p>
      <ul>
        <li v-for="c in chapters" :key="c.id">
          <a
            :href="`#${c.id}`"
            class="mn-d__link"
            :class="{ 'is-active': activeId === c.id }"
            :aria-current="activeId === c.id ? 'location' : undefined"
            @click="jumpTo($event, c.id)"
          >
            <span class="mn-d__dot" aria-hidden="true" />
            {{ c.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ variant?: 'rail' | 'mobile' }>(), {
  variant: 'rail',
})
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)

// ÍNDICE COMPLETO DE LA PÁGINA, mapeado a los id de <h2> ya existentes. Empieza por
// la HERRAMIENTA (Zona 1: «Dianas idóneas» + el mapa/3D) para poder VOLVER a la
// decisión desde cualquier punto (wayfinding), y sigue con la sección general
// (Zona 2), ordenada de MÁS a MENOS importante para decidir. Las etiquetas casan
// con el <h2> de destino (confirmación de «dónde estoy» tras saltar). Bilingüe, neutra.
// El índice cubre SOLO la sección general (Zona 2 · de la visión general en adelante);
// la herramienta (dianas + mapa) va sin menú. Sin entrada de «volver al mapa» (petición).
const chapters = computed(() => [
  { id: 'idoneidad', label: L('Idoneidad como diana', 'Suitability as a target') },
  { id: 'fenotipo', label: L('Mapa de fenotipo', 'Phenotype map') },
  { id: 'imagen', label: L('La imagen real', 'The real imaging') },
  { id: 'imagenes-clave', label: L('Imágenes clave por foco', 'Key images per focus') },
  { id: 'trayectoria', label: L('Trayectoria', 'Trajectory') },
  { id: 'tabla', label: L('Apéndice (tabla)', 'Appendix (table)') },
  { id: 'cockpit', label: L('Cómo se lee · desglose', 'How to read it · breakdown') },
])

const activeId = ref('')
let observer: IntersectionObserver | null = null
// Conjunto de secciones que tocan la banda activa AHORA MISMO. Es la fuente de
// verdad del scroll-spy: el observer solo lo actualiza (entra/sale) y de ahí
// derivamos UN único activo por geometría.
//
// Antes, el callback hacía «el último que entra gana» (recorría `entries` y se
// quedaba con la última intersección). Como IntersectionObserver NO garantiza el
// orden del lote, con dos secciones visibles a la vez el resaltado podía caer en
// cualquiera y alternar al hacer scroll → se veían DOS activos parpadeando.
const visibleIds = new Set<string>()

// De las secciones que tocan la banda, la activa es la que está MÁS ABAJO en el
// documento (la última que el lector ha alcanzado): comparamos posiciones reales
// → resultado determinista y SIEMPRE uno solo, sea cual sea el orden del lote.
function resolveActive() {
  let winner = ''
  let winnerTop = -Infinity
  for (const c of chapters.value) {
    if (!visibleIds.has(c.id)) continue
    const el = document.getElementById(c.id)
    if (!el) continue
    const top = el.getBoundingClientRect().top
    if (top >= winnerTop) {
      winnerTop = top
      winner = c.id
    }
  }
  // En los huecos entre secciones (nada toca la banda) conservamos el último
  // activo: el rail nunca se queda sin resaltar.
  if (winner) activeId.value = winner
}

onMounted(() => {
  // El scroll-spy solo lo necesita el rail de escritorio (resalta el activo).
  if (props.variant !== 'rail') return
  const els = chapters.value
    .map((c) => document.getElementById(c.id))
    .filter((el): el is HTMLElement => !!el)
  if (!els.length) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).id
        if (e.isIntersecting) visibleIds.add(id)
        else visibleIds.delete(id)
      }
      resolveActive()
    },
    { rootMargin: '-80px 0px -72% 0px', threshold: 0 }
  )
  els.forEach((el) => observer!.observe(el))
})

onBeforeUnmount(() => observer?.disconnect())

function jumpTo(e: Event, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  // A11y: el foco va al título destino; respeta prefers-reduced-motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  activeId.value = id
  // cerrar el desplegable móvil tras saltar
  const details = (e.currentTarget as HTMLElement).closest('details')
  if (details) (details as HTMLDetailsElement).open = false
}
</script>

<style scoped>
/* Desktop */
.mn-d__title {
  margin-bottom: 0.75rem;
}
.mn-d ul {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-left: 1px solid rgba(45, 27, 61, 0.12);
}
.mn-d__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: -1px;
  padding: 6px 0 6px 14px;
  border-left: 2px solid transparent;
  font-size: 13.5px;
  line-height: 1.3;
  color: rgba(45, 27, 61, 0.72);
  text-decoration: none;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.mn-d__dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.18s ease;
}
.mn-d__link:hover {
  color: #2d1b3d;
}
.mn-d__link.is-active {
  color: #2d1b3d;
  font-weight: 600;
  border-left-color: #9d44ab;
}
.mn-d__link.is-active .mn-d__dot {
  background: #9d44ab;
}
.mn-d__link:focus-visible {
  outline: 2px solid #9d44ab;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Móvil */
.mn-m {
  border: 1px solid rgba(45, 27, 61, 0.12);
  border-radius: 12px;
  background: #f5efe6;
}
.mn-m__summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2d1b3d;
  cursor: pointer;
  list-style: none;
}
.mn-m__summary::-webkit-details-marker {
  display: none;
}
.mn-m__caret {
  margin-left: auto;
  transition: transform 0.2s ease;
}
.mn-m[open] .mn-m__caret {
  transform: rotate(180deg);
}
.mn-m__list {
  padding: 2px 14px 10px;
  display: flex;
  flex-direction: column;
}
.mn-m__list a {
  display: block;
  padding: 9px 0;
  font-size: 14px;
  color: #2d1b3d;
  text-decoration: none;
  border-top: 1px solid rgba(45, 27, 61, 0.07);
}
.mn-m__summary:focus-visible,
.mn-m__list a:focus-visible {
  outline: 2px solid #9d44ab;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .mn-d__link,
  .mn-d__dot,
  .mn-m__caret {
    transition: none;
  }
}
</style>
