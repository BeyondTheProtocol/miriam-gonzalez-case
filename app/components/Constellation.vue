<template>
  <ClientOnly>
    <div class="constellation" aria-hidden="true">
      <!-- Carta celeste dibujada a mano: conectores a lápiz (curvados) entre
           estrellas vecinas. Las constelaciones nunca fueron los astros — son
           las líneas que trazamos para navegar. -->
      <svg class="constellation__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          v-for="(l, i) in lines"
          :key="i"
          :d="l.d"
          fill="none"
          stroke="#9d44ab"
          stroke-width="1"
          stroke-linecap="round"
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
          '--rot': s.rot + 'deg',
        }"
        viewBox="0 0 20 20"
      >
        <path :fill="s.new ? '#ff6b47' : '#9d44ab'" :d="STAR_D" />
      </svg>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Constelación de quienes apoyan — trazo de cuaderno (estrella dibujada a mano,
 * con leve rotación propia y conectores a lápiz curvados). La ciencia dentro:
 *  · MAGNITUD: si llegan importes, el tamaño sigue escala logarítmica (Pogson):
 *    una aportación 100× mayor brilla solo unos pasos más — ninguna eclipsa.
 *  · LÍNEAS: cada estrella se une a su vecina, como en una carta celeste.
 * Genera UNA estrella por aportación real (todas, con tope de cordura para el
 * DOM). Tamaños fijos en píxeles, posiciones deterministas (PRNG), decorativa
 * (aria-hidden) y ClientOnly. En móvil sube la opacidad (media query).
 */
const props = withDefaults(defineProps<{ count?: number; amounts?: number[] }>(), {
  count: 60,
})

// Estrella de 4 puntas dibujada a mano: brazos ligeramente curvos y asimétricos.
const STAR_D =
  'M10 1.6 C10.8 5,11.4 6.2,12.6 7.4 C14 8.8,16.4 9.4,18.4 10 C16.2 10.8,14.2 11.4,12.8 12.7 C11.5 13.9,10.9 15.7,10 18.4 C9.3 15.9,8.5 14.2,7.2 12.9 C5.8 11.6,3.4 10.7,1.6 10 C3.8 9.1,5.8 8.4,7.2 7.1 C8.4 6,9.2 4.2,10 1.6 Z'

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
  rot: number
  new: boolean
}

const sky = computed(() => {
  // Una estrella por aportación real (todas); tope para no saturar el DOM.
  const n = Math.max(18, Math.min(props.count, 600))
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
      const a = amts[Math.floor(rnd() * amts.length)]!
      size = +Math.min(12, Math.max(4.5, 6 + 2.2 * Math.log10(a / median))).toFixed(1)
    }
    stars.push({ x, y, size, o, rot: +(rnd() * 44 - 22).toFixed(1), new: false })
  }
  // La estrella nueva (coral): la de quien acaba de llegar — recién descubierta.
  stars.push({ x: 50, y: 26, size: 14, o: 1, rot: -6, new: true })

  // Conectores a lápiz: cada estrella con su vecina previa más cercana, curvados.
  const lines: { d: string }[] = []
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
      lines.push({ d: penLine(stars[i]!.x, stars[i]!.y, stars[best]!.x, stars[best]!.y, rnd) })
    }
  }
  return { stars, lines }
})

// Traza una línea «a mano»: recta con leve curvatura perpendicular en el medio.
function penLine(x1: number, y1: number, x2: number, y2: number, rnd: () => number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const off = (rnd() * 2 - 1) * Math.min(2.5, len * 0.12)
  const cxp = (mx + (-dy / len) * off).toFixed(1)
  const cyp = (my + (dx / len) * off).toFixed(1)
  return `M${x1} ${y1} Q${cxp} ${cyp} ${x2} ${y2}`
}

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
  transform: translate(-50%, -50%) rotate(var(--rot, 0deg));
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
