<template>
  <ClientOnly>
    <div class="constellation" aria-hidden="true">
      <!-- Carta celeste: trazos finos entre estrellas vecinas. Las constelaciones
           nunca fueron los astros — son las líneas que dibujamos para navegar. -->
      <svg class="constellation__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          v-for="(l, i) in lines"
          :key="i"
          :x1="l.x1"
          :y1="l.y1"
          :x2="l.x2"
          :y2="l.y2"
          stroke="#9d44ab"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
      </svg>
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
          '--o': String(s.o),
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
 * Constelación de quienes apoyan — metáfora con la ciencia de verdad dentro:
 *  · Estrella de 4 puntas = picos de difracción (así se ven los astros en
 *    las fotos de telescopio; el logo ya lo era).
 *  · MAGNITUD: si llegan importes, el tamaño sigue una escala logarítmica
 *    (como la magnitud de Pogson): una aportación 100× mayor brilla solo
 *    unos pasos más — todas cuentan, ninguna eclipsa a las demás.
 *  · LÍNEAS: cada estrella se une a su vecina más cercana, como en una
 *    carta celeste: la constelación es el mapa, no los puntos.
 * Tamaños FIJOS en píxeles (no escalan con la sección), posiciones
 * deterministas (PRNG con semilla), tope de estrellas, decorativa
 * (aria-hidden) y ClientOnly. En móvil sube la opacidad (media query).
 */
const props = withDefaults(defineProps<{ count?: number; amounts?: number[] }>(), {
  count: 60,
})

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

interface Star {
  x: number
  y: number
  size: number
  o: number
  new: boolean
}

const sky = computed(() => {
  const n = Math.max(18, Math.min(Math.round(props.count / 12), 70))
  const rnd = mulberry32(20240127)
  const amts = (props.amounts ?? []).filter((a) => a > 0)
  const median = amts.length ? [...amts].sort((a, b) => a - b)[Math.floor(amts.length / 2)]! : 0

  const stars: Star[] = []
  for (let i = 0; i < n; i++) {
    const x = +(rnd() * 100).toFixed(2)
    const y = +(rnd() * 100).toFixed(2)
    const o = +(0.16 + rnd() * 0.34).toFixed(2)
    let size = +(5 + rnd() * 6).toFixed(1)
    if (median > 0) {
      // Magnitud (log): 6px en la mediana, ±2.2px por década de importe.
      const a = amts[Math.floor(rnd() * amts.length)]!
      size = +Math.min(12, Math.max(4.5, 6 + 2.2 * Math.log10(a / median))).toFixed(1)
    }
    stars.push({ x, y, size, o, new: false })
  }
  // La estrella nueva (coral): la de quien acaba de llegar — recién descubierta.
  stars.push({ x: 50, y: 26, size: 14, o: 1, new: true })

  // Bosque de segmentos: cada estrella con su vecina previa más cercana.
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  const MAX_D2 = 24 * 24
  for (let i = 1; i < stars.length; i++) {
    let best = -1
    let bd = Infinity
    for (let j = 0; j < i; j++) {
      const dx = stars[i]!.x - stars[j]!.x
      const dy = stars[i]!.y - stars[j]!.y
      const d2 = dx * dx + dy * dy
      if (d2 < bd) {
        bd = d2
        best = j
      }
    }
    if (best >= 0 && bd < MAX_D2) {
      lines.push({ x1: stars[i]!.x, y1: stars[i]!.y, x2: stars[best]!.x, y2: stars[best]!.y })
    }
  }
  return { stars, lines }
})

const stars = computed(() => sky.value.stars)
const lines = computed(() => sky.value.lines)
</script>

<style scoped>
.constellation {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.constellation__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.12;
}
.constellation__star {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%);
  opacity: var(--o, 0.3);
}
/* Móvil: el cielo gana presencia (pantalla pequeña, máscara vertical aparte). */
@media (max-width: 639px) {
  .constellation__star {
    opacity: calc(var(--o, 0.3) + 0.15);
  }
  .constellation__lines {
    opacity: 0.18;
  }
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
