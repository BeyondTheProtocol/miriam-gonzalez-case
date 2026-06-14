<template>
  <ClientOnly>
    <div class="constellation" aria-hidden="true">
      <!-- Asterismos: unas pocas figuras dibujadas a lápiz en los márgenes
           (no una malla). Las constelaciones nunca fueron los astros —
           son las líneas que trazamos para navegar. -->
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

      <!-- Halos suaves: la estrella «tú» (coral) y la estrella guía (violeta). -->
      <span
        v-for="(h, i) in halos"
        :key="'h' + i"
        class="constellation__halo"
        :class="h.kind === 'you' ? 'is-you' : 'is-north'"
        :style="{ left: h.x + '%', top: h.y + '%', width: h.r + 'px', height: h.r + 'px' }"
      />

      <!-- Estrellas -->
      <svg
        v-for="(s, i) in stars"
        :key="i"
        class="constellation__star"
        :class="{ 'is-you': s.kind === 'you', twinkle: s.twinkle }"
        :style="{
          left: s.x + '%',
          top: s.y + '%',
          width: s.size + 'px',
          height: s.size + 'px',
          '--o': String(s.o),
          '--rot': s.rot + 'deg',
          '--blur': s.blur + 'px',
          '--delay': s.delay + 's',
          '--dur': s.dur + 's',
        }"
        viewBox="0 0 20 20"
      >
        <path :fill="s.kind === 'you' ? '#ff6b47' : '#9d44ab'" :d="STAR_D" />
      </svg>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Constelación de quienes apoyan — un cielo violeta tras el mensaje de gracias.
 * Repaso de diseño de datos:
 *  · DISTRIBUCIÓN: rejilla con jitter (azul-ruido) → densidad pareja, sin grumos.
 *  · ZONA TRANQUILA: elipse central tras el texto donde las estrellas se atenúan
 *    (la mirada cae siempre en las palabras, nunca en un astro).
 *  · FIGURAS: unas pocas constelaciones cortas a lápiz en los márgenes, no una
 *    malla de todos-con-todos.
 *  · PROFUNDIDAD: 3 capas (tamaño + opacidad + leve desenfoque) → cielo con aire.
 *  · MOVIMIENTO: parpadeo lento y desincronizado, solo CSS, off con reduced-motion.
 *  · «TÚ»: la estrella de quien acaba de llegar, coral, con halo, que se enciende
 *    y completa una línea. Y una estrella-guía violeta como ancla.
 * Una estrella por aportación (densidad = nº de donantes). Decorativa
 * (aria-hidden), determinista (PRNG) y ClientOnly.
 */
const props = withDefaults(defineProps<{ count?: number }>(), { count: 60 })

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
  blur: number
  rot: number
  twinkle: boolean
  delay: number
  dur: number
  kind: 'field' | 'north' | 'you'
}

// Zona tranquila: elipse central donde vive el texto. Las estrellas que caen
// dentro se atenúan (factor < 1) para no robarle legibilidad al mensaje.
const QZ = { cx: 50, cy: 48, rx: 34, ry: 31 }
function quiet(x: number, y: number) {
  const dx = (x - QZ.cx) / QZ.rx
  const dy = (y - QZ.cy) / QZ.ry
  const d = Math.sqrt(dx * dx + dy * dy)
  return Math.max(0.1, Math.min(1, d * d))
}

// Línea «a lápiz»: recta con leve curvatura perpendicular en el medio.
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

function pickNearest(stars: Star[], ax: number, ay: number) {
  let best: Star | null = null
  let bd = Infinity
  for (const s of stars) {
    if (s.kind !== 'field' || quiet(s.x, s.y) < 0.85) continue
    const d = (s.x - ax) ** 2 + (s.y - ay) ** 2
    if (d < bd) {
      bd = d
      best = s
    }
  }
  return best
}

function greedyPath(pts: Star[], start: Star): Star[] {
  const rem = pts.filter((p) => p !== start)
  const path = [start]
  while (rem.length) {
    const last = path[path.length - 1]!
    let bi = 0
    let bd = Infinity
    for (let i = 0; i < rem.length; i++) {
      const d = (rem[i]!.x - last.x) ** 2 + (rem[i]!.y - last.y) ** 2
      if (d < bd) {
        bd = d
        bi = i
      }
    }
    path.push(rem.splice(bi, 1)[0]!)
  }
  return path
}

