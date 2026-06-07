<template>
  <section :aria-label="$t('twofaces.title')">
    <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
    <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
      {{ $t('twofaces.title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>

    <!-- Data-art: una célula, dos caras. El conocimiento es luz. La cara luminal
         es una red densa y cartografiada; la neuroendocrina, casi a oscuras, con
         solo dos certezas encendidas (RB1, SSTR2). La asimetría es el mensaje. -->
    <figure ref="root" class="tf2" :class="{ 'tf2-in': inView }">
      <svg class="tf2__svg" viewBox="0 0 420 360" role="img" :aria-label="ariaLabel">
        <defs>
          <radialGradient id="tf2-lum" cx="32%" cy="42%" r="70%">
            <stop offset="0%" stop-color="#9d44ab" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#9d44ab" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="tf2-ne" cx="70%" cy="55%" r="70%">
            <stop offset="0%" stop-color="#2d1b3d" stop-opacity="0.30" />
            <stop offset="100%" stop-color="#2d1b3d" stop-opacity="0.06" />
          </radialGradient>
          <linearGradient id="tf2-seam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#9d44ab" />
            <stop offset="100%" stop-color="#ff6b47" />
          </linearGradient>
          <linearGradient id="tf2-bridge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#9d44ab" />
            <stop offset="100%" stop-color="#ff6b47" />
          </linearGradient>
        </defs>

        <!-- Membrana de la célula -->
        <circle :cx="cx" :cy="cy" :r="R" fill="none" stroke="rgba(45,27,61,0.14)" stroke-width="1" />
        <!-- Fondo de cada cara: luminal iluminada, neuroendocrina en penumbra -->
        <clipPath id="tf2-clip"><circle :cx="cx" :cy="cy" :r="R" /></clipPath>
        <g clip-path="url(#tf2-clip)">
          <rect :x="cx - R" :y="cy - R" :width="R" :height="2 * R" fill="url(#tf2-lum)" />
          <rect :x="cx" :y="cy - R" :width="R" :height="2 * R" fill="url(#tf2-ne)" />
        </g>

        <!-- Puentes: las dos certezas cruzan la costura hacia la red conocida
             (un mismo tumor, se tratan juntas) -->
        <line
          v-for="(b, i) in bridges"
          :key="'b' + i"
          class="tf2__bridge"
          :x1="b.x1"
          :y1="b.y1"
          :x2="b.x2"
          :y2="b.y2"
          stroke="url(#tf2-bridge)"
          stroke-width="1"
        />

        <!-- Red luminal: nodos conectados (biología cartografiada) -->
        <g class="tf2__web">
          <line
            v-for="(l, i) in webLines"
            :key="'l' + i"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            stroke="#9d44ab"
            stroke-width="0.8"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="(n, i) in lumNodes"
            :key="'n' + i"
            class="tf2__lum-node"
            :cx="n.x"
            :cy="n.y"
            :r="n.r"
            fill="#9d44ab"
            :style="{ '--o': String(n.o), '--d': (0.02 * i).toFixed(2) + 's' }"
          />
        </g>

        <!-- Cara neuroendocrina: lo desconocido (puntos huecos, sin conectar) -->
        <circle
          v-for="(u, i) in unknownNodes"
          :key="'u' + i"
          class="tf2__unknown"
          :cx="u.x"
          :cy="u.y"
          :r="u.r"
          fill="none"
          stroke="rgba(58,51,64,0.4)"
          stroke-width="0.8"
          stroke-dasharray="1.5 1.5"
        />

        <!-- Costura: la misma célula -->
        <line
          :x1="cx"
          :y1="cy - R + 6"
          :x2="cx"
          :y2="cy + R - 6"
          stroke="url(#tf2-seam)"
          stroke-width="1"
          stroke-opacity="0.5"
        />

        <!-- Las dos certezas: nodos coral encendidos, con halo -->
        <g
          v-for="(k, i) in knownNodes"
          :key="'k' + i"
          class="tf2__known"
          :style="{ '--d': (0.9 + 0.35 * i).toFixed(2) + 's' }"
        >
          <circle class="tf2__halo" :cx="k.x" :cy="k.y" r="13" fill="#ff6b47" />
          <circle :cx="k.x" :cy="k.y" r="5" fill="#ff6b47" />
          <text :x="k.lx" :y="k.ly" :text-anchor="k.anchor" class="tf2__label" translate="no">{{ k.m }}</text>
        </g>
      </svg>

      <!-- Pies de cara: la lectura, en palabras (legible siempre) -->
      <figcaption class="tf2__caps">
        <span class="tf2__cap">
          <span class="tf2__cap-dot" style="background:#9d44ab" aria-hidden="true" />
          <span><strong style="color:#6a2475">{{ $t('twofaces.lum_label') }}</strong> — {{ $t('twofaces.lum_status') }}</span>
        </span>
        <span class="tf2__cap">
          <span class="tf2__cap-dot" style="background:#ff6b47" aria-hidden="true" />
          <span><strong style="color:#bb4128">{{ $t('twofaces.ne_label') }}</strong> — {{ $t('twofaces.ne_status') }}</span>
        </span>
      </figcaption>
    </figure>

    <!-- Las dos certezas, nombradas, debajo del arte -->
    <ul class="tf2__certs">
      <li v-for="(k, i) in known" :key="i" class="tf2__cert">
        <span class="tf2__cert-m" translate="no">{{ k.m }}</span>
        <span class="tf2__cert-d">{{ k.d }}</span>
      </li>
    </ul>

    <p class="tf2__together">
      <svg class="tf2__together-mark" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z"
        />
      </svg>
      {{ $t('twofaces.together') }}
    </p>
  </section>
</template>

<script setup lang="ts">
/**
 * «Las dos caras» — data-art conceptual del tumor. Una célula partida en dos:
 *  · Cara luminal (magenta): red densa de nodos conectados = biología
 *    ampliamente cartografiada, con tratamiento estándar.
 *  · Cara neuroendocrina (coral): penumbra con puntos huecos (lo desconocido)
 *    y SOLO dos nodos encendidos — RB1 (motor de la transformación) y SSTR2
 *    (vía de radioligandos), las dos certezas ganadas a pulso y documentadas
 *    en /ciencia. Puentes cruzando la costura: un mismo tumor, se tratan juntas.
 * El conocimiento se codifica como densidad de luz: la asimetría es el dato.
 * Posiciones deterministas (PRNG). Mobile-first (SVG con viewBox), animaciones
 * con prefers-reduced-motion, role=img + aria-label (el texto da la lectura).
 */
const { t, tm, rt } = useI18n()

const R = 150
const cx = 200
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
function inCell(x: number, y: number, pad = 8) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= (R - pad) ** 2
}

interface Node { x: number; y: number; r: number; o: number }

// Las dos certezas, en posiciones fijas y agradables dentro de la cara NE.
const knownNodes = [
  { x: 300, y: 118, m: 'RB1', lx: 300, ly: 100, anchor: 'middle' as const },
  { x: 286, y: 232, m: 'SSTR2', lx: 286, ly: 254, anchor: 'middle' as const },
]

const geometry = computed(() => {
  const rnd = mulberry32(20240127)
  const lumNodes: Node[] = []
  let guard = 0
  while (lumNodes.length < 54 && guard < 6000) {
    guard++
    const x = cx - R + rnd() * R
    const y = cy - R + rnd() * (2 * R)
    if (x < cx - 7 && inCell(x, y)) {
      lumNodes.push({
        x: +x.toFixed(1),
        y: +y.toFixed(1),
        r: +(1.5 + rnd() * 2).toFixed(1),
        o: +(0.45 + rnd() * 0.5).toFixed(2),
      })
    }
  }
  // Red: cada nodo se une a su vecino previo más cercano (ventana acotada).
  const webLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 1; i < lumNodes.length; i++) {
    let best = -1
    let bd = Infinity
    for (let j = 0; j < i; j++) {
      const dx = lumNodes[i]!.x - lumNodes[j]!.x
      const dy = lumNodes[i]!.y - lumNodes[j]!.y
      const d = dx * dx + dy * dy
      if (d < bd) {
        bd = d
        best = j
      }
    }
    if (best >= 0 && bd < 40 * 40) {
      webLines.push({
        x1: lumNodes[i]!.x,
        y1: lumNodes[i]!.y,
        x2: lumNodes[best]!.x,
        y2: lumNodes[best]!.y,
      })
    }
  }
  // Lo desconocido (cara NE): puntos huecos dispersos, sin conexión.
  const unknownNodes: { x: number; y: number; r: number }[] = []
  guard = 0
  while (unknownNodes.length < 12 && guard < 6000) {
    guard++
    const x = cx + rnd() * R
    const y = cy - R + rnd() * (2 * R)
    const farFromKnown = knownNodes.every((k) => (k.x - x) ** 2 + (k.y - y) ** 2 > 30 * 30)
    if (x > cx + 9 && inCell(x, y, 12) && farFromKnown) {
      unknownNodes.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(1.3 + rnd() * 1.6).toFixed(1) })
    }
  }
  // Puentes: de cada certeza al nodo luminal más cercano (cruzan la costura).
  const bridges = knownNodes.map((k) => {
    let best = lumNodes[0]!
    let bd = Infinity
    for (const n of lumNodes) {
      const d = (n.x - k.x) ** 2 + (n.y - k.y) ** 2
      if (d < bd) {
        bd = d
        best = n
      }
    }
    return { x1: k.x, y1: k.y, x2: best.x, y2: best.y }
  })
  return { lumNodes, webLines, unknownNodes, bridges }
})
const lumNodes = computed(() => geometry.value.lumNodes)
const webLines = computed(() => geometry.value.webLines)
const unknownNodes = computed(() => geometry.value.unknownNodes)
const bridges = computed(() => geometry.value.bridges)

