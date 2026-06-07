<template>
  <div ref="root" class="dna-divider" :class="{ 'dna-in': inView }" aria-hidden="true">
    <svg class="dna-svg" viewBox="0 0 240 24" width="240" height="24" fill="none">
      <!-- Peldaños (pares de bases) en los puntos de máxima separación -->
      <path
        class="dna-rungs"
        d="M30 8 V16 M60 8 V16 M90 8 V16 M120 8 V16 M150 8 V16 M180 8 V16 M210 8 V16"
        stroke="#2d1b3d"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <!-- Hebra A (magenta, luminal) y hebra B (coral): las dos caras, trenzadas -->
      <path
        class="dna-strand"
        d="M0 5 C13 5, 17 19, 30 19 S 47 5, 60 5 S 77 19, 90 19 S 107 5, 120 5 S 137 19, 150 19 S 167 5, 180 5 S 197 19, 210 19 S 227 5, 240 5"
        stroke="#9d44ab"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        class="dna-strand dna-strand--b"
        d="M0 19 C13 19, 17 5, 30 5 S 47 19, 60 19 S 77 5, 90 5 S 107 19, 120 19 S 137 5, 150 5 S 167 19, 180 19 S 197 5, 210 5 S 227 19, 240 19"
        stroke="#ff6b47"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * Separador "doble hélice" — hermano del latido (EcgDivider) para el lenguaje
 * científico del sitio: estrellas (gratitud), ECG (vida), ADN (la ciencia).
 * Dos hebras —magenta y coral, las dos caras del tumor— se trazan al entrar
 * en viewport y los peldaños aparecen después. Decorativo (aria-hidden);
 * con reduced-motion se ve completo. Alto fijo → sin CLS.
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
.dna-divider {
  display: flex;
  justify-content: center;
  padding: 6px 0; /* alto fijo, sin CLS */
}
.dna-svg {
  display: block;
  opacity: 0.7;
}
.dna-strand {
  --len: 300;
  stroke-dasharray: 300;
  stroke-dashoffset: 0; /* estático / reduced-motion: hélice completa */
}
.dna-rungs {
  opacity: 0.25;
}
@media (prefers-reduced-motion: no-preference) {
  .dna-divider:not(.dna-in) .dna-strand {
    stroke-dashoffset: var(--len);
  }
  .dna-divider:not(.dna-in) .dna-rungs {
    opacity: 0;
  }
  .dna-in .dna-strand {
    animation: draw-in 0.9s ease forwards;
  }
  .dna-in .dna-strand--b {
    animation-delay: 0.18s;
    animation-fill-mode: backwards;
  }
  .dna-in .dna-rungs {
    animation: dna-rungs-in 0.5s ease 0.8s forwards;
  }
  @keyframes dna-rungs-in {
    to {
      opacity: 0.25;
    }
  }
}
</style>
