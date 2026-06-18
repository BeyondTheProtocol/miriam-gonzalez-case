<template>
  <!-- Índice de secciones del panel /mapa-metastasis (mismo patrón que
       CienciaSectionNav). Rail pegajoso en lg+ (variant="rail") con scroll-spy
       por IntersectionObserver; desplegable «Saltar a…» en móvil
       (variant="mobile"); activo en berenjena + punto violeta (NUNCA coral);
       foco gestionado al saltar y respeto por prefers-reduced-motion. Las 8
       secciones apuntan a los id de los <h2> ya presentes en la página. -->
  <nav :aria-label="locale === 'es' ? 'Índice de secciones' : 'Section index'">
    <!-- Barra horizontal SUPERIOR (variant="bar"): el índice ya no ocupa rail
         lateral. En ≥md es una tira de chips con scroll horizontal y scroll-spy
         (el activo resalta); en <md colapsa a un desplegable «Saltar a sección».
         Así el contenido usa toda la pantalla. Conserva foco a11y + anclas. -->
    <template v-if="variant === 'bar'">
      <!-- ≥md: tira de chips horizontal -->
      <div class="mn-b">
        <span class="mn-b__label">{{ locale === 'es' ? 'Saltar a' : 'Jump to' }}</span>
        <ul class="mn-b__list">
          <li v-for="c in chapters" :key="c.id">
            <a
              :href="`#${c.id}`"
              class="mn-b__chip"
              :class="{ 'is-active': activeId === c.id }"
              :aria-current="activeId === c.id ? 'location' : undefined"
              @click="jumpTo($event, c.id)"
            >{{ c.label }}</a>
          </li>
        </ul>
      </div>
      <!-- <md: desplegable compacto «Saltar a sección ▾» -->
      <details class="mn-m mn-b__details">
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
    </template>

    <!-- Móvil: desplegable en el flujo (no pegajoso) -->
    <details v-else-if="variant === 'mobile'" class="mn-m">
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
const props = withDefaults(defineProps<{ variant?: 'rail' | 'mobile' | 'bar' }>(), {
  variant: 'rail',
})
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)

// Secciones del mapa, mapeadas a los id de <h2> ya existentes en la página
// (nuevo orden de lectura: lo PRIMARIO arriba —navegar focos ↔ ver en 3D— y el
// contexto/detalle/apéndices debajo). Etiquetas bilingües, neutras.
const chapters = computed(() => [
  { id: 'mapa', label: L('El mapa · navega y ve en 3D', 'The map · navigate and see in 3D') },
  { id: 'detalle-foco', label: L('Detalle del foco', 'Focus detail') },
  { id: 'cockpit', label: L('Enfermedad ósea de un vistazo', 'Bone disease at a glance') },
  { id: 'fenotipo', label: L('Mapa de fenotipo', 'Phenotype map') },
  { id: 'imagen', label: L('Lo que muestra la RMN', 'What the MRI shows') },
  { id: 'trayectoria', label: L('Trayectoria del FDG', 'FDG trajectory') },
  { id: 'idoneidad', label: L('Idoneidad como diana', 'Suitability as a target') },
  { id: 'tabla', label: L('Apéndice: tabla de focos', 'Appendix: foci table') },
])

const activeId = ref('')
let observer: IntersectionObserver | null = null

onMounted(() => {
  // El scroll-spy resalta el activo en el rail de escritorio y en la barra
  // superior de chips (no en el desplegable móvil simple).
  if (props.variant !== 'rail' && props.variant !== 'bar') return
  const els = chapters.value
    .map((c) => document.getElementById(c.id))
    .filter((el): el is HTMLElement => !!el)
  if (!els.length) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activeId.value = (e.target as HTMLElement).id
      }
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
  color: rgba(45, 27, 61, 0.58);
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
  outline: 2px solid #ff6b47;
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
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
/* Barra horizontal superior (variant="bar") */
.mn-b {
  display: none; /* <md: usa el desplegable */
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0;
  background: rgba(247, 242, 234, 0.92);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(45, 27, 61, 0.1);
}
.mn-b__details {
  /* el desplegable de la barra hereda el estilo .mn-m; añade el fondo pegajoso */
  background: rgba(247, 242, 234, 0.96);
  backdrop-filter: blur(6px);
}
.mn-b__label {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #6b6470;
}
.mn-b__list {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 1px;
}
.mn-b__chip {
  display: inline-block;
  white-space: nowrap;
  padding: 4px 11px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  background: #fbf7f0;
  font-size: 12.5px;
  line-height: 1.2;
  color: rgba(45, 27, 61, 0.62);
  text-decoration: none;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.mn-b__chip:hover {
  color: #2d1b3d;
  border-color: rgba(45, 27, 61, 0.32);
}
.mn-b__chip.is-active {
  color: #fdf6ef;
  background: #2d1b3d;
  border-color: #2d1b3d;
  font-weight: 600;
}
.mn-b__chip:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
@media (min-width: 768px) {
  .mn-b { display: flex; }
  .mn-b__details { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .mn-d__link,
  .mn-d__dot,
  .mn-m__caret,
  .mn-b__chip {
    transition: none;
  }
}
</style>