interface Known { m: string; d: string }
const known = computed<Known[]>(() => {
  const raw = tm('twofaces.ne_known') as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({
    m: rt((e as Record<string, unknown>).m as never),
    d: rt((e as Record<string, unknown>).d as never),
  }))
})

const ariaLabel = computed(() => {
  const lum = t('twofaces.lum_label') + ': ' + t('twofaces.lum_status')
  const ne = t('twofaces.ne_label') + ': ' + t('twofaces.ne_status')
  const certs = known.value.map((k) => k.m).join(', ')
  return `${lum} ${ne} (${certs}).`
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
  max-width: 460px;
  height: auto;
  margin: 0 auto;
}
.tf2__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  fill: #bb4128;
}
.tf2__bridge {
  opacity: 0.3;
}
.tf2__halo {
  opacity: 0.22;
}
/* Pies de cara */
.tf2__caps {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 30rem;
  margin: 0.5rem auto 0;
}
.tf2__cap {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 13px;
  line-height: 1.45;
  color: #3a3340;
}
.tf2__cap-dot {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  flex-shrink: 0;
  transform: translateY(1px);
}
/* Las dos certezas, nombradas */
.tf2__certs {
  list-style: none;
  padding: 0;
  margin: 1.25rem 0 0;
  display: grid;
  gap: 0.5rem;
}
@media (min-width: 640px) {
  .tf2__certs {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1.5rem;
  }
}
.tf2__cert {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding-left: 0.75rem;
  border-left: 2px solid #ff6b47;
}
.tf2__cert-m {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #bb4128;
  flex-shrink: 0;
}
.tf2__cert-d {
  font-size: 13px;
  line-height: 1.4;
  color: #3a3340;
}
.tf2__together {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.05rem;
  color: #2d1b3d;
}
.tf2__together-mark {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #ff6b47;
}

/* Estado base = visible (también es lo que ve reduced-motion: nada oculto). */
.tf2__lum-node { opacity: var(--o, 0.7); }
.tf2__lum-node,
.tf2__known {
  transform-box: fill-box; /* scale() gira sobre el centro del propio nodo */
  transform-origin: center;
}

/* ── Animación: la red luminal se enciende; las certezas, al final ──── */
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
