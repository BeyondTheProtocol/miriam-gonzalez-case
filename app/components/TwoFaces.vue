<template>
  <section :aria-label="$t('twofaces.title')">
    <template v-if="!compact">
      <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
      <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
        {{ $t('twofaces.title') }}
      </h2>
      <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>
    </template>

    <!-- ESQUEMA claro (home). Una célula, dos biologías que conviven. Receptores
         FUERA (membrana): HR+ presentes (lila), HER2 ausente (fantasma), SSTR2
         sobreexpresados (coral). ADN DENTRO: amplificaciones (FGFR1, CCND1) y
         mutación (ESR1). El 80% que manda (Cg/Syn) es lo que falta por conocer;
         RB1 es el freno que se está perdiendo. El detalle riguroso, en /ciencia. -->
    <figure class="tf2">
      <svg class="tf2__svg" viewBox="0 0 480 246" role="img" :aria-label="ariaLabel">
        <defs>
          <pattern id="tf2-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0 H0 V22" fill="none" stroke="rgba(45,27,61,0.06)" stroke-width="1" />
          </pattern>
          <clipPath id="tf2-field"><path :d="fieldPath" /></clipPath>
        </defs>

        <rect x="2" y="2" width="476" height="242" rx="14" fill="#faf6f0" stroke="rgba(45,27,61,0.16)" />
        <rect x="2" y="2" width="476" height="242" rx="14" fill="url(#tf2-grid)" />

        <g clip-path="url(#tf2-field)">
          <rect :x="FX - RX" :y="FY - RY" :width="BX - (FX - RX)" :height="2 * RY" fill="#9d44ab" opacity="0.08" />
          <rect :x="BX" :y="FY - RY" :width="FX + RX - BX" :height="2 * RY" fill="#2d1b3d" opacity="0.13" />
        </g>
        <path :d="fieldPath" fill="none" stroke="rgba(45,27,61,0.45)" stroke-width="2" stroke-linecap="round" />
        <path :d="seamPath" fill="none" stroke="rgba(45,27,61,0.3)" stroke-width="1.3" stroke-dasharray="2 5" />

        <!-- Gránulos Cg/Syn = el 80% neuroendocrino -->
        <g fill="#2d1b3d" opacity="0.28">
          <circle v-for="(gr, i) in granules" :key="'gr' + i" :cx="gr.x" :cy="gr.y" :r="gr.r" />
        </g>
        <text x="324" y="170" text-anchor="middle" class="tf2__pct">{{ $t('twofaces.pct') }}</text>
        <text x="324" y="187" text-anchor="middle" class="tf2__cgsyn" translate="no">{{ $t('twofaces.cgsyn') }}</text>

        <!-- Receptores hormonales HR+ (presentes, lila) en la membrana luminal -->
        <g stroke="#9d44ab" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path v-for="(r, i) in hrReceptors" :key="'hr' + i" :d="r" />
        </g>
        <text x="8" y="206" class="tf2__rec-lab" translate="no">HR+</text>
        <text x="8" y="220" class="tf2__rec-note">{{ $t('twofaces.hr_note') }}</text>
        <!-- HER2 negativo = NO lo tiene: receptor ausente. En GRIS (no es diana,
             no está) y punteado, frente al lila/coral de los que sí hay. -->
        <path :d="her2Ghost" fill="none" stroke="#8a857e" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 2" opacity="0.7" />
        <text x="8" y="110" class="tf2__rec-off" translate="no">HER2−</text>

        <!-- Alteraciones genómicas (dentro): amplificación = círculo doble (copias),
             mutación = rombo. -->
        <g v-for="(g, i) in genes" :key="'g' + i">
          <template v-if="g.t === 'amp'">
            <circle cx="104" :cy="gy(i)" r="4.5" fill="none" stroke="#9d44ab" stroke-width="1.4" />
            <circle cx="104" :cy="gy(i)" r="1.7" fill="#9d44ab" />
          </template>
          <path v-else :d="diamond(104, gy(i))" fill="none" stroke="#9d44ab" stroke-width="1.4" />
          <text x="116" :y="gy(i) + 4" class="tf2__genes" translate="no">{{ g.n }}</text>
        </g>

        <!-- RB1 = el freno que se está perdiendo (aro ROTO, no entero) -->
        <circle cx="300" cy="116" r="4.5" fill="#ff6b47" />
        <path :d="rb1Broken" fill="none" stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" />
        <text x="320" y="112" class="tf2__known-m" translate="no">{{ $t('twofaces.rb1') }}</text>
        <text x="320" y="126" class="tf2__known-n">{{ $t('twofaces.rb1_note') }}</text>

        <!-- SSTR2 = receptores sobreexpresados (coral) en la membrana NE -->
        <g stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path v-for="(r, i) in receptors" :key="'r' + i" :d="r" />
        </g>
        <text x="472" y="214" text-anchor="end" class="tf2__known-m" translate="no">{{ $t('twofaces.sstr2') }}</text>
        <text x="472" y="228" text-anchor="end" class="tf2__known-n">{{ $t('twofaces.sstr2_note') }}</text>

        <!-- Títulos (derecha en dos líneas + subtítulo, con aire) -->
        <text x="34" y="28" class="tf2__head">{{ $t('twofaces.lum_head') }}</text>
        <text x="34" y="44" class="tf2__sub">{{ $t('twofaces.lum_sub') }}</text>
        <text x="470" y="26" text-anchor="end" class="tf2__head">{{ neHead[0] }}</text>
        <text x="470" y="43" text-anchor="end" class="tf2__head">{{ neHead[1] }}</text>
        <text x="470" y="59" text-anchor="end" class="tf2__sub">{{ $t('twofaces.ne_sub') }}</text>
      </svg>

      <!-- Leyenda en lenguaje llano (ocupa el hueco del cierre): qué significa
           cada glifo, para que la gente lo entienda. Los mini-iconos mapean al
           dibujo. -->
      <figcaption class="tf2-legend">
        <!-- Receptores diana: dos colores (lila = HR, coral = SSTR2), los que SÍ hay -->
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 26 18" aria-hidden="true" style="width: 26px">
            <path d="M7 16 L7 9 M7 9 L4 5 M7 9 L10 5" fill="none" stroke="#9d44ab" stroke-width="1.5" stroke-linecap="round" />
            <path d="M18 16 L18 9 M18 9 L15 5 M18 9 L21 5" fill="none" stroke="#ff6b47" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          {{ $t('twofaces.legend_rec') }}
        </span>
        <!-- HER2: gris y punteado = el receptor que NO tiene -->
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 16 L9 9 M9 9 L5 4 M9 9 L13 4" fill="none" stroke="#8a857e" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 2" /></svg>
          {{ $t('twofaces.legend_her2') }}
        </span>
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="5" fill="none" stroke="#9d44ab" stroke-width="1.4" /><circle cx="9" cy="9" r="2" fill="#9d44ab" /></svg>
          {{ $t('twofaces.legend_amp') }}
        </span>
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3 l5 6 l-5 6 l-5 -6 z" fill="none" stroke="#9d44ab" stroke-width="1.4" /></svg>
          {{ $t('twofaces.legend_mut') }}
        </span>
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 18 18" aria-hidden="true"><path d="M13.5 5.2 A5 5 0 1 0 13.5 12.8" fill="none" stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" /></svg>
          {{ $t('twofaces.legend_rb1') }}
        </span>
        <!-- Cg·Syn: los puntitos = gránulos neuroendocrinos, el 80% -->
        <span class="tf2-legend__item">
          <svg class="tf2-legend__g" viewBox="0 0 18 18" aria-hidden="true" fill="#2d1b3d"><circle cx="6" cy="7" r="1.9" /><circle cx="12.5" cy="9.5" r="1.7" /><circle cx="8" cy="13" r="1.6" /></svg>
          {{ $t('twofaces.legend_cgsyn') }}
        </span>
      </figcaption>
    </figure>

    <p class="sr-only">{{ $t('twofaces.sr') }}</p>
  </section>
