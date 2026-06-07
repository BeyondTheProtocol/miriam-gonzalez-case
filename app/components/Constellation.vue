<template>
  <ClientOnly>
    <div class="constellation" aria-hidden="true">
      <svg
        v-for="(s, i) in stars"
        :key="i"
        class="constellation__star"
        :class="{ constellation__new: s.new }"
        :style="{
          left: s.x + '%',
          top: s.y + '%',
          width: s.size + 'px',
          height: s.size + 'px',
          opacity: s.new ? undefined : s.o,
        }"
        viewBox="0 0 20 20"
      >
        <path
          :fill="s.new ? '#ff6b47' : '#9d44ab'"
          d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z"
        />
      </svg>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Constelación de quienes apoyan — la estrella de 4 puntas del logo, en
 * TAMAÑO FIJO en píxeles (5–11px): no escala con la sección, así nunca se
 * hace grande aunque la página sea larga. Posiciones deterministas (PRNG),
 * tope de estrellas, decorativa (aria-hidden) y ClientOnly.
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
  const n = Math.max(18, Math.min(Math.round(props.count / 12), 70))
  const rnd = mulberry32(20240127)
  const out: { x: number; y: number; size: number; o: number; new: boolean }[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      x: +(rnd() * 100).toFixed(2),
      y: +(rnd() * 100).toFixed(2),
      size: +(5 + rnd() * 6).toFixed(1),
      o: +(0.16 + rnd() * 0.34).toFixed(2),
      new: false,
    })
  }
  // La estrella nueva (coral): la de quien acaba de llegar.
  out.push({ x: 50, y: 26, size: 14, o: 1, new: true })
  return out
})
</script>

<style scoped>
.constellation {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.constellation__star {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%);
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
