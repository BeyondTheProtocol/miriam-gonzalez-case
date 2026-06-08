<template>
  <section :aria-label="$t('twofaces.title')">
    <template v-if="!compact">
      <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
      <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
        {{ $t('twofaces.title') }}
      </h2>
      <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>
    </template>

    <!-- ESQUEMA claro (home, gente de a pie). Una célula, dos biologías que
         conviven: lo CONOCIDO es lo pequeño (mama luminal, con sus marcadores
         nombrados); lo que MANDA es el 80% neuroendocrino (Cg/Syn), apenas
         conocido — solo dos certezas: RB1 perdido (dispara el 80%) y SSTR2
         (receptores → PRRT). Bloquéalo por un lado y escapa por el otro →
         hay que tratarlo entero. El detalle genómico riguroso vive en /ciencia. -->
    <figure class="tf2">
      <svg class="tf2__svg" viewBox="0 0 480 288" role="img" :aria-label="ariaLabel">
        <defs>
          <pattern id="tf2-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0 H0 V22" fill="none" stroke="rgba(45,27,61,0.06)" stroke-width="1" />
          </pattern>
          <clipPath id="tf2-field"><path :d="fieldPath" /></clipPath>
        </defs>

        <rect x="2" y="2" width="476" height="284" rx="14" fill="#faf6f0" stroke="rgba(45,27,61,0.16)" />
        <rect x="2" y="2" width="476" height="284" rx="14" fill="url(#tf2-grid)" />

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
        <text x="324" y="150" text-anchor="middle" class="tf2__pct">{{ $t('twofaces.pct') }}</text>
        <text x="324" y="167" text-anchor="middle" class="tf2__cgsyn" translate="no">{{ $t('twofaces.cgsyn') }}</text>

        <!-- Lo conocido (luminal): un glifo por tipo de hallazgo —
             amplificación = círculo doble (copias), mutación = rombo,
             receptor = «Y» (HER2 tachado por negativo). Nombres legibles. -->
        <g v-for="(g, i) in genes" :key="'g' + i">
          <template v-if="g.t === 'amp'">
            <circle cx="58" :cy="gy(i)" r="4.5" fill="none" stroke="#9d44ab" stroke-width="1.4" />
            <circle cx="58" :cy="gy(i)" r="1.7" fill="#9d44ab" />
          </template>
          <path v-else-if="g.t === 'mut'" :d="diamond(58, gy(i))" fill="none" stroke="#9d44ab" stroke-width="1.4" />
          <template v-else>
            <path :d="recGlyph(58, gy(i))" fill="none" stroke="#9d44ab" stroke-width="1.5" stroke-linecap="round" />
            <path v-if="g.t === 'recneg'" :d="slash(58, gy(i))" stroke="#bb4128" stroke-width="1.5" stroke-linecap="round" />
          </template>
          <text x="72" :y="gy(i) + 4" class="tf2__genes" translate="no">{{ g.n }}</text>
        </g>

        <!-- Las dos certezas neuroendocrinas -->
        <circle cx="300" cy="96" r="4.5" fill="#ff6b47" />
        <path :d="rb1Ring" fill="none" stroke="#ff6b47" stroke-width="1.6" />
        <text x="320" y="92" class="tf2__known-m" translate="no">{{ $t('twofaces.rb1') }}</text>
        <text x="320" y="106" class="tf2__known-n">{{ $t('twofaces.rb1_note') }}</text>

        <!-- SSTR2 = receptores sobre la membrana NE (lo característico: siempre
             los tendrá; sobreexpresados → diana de la PRRT). Etiqueta pegada
             al racimo de receptores. -->
        <g stroke="#ff6b47" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path v-for="(r, i) in receptors" :key="'r' + i" :d="r" />
        </g>
        <text x="470" y="196" text-anchor="end" class="tf2__known-m" translate="no">{{ $t('twofaces.sstr2') }}</text>
        <text x="470" y="210" text-anchor="end" class="tf2__known-n">{{ $t('twofaces.sstr2_note') }}</text>

        <!-- Títulos (derecha en dos líneas → no chocan en móvil) -->
        <text x="34" y="26" class="tf2__head">{{ $t('twofaces.lum_head') }}</text>
        <text x="34" y="42" class="tf2__sub">{{ $t('twofaces.lum_sub') }}</text>
        <text x="470" y="24" text-anchor="end" class="tf2__head">{{ neHead[0] }}</text>
        <text x="470" y="41" text-anchor="end" class="tf2__head">{{ neHead[1] }}</text>
        <text x="470" y="57" text-anchor="end" class="tf2__sub">{{ $t('twofaces.ne_sub') }}</text>

        <!-- Cierre -->
        <text x="240" y="266" text-anchor="middle" class="tf2__close tf2__close--soft">{{ $t('twofaces.close1') }}</text>
        <text x="240" y="283" text-anchor="middle" class="tf2__close">{{ $t('twofaces.close2') }}</text>
      </svg>
    </figure>

    <p class="sr-only">{{ $t('twofaces.sr') }}</p>
  </section>
