<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div v-if="visible" class="mobile-support-bar lg:hidden">
      <a
        :href="GOFUNDME_URL"
        target="_blank"
        rel="noopener noreferrer"
        @click="trackSupport('barra_movil')"
        class="btn-cta w-full justify-center"
        style="text-decoration: none"
      >
        <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
        {{ $t('nav.donate') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
      </a>
      <NuxtLink
        :to="localePath('colabora')"
        class="mobile-support-bar__more"
      >
        {{ $t('a11y.more_ways') }}
        <Icon name="ph:arrow-right" class="w-3 h-3" aria-hidden="true" />
      </NuxtLink>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Barra de apoyo persistente en móvil (plan Decisión 5, default B).
 * La cabecera oculta el botón de donar por debajo de `sm`; con ~80% del
 * tráfico en móvil hace falta un CTA siempre a mano, donde vive el pulgar.
 * · Solo en móvil y tablet estrecha (`lg:hidden`; desktop ≥1024px sin barra).
 * · Aparece tras pasar el hero.
 * · Se oculta cerca del footer/cierre (para no duplicar el CTA) y en /gracias.
 * · Se silencia en lecturas técnicas profundas de Ciencia (ver isDeepScience):
 *   ahí el público lee y entiende; un sticky coral que persigue por encima de
 *   tablas de patología resta credibilidad y carga la atención (a11y/neuroD).
 *   El header coral global sigue cubriendo la conversión (review de Adri,
 *   marketing prevalece). El índice /ciencia NO se silencia: tiene sus propios
 *   cierres de apoyo y muchos llegan en modo simple, no son médicos.
 * · Respeta safe-area-inset-bottom y prefers-reduced-motion.
 */
const { y } = useWindowScroll()
const route = useRoute()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport } = useSupport()

const visible = ref(false)

// ¿Es una SUB-página de Ciencia (lectura técnica de inmersión)? Captura
// /ciencia/evidencia y /ciencia/[slug] en ES, y /science/evidence + /science/[slug]
// en EN (prefijo /en). El índice (/ciencia · /en/science) queda FUERA a propósito:
// solo se silencia donde hay un segmento DESPUÉS de la sección. Por path (robusto
// entre locales, como ya se hace con /gracias y /marcas en el resto del sitio).
const isDeepScience = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  return /^\/(?:en\/)?(?:ciencia|science)\/.+/.test(path)
})

// El mapa de metástasis es una herramienta clínica de INMERSIÓN (esqueleto navegador,
// línea de tiempo, ficha lesión a lesión, visor 3D). El mismo criterio que las lecturas
// técnicas de Ciencia: un sticky coral persiguiendo por encima de la herramienta resta
// credibilidad y tapa contenido en pantallas pequeñas. El header coral global ya cubre
// la conversión. Por path, robusto entre locales (/mapa-metastasis y /en/mapa-metastasis).
const isDeepTool = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  return /^\/(?:en\/)?mapa-metastasis$/.test(path)
})

// ¿Hay un botón coral de apoyo (data-support-cta) dentro del viewport? Si lo hay,
// ocultamos la barra para no mostrar dos CTA coral idénticos a la vez.
function anyCtaVisible(): boolean {
  if (typeof document === 'undefined') return false
  const els = document.querySelectorAll<HTMLElement>('[data-support-cta]')
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.bottom > 0 && r.top < window.innerHeight) return true
  }
  return false
}

const DESKTOP_MIN = 1024

function update() {
  if (typeof window === 'undefined') return
  if (window.innerWidth >= DESKTOP_MIN) {
    visible.value = false
    return
  }
  if (route.path.includes('gracias')) {
    visible.value = false
    return
  }
  // Lectura técnica profunda de Ciencia: barra silenciada (el header cubre).
  if (isDeepScience.value) {
    visible.value = false
    return
  }
  // Herramienta clínica de inmersión (mapa de metástasis): barra silenciada.
  if (isDeepTool.value) {
    visible.value = false
    return
  }
  const pastHero = y.value > 480
  const docH = document.documentElement.scrollHeight
  const nearBottom = y.value + window.innerHeight >= docH - 240
  visible.value = pastHero && !nearBottom && !anyCtaVisible()
}

watch(y, update)
watch(() => route.path, () => nextTick(update))
onMounted(() => {
  update()
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', update)
})
</script>

<style scoped>
@media (min-width: 1024px) {
  .mobile-support-bar {
    display: none !important;
  }
}

.mobile-support-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #2d1b3d; /* berenjena */
  padding: 10px 16px 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(250, 246, 240, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.mobile-support-bar__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(250, 246, 240, 0.72);
  text-decoration: none;
  padding-bottom: 2px;
}
.mobile-support-bar__more:hover {
  color: #faf6f0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
