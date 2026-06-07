<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div v-if="visible" class="mobile-support-bar sm:hidden">
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
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Barra de apoyo persistente en móvil (plan Decisión 5, default B).
 * La cabecera oculta el botón de donar por debajo de `sm`; con ~80% del
 * tráfico en móvil hace falta un CTA siempre a mano, donde vive el pulgar.
 * · Solo en móvil (`sm:hidden`).
 * · Aparece tras pasar el hero.
 * · Se oculta cerca del footer/cierre (para no duplicar el CTA) y en /gracias.
 * · Respeta safe-area-inset-bottom y prefers-reduced-motion.
 */
const { y } = useWindowScroll()
const route = useRoute()
const { GOFUNDME_URL, trackSupport } = useSupport()

const visible = ref(false)

function update() {
  if (typeof window === 'undefined') return
  if (route.path.includes('gracias')) {
    visible.value = false
    return
  }
  const pastHero = y.value > 480
  const docH = document.documentElement.scrollHeight
  const nearBottom = y.value + window.innerHeight >= docH - 240
  visible.value = pastHero && !nearBottom
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
.mobile-support-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #2d1b3d; /* berenjena */
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(250, 246, 240, 0.12);
}
</style>
