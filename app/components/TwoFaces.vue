<template>
  <section :aria-label="$t('twofaces.title')">
    <!-- En modo compacto (home) el texto de la sección anfitriona ya hace de
         intro: solo se pinta la página del cuaderno. -->
    <template v-if="!compact">
      <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
      <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
        {{ $t('twofaces.title') }}
      </h2>
      <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>
    </template>

    <!-- Página de cuaderno de laboratorio (ADN gráfico del design system):
         tinta berenjena, trazo a pluma imperfecto, UN solo acento (coral) sobre
         las dos certezas que financia la campaña; el lado luminal "conocido" se
         dibuja por densidad de tinta, no por color. Todo anotado a mano dentro
         de la página — sin leyenda fuera. La lectura completa va en sr-only. -->
    <figure ref="root" class="tf2" :class="{ 'tf2-in': inView }">
      <svg class="tf2__svg" viewBox="0 0 440 384" role="img" :aria-label="ariaLabel">
        <defs>
          <filter id="tf2-rough" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="tf2-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
          <pattern id="tf2-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0 H0 V22" fill="none" stroke="rgba(45,27,61,0.06)" stroke-width="1" />
          </pattern>
          <marker id="tf2-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#2d1b3d" />
          </marker>
          <marker id="tf2-arrow-c" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#bb4128" />
          </marker>
        </defs>

        <!-- Papel crema + grano sutil + cuadrícula de libreta -->
        <rect x="2" y="2" width="436" height="380" rx="14" fill="#faf6f0" stroke="rgba(45,27,61,0.16)" />
        <rect x="2" y="2" width="436" height="380" rx="14" fill="url(#tf2-grid)" />
        <rect x="2" y="2" width="436" height="380" rx="14" filter="url(#tf2-grain)" opacity="0.04" />

        <!-- ── Trazo a pluma (con temblor): todo en tinta berenjena ─────── -->
        <g filter="url(#tf2-rough)">
          <!-- Membrana de la célula, dibujada a mano (no es un círculo perfecto) -->
          <path
            :d="cellPath"
            fill="none"
            stroke="#2d1b3d"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <!-- Costura central a lápiz -->
          <path :d="seamPath" fill="none" stroke="#2d1b3d" stroke-width="1.4" stroke-dasharray="2 5" opacity="0.55" />

          <!-- Lado MAMA: red densa cartografiada (tinta) -->
          <g class="tf2__web" stroke="#2d1b3d" stroke-width="0.9" stroke-linecap="round" fill="none" opacity="0.8">
            <path v-for="(l, i) in webLines" :key="'l' + i" :d="l.d" />
          </g>
          <g fill="#2d1b3d" stroke="none">
            <circle
              v-for="(n, i) in lumNodes"
              :key="'n' + i"
              class="tf2__lum-node"
              :cx="n.x"
              :cy="n.y"
              :r="n.r"
              :style="{ '--o': String(n.o), '--d': (0.02 * i).toFixed(2) + 's' }"
            />
          </g>

          <!-- Lado NEUROENDOCRINO: penumbra de puntitos (stippling = lo desconocido) -->
          <g fill="#2d1b3d" stroke="none" opacity="0.38">
            <circle v-for="(u, i) in unknownNodes" :key="'u' + i" :cx="u.x" :cy="u.y" :r="u.r" />
          </g>

          <!-- Puentes coral: las certezas cruzan hacia la red (se tratan juntas) -->
          <path
            v-for="(b, i) in bridges"
            :key="'b' + i"
            class="tf2__bridge"
            :d="b.d"
            fill="none"
            stroke="#ff6b47"
            stroke-width="1.2"
            stroke-dasharray="3 3"
          />

          <!-- Las dos certezas: punto coral + círculo rodeado a mano (único acento) -->
          <g class="tf2__known" v-for="(k, i) in knownNodes" :key="'k' + i" :style="{ '--d': (0.9 + 0.35 * i).toFixed(2) + 's' }">
            <circle :cx="k.x" :cy="k.y" r="4.5" fill="#ff6b47" stroke="none" />
            <path :d="k.ring" fill="none" stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" />
          </g>
        </g>

        <!-- ── Anotaciones manuscritas (sin filtro, legibles) ──────────── -->
        <!-- Flechas curvas finas -->
        <g fill="none" stroke-width="1.3">
          <path :d="ann.mama.arrow" stroke="#2d1b3d" marker-end="url(#tf2-arrow)" />
          <path :d="ann.ne.arrow" stroke="#2d1b3d" marker-end="url(#tf2-arrow)" />
          <path :d="ann.mapped.arrow" stroke="#2d1b3d" opacity="0.7" marker-end="url(#tf2-arrow)" />
          <path v-for="(k, i) in knownNodes" :key="'ka' + i" :d="k.arrow" stroke="#bb4128" marker-end="url(#tf2-arrow-c)" />
        </g>
        <!-- Etiquetas -->
        <g class="tf2__hand" fill="#2d1b3d">
          <text :x="ann.mama.x" :y="ann.mama.y" :transform="`rotate(-7 ${ann.mama.x} ${ann.mama.y})`" class="tf2__label tf2__up">{{ $t('twofaces.lum_word') }}</text>
          <text :x="ann.ne.x" :y="ann.ne.y" :transform="`rotate(5 ${ann.ne.x} ${ann.ne.y})`" class="tf2__label tf2__label--sm tf2__up">{{ $t('twofaces.ne_word') }}</text>
          <text :x="ann.mapped.x" :y="ann.mapped.y" :transform="`rotate(-4 ${ann.mapped.x} ${ann.mapped.y})`" class="tf2__note tf2__up" opacity="0.75">{{ $t('twofaces.note_mapped') }}</text>
          <text :x="ann.dark.x" :y="ann.dark.y" :transform="`rotate(4 ${ann.dark.x} ${ann.dark.y})`" class="tf2__note tf2__up" opacity="0.6">{{ $t('twofaces.note_dark') }}</text>
          <!-- ? sobre la penumbra -->
          <text v-for="(q, i) in qmarks" :key="'q' + i" :x="q.x" :y="q.y" class="tf2__q" opacity="0.4">?</text>
        </g>
        <!-- Certezas: nombre coral + significado a mano -->
        <g class="tf2__hand">
          <template v-for="(k, i) in knownNodes" :key="'kt' + i">
            <text :x="k.lx" :y="k.ly" class="tf2__label tf2__up" fill="#bb4128" translate="no">{{ k.m }}</text>
            <text :x="k.lx" :y="k.ly + 16" class="tf2__note" fill="#3a3340">{{ k.note }}</text>
          </template>
        </g>
        <!-- Cierre: un mismo tumor, se tratan juntas (subrayado coral a mano) -->
        <g class="tf2__hand">
          <text x="220" y="366" text-anchor="middle" class="tf2__together-txt" fill="#2d1b3d">{{ $t('twofaces.together_short') }}</text>
          <path d="M118 372 Q220 377 322 371" fill="none" stroke="#ff6b47" stroke-width="2" stroke-linecap="round" />
        </g>
      </svg>
    </figure>

    <!-- Lectura accesible (lectores de pantalla / SEO): lo que el dibujo cuenta. -->
    <div class="sr-only">
      <p>{{ $t('twofaces.lum_label') }}: {{ $t('twofaces.lum_status') }}</p>
      <p>{{ $t('twofaces.ne_label') }}: {{ $t('twofaces.ne_status') }}</p>
      <ul>
        <li v-for="(k, i) in known" :key="i">{{ k.m }} — {{ k.d }}</li>
      </ul>
      <p>{{ $t('twofaces.together') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * «Las dos caras» — página de cuaderno de laboratorio según el ADN gráfico del
 * design system: ilustración a pluma en tinta berenjena (#2d1b3d), trazo
 * imperfecto, UN solo acento (coral #ff6b47) reservado a las dos certezas que
 * financia la campaña. El lado luminal "conocido" se representa por densidad de
 * tinta (red cartografiada); el neuroendocrino, por penumbra de puntitos
 * (stippling) + las dos certezas rodeadas a mano: RB1 (el motor) y SSTR2 (vía
 * PRRT), documentadas en /ciencia. Todo anotado a mano DENTRO de la página
 * (mayúsculas + flechas curvas), sin leyenda fuera. La lectura completa va en
 * un bloque sr-only (a11y/SEO). Posiciones deterministas (PRNG), mobile-first
 * (viewBox), animaciones con prefers-reduced-motion.
 */
defineProps<{ compact?: boolean }>()

const { t, tm, rt } = useI18n()

const R = 132
const cx = 206
const cy = 178

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t2 = Math.imul(a ^ (a >>> 15), 1 | a)
    t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2
    return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296
  }
}
function inCell(x: number, y: number, pad = 10) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= (R - pad) ** 2
}
function penLine(x1: number, y1: number, x2: number, y2: number, rnd: () => number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const off = (rnd() * 2 - 1) * Math.min(5, len * 0.16)
  return `M${x1} ${y1} Q${(mx + (-dy / len) * off).toFixed(1)} ${(my + (dx / len) * off).toFixed(1)} ${x2} ${y2}`
}

// Cierra una nube de puntos con curvas suaves (Catmull-Rom → Bézier):
// el wobble queda orgánico, como trazo de boli, no facetado.
function smoothClosed(pts: { x: number; y: number }[]) {
  const n = pts.length
  const P = (i: number) => pts[((i % n) + n) % n]!
  let d = `M${P(0).x.toFixed(1)} ${P(0).y.toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1)
    const p1 = P(i)
    const p2 = P(i + 1)
    const p3 = P(i + 2)
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d + ' Z'
}

// Célula dibujada a mano: blob suave con radios ligeramente variables.
const cellPath = computed(() => {
  const rnd = mulberry32(99)
  const pts: { x: number; y: number }[] = []
  const N = 16
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2
    const rr = R + (rnd() * 2 - 1) * 5
    pts.push({ x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr * 0.98 })
  }
  return smoothClosed(pts)
})
const seamPath = `M${cx} ${cy - R + 10} Q${cx + 6} ${cy} ${cx - 4} ${cy + R - 10}`

interface Node { x: number; y: number; r: number; o: number }

// Las dos certezas: punto, círculo rodeado a mano, flecha y etiqueta+significado.
const knownNodes = computed(() => {
  const mk = (x: number, y: number, m: string, note: string, lx: number, ly: number, ax: number, ay: number) => ({
    x, y, m, note, lx, ly,
    ring: handRing(x, y, 16, 13),
    arrow: penLine(ax, ay, x + 13, y - 6, mulberry32(Math.round(x * y))),
  })
  return [
    mk(294, 122, 'RB1', t('twofaces.rb1_note'), 348, 108, 346, 104),
    mk(286, 244, 'SSTR2', t('twofaces.sstr2_note'), 338, 250, 336, 246),
  ]
})
function handRing(x: number, y: number, rx: number, ry: number) {
  // Aro rodeado a boli: elipse suave con leve temblor (curvas, no facetas).
  const pts: { x: number; y: number }[] = []
  const N = 12
  const rnd = mulberry32(Math.round(x + y))
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 - 0.5
    pts.push({ x: x + Math.cos(ang) * rx + (rnd() * 2 - 1) * 1.2, y: y + Math.sin(ang) * ry + (rnd() * 2 - 1) * 1.2 })
  }
  return smoothClosed(pts)
}

const geometry = computed(() => {
  const rnd = mulberry32(20240127)
  const lumNodes: Node[] = []
  let guard = 0
  while (lumNodes.length < 46 && guard < 6000) {
    guard++
    const x = cx - R + rnd() * R
    const y = cy - R + rnd() * (2 * R)
    if (x < cx - 8 && inCell(x, y)) {
      lumNodes.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(1.6 + rnd() * 1.9).toFixed(1), o: +(0.55 + rnd() * 0.4).toFixed(2) })
    }
  }
  const webLines: { d: string }[] = []
  for (let i = 1; i < lumNodes.length; i++) {
    let best = -1
    let bd = Infinity
    for (let j = 0; j < i; j++) {
      const dx = lumNodes[i]!.x - lumNodes[j]!.x
      const dy = lumNodes[i]!.y - lumNodes[j]!.y
      const d = dx * dx + dy * dy
      if (d < bd) { bd = d; best = j }
    }
    if (best >= 0 && bd < 40 * 40) {
      webLines.push({ d: penLine(lumNodes[i]!.x, lumNodes[i]!.y, lumNodes[best]!.x, lumNodes[best]!.y, rnd) })
    }
  }
  const unknownNodes: { x: number; y: number; r: number }[] = []
  guard = 0
  const kn = knownNodes.value
  while (unknownNodes.length < 14 && guard < 6000) {
    guard++
    const x = cx + rnd() * R
    const y = cy - R + rnd() * (2 * R)
    const farFromKnown = kn.every((k) => (k.x - x) ** 2 + (k.y - y) ** 2 > 30 * 30)
    if (x > cx + 10 && inCell(x, y, 14) && farFromKnown) {
      unknownNodes.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(1.6 + rnd() * 1.6).toFixed(1) })
    }
  }
  const bridges = kn.map((k) => {
    let best = lumNodes[0]!
    let bd = Infinity
    for (const n of lumNodes) {
      const d = (n.x - k.x) ** 2 + (n.y - k.y) ** 2
      if (d < bd) { bd = d; best = n }
    }
    return { d: penLine(k.x, k.y, best.x, best.y, rnd) }
  })
  return { lumNodes, webLines, unknownNodes, bridges }
})
const lumNodes = computed(() => geometry.value.lumNodes)
const webLines = computed(() => geometry.value.webLines)
const unknownNodes = computed(() => geometry.value.unknownNodes)
const bridges = computed(() => geometry.value.bridges)

// ¿ marcas sobre la penumbra (lo desconocido)
const qmarks = [
  { x: 322, y: 150 },
  { x: 268, y: 196 },
  { x: 330, y: 210 },
]

// Anotaciones manuscritas con flecha (posiciones fijas).
const ann = computed(() => ({
  mama: { x: 44, y: 60, arrow: 'M70 66 Q92 78 110 104' },
  ne: { x: 244, y: 44, arrow: 'M298 52 Q318 66 318 92' },
  mapped: { x: 28, y: 318, arrow: 'M92 310 Q118 288 140 256' },
  dark: { x: 250, y: 322, arrow: 'M300 316 Q300 296 296 276' },
}))

interface Known { m: string; d: string }
const known = computed<Known[]>(() => {
  const raw = tm('twofaces.ne_known') as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({ m: rt((e as Record<string, unknown>).m as never), d: rt((e as Record<string, unknown>).d as never) }))
})

const ariaLabel = computed(() => {
  const lum = t('twofaces.lum_label') + ': ' + t('twofaces.lum_status')
  const ne = t('twofaces.ne_label') + ': ' + t('twofaces.ne_status')
  const certs = known.value.map((k) => `${k.m} (${k.d})`).join(', ')
  return `${lum} ${ne} ${certs}. ${t('twofaces.together')}`
})

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
    { threshold: 0.3 }
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.tf2 {
  margin: 0;
}
.tf2__svg {
  display: block;
  width: 100%;
  max-width: 500px;
  height: auto;
  margin: 0 auto;
}
.tf2__hand {
  font-family: 'Caveat', 'Bradley Hand', cursive;
}
.tf2__up {
  text-transform: uppercase;
}
.tf2__label {
  font-size: 20px;
  font-weight: 700;
}
.tf2__label--sm {
  font-size: 17px;
}
.tf2__note {
  font-size: 15px;
}
.tf2__q {
  font-family: 'Caveat', cursive;
  font-size: 22px;
  font-weight: 700;
  fill: #2d1b3d;
}
.tf2__together-txt {
  font-size: 18px;
  font-weight: 700;
}

/* Estado base = visible (lo que ve reduced-motion: nada oculto). */
.tf2__lum-node { opacity: var(--o, 0.7); }
.tf2__lum-node,
.tf2__known {
  transform-box: fill-box;
  transform-origin: center;
}

/* ── Animación: la red se dibuja; las certezas se rodean al final ───── */
@media (prefers-reduced-motion: no-preference) {
  .tf2__web { transition: opacity 0.6s ease; }
  .tf2:not(.tf2-in) .tf2__web { opacity: 0; }
  .tf2:not(.tf2-in) .tf2__lum-node { opacity: 0; }
  .tf2-in .tf2__lum-node { animation: tf2-pop 0.4s ease-out var(--d, 0s) backwards; }
  .tf2:not(.tf2-in) .tf2__known { opacity: 0; }
  .tf2-in .tf2__known { animation: tf2-ignite 0.8s ease-out var(--d, 0s) backwards; }
  .tf2:not(.tf2-in) .tf2__bridge { stroke-dasharray: 200; stroke-dashoffset: 200; }
  .tf2-in .tf2__bridge { animation: tf2-draw 1s ease 1.2s backwards; }
  @keyframes tf2-pop {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: var(--o, 0.7); transform: scale(1); }
  }
  @keyframes tf2-ignite {
    0% { opacity: 0; }
    60% { opacity: 1; }
    100% { opacity: 1; }
  }
  @keyframes tf2-draw { to { stroke-dashoffset: 0; } }
}
</style>
