<template>
  <section :aria-label="$t('twofaces.title')">
    <template v-if="!compact">
      <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
      <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
        {{ $t('twofaces.title') }}
      </h2>
      <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>
    </template>

    <!-- ESQUEMA (no retrato). Gramática rigurosa de alteraciones:
         · receptores en la membrana (HR+, HER2 tachado = negativo, SSTR2)
         · amplificación = copias apiladas + ×N, agrupadas en el clúster 11q13
         · mutación = rombo (ESR1, en ctDNA)
         · pérdida = gen roto y tachado (RB1)
         · gránulos Cg/Syn = lo que define el 80% neuroendocrino.
         Lo conocido es lo pequeño (mama luminal); lo que manda (80%) apenas se
         conoce. Bloquéalo por un lado y escapa por el otro → tratarlo entero. -->
    <figure class="tf2">
      <svg class="tf2__svg" viewBox="0 0 480 300" role="img" :aria-label="ariaLabel">
        <defs>
          <pattern id="tf2-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0 H0 V22" fill="none" stroke="rgba(45,27,61,0.06)" stroke-width="1" />
          </pattern>
          <clipPath id="tf2-field"><path :d="fieldPath" /></clipPath>
        </defs>

        <rect x="2" y="2" width="476" height="296" rx="14" fill="#faf6f0" stroke="rgba(45,27,61,0.16)" />
        <rect x="2" y="2" width="476" height="296" rx="14" fill="url(#tf2-grid)" />

        <g clip-path="url(#tf2-field)">
          <rect :x="FX - RX" :y="FY - RY" :width="BX - (FX - RX)" :height="2 * RY" fill="#9d44ab" opacity="0.08" />
          <rect :x="BX" :y="FY - RY" :width="FX + RX - BX" :height="2 * RY" fill="#2d1b3d" opacity="0.13" />
        </g>
        <path :d="fieldPath" fill="none" stroke="rgba(45,27,61,0.45)" stroke-width="2" stroke-linecap="round" />
        <path :d="seamPath" fill="none" stroke="rgba(45,27,61,0.3)" stroke-width="1.3" stroke-dasharray="2 5" />

        <!-- Gránulos Cg/Syn: definen el 80% NE -->
        <g fill="#2d1b3d" opacity="0.3">
          <circle v-for="(gr, i) in granules" :key="'gr' + i" :cx="gr.x" :cy="gr.y" :r="gr.r" />
        </g>
        <text x="312" y="150" text-anchor="middle" class="tf2__pct">{{ $t('twofaces.pct') }}</text>
        <text x="312" y="168" text-anchor="middle" class="tf2__cgsyn" translate="no">{{ $t('twofaces.cgsyn') }}</text>

        <!-- LUMINAL · amplicón 11q13 (amplificación = copias apiladas) -->
        <g>
          <rect v-for="c in 4" :key="'c' + c" :x="48 + (c - 1) * 3" y="84" width="2" height="9" rx="1" fill="#9d44ab" />
        </g>
        <text x="66" y="92" class="tf2__amp-head" translate="no">{{ $t('twofaces.amplicon') }}</text>
        <text x="48" y="110" class="tf2__amp-g" translate="no">{{ $t('twofaces.amplicon_g1') }}</text>
        <text x="48" y="126" class="tf2__amp-g" translate="no">{{ $t('twofaces.amplicon_g2') }}</text>

        <!-- LUMINAL · ESR1 (mutación = rombo) -->
        <path d="M52 146 l5 5 l-5 5 l-5 -5 z" fill="none" stroke="#9d44ab" stroke-width="1.6" />
        <text x="62" y="155" class="tf2__amp-g" translate="no">{{ $t('twofaces.esr1') }}</text>

        <!-- LUMINAL · receptores HR+ (presente) y HER2 (tachado = negativo) -->
        <g stroke="#9d44ab" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path :d="hrRec" />
        </g>
        <text :x="hr.x - 30" :y="hr.y - 6" class="tf2__rec-lab" translate="no">{{ $t('twofaces.hr') }}</text>
        <g stroke="#9d44ab" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.55">
          <path :d="her2Rec" />
        </g>
        <path :d="her2Slash" stroke="#bb4128" stroke-width="1.6" stroke-linecap="round" fill="none" />
        <text :x="her2.x - 44" :y="her2.y + 14" class="tf2__rec-lab tf2__rec-lab--off" translate="no">{{ $t('twofaces.her2') }}</text>

        <!-- NE · RB1 perdido (pérdida = gen roto + tachado) -->
        <path d="M294 98 h5 M303 98 h5" stroke="#bb4128" stroke-width="2" stroke-linecap="round" />
        <path d="M292 92 l16 12" stroke="#bb4128" stroke-width="1.6" stroke-linecap="round" />
        <text x="316" y="95" class="tf2__known-m" translate="no">{{ $t('twofaces.rb1') }}</text>
        <text x="316" y="109" class="tf2__known-n">{{ $t('twofaces.rb1_note') }}</text>

        <!-- NE · SSTR2 receptores (sobreexpresados → PRRT) -->
        <g stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path v-for="(r, i) in receptors" :key="'r' + i" :d="r" />
        </g>
        <text x="470" y="236" text-anchor="end" class="tf2__known-m" translate="no">{{ $t('twofaces.sstr2') }}</text>
        <text x="470" y="250" text-anchor="end" class="tf2__known-n">{{ $t('twofaces.sstr2_note') }}</text>

        <!-- Títulos (derecha en dos líneas → no chocan en móvil) -->
        <text x="34" y="26" class="tf2__head">{{ $t('twofaces.lum_head') }}</text>
        <text x="34" y="42" class="tf2__sub">{{ $t('twofaces.lum_sub') }}</text>
        <text x="470" y="24" text-anchor="end" class="tf2__head">{{ neHead[0] }}</text>
        <text x="470" y="40" text-anchor="end" class="tf2__head">{{ neHead[1] }}</text>

        <!-- Cierre -->
        <text x="240" y="278" text-anchor="middle" class="tf2__close">{{ $t('twofaces.close1') }}</text>
        <text x="240" y="295" text-anchor="middle" class="tf2__close tf2__close--coral">{{ $t('twofaces.close2') }}</text>
      </svg>
    </figure>

    <p class="sr-only">{{ $t('twofaces.sr') }}</p>
  </section>