const sky = computed(() => {
  const n = Math.max(18, Math.min(props.count, 600))
  const rnd = mulberry32(20240127)

  // Rejilla con jitter: una estrella por celda (orden barajado), centro ± offset.
  const cols = Math.ceil(Math.sqrt(n * 1.6))
  const rows = Math.ceil(n / cols)
  const cw = 100 / cols
  const ch = 100 / rows
  const cells = Array.from({ length: rows * cols }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j]!, cells[i]!]
  }

  const stars: Star[] = []
  for (let k = 0; k < n; k++) {
    const cell = cells[k]!
    const c = cell % cols
    const r = Math.floor(cell / cols)
    let x = (c + 0.5 + (rnd() - 0.5) * 0.7) * cw
    let y = (r + 0.5 + (rnd() - 0.5) * 0.7) * ch
    x = Math.max(1, Math.min(99, x))
    y = Math.max(1, Math.min(99, y))

    // 3 capas: lejos (pequeña/tenue/borrosa) · media · cerca (grande/nítida).
    const t = rnd()
    let size: number
    let o: number
    let blur: number
    if (t < 0.58) {
      size = 3 + rnd() * 2
      o = 0.1 + rnd() * 0.08
      blur = 0.4
    } else if (t < 0.88) {
      size = 5 + rnd() * 3
      o = 0.18 + rnd() * 0.12
      blur = 0
    } else {
      size = 8 + rnd() * 4
      o = 0.3 + rnd() * 0.12
      blur = 0
    }

    const q = quiet(x, y)
    o *= q
    // Parpadeo: ~30% de las pequeñas/medianas, nunca dentro de la zona del texto.
    const twinkle = t < 0.88 && q > 0.6 && rnd() < 0.32

    stars.push({
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      size: +size.toFixed(1),
      o: +o.toFixed(3),
      blur,
      rot: +(rnd() * 44 - 22).toFixed(1),
      twinkle,
      delay: +(rnd() * 8).toFixed(1),
      dur: +(6 + rnd() * 5).toFixed(1),
      kind: 'field',
    })
  }

  // Estrella-guía (violeta, brillante) cerca del margen superior-izquierdo: ancla.
  const north = pickNearest(stars, 21, 27)
  if (north) {
    north.size = 13
    north.o = 0.5
    north.blur = 0
    north.kind = 'north'
    north.twinkle = false
  }

  // Estrella «tú» (coral): quien acaba de llegar, sobre el monograma.
  const you: Star = {
    x: 56,
    y: 14,
    size: 14,
    o: 1,
    blur: 0,
    rot: -6,
    twinkle: false,
    delay: 0,
    dur: 0,
    kind: 'you',
  }
  stars.push(you)

  // Figuras: 3–4 asterismos cortos en los márgenes (fuera de la zona del texto).
  const lines: { d: string }[] = []
  const used = new Set<Star>()
  const cand = stars.filter((s) => s.kind === 'field' && quiet(s.x, s.y) > 0.9)
  const anchors: { x: number; y: number; seed: Star | null }[] = [
    { x: north?.x ?? 21, y: north?.y ?? 27, seed: north },
    { x: 82, y: 30, seed: null },
    { x: 24, y: 80, seed: null },
    { x: 78, y: 78, seed: null },
  ]
  for (const a of anchors) {
    const near = cand
      .filter((s) => !used.has(s))
      .map((s) => ({ s, d: (s.x - a.x) ** 2 + (s.y - a.y) ** 2 }))
      .sort((p, q) => p.d - q.d)
      .slice(0, 4 + Math.floor(rnd() * 2))
      .map((p) => p.s)
    const figure = a.seed ? [a.seed, ...near.filter((s) => s !== a.seed)] : near
    if (figure.length < 3) continue
    figure.forEach((s) => used.add(s))
    const path = greedyPath(figure, a.seed ?? figure[0]!)
    for (let i = 1; i < path.length; i++) {
      lines.push({ d: penLine(path[i - 1]!.x, path[i - 1]!.y, path[i]!.x, path[i]!.y, rnd) })
    }
  }

  // «Tú» enciende su propia mini-figura: 1–2 estrellas cercanas de la franja alta.
  const top = stars
    .filter((s) => s.kind === 'field' && s.y < 26 && quiet(s.x, s.y) > 0.85)
    .map((s) => ({ s, d: (s.x - you.x) ** 2 + (s.y - you.y) ** 2 }))
    .sort((p, q) => p.d - q.d)
    .slice(0, 2)
    .map((p) => p.s)
  let prev = you
  for (const s of top) {
    if ((s.x - prev.x) ** 2 + (s.y - prev.y) ** 2 < 26 * 26) {
      lines.push({ d: penLine(prev.x, prev.y, s.x, s.y, rnd) })
    }
    prev = s
  }

  // Halos suaves para las dos estrellas especiales.
  const halos = stars
    .filter((s) => s.kind === 'you' || s.kind === 'north')
    .map((s) => ({ x: s.x, y: s.y, r: +(s.size * 3.4).toFixed(1), kind: s.kind }))

  return { stars, lines, halos }
})

const stars = computed(() => sky.value.stars)
const lines = computed(() => sky.value.lines)
const halos = computed(() => sky.value.halos)
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
  opacity: 0.1;
}
.constellation__star {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%) rotate(var(--rot, 0deg));
  opacity: var(--o, 0.3);
  filter: blur(var(--blur, 0px));
  will-change: opacity;
}
.constellation__halo {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  pointer-events: none;
}
.constellation__halo.is-you {
  background: radial-gradient(circle, rgba(255, 107, 71, 0.16), transparent 70%);
}
.constellation__halo.is-north {
  background: radial-gradient(circle, rgba(157, 68, 171, 0.1), transparent 70%);
}
/* Fallback estático (reduced-motion o SSR): «tú» visible sin animación. */
.constellation__star.is-you {
  opacity: 0.92;
}

/* Móvil: el cielo gana un poco de presencia (pantalla pequeña). */
@media (max-width: 639px) {
  .constellation__star {
    opacity: calc(var(--o, 0.3) + 0.1);
  }
  .constellation__lines {
    opacity: 0.14;
  }
}

@keyframes star-ignite {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(0.6);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0.92;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1);
  }
}
@keyframes halo-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: var(--o, 0.3);
  }
  50% {
    opacity: calc(var(--o, 0.3) * 0.5);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .constellation__star.is-you {
    opacity: 0;
    animation: star-ignite 1.6s ease-out 0.5s forwards;
  }
  .constellation__halo.is-you {
    opacity: 0;
    animation: halo-in 1.6s ease-out 0.5s forwards;
  }
  .constellation__star.twinkle {
    animation: twinkle var(--dur, 8s) ease-in-out var(--delay, 0s) infinite;
  }
}
</style>
