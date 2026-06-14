<template>
  <ClientOnly>
    <svg
      class="constellation"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id="cn-star" :d="STAR_D" />
        <!-- Zona tranquila: velo crema que atenúa el cielo tras el mensaje. -->
        <radialGradient id="cn-quiet">
          <stop offset="0%" stop-color="#faf6f0" stop-opacity="0.9" />
          <stop offset="58%" stop-color="#faf6f0" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#faf6f0" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="cn-halo-v">
          <stop offset="0%" stop-color="#9d44ab" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#9d44ab" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="cn-halo-c">
          <stop offset="0%" stop-color="#ff6b47" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#ff6b47" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Campo: la multitud de aportaciones (estrellas instanciadas de una sola
           definición → baratas; las diminutas se leen como puntos). -->
      <g class="cn-field">
        <use
          v-for="(s, i) in field"
          :key="i"
          href="#cn-star"
          fill="#9d44ab"
          :opacity="s.o"
          :transform="`translate(${s.x} ${s.y}) scale(${s.r / 10}) translate(-10 -10)`"
        />
      </g>

      <!-- Velo de la zona tranquila (un solo nodo, sobre el campo). -->
      <ellipse cx="50" cy="47" rx="36" ry="42" fill="url(#cn-quiet)" />

      <!-- Líneas de las figuras (a lápiz, solo entre las estrellas mayores). -->
      <g class="cn-lines">
        <path
          v-for="(d, i) in edges"
          :key="i"
          :d="d"
          fill="none"
          stroke="#9d44ab"
          stroke-width="0.5"
          stroke-linecap="round"
          opacity="0.24"
          vector-effect="non-scaling-stroke"
        />
      </g>

      <!-- Halos suaves: la estrella guía (la mayor, violeta) y «tú» (coral). -->
      <circle v-if="guide" :cx="guide.x" :cy="guide.y" :r="guide.r * 3" fill="url(#cn-halo-v)" />
      <circle class="cn-halo-you" :cx="you.x" :cy="you.y" :r="you.r * 3.2" fill="url(#cn-halo-c)" />

      <!-- Estrellas mayores: los 11 mayores donantes (figuras principales). -->
      <g
        v-for="(a, i) in anchors"
        :key="'a' + i"
        class="cn-anchor"
        :class="{ twinkle: a.twinkle }"
        :style="{ '--o': String(a.o), '--d': a.delay + 's' }"
        :transform="`translate(${a.x} ${a.y}) scale(${a.r / 10}) translate(-10 -10)`"
      >
        <use href="#cn-star" fill="#9d44ab" />
      </g>

      <!-- Estrella «tú»: quien acaba de llegar (la donación más reciente). -->
      <g
        class="cn-you"
        :transform="`translate(${you.x} ${you.y}) scale(${you.r / 10}) translate(-10 -10)`"
      >
        <use href="#cn-star" fill="#ff6b47" />
      </g>
    </svg>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Constelación de quienes apoyan (página de gracias) — repaso v2.
 *  · MAGNITUD POR APORTACIÓN: cada estrella se dimensiona por su importe en
 *    escala de Pogson (magnitud astronómica): una donación 300× mayor brilla
 *    solo unos pasos más — nadie eclipsa, pero las mayores son los anclajes.
 *  · FIGURAS PRINCIPALES: los ~11 mayores donantes son las estrellas brillantes
 *    que trazan las constelaciones (espina superior + dos grupos), y la donación
 *    más reciente es la estrella «tú» (coral) en la cima.
 *  · UN SOLO SVG vectorial (viewBox) → escala nítido al hacer zoom y pocos nodos
 *    (el campo son <circle>, no un <svg> por estrella) → navegación fluida.
 *  · ZONA TRANQUILA: un velo crema atenúa el cielo tras el texto (legibilidad).
 *  · Movimiento mínimo (parpadeo de las mayores + encendido de «tú»), off con
 *    prefers-reduced-motion. Decorativa (aria-hidden), ClientOnly, determinista.
 * Sin importes (fallback): densidad por nº de donantes, tamaño mediano.
 */
const props = withDefaults(
  defineProps<{ count?: number; donations?: { amount: number; createdAt?: string }[] }>(),
  { count: 60 }
)

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

// Vértices DISEÑADOS (no aleatorios) de las figuras, en viewBox 0–100. El primero
// es el más prominente (junto a la cima): ahí va la estrella guía (la mayor).
const APEX = { x: 50, y: 7 } // estrella «tú»
const VERTICES = [
  { x: 66, y: 9 }, // 0 · guía
  { x: 36, y: 10 }, // 1
  { x: 80, y: 15 }, // 2
  { x: 23, y: 18 }, // 3
  { x: 90, y: 26 }, // 4
  { x: 11, y: 49 }, // 5
  { x: 7, y: 65 }, // 6
  { x: 15, y: 79 }, // 7
  { x: 91, y: 48 }, // 8
  { x: 95, y: 64 }, // 9
  { x: 87, y: 79 }, // 10
]
// Aristas (índice en VERTICES o 'a' = apex): espina superior + grupo izq + der.
const EDGES: [number | 'a', number | 'a'][] = [
  [3, 1], [1, 'a'], ['a', 0], [0, 2], [2, 4], // espina
  [5, 6], [6, 7], // izquierda
  [8, 9], [9, 10], // derecha
]