</template>

<script setup lang="ts">
/**
 * «Un tumor con dos caras» — ESQUEMA claro para la home. Receptores en la
 * membrana (HR+ presentes lila, HER2 ausente/fantasma, SSTR2 sobreexpresados
 * coral); alteraciones genómicas dentro (FGFR1/CCND1 amplificados, ESR1 mutado).
 * El 80% (Cg/Syn) es lo que manda y lo que falta por conocer; RB1 es el freno
 * que se está perdiendo (aro roto). Lo conocido es pequeño; lo dominante,
 * apenas conocido. El detalle riguroso (amplicón 11q13 con ×N, etc.) → /ciencia.
 * viewBox fijo (mobile-first), texto real en sr-only, sin animación (calma).
 */
defineProps<{ compact?: boolean }>()

const { t } = useI18n()

const FX = 250
const FY = 148
const RX = 192
const RY = 82
const BX = 178

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
function arcRec(deg: number) {
  const a = (deg * Math.PI) / 180
  return recPath(FX + Math.cos(a) * RX, FY + Math.sin(a) * RY, Math.cos(a), Math.sin(a))
}
const hrReceptors = computed(() => [156, 174, 192].map(arcRec))
const her2Ghost = arcRec(208)
const receptors = computed(() => [8, 20, 32, 44, 56].map(arcRec))

