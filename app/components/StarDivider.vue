<template>
  <div ref="root" class="star-divider" :class="{ 'star-in': inView }" aria-hidden="true">
    <svg class="star-svg" viewBox="0 0 240 24" width="240" height="24" fill="#9d44ab">
      <!-- Mini-constelación de destellos de 4 puntas (mismo motivo que la marca y
           que el muro de donantes-estrellas). Centrada, con caída de tamaño hacia
           los lados. Decorativa: aria-hidden. -->
      <circle class="st st--d1" cx="50" cy="12" r="1.1" />
      <path class="st st--s2" d="M72 8.8 L73.02 10.98 L75.2 12 L73.02 13.02 L72 15.2 L70.98 13.02 L68.8 12 L70.98 10.98 Z" />
      <path class="st st--m1" d="M96 7 L97.6 10.4 L101 12 L97.6 13.6 L96 17 L94.4 13.6 L91 12 L94.4 10.4 Z" />
      <path class="st st--c" d="M120 3.5 L122.7 9.3 L128.5 12 L122.7 14.7 L120 20.5 L117.3 14.7 L111.5 12 L117.3 9.3 Z" />
      <path class="st st--m2" d="M144 7 L145.6 10.4 L149 12 L145.6 13.6 L144 17 L142.4 13.6 L139 12 L142.4 10.4 Z" />
      <path class="st st--s1" d="M168 8.8 L169.02 10.98 L171.2 12 L169.02 13.02 L168 15.2 L166.98 13.02 L164.8 12 L166.98 10.98 Z" />
      <circle class="st st--d2" cx="190" cy="12" r="1.1" />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * Separador "constelación" — variante del separador-latido (EcgDivider) para el
 * cierre del muro de donantes: una hilera de destellos de 4 puntas (el motivo de
 * la marca) que parpadea UNA vez al entrar en viewport, del centro hacia fuera.
 * Decorativo (aria-hidden); con reduced-motion se ve fijo. Alto fijo → sin CLS.
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
    { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.star-divider {
  display: flex;
  justify-content: center;
  padding: 14px 0; /* alto fijo, sin CLS */
}
.star-svg {
  display: block;
  opacity: 0.92;
}
/* estático / reduced-motion: constelación completa y quieta */
.st {
  opacity: 1;
}
.st--d1,
.st--d2 {
  opacity: 0.55;
}
@media (prefers-reduced-motion: no-preference) {
  /* Oculta antes de entrar; al entrar en viewport, cada destello parpadea en
     BUCLE con su propia duración y fase → constelación viva y orgánica, nunca
     al unísono. (Como el resto del sitio: aquí también hay movimiento continuo.) */
  .star-divider:not(.star-in) .st {
    opacity: 0;
  }
  .star-in .st {
    animation: star-tw var(--d, 3s) ease-in-out var(--o, 0s) infinite both;
  }
  .star-in .st--d1,
  .star-in .st--d2 {
    animation-name: star-tw-soft;
  }
  /* duración + desfase propios por destello; delays negativos para que arranquen
     a media intensidad (sin salto brusco desde 0). */
  .st--c {
    --d: 3.2s;
    --o: -0.2s;
  }
  .st--m1 {
    --d: 2.7s;
    --o: -1.1s;
  }
  .st--m2 {
    --d: 2.9s;
    --o: -1.9s;
  }
  .st--s1 {
    --d: 2.4s;
    --o: -0.6s;
  }
  .st--s2 {
    --d: 2.6s;
    --o: -1.5s;
  }
  .st--d1 {
    --d: 3.4s;
    --o: -2.2s;
  }
  .st--d2 {
    --d: 3.1s;
    --o: -0.9s;
  }
  @keyframes star-tw {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
  @keyframes star-tw-soft {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 0.15;
    }
  }
}
</style>
