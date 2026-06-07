<template>
  <div ref="root" class="sparkline" :class="{ 'spark-in': inView }" aria-hidden="true">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" fill="none" class="sparkline__svg">
      <polyline
        class="sparkline__line"
        :points="linePoints"
        stroke="#ff6b47"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(p, i) in coords"
        :key="i"
        :cx="p.x"
        :cy="p.y"
        :r="i === coords.length - 1 ? 3.6 : 2.6"
        fill="#ff6b47"
        :class="i === coords.length - 1 ? 'heart-beat sparkline__last' : ''"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * Sparkline (detalles con alma · B2). Dibuja una serie numérica como polyline
 * coral que se traza al entrar en viewport; el último punto late (heart-beat).
 * Decorativo (aria-hidden): los valores reales siguen como texto/tabla al lado.
 * Estático con reduced-motion (línea completa, sin latido).
 */
const props = defineProps<{ points: number[] }>()

const W = 88
const H = 30
const PAD = 5

const coords = computed(() => {
  const pts = props.points
  if (pts.length < 2) return []
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const stepX = (W - PAD * 2) / (pts.length - 1)
  return pts.map((v, i) => ({
    x: PAD + i * stepX,
    // valor alto → arriba (y pequeña); invertimos.
    y: H - PAD - ((v - min) / span) * (H - PAD * 2),
  }))
})

const linePoints = computed(() => coords.value.map((p) => `${p.x},${p.y}`).join(' '))

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
.sparkline {
  display: inline-block;
  line-height: 0;
}
.sparkline__svg {
  display: block;
}
.sparkline__line {
  --len: 120;
  stroke-dasharray: 120;
  stroke-dashoffset: 0; /* estático / reduced-motion: línea completa */
}
.heart-beat {
  transform-origin: center;
  transform-box: fill-box;
}
@media (prefers-reduced-motion: no-preference) {
  .sparkline:not(.spark-in) .sparkline__line {
    stroke-dashoffset: var(--len);
  }
  .spark-in .sparkline__line {
    animation: draw-in 1s ease forwards;
  }
  /* el punto final late solo cuando ya se trazó la línea */
  .spark-in .sparkline__last {
    animation: heart-beat-soft 2.4s ease-in-out 1s infinite;
  }
}
</style>
