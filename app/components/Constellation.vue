<template>
  <ClientOnly>
    <svg
      ref="el"
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
      <ellipse cx="50" :cy="velo.cy" :rx="velo.rx" :ry="velo.ry" fill="url(#cn-quiet)" />

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
 *
 * CAJA ANCHA (T3-LOTE3, A36). El cielo se dibuja en un viewBox de 100 × 100 con `slice`: en una caja más ANCHA que alta (la de /links a 1920 px,
 * la de /gracias a sangre desde 768 px) `slice` escala por el ancho y solo se ve la franja central en vertical, y la estrella «tú» (y = 7) y la guía
 * (y = 9) quedaban fuera, arriba. Ahora el componente mide la proporción de su caja (ResizeObserver) y, si es ancha, dibuja el cielo como lo
 * dibujaría en una caja cuadrada del alto de la caja y luego lo estira en horizontal: las POSICIONES se reparten por todo el ancho y por la franja
 * visible (y' = arriba + y / proporción) y los TAMAÑOS (estrellas, velo) se dividen por la proporción, así una estrella mide en píxeles lo que mediría
 * en la caja alta. En una caja cuadrada o más alta que ancha (todo móvil, y /links hasta unos 1390 px) la proporción efectiva es 1 y no se
 * toca nada: mismo dibujo, mismo orden de números aleatorios. La primera pintura, antes de medir, es esa misma.
 *
 * LA «TÚ» SE VE (T3-LOTE3, revisión). Que quepa en la caja no es que se vea: en /links la estrella cae a un 7 % del alto de la caja (unos 97 px de los
 * ~1390 que mide la página) y el avatar empieza a 80, así que quedaba detrás de él (se veía entre un 4 y un 7 % de su área a 1024, 1280, 1440 y 1920). Con la prop `tuTopePx`
 * (solo la pasa /links), desde `lg` (1024 px, la media query real) el CENTRO de la estrella queda como mucho a esos px del borde de arriba de la caja,
 * en cualquier proporción: también en cajas altas, donde la rama ancha de arriba no entra (1024 a 1389 px). Sin prop, o por debajo de `lg`, no se toca
 * nada (/gracias y el móvil quedan como estaban). El cálculo necesita los lados de la caja en px, porque `slice` escala por el MAYOR (el ancho si la caja es
 * ancha, el alto si es alta): 1 px son 100 / lado unidades del viewBox, y el borde de arriba de la caja cae donde arranca la franja visible. Por debajo de `lg` la «tú» de /links sigue detrás del avatar (a 375 px se ve un
 * 0,6 %, a 768 un 4,3 %): arreglarlo es composición del móvil y no entra en este lote.
 */
const props = withDefaults(
  defineProps<{
    count?: number
    donations?: { amount: number; createdAt?: string }[]
    /** Tope, en px, de la distancia del CENTRO de la estrella «tú» al borde de arriba de la caja, desde `lg`. 0 = sin tope (lo de siempre). */
    tuTopePx?: number
  }>(),
  { count: 60, tuTopePx: 0 }
)

// Proporción ancho / alto de la caja del cielo, en saltos de 0,01 para que el cielo no se rehaga a cada píxel al cambiar el tamaño. Más gruesos
// (0,05) la estrella «tú» quedaba hasta 17 px más abajo de donde `slice` pone el borde de la franja y se escondía detrás del avatar de /links. 1 hasta medirla.
const el = ref<SVGSVGElement | null>(null)
const proporcion = ref(1)
// Los dos lados de la caja en px (el MAYOR es el que `slice` toma por escala), en saltos de 4 px (el tope de la «tú» se desvía un píxel como mucho), y si la
// ventana es `lg` o más. Se guardan aparte de la proporción, que va redondeada a 0,01 y a 1440 px dejaba la estrella hasta 3 px más arriba de lo pedido.
const lado = ref(0)
const corto = ref(0)
const escritorio = ref(false)
let observador: ResizeObserver | undefined
watch(el, (n) => {
  observador?.disconnect()
  observador = undefined
  if (!n || typeof ResizeObserver === 'undefined') return
  observador = new ResizeObserver((entradas) => {
    const r = entradas[0]?.contentRect
    if (!r || !r.width || !r.height) return
    proporcion.value = Math.round((r.width / r.height) * 100) / 100
    lado.value = Math.round(Math.max(r.width, r.height) / 4) * 4
    corto.value = Math.round(Math.min(r.width, r.height) / 4) * 4
    escritorio.value = window.matchMedia('(min-width: 1024px)').matches
  })
  observador.observe(n)
})
onBeforeUnmount(() => observador?.disconnect())

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

  // Caja ancha (ver la nota de arriba): `ancha` ≥ 1; `sc` es lo que se encoge todo lo vertical y el tamaño de las estrellas. Con 1 no cambia nada.
  const ancha = Math.max(1, proporcion.value)
  const sc = 1 / ancha
  const arriba = 50 - 50 * sc // y del borde de arriba de la franja que `slice` deja ver
  const Y = (y: number) => +(arriba + y * sc).toFixed(2)
  const R = (r: number) => +(r * sc).toFixed(2)
  // La «tú» (el ápice): desde `lg` y con tope, como mucho a `tuTopePx` px del borde de arriba de la caja (ver la nota de arriba). El borde de arriba de la caja
  // es donde arranca la franja visible: y = 0 en una caja alta y 50 - 50 · corto / lado en una ancha (aquí con las medidas, no con la proporción redondeada).
  const borde = proporcion.value > 1 && lado.value ? 50 - (50 * corto.value) / lado.value : 0
  const tope = props.tuTopePx > 0 && escritorio.value && lado.value ? borde + (props.tuTopePx * 100) / lado.value : Infinity
  const apex = { x: APEX.x, y: +Math.min(Y(APEX.y), tope).toFixed(2) }
  const vertices = VERTICES.map((v) => ({ x: v.x, y: Y(v.y) }))

  // Estrella «tú» = la donación más reciente (createdAt máximo); si no hay datos,
  // una estrella simbólica. Tamaño con suelo para que el foco coral siempre luzca.
  let newest = dons[0]
  for (const d of dons) {
    if (d.createdAt && (!newest?.createdAt || d.createdAt > newest.createdAt)) newest = d
  }
  const you = {
    x: apex.x,
    y: apex.y,
    r: R(Math.max(2.7, radiusOf(magOf(newest?.amount ?? amax, amax)))),
  }

  // Anclas: los 11 mayores donantes → vértices diseñados. La mayor = guía.
  const anchors = vertices.map((v, i) => {
    const a = sorted[i]?.amount ?? 0
    const m = magOf(a, amax)
    return {
      x: v.x,
      y: v.y,
      r: R(i === 0 ? Math.max(2.2, radiusOf(m)) : radiusOf(m)),
      o: Math.min(0.82, opacityOf(m) + 0.15),
      twinkle: i < 8,
      delay: +(rnd() * 6).toFixed(1),
    }
  })
  const guide = anchors[0]

  // Campo: el resto de aportaciones (o, sin importes, `count`). Rejilla con jitter.
  const tail = sorted.slice(VERTICES.length)
  // Sin importes, `count` es una densidad: en una caja ancha hay más sitio y se reparte en proporción (con importes, una estrella por aportación).
  const N = amax ? Math.min(tail.length, 580) : Math.max(18, Math.min(Math.round(props.count * ancha), 580))
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
    field.push({ x, y: Y(y), r: R(radiusOf(m)), o: opacityOf(m) })
  }

  // Resolver aristas a coordenadas.
  const at = (idx: number | 'a') => (idx === 'a' ? apex : vertices[idx]!)
  const edges = EDGES.map(([p, q]) => {
    const a = at(p)
    const b = at(q)
    return penLine(a.x, a.y, b.x, b.y, rnd)
  })
  // «Tú» se une a la espina (completa la línea) por la estrella más cercana.
  edges.push(penLine(you.x, you.y, vertices[0]!.x, vertices[0]!.y, rnd))
  edges.push(penLine(you.x, you.y, vertices[1]!.x, vertices[1]!.y, rnd))

  // El velo de la zona tranquila se encoge como lo demás: en una caja ancha tapa lo que tapaba en la alta (la columna del mensaje), no un tercio de la pantalla.
  const velo = { cy: Y(47), rx: +(36 * sc).toFixed(2), ry: +(42 * sc).toFixed(2) }

  return { field, anchors, guide, you, edges, velo }
})

const field = computed(() => sky.value.field)
const anchors = computed(() => sky.value.anchors)
const guide = computed(() => sky.value.guide)
const you = computed(() => sky.value.you)
const edges = computed(() => sky.value.edges)
const velo = computed(() => sky.value.velo)
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