</template>

<script setup lang="ts">
/**
 * «Un tumor con dos caras» — ESQUEMA de cuaderno (no un retrato de la célula),
 * riguroso pero aligerado. Gramática de alteraciones: receptores en la
 * membrana (HR+, HER2 tachado, SSTR2), amplificación = copias apiladas + ×N
 * agrupadas en el clúster 11q13, mutación = rombo (ESR1, ctDNA), pérdida = gen
 * roto (RB1), gránulos Cg/Syn = el 80% neuroendocrino. Lo conocido es pequeño;
 * lo que manda (80%) apenas se conoce → bloquéalo por un lado y escapa por el
 * otro, hay que tratarlo entero. «Diferenciación neuroendocrina», nunca
 * «neuroendocrino» a secas. viewBox fijo (mobile-first), texto real en sr-only.
 */
defineProps<{ compact?: boolean }>()

const { t, tm, rt } = useI18n()

const FX = 250
const FY = 130
const RX = 190
const RY = 80
const BX = 182 // frontera: luminal pequeño, pero con sitio para su genómica

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
function smoothClosed(pts: { x: number; y: number }[]) {
  const n = pts.length
  const P = (i: number) => pts[((i % n) + n) % n]!
  let d = `M${P(0).x.toFixed(1)} ${P(0).y.toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1)
    const p1 = P(i)
    const p2 = P(i + 1)
    const p3 = P(i + 2)
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}, ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d + ' Z'
}

const fieldPath = computed(() => {
  const rnd = mulberry32(99)
  const pts: { x: number; y: number }[] = []
  const N = 20
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const rr = 1 + (rnd() * 2 - 1) * 0.035
    pts.push({ x: FX + Math.cos(a) * RX * rr, y: FY + Math.sin(a) * RY * rr })
  }
  return smoothClosed(pts)
})
const seamPath = `M${BX - 2} ${FY - RY + 14} Q${BX + 8} ${FY} ${BX - 6} ${FY + RY - 14}`

// Receptor «Y» en un punto de la membrana, hacia fuera.
function recPath(px: number, py: number, nx: number, ny: number, len = 8) {
  const bx = px - nx * 2
  const by = py - ny * 2
  const tx = px + nx * len
  const ty = py + ny * len
  const perpx = -ny
  const perpy = nx
  return (
    `M${bx.toFixed(1)} ${by.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} ` +
    `M${tx.toFixed(1)} ${ty.toFixed(1)} L${(tx + perpx * 3.5 - nx).toFixed(1)} ${(ty + perpy * 3.5 - ny).toFixed(1)} ` +
    `M${tx.toFixed(1)} ${ty.toFixed(1)} L${(tx - perpx * 3.5 - nx).toFixed(1)} ${(ty - perpy * 3.5 - ny).toFixed(1)}`
  )
}
function onArc(deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: FX + Math.cos(a) * RX, y: FY + Math.sin(a) * RY, nx: Math.cos(a), ny: Math.sin(a) }
}
// HR+ (presente) y HER2 (tachado) sobre la membrana luminal (arco izquierdo)
const hr = onArc(206)
const hrRec = recPath(hr.x, hr.y, hr.nx, hr.ny)
const her2 = onArc(150)
const her2Rec = recPath(her2.x, her2.y, her2.nx, her2.ny)
const her2Slash = `M${(her2.x - 6).toFixed(1)} ${(her2.y - 12).toFixed(1)} l12 12`

// SSTR2 receptores sobreexpresados (arco derecho, NE)
const receptors = computed(() => {
  const out: string[] = []
  for (let i = 0; i < 6; i++) {
    const p = onArc(-46 + i * 18)
    out.push(recPath(p.x, p.y, p.nx, p.ny))
  }
  return out
})

// Gránulos Cg/Syn (textura del 80% NE), esquivando RB1, el rótulo y el borde.
const granules = computed(() => {
  const rnd = mulberry32(424242)
  const out: { x: number; y: number; r: number }[] = []
  let guard = 0
  while (out.length < 11 && guard < 6000) {
    guard++
    const x = BX + 16 + rnd() * (FX + RX - (BX + 34))
    const y = FY - RY + rnd() * (2 * RY)
    const inF = ((x - FX) / (RX - 16)) ** 2 + ((y - FY) / (RY - 14)) ** 2 <= 1
    const farRB1 = (x - 300) ** 2 + (y - 100) ** 2 > 28 * 28
    const farCenter = Math.abs(x - 312) > 48 || y < 130 || y > 178
    if (inF && farRB1 && farCenter) {
      out.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(1.5 + rnd() * 1).toFixed(1) })
    }
  }
  return out
})

const neHead = computed(() => {
  const h = t('twofaces.ne_head')
  // dos líneas para no chocar con el título izquierdo en móvil
  return h.includes(' ') ? [h.split(' ')[0]!, h.split(' ').slice(1).join(' ')] : [h, '']
})

const ariaLabel = computed(() => t('twofaces.sr'))
</script>

<style scoped>
.tf2 {
  margin: 0;
}
.tf2__svg {
  display: block;
  width: 100%;
  max-width: 540px;
  height: auto;
  margin: 0 auto;
}
.tf2__head {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 17px;
  font-weight: 700;
  fill: #2d1b3d;
}
.tf2__sub {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  fill: #3a3340;
}
.tf2__amp-head {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  font-weight: 700;
  fill: #6a2475;
}
.tf2__amp-g {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  font-weight: 700;
  fill: #6a2475;
}
.tf2__rec-lab {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  font-weight: 700;
  fill: #6a2475;
}
.tf2__rec-lab--off {
  fill: #3a3340;
}
.tf2__known-m {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 16px;
  font-weight: 700;
  fill: #bb4128;
}
.tf2__known-n {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 12px;
  fill: #3a3340;
}
.tf2__pct {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 34px;
  font-weight: 700;
  fill: #2d1b3d;
  opacity: 0.3;
}
.tf2__cgsyn {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  font-weight: 700;
  fill: #2d1b3d;
  opacity: 0.4;
}
.tf2__close {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 18px;
  font-weight: 700;
  fill: #2d1b3d;
}
.tf2__close--coral {
  font-size: 16px;
  fill: #ff6b47;
}
</style>