</template>

<script setup lang="ts">
/**
 * «Un tumor con dos caras» — ESQUEMA claro para la home (gente de a pie). Una
 * célula, dos biologías que conviven: lo conocido es lo pequeño (mama luminal,
 * marcadores nombrados); lo que manda es el 80% neuroendocrino (gránulos
 * Cg/Syn), apenas conocido — solo dos certezas: RB1 perdido (su pérdida dispara
 * el 80%) y SSTR2 (receptores → PRRT). Mensaje: bloquéalo por un lado y escapa
 * por el otro → tratarlo entero. «Diferenciación neuroendocrina», nunca
 * «neuroendocrino» a secas. El detalle genómico riguroso (amplicón 11q13 con
 * ×N, mutaciones, receptores) vive en /ciencia. viewBox fijo (mobile-first),
 * texto real en sr-only, sin animación (regla de calma).
 */
defineProps<{ compact?: boolean }>()

const { t } = useI18n()

const FX = 250
const FY = 128
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

function handRing(x: number, y: number, rx = 14, ry = 11) {
  const rnd = mulberry32(Math.round(x + y))
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - 0.5
    pts.push({ x: x + Math.cos(a) * rx + (rnd() * 2 - 1) * 1.1, y: y + Math.sin(a) * ry + (rnd() * 2 - 1) * 1.1 })
  }
  return smoothClosed(pts)
}
const rb1Ring = handRing(300, 96)

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
// SSTR2 sobreexpresados: racimo de receptores en el arco inferior-derecho (NE),
// junto a su etiqueta (para que se lean cerca).
const receptors = computed(() => {
  const out: string[] = []
  for (let i = 0; i < 5; i++) {
    const a = ((8 + i * 12) * Math.PI) / 180
    out.push(recPath(FX + Math.cos(a) * RX, FY + Math.sin(a) * RY, Math.cos(a), Math.sin(a)))
  }
  return out
})

// Marcadores conocidos del lado luminal, un glifo por tipo de hallazgo:
//  amp = amplificación (círculo doble = copias) · mut = mutación (rombo) ·
//  rec = receptor presente («Y») · recneg = receptor negativo («Y» tachado).
const genes = [
  { n: 'FGFR1', t: 'amp' },
  { n: 'CCND1', t: 'amp' },
  { n: 'ESR1', t: 'mut' },
  { n: 'HR+', t: 'rec' },
  { n: 'HER2−', t: 'recneg' },
]
function gy(i: number) {
  return 98 + i * 19
}
function diamond(x: number, y: number) {
  return `M${x} ${y - 4} l4 4 l-4 4 l-4 -4 z`
}
function recGlyph(x: number, y: number) {
  return `M${x} ${y + 5} L${x} ${y - 1} M${x} ${y - 1} L${x - 3.5} ${y - 5} M${x} ${y - 1} L${x + 3.5} ${y - 5}`
}
function slash(x: number, y: number) {
  return `M${x - 4} ${y + 3} L${x + 4} ${y - 5}`
}
// Gránulos Cg/Syn (el 80%), esquivando RB1, SSTR2, el rótulo central y el borde.
const granules = computed(() => {
  const rnd = mulberry32(424242)
  const out: { x: number; y: number; r: number }[] = []
  let guard = 0
  while (out.length < 9 && guard < 6000) {
    guard++
    const x = BX + 18 + rnd() * (FX + RX - (BX + 38))
    const y = FY - RY + rnd() * (2 * RY)
    const inF = ((x - FX) / (RX - 16)) ** 2 + ((y - FY) / (RY - 14)) ** 2 <= 1
    const farRB1 = (x - 300) ** 2 + (y - 96) ** 2 > 26 * 26
    const farCenter = Math.abs(x - 324) > 50 || y < 132 || y > 176
    const farLabel = !(x > 352 && y > 180 && y < 214)
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
.tf2__close {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 17px;
  font-weight: 700;
  fill: #2d1b3d;
}
.tf2__close--soft {
  font-weight: 400;
  fill: #3a3340;
}
</style>
