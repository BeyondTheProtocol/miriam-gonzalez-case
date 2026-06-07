<template>
  <ClientOnly>
    <div class="constellation" aria-hidden="true">
      <svg class="constellation__svg" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid slice">
        <circle
          v-for="(s, i) in stars"
          :key="i"
          :cx="s.x"
          :cy="s.y"
          :r="s.r"
          :fill="s.new ? '#ff6b47' : '#9d44ab'"
          :class="s.new ? 'constellation__new' : ''"
          :style="s.new ? null : { opacity: s.o }"
        />
      </svg>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Constelación de quienes apoyan (/gracias · detalles con alma · B1).
 * Cielo de estrellas sutil (violeta) y una estrella NUEVA coral que se enciende
 * una vez al aterrizar tras donar — enlaza con la constelación del logo.
 * Decorativo (aria-hidden) y ClientOnly: el mensaje de gracias sigue en
 * texto/SSR. Con reduced-motion la estrella nueva ya aparece encendida.
 * Posiciones deterministas (PRNG con semilla fija) → sin saltos.
 */
const props = withDefaults(defineProps<{ count?: number }>(), { count: 60 })

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const stars = computed(() => {
  // Densidad ligada a donantes, con tope para no penalizar el render.
  const n = Math.max(18, Math.min(props.count, 110))
  const rnd = mulberry32(20240127)
  const out: { x: number; y: number; r: number; o: number; new: boolean }[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      x: Math.round(rnd() * 600),
      y: Math.round(rnd() * 320),
      r: +(0.5 + rnd() * 1.4).toFixed(1),
      o: +(0.12 + rnd() * 0.4).toFixed(2),
      new: false,
    })
  }
  out.push({ x: 300, y: 96, r: 3.2, o: 1, new: true })
  return out
})
</script>

<style scoped>
.constellation {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.constellation__svg {
  width: 100%;
  height: 100%;
  display: block;
}
.constellation__new {
  opacity: 1;
}
@keyframes star-ignite {
  0% { opacity: 0; }
  60% { opacity: 1; }
  100% { opacity: 0.9; }
}
@media (prefers-reduced-motion: no-preference) {
  .constellation__new {
    opacity: 0;
    animation: star-ignite 1.6s ease-out 0.4s forwards;
  }
}
</style>