// RB1 = el freno: aro ROTO (abierto, con un hueco) = se está perdiendo.
const rb1Broken = (() => {
  const x = 300
  const y = 116
  const rx = 14
  const ry = 11
  const rnd = mulberry32(417)
  const pts: string[] = []
  const N = 12
  const shown = 9 // deja un hueco: el aro no cierra (freno partido)
  for (let i = 0; i <= shown; i++) {
    const a = (i / N) * Math.PI * 2 - 0.4
    pts.push(
      `${(x + Math.cos(a) * rx + (rnd() * 2 - 1) * 1.1).toFixed(1)} ${(y + Math.sin(a) * ry + (rnd() * 2 - 1) * 1.1).toFixed(1)}`
    )
  }
  return 'M' + pts.join(' L')
})()

const genes = [
  { n: 'FGFR1', t: 'amp' },
  { n: 'CCND1', t: 'amp' },
  { n: 'ESR1', t: 'mut' },
]
function gy(i: number) {
  return 120 + i * 22
}
function diamond(x: number, y: number) {
  return `M${x} ${y - 4} l4 4 l-4 4 l-4 -4 z`
}

// Gránulos Cg/Syn (el 80%), esquivando RB1, el rótulo central, el borde y la
// etiqueta de SSTR2.
const granules = computed(() => {
  const rnd = mulberry32(424242)
  const out: { x: number; y: number; r: number }[] = []
  let guard = 0
  while (out.length < 9 && guard < 6000) {
    guard++
    const x = BX + 18 + rnd() * (FX + RX - (BX + 38))
    const y = FY - RY + rnd() * (2 * RY)
    const inF = ((x - FX) / (RX - 16)) ** 2 + ((y - FY) / (RY - 14)) ** 2 <= 1
    const farRB1 = (x - 300) ** 2 + (y - 116) ** 2 > 26 * 26
    const farCenter = Math.abs(x - 324) > 50 || y < 152 || y > 196
    const farLabel = !(x > 352 && y > 198 && y < 232)
    if (inF && farRB1 && farCenter && farLabel) {
      out.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(1.5 + rnd() * 1).toFixed(1) })
    }
  }
  return out
})

const neHead = computed(() => {
  const h = t('twofaces.ne_head')
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
  font-size: 18px;
  font-weight: 700;
  fill: #2d1b3d;
}
.tf2__sub {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 13px;
  fill: #3a3340;
}
.tf2__genes {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 15px;
  font-weight: 700;
  fill: #6a2475;
}
.tf2__rec-lab {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 14px;
  font-weight: 700;
  fill: #6a2475;
}
.tf2__rec-note {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 11px;
  fill: #8a857e;
}
.tf2__rec-off {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 14px;
  font-weight: 700;
  fill: #8a857e;
}
.tf2__known-m {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 15px;
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
/* Leyenda en lenguaje llano bajo el esquema (sustituye al cierre). */
.tf2-legend {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px 18px;
  max-width: 540px;
  margin: 0.6rem auto 0;
  padding: 0 4px;
}
@media (min-width: 560px) {
  .tf2-legend {
    grid-template-columns: 1fr 1fr;
  }
}
.tf2-legend__item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  line-height: 1.35;
  color: #3a3340;
}
.tf2-legend__g {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