// Magnitud de Pogson: 0 = la mayor; ~1 = la menor (normalizada).
const MMAX = 6.2
function magOf(amount: number, amax: number) {
  if (!amax || amount <= 0) return 0.72
  return Math.min(1, (-2.5 * Math.log10(amount / amax)) / MMAX)
}
const R_MAX = 2.4
const R_MIN = 0.32
function radiusOf(m: number) {
  // Curva pronunciada: solo las mayores crecen; la cola es polvo de estrellas.
  return +(R_MIN + (R_MAX - R_MIN) * Math.pow(1 - m, 2.8)).toFixed(2)
}
function opacityOf(m: number) {
  return +Math.max(0.1, Math.min(0.78, 0.6 - 0.5 * m)).toFixed(2)
}

// Línea «a lápiz»: recta con leve curvatura perpendicular en el medio.
function penLine(x1: number, y1: number, x2: number, y2: number, rnd: () => number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const off = (rnd() * 2 - 1) * Math.min(2.4, len * 0.1)
  const cxp = (mx + (-dy / len) * off).toFixed(1)
  const cyp = (my + (dx / len) * off).toFixed(1)
  return `M${x1} ${y1} Q${cxp} ${cyp} ${x2} ${y2}`
}

const sky = computed(() => {
  const rnd = mulberry32(20240127)
  const dons = (props.donations ?? []).filter((d) => d && d.amount > 0)
  const sorted = [...dons].sort((a, b) => b.amount - a.amount)
  const amax = sorted.length ? sorted[0]!.amount : 0

  // Estrella «tú» = la donación más reciente (createdAt máximo); si no hay datos,
  // una estrella simbólica. Tamaño con suelo para que el foco coral siempre luzca.
  let newest = dons[0]
  for (const d of dons) {
    if (d.createdAt && (!newest?.createdAt || d.createdAt > newest.createdAt)) newest = d
  }
  const you = {
    x: APEX.x,
    y: APEX.y,
    r: Math.max(2.7, radiusOf(magOf(newest?.amount ?? amax, amax))),
  }

  // Anclas: los 11 mayores donantes → vértices diseñados. La mayor = guía.
  const anchors = VERTICES.map((v, i) => {
    const a = sorted[i]?.amount ?? 0
    const m = magOf(a, amax)
    return {
      x: v.x,
      y: v.y,
      r: i === 0 ? Math.max(2.2, radiusOf(m)) : radiusOf(m),
      o: Math.min(0.82, opacityOf(m) + 0.15),
      twinkle: i < 8,
      delay: +(rnd() * 6).toFixed(1),
    }
  })
  const guide = anchors[0]

  // Campo: el resto de aportaciones (o, sin importes, `count`). Rejilla con jitter.
  const tail = sorted.slice(VERTICES.length)
  const N = amax ? Math.min(tail.length, 580) : Math.max(18, Math.min(props.count, 580))
  const cols = Math.ceil(Math.sqrt(N * 1.6))
  const rows = Math.ceil(N / cols)
  const cw = 100 / cols
  const ch = 100 / rows
  const cells = Array.from({ length: rows * cols }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j]!, cells[i]!]
  }
  const step = amax && tail.length > N ? tail.length / N : 1 // muestreo del «tail»

  const field: { x: number; y: number; r: number; o: number }[] = []
  for (let k = 0; k < N; k++) {
    const cell = cells[k]!
    const c = cell % cols
    const r = Math.floor(cell / cols)
    const x = +Math.max(0.5, Math.min(99.5, (c + 0.5 + (rnd() - 0.5) * 0.7) * cw)).toFixed(2)
    const y = +Math.max(0.5, Math.min(99.5, (r + 0.5 + (rnd() - 0.5) * 0.7) * ch)).toFixed(2)
    const amount = amax ? (tail[Math.floor(k * step)]?.amount ?? 0) : 0
    const m = magOf(amount, amax)
    field.push({ x, y, r: radiusOf(m), o: opacityOf(m) })
  }

  // Resolver aristas a coordenadas.
  const at = (idx: number | 'a') => (idx === 'a' ? APEX : VERTICES[idx]!)
  const edges = EDGES.map(([p, q]) => {
    const a = at(p)
    const b = at(q)
    return penLine(a.x, a.y, b.x, b.y, rnd)
  })
  // «Tú» se une a la espina (completa la línea) por la estrella más cercana.
  edges.push(penLine(you.x, you.y, VERTICES[0]!.x, VERTICES[0]!.y, rnd))
  edges.push(penLine(you.x, you.y, VERTICES[1]!.x, VERTICES[1]!.y, rnd))

  return { field, anchors, guide, you, edges }
})

const field = computed(() => sky.value.field)
const anchors = computed(() => sky.value.anchors)
const guide = computed(() => sky.value.guide)
const you = computed(() => sky.value.you)
const edges = computed(() => sky.value.edges)
</script>

<style scoped>
.constellation {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.cn-anchor {
  opacity: var(--o, 0.5);
}
.cn-you {
  opacity: 0.95;
}
.cn-halo-you {
  opacity: 1;
}

/* Móvil: el cielo gana un poco de presencia. */
@media (max-width: 639px) {
  .cn-field circle {
    opacity: 0.9;
  }
  .cn-lines {
    opacity: 1.3;
  }
}

@keyframes cn-twinkle {
  0%,
  100% {
    opacity: var(--o, 0.5);
  }
  50% {
    opacity: calc(var(--o, 0.5) * 0.55);
  }
}
@keyframes cn-ignite {
  0% {
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0.95;
  }
}
@keyframes cn-ignite-halo {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .cn-anchor.twinkle {
    animation: cn-twinkle 8s ease-in-out var(--d, 0s) infinite;
  }
  .cn-you {
    opacity: 0;
    animation: cn-ignite 1.6s ease-out 0.5s forwards;
  }
  .cn-halo-you {
    opacity: 0;
    animation: cn-ignite-halo 1.6s ease-out 0.5s forwards;
  }
}
</style>
