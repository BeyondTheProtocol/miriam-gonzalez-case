<template>
  <div ref="root" class="ecg-divider" :class="{ 'ecg-in': inView }" aria-hidden="true">
    <svg class="ecg-svg" viewBox="0 0 240 24" width="240" height="24" fill="none">
      <path
        class="ecg-path"
        d="M0 12 H88 l5 -8 l5 16 l5 -8 H240"
        stroke="var(--color-cta)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * Separador "latido" — firma del sitio (plan detalles con alma · A1).
 * Una línea de ECG con un blip coral que se traza una vez al entrar en
 * viewport. Decorativo (aria-hidden); con reduced-motion se ve completa,
 * sin trazado. Alto fijo → sin CLS. ~1 KB.
 */
const root = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    inView.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          inView.value = true
          io?.disconnect()
          break
        }
      }
    },
    { threshold: 0.6 }
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.ecg-divider {
  display: flex;
  justify-content: center;
  padding: 6px 0; /* alto fijo, sin CLS */
}
.ecg-svg {
  display: block;
  opacity: 0.7;
}
.ecg-path {
  --len: 280;
  stroke-dasharray: 280;
  stroke-dashoffset: 0; /* estático / reduced-motion: línea completa */
}
@media (prefers-reduced-motion: no-preference) {
  /* Oculta antes de entrar; se traza al intersectar. */
  .ecg-divider:not(.ecg-in) .ecg-path {
    stroke-dashoffset: var(--len);
  }
  .ecg-in .ecg-path {
    animation: draw-in 0.9s ease forwards;
  }
}
</style>
