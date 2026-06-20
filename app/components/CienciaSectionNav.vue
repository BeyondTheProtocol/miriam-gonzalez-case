<template>
  <!-- Índice de secciones del dossier clínico (modo pro de /ciencia). Comité:
       rail pegajoso a la izquierda en lg+ (variant="rail"), desplegable
       «Saltar a…» en móvil (variant="mobile"); etiquetas clínicas en sans bajo
       un rótulo mono; activo en berenjena + punto violeta (NUNCA coral); foco
       gestionado al saltar y respeto por prefers-reduced-motion. -->
  <nav :aria-label="locale === 'es' ? 'Índice de secciones' : 'Section index'">
    <!-- Móvil: desplegable en el flujo (no pegajoso) -->
    <details v-if="variant === 'mobile'" class="cn-m">
      <summary class="cn-m__summary">
        <Icon name="ph:list-bold" class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ locale === 'es' ? 'Saltar a una sección' : 'Jump to a section' }}
        <Icon name="ph:caret-down" class="cn-m__caret w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      </summary>
      <ul class="cn-m__list">
        <li v-for="c in chapters" :key="c.id">
          <a :href="`#${c.id}`" @click="jumpTo($event, c.id)">{{ c.label }}</a>
        </li>
      </ul>
    </details>

    <!-- Desktop: lista; el contenedor padre aporta el sticky -->
    <div v-else class="cn-d">
      <p class="eyebrow cn-d__title">{{ locale === 'es' ? 'Índice' : 'Contents' }}</p>
      <ul>
        <li v-for="c in chapters" :key="c.id">
          <a
            :href="`#${c.id}`"
            class="cn-d__link"
            :class="{ 'is-active': activeId === c.id }"
            :aria-current="activeId === c.id ? 'location' : undefined"
            @click="jumpTo($event, c.id)"
          >
            <span class="cn-d__dot" aria-hidden="true" />
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

// 6 capítulos clínicos mapeados a ids de título ya existentes en la página
// (orden de lectura tras subir el panel sobre la historia clínica).
const chapters = computed(() =>
  locale.value === 'es'
    ? [
        { id: 'snapshot-title', label: 'Resumen clínico' },
        { id: 'tejido-3veces', label: 'Anatomía patológica' },
        { id: 'molecular-profile-title', label: 'Perfil molecular' },
        { id: 'imaging-tissue-title', label: 'Imagen funcional' },
        { id: 'mapa-metastasis-link', label: 'Mapa de metástasis' },
        { id: 'panel-title', label: 'El siguiente paso' },
        { id: 'treatment-title', label: 'Historia clínica' },
      ]
    : [
        { id: 'snapshot-title', label: 'Clinical summary' },
        { id: 'tejido-3veces', label: 'Pathology' },
        { id: 'molecular-profile-title', label: 'Molecular profile' },
        { id: 'imaging-tissue-title', label: 'Functional imaging' },
        { id: 'mapa-metastasis-link', label: 'Metastasis map' },
        { id: 'panel-title', label: 'The next step' },
        { id: 'treatment-title', label: 'Clinical history' },
      ]
)

const activeId = ref('')
let observer: IntersectionObserver | null = null
// Conjunto de secciones que tocan la banda activa en este momento. Es la FUENTE DE
// VERDAD del scroll-spy: el observer solo lo actualiza (entra/sale), y de ahí
// derivamos UN único activo por geometría. (Antes el callback hacía «el último que
// entra gana» recorriendo entries; como IntersectionObserver NO garantiza el orden
// del lote, dos secciones visibles a la vez podían alternar el resaltado → se veían
// dos activos parpadeando al hacer scroll.)
const visible = new Set<string>()

// De todas las secciones que tocan la banda, la activa es la que está MÁS ABAJO en
// el documento (la última que el lector ha alcanzado): comparamos posiciones reales,
// resultado determinista y siempre UNO. Orden estable = el de `chapters`.
function resolveActive() {
  let winner = ''
  let winnerTop = -Infinity
  for (const c of chapters.value) {
    if (!visible.has(c.id)) continue
    const el = document.getElementById(c.id)
    if (!el) continue
    const top = el.getBoundingClientRect().top
    if (top >= winnerTop) {
      winnerTop = top
      winner = c.id
    }
  }
  // Si nada toca la banda (entre dos secciones), conservamos el último activo: evita
  // que el rail se quede sin resaltar en los huecos.
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
        if (e.isIntersecting) visible.add(id)
        else visible.delete(id)
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
  // A11y: solo forzar tabindex en destinos NO focusables (un heading). Si el destino
  // ya es focusable (el <a> del CTA del mapa), preservar su tabulación nativa.
  if (!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.getAttribute('tabindex') === null) {
    el.setAttribute('tabindex', '-1')
  }
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
.cn-d__title {
  margin-bottom: 0.75rem;
}
.cn-d ul {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-left: 1px solid rgba(45, 27, 61, 0.12);
}
.cn-d__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: -1px;
  padding: 6px 0 6px 14px;
  border-left: 2px solid transparent;
  font-size: 13.5px;
  line-height: 1.3;
  color: rgba(45, 27, 61, 0.58);
  text-decoration: none;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.cn-d__dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.18s ease;
}
.cn-d__link:hover {
  color: #2d1b3d;
}
.cn-d__link.is-active {
  color: #2d1b3d;
  font-weight: 600;
  border-left-color: #9d44ab;
}
.cn-d__link.is-active .cn-d__dot {
  background: #9d44ab;
}
.cn-d__link:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Móvil */
.cn-m {
  border: 1px solid rgba(45, 27, 61, 0.12);
  border-radius: 12px;
  background: #f5efe6;
}
.cn-m__summary {
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
.cn-m__summary::-webkit-details-marker {
  display: none;
}
.cn-m__caret {
  margin-left: auto;
  transition: transform 0.2s ease;
}
.cn-m[open] .cn-m__caret {
  transform: rotate(180deg);
}
.cn-m__list {
  padding: 2px 14px 10px;
  display: flex;
  flex-direction: column;
}
.cn-m__list a {
  display: block;
  padding: 9px 0;
  font-size: 14px;
  color: #2d1b3d;
  text-decoration: none;
  border-top: 1px solid rgba(45, 27, 61, 0.07);
}
.cn-m__summary:focus-visible,
.cn-m__list a:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .cn-d__link,
  .cn-d__dot,
  .cn-m__caret {
    transition: none;
  }
}
</style>
