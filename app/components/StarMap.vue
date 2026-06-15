<template>
  <div>
    <!-- La frase con las cantidades, ENCIMA del mapa, en tipografía normal
         (hace de intro de la sección). -->
    <i18n-t
      v-if="donationCount && total"
      keypath="thanksWall.stars_line"
      tag="p"
      class="mb-4 text-tinta leading-relaxed max-w-2xl"
    >
      <template #star>
        <svg class="inline-block w-4 h-4" style="vertical-align: -0.08em" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="#ff6b47" d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z" />
        </svg>
      </template>
      <template #n>
        <strong class="font-semibold text-coral-deep nums">{{ donationCount }}</strong>
      </template>
      <template #total>
        <strong class="font-semibold text-coral-deep nums" style="white-space: nowrap">{{ total }}</strong>
      </template>
    </i18n-t>

    <!-- Carta celeste = la constelación REAL de Cáncer (el Cangrejo). Sus
         estrellas con nombre son el esqueleto; en el corazón, el Cúmulo del
         Pesebre (M44) reúne las aportaciones mayores (núcleo brillante), y las
         menores forman el halo. Lienzo con zoom y arrastre para deshacer el
         apelotonamiento. Decorativa para lectores de pantalla: los botones de
         zoom son operables por teclado y la tabla de abajo es la vía accesible
         a los datos. -->
    <div class="starmap-frame">
      <div
        ref="viewport"
        class="starmap-viewport"
        :style="{ touchAction: scale > 1 ? 'none' : 'pan-y' }"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <div
          ref="content"
          class="starmap-content"
          :class="{ 'is-still': still, 'starmap-content--spotlight': spotlight }"
          :style="contentStyle"
          aria-hidden="true"
        >
          <!-- Asterismo de Cáncer: líneas a lápiz entre las estrellas con nombre -->
          <svg class="starmap__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              v-for="(l, i) in asterism"
              :key="i"
              :d="l.d"
              fill="none"
              stroke="#9d44ab"
              stroke-width="1.1"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <!-- Aura del Pesebre (M44) -->
          <div class="starmap__beehive" :style="{ left: BEEHIVE.x + '%', top: BEEHIVE.y + '%' }" />

          <!-- Mecenas: las 5 mayores aportaciones marcan el dibujo de la constelación -->
          <svg
            v-for="a in patronSpikes"
            :key="'spike-patron-' + a.id"
            class="starmap__spike starmap__spike--patron"
            :style="{ left: a.x + '%', top: a.y + '%', width: a.size * 2.8 + 'px', height: a.size * 2.8 + 'px' }"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <path d="M20 2 V38 M2 20 H38" stroke="#ff6b47" stroke-width="1" stroke-linecap="round" :opacity="a.rank === 1 ? 0.55 : 0.35" />
          </svg>
          <svg
            v-for="a in anchorMarkers"
            :key="'anc-' + a.id"
            class="starmap__anchor starmap__anchor--patron"
            :class="{
              'starmap__anchor--patron-1': a.rank === 1,
              'starmap__star--lit': markerLit(a.id),
              'starmap__star--spotlight': spotlight && activeId === a.id,
            }"
            :style="{ left: a.x + '%', top: a.y + '%', width: a.size + 'px', height: a.size + 'px' }"
            viewBox="0 0 20 20"
          >
            <path :fill="a.rank === 1 ? '#ff6b47' : '#9d44ab'" :d="STAR_D" />
            <circle v-if="a.rank === 1" cx="10" cy="10" r="2.2" fill="#fff6fb" opacity="0.85" />
          </svg>

          <!-- Puntas de difracción + halo de las estrellas PRINCIPALES (detrás
               de los núcleos): la firma de las mayores aportaciones. -->
          <svg
            v-for="s in principals"
            :key="'spike-' + s.id"
            class="starmap__spike"
            :style="{ left: s.x + '%', top: s.y + '%', width: s.size * (2.2 + s.b * 1.7) + 'px', height: s.size * (2.2 + s.b * 1.7) + 'px' }"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <path d="M20 2 V38 M2 20 H38" stroke="#9d44ab" :stroke-width="0.7 + s.b * 0.5" stroke-linecap="round" :opacity="0.3 + s.b * 0.28" />
            <path v-if="s.eight" d="M8 8 L32 32 M32 8 L8 32" stroke="#9d44ab" stroke-width="0.6" stroke-linecap="round" :opacity="0.14 + s.b * 0.14" />
          </svg>

          <!-- Donantes: una estrella por aportación; importe → magnitud (brillo +
               tamaño) y cercanía al corazón. Principales/brillantes con halo. -->
          <svg
            v-for="s in fieldStars"
            :key="s.id"
            class="starmap__star"
            :class="[
              s.tier === 'principal' ? 'starmap__star--principal' : s.tier === 'bright' ? 'starmap__star--bright' : '',
              {
                'starmap__star--new': s.newest,
                'starmap__star--lit': markerLit(s.id),
                'starmap__star--spotlight': spotlight && activeId === s.id,
              },
            ]"
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
            <path :fill="s.newest ? '#ff6b47' : '#9d44ab'" :d="STAR_D" />
            <circle v-if="s.tier === 'principal' && !s.newest" cx="10" cy="10" :r="1.4 + s.b * 1.2" fill="#fff6fb" :opacity="0.7 + s.b * 0.2" />
          </svg>

          <!-- Anotaciones a mano (cuaderno) -->
          <span class="starmap__title" :style="{ left: '4%', top: '7%' }">Cáncer<small>la constelación</small></span>
          <span
            v-for="a in anchorMarkers"
            :key="'lbl-' + a.id"
            :class="['starmap__label', 'starmap__label--patron', a.side ? 'starmap__label--' + a.side : '']"
            :style="{ left: a.x + '%', top: a.y + '%' }"
          >{{ a.name }}</span>
          <span class="starmap__m44" :style="{ left: BEEHIVE.x + '%', top: BEEHIVE.y + '%' }">
            M44 · el Pesebre<small>{{ $t('thanksWall.m44_subtitle') }}</small>
          </span>
        </div>

        <!-- Quién encendió la estrella activa (fuera del transform: no se escala) -->
        <div v-if="active" class="starmap__tip" :style="tipStyle">
          <span class="starmap__tip-name">{{ active.name }}</span>
          <span class="starmap__tip-meta nums">{{ money(active) }} · {{ timeAgo(active.createdAt) }}</span>
        </div>

        <!-- Controles de zoom -->
        <div class="starmap__zoom" role="toolbar" :aria-label="$t('thanksWall.zoom_toolbar')">
          <button type="button" class="starmap__zoom-btn" :aria-label="$t('thanksWall.zoom_in')" @click="zoomBy(1.5)">
            <Icon name="ph:plus-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" class="starmap__zoom-btn" :aria-label="$t('thanksWall.zoom_out')" @click="zoomBy(1 / 1.5)">
            <Icon name="ph:minus-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
          <span class="starmap__zoom-sep" aria-hidden="true" />
          <button type="button" class="starmap__zoom-btn starmap__zoom-btn--reset" :aria-label="$t('thanksWall.zoom_reset')" @click="resetView">
            <Icon name="ph:compass-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <Nota v-if="anchorMarkers.length" class="mt-3">{{ $t('thanksWall.patrons_note') }}</Nota>
    <!-- Cómo se juega: nota de gesto (dedito), pequeña, bajo el mapa. -->
    <Nota icon="tap" class="mt-2">{{ $t('thanksWall.sky_hint') }}</Nota>
    <!-- Cómo leerlo: el brillo crece en escala log (✱ nota al margen). -->
    <Nota class="mt-2">{{ $t('thanksWall.magnitude_note') }}</Nota>

    <!-- El juego: tu estrella se enciende donando (solo el botón; el resto
         del texto se quitó — el pie manuscrito ya cuenta la historia). -->
    <div class="mt-4">
      <a
        :href="GOFUNDME_URL"
        target="_blank"
        rel="noopener"
        data-support-cta
        class="btn-secondary h-11"
        @click="trackSupport('constelacion')"
      >
        <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z"
          />
        </svg>
        {{ $t('thanksWall.sky_cta') }}
      </a>
      <p class="mt-2 text-xs text-tinta/80">{{ $t('thanksWall.sky_cta_note') }}</p>
    </div>

    <!-- Lectura accesible del concepto (el mapa es decorativo / aria-hidden). -->
    <p class="sr-only">{{ $t('thanksWall.sky_a11y', { n: donationCount }) }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Carta celeste = la constelación REAL de Cáncer (el Cangrejo, Y invertida).
 *  · CONCEPTO: «Cáncer» es también una constelación; aquí la dibujan las
 *    donaciones — se reapropia la palabra. En su corazón, el Cúmulo del Pesebre
 *    (M44/Praesepe, ~1000 estrellas reales) reúne las aportaciones mayores.
 *  · CRITERIO (por aportación, doble): el importe define el BRILLO (magnitud
 *    logarítmica, como en los catálogos estelares) y la CERCANÍA al corazón
 *    (las mayores al núcleo brillante del Pesebre; las menores, al halo).
 *    Ángulo estable por hash → tu estrella no se mueve.
 *  · CIENCIA: estrellas con nombre en posiciones relativas reales (Tarf β,
 *    Asellus Australis δ, Asellus Borealis γ, Acubens α, Iota ι) + asterismo.
 *  · ZOOM/PAN: rueda o pellizco para acercar, arrastre para mover, y botones
 *    +/−/reinicio operables por teclado. Un dedo NO se secuestra con el mapa
 *    alejado (touch-action: pan-y → la página sigue scrolleando); al acercar
 *    pasa a pan. Tap = enciende la estrella más cercana.
 *  · A11Y: lienzo aria-hidden + resumen sr-only; la tabla de DonationsWall es
 *    la vía accesible a los datos. Animaciones con prefers-reduced-motion.
 */
import type { PublicDonationSafe } from '../../utils/donationsPublic'

const props = defineProps<{ donations: PublicDonationSafe[]; total?: string }>()
const { t, locale } = useI18n()
const { GOFUNDME_URL, trackSupport } = useSupport()

const MAX_STARS = 2000

const STAR_D =
  'M10 1.6 C10.8 5,11.4 6.2,12.6 7.4 C14 8.8,16.4 9.4,18.4 10 C16.2 10.8,14.2 11.4,12.8 12.7 C11.5 13.9,10.9 15.7,10 18.4 C9.3 15.9,8.5 14.2,7.2 12.9 C5.8 11.6,3.4 10.7,1.6 10 C3.8 9.1,5.8 8.4,7.2 7.1 C8.4 6,9.2 4.2,10 1.6 Z'

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
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return h >>> 0
}
function penLine(x1: number, y1: number, x2: number, y2: number, rnd: () => number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const off = (rnd() * 2 - 1) * Math.min(2.5, len * 0.1)
  return `M${x1} ${y1} Q${(mx + (-dy / len) * off).toFixed(1)} ${(my + (dx / len) * off).toFixed(1)} ${x2} ${y2}`
}

// ── La constelación de Cáncer (Y invertida): 5 vértices fijos del dibujo. ──
const BEEHIVE = { x: 41, y: 48 }
const ANCHOR_SLOTS = [
  { key: 'tarf', x: 13, y: 78, mag: 3.5, side: '' },
  { key: 'asAus', x: 45, y: 60, mag: 3.9, side: 'below' },
  { key: 'asBor', x: 48, y: 34, mag: 4.7, side: '' },
  { key: 'iota', x: 53, y: 13, mag: 4.0, side: '' },
  { key: 'acubens', x: 85, y: 64, mag: 4.2, side: 'left' },
]

const donationCount = computed(() => props.donations.length)

const topPatrons = computed(() =>
  [...props.donations]
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, ANCHOR_SLOTS.length)
)

interface PatronMarker {
  id: string
  key: string
  name: string
  x: number
  y: number
  size: number
  rank: number
  side: string
  amount: number
  currencyCode?: string
  createdAt?: string
}

const anchorMarkers = computed<PatronMarker[]>(() =>
  ANCHOR_SLOTS.map((slot, i) => {
    const d = topPatrons.value[i]
    const rank = i + 1
    const baseSize = Math.max(8, 17 - (slot.mag - 3.5) * 3)
    return {
      id: d ? String(d.id) : `slot-${slot.key}`,
      key: slot.key,
      name: d?.name ?? '—',
      x: slot.x,
      y: slot.y,
      size: +(rank === 1 ? baseSize + 5 : rank <= 2 ? baseSize + 2 : baseSize).toFixed(1),
      rank,
      side: slot.side,
      amount: d?.amount ?? 0,
      currencyCode: d?.currencyCode,
      createdAt: d?.createdAt,
    }
  }).filter((a) => a.amount > 0)
)

const patronSpikes = computed(() => anchorMarkers.value.filter((a) => a.rank <= 2))

const patronIds = computed(() => new Set(anchorMarkers.value.map((a) => a.id)))

const asterism = computed(() => {
  const by = Object.fromEntries(ANCHOR_SLOTS.map((a) => [a.key, a]))
  const rnd = mulberry32(7)
  const edges: [string, string][] = [
    ['iota', 'asBor'],
    ['asBor', 'asAus'],
    ['asAus', 'tarf'],
    ['asAus', 'acubens'],
  ]
  return edges.map(([p, q]) => ({ d: penLine(by[p]!.x, by[p]!.y, by[q]!.x, by[q]!.y, rnd) }))
})

interface Star {
  id: string
  x: number
  y: number
  size: number
  o: number
  rot: number
  newest: boolean
  tier: 'faint' | 'bright' | 'principal'
  b: number
  eight: boolean
  name: string
  amount: number
  currencyCode?: string
  createdAt?: string
}

const fieldStars = computed<Star[]>(() => {
  const ds = props.donations
    .filter((d) => !patronIds.value.has(String(d.id)))
    .slice(0, MAX_STARS)
  if (!ds.length) return []
  const amts = ds.map((d) => d.amount).filter((a) => a > 0)
  const sorted = [...amts].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0
  // Magnitud (brillo + tamaño) por importe en escala LOGARÍTMICA —como en los
  // catálogos estelares: ninguna estrella eclipsa a las demás—, normalizada
  // entre el p5 y el p98 para que un extremo no aplaste a todo el resto.
  const at = (f: number) =>
    sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * f)))]! : 1
  const lLo = Math.log(Math.max(1, at(0.05)))
  // Tope cerca del máximo (p99.7, robusto a un outlier suelto) para que la
  // cúspide —las mayores aportaciones— tenga recorrido propio de magnitud.
  const lHi = Math.log(Math.max(Math.max(1, at(0.05)) + 1, at(0.997)))
  // Percentil del importe (0 = menor, 1 = mayor) → cercanía al corazón.
  const pct = (a: number) => {
    if (sorted.length < 2) return 0.5
    let lo = 0
    let hi = sorted.length
    while (lo < hi) {
      const m = (lo + hi) >> 1
      if (sorted[m]! <= a) lo = m + 1
      else hi = m
    }
    return (lo - 1) / (sorted.length - 1)
  }
  let newestIdx = 0
  let newestT = -Infinity
  ds.forEach((d, i) => {
    const tt = new Date(d.createdAt ?? 0).getTime()
    if (tt > newestT) {
      newestT = tt
      newestIdx = i
    }
  })
  // Rebote en los bordes: si una estrella se sale, vuelve hacia dentro (el
  // clamp duro creaba columnas de estrellas pegadas a las paredes).
  const reflect = (v: number, min: number, max: number) => {
    if (v < min) v = min + (min - v)
    if (v > max) v = max - (v - max)
    return Math.max(min, Math.min(max, v))
  }
  return ds.map((d, i) => {
    const rnd = mulberry32(hashStr(String(d.id ?? `${d.name}-${d.createdAt ?? i}`)))
    // Radio desde el corazón: mayor importe → más cerca (núcleo del Pesebre).
    // Núcleo con algo más de aire (radio mínimo 8, jitter ±5) para que a
    // escala 1 sea un cúmulo denso pero no una masa sólida.
    const p = d.amount > 0 ? pct(d.amount) : rnd()
    const radius = 8 + (1 - p) * 38 + (rnd() - 0.5) * 10
    const ang = rnd() * Math.PI * 2
    let x = BEEHIVE.x + Math.cos(ang) * radius * 1.25
    let y = BEEHIVE.y + Math.sin(ang) * radius
    x = +reflect(x, 2, 98).toFixed(2)
    y = +reflect(y, 6, 94).toFixed(2)
    // Magnitud (0..1) por importe en log. Brillo con leve gamma (los medios
    // suben un punto) + jitter determinista ±0.025 para que el campo no salga
    // «en bandas». Tamaño también con gamma suave.
    const b = d.amount > 0 ? Math.min(1, Math.max(0, (Math.log(d.amount) - lLo) / (lHi - lLo || 1))) : 0.1
    const o = +Math.min(1, Math.max(0.26, 0.3 + Math.pow(b, 0.85) * 0.64 + (rnd() - 0.5) * 0.05)).toFixed(2)
    const size = +(3.2 + Math.pow(b, 0.9) * 13.3).toFixed(1)
    // Jerarquía por percentil: principales (≈top 1.5%) con halo + puntas de
    // difracción (las más brillantes, además, en 8 radios); brillantes (top 20%)
    // con halo suave; el resto, tenues.
    const tier: Star['tier'] = d.amount <= 0 ? 'faint' : p >= 0.99 ? 'principal' : p >= 0.85 ? 'bright' : 'faint'
    // Solo la cúspide (≈top 0.3%) luce 8 radios en vez de 4.
    const eight = tier === 'principal' && p >= 0.997
    const newest = i === newestIdx
    return {
      id: String(d.id ?? i),
      x,
      y,
      size: newest ? 17 : size,
      o: newest ? 1 : o,
      rot: +(rnd() * 44 - 22).toFixed(1),
      newest,
      tier,
      b: +b.toFixed(3),
      eight,
      name: d.name,
      amount: d.amount,
      currencyCode: d.currencyCode,
      createdAt: d.createdAt,
    }
  })
})

// Las principales (mayores aportaciones, salvo la recién encendida) llevan halo
// y puntas de difracción, dibujadas en una capa propia detrás de los núcleos.
const principals = computed(() => fieldStars.value.filter((s) => s.tier === 'principal' && !s.newest))

type MapMarker = Star | PatronMarker

function getMarker(id: string): MapMarker | null {
  return anchorMarkers.value.find((a) => a.id === id) ?? fieldStars.value.find((s) => s.id === id) ?? null
}

function markerLit(id: string) {
  return id === activeId.value || id === hoverId.value
}

/* ── Zoom + pan ───────────────────────────────────────────────────────── */
const viewport = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const MIN_S = 1
const MAX_S = 5

// Fluidez del zoom: mientras se interactúa (zoom/arrastre/pellizco) apagamos los
// halos (filter: drop-shadow) de las ~220 estrellas brillantes —se re-rasterizan
// en cada frame y son la causa del tirón— y los devolvemos ~220 ms tras soltar.
const still = ref(true)
let stillTimer: ReturnType<typeof setTimeout> | undefined
function bump() {
  if (still.value) still.value = false
  clearTimeout(stillTimer)
  stillTimer = setTimeout(() => (still.value = true), 220)
}

const contentStyle = computed(() => ({
  transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
}))

function clampPan() {
  const vp = viewport.value
  if (!vp) return
  const w = vp.clientWidth
  const h = vp.clientHeight
  tx.value = Math.min(0, Math.max(w * (1 - scale.value), tx.value))
  ty.value = Math.min(0, Math.max(h * (1 - scale.value), ty.value))
}
// Zoom hacia un punto (px relativo al viewport).
function zoomAt(factor: number, px: number, py: number) {
  bump()
  const ns = Math.min(MAX_S, Math.max(MIN_S, scale.value * factor))
  const k = ns / scale.value
  tx.value = px - (px - tx.value) * k
  ty.value = py - (py - ty.value) * k
  scale.value = ns
  clampPan()
}
function zoomBy(factor: number) {
  const vp = viewport.value
  if (!vp) return
  zoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2)
}
function resetView() {
  cancelFly()
  spotlight.value = false
  activeId.value = null
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

/* ── Buscar y enfocar una estrella (tabla / búsqueda por nombre) ─────── */
const spotlight = ref(false)
let flyRaf = 0

function cancelFly() {
  cancelAnimationFrame(flyRaf)
  flyRaf = 0
}

function normName(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function findIdByName(query: string): string | null {
  const q = normName(query)
  if (!q) return null
  const all = [...anchorMarkers.value, ...fieldStars.value]
  const exact = all.find((s) => normName(s.name) === q)
  if (exact) return exact.id
  const incl = all.find((s) => normName(s.name).includes(q))
  if (incl) return incl.id
  const words = q.split(/\s+/).filter(Boolean)
  if (!words.length) return null
  const wordHit = all.find((s) => {
    const n = normName(s.name)
    return words.every((w) => n.includes(w))
  })
  return wordHit?.id ?? null
}

function flyToId(id: string): boolean {
  const vp = viewport.value
  const ct = content.value
  const m = getMarker(id)
  if (!vp || !ct || !m) return false

  cancelFly()
  spotlight.value = true
  activeId.value = id
  hoverId.value = null

  const W = ct.clientWidth
  const H = ct.clientHeight
  const targetScale = Math.min(MAX_S, Math.max(2.8, scale.value))
  const starPxX = (m.x / 100) * W
  const starPxY = (m.y / 100) * H
  const targetTx = vp.clientWidth / 2 - starPxX * targetScale
  const targetTy = vp.clientHeight / 2 - starPxY * targetScale

  const startS = scale.value
  const startTx = tx.value
  const startTy = ty.value
  const t0 = performance.now()
  const dur = 480

  bump()
  function frame(now: number) {
    const t = Math.min(1, (now - t0) / dur)
    const ease = 1 - (1 - t) ** 3
    scale.value = startS + (targetScale - startS) * ease
    tx.value = startTx + (targetTx - startTx) * ease
    ty.value = startTy + (targetTy - startTy) * ease
    if (t < 1) flyRaf = requestAnimationFrame(frame)
    else {
      flyRaf = 0
      clampPan()
    }
  }
  flyRaf = requestAnimationFrame(frame)
  vp.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return true
}

function focusById(id: string | number): boolean {
  const sid = String(id)
  if (getMarker(sid)) return flyToId(sid)
  return false
}

function focusByName(query: string): boolean {
  const id = findIdByName(query)
  return id ? flyToId(id) : false
}

defineExpose({ focusById, focusByName })

let onWheel: ((e: WheelEvent) => void) | null = null
onMounted(() => {
  const vp = viewport.value
  if (!vp) return
  onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const r = vp.getBoundingClientRect()
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top)
  }
  vp.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => {
  if (viewport.value && onWheel) viewport.value.removeEventListener('wheel', onWheel)
  cancelAnimationFrame(raf)
  cancelFly()
  clearTimeout(stillTimer)
})

/* ── Punteros: tap (selección), arrastre (pan), pellizco (zoom) ─────────── */
const ptrs = new Map<number, { x: number; y: number }>()
let downX = 0
let downY = 0
let moved = false
let pinchDist = 0
let pinchMid = { x: 0, y: 0 }

function onDown(e: PointerEvent) {
  bump()
  ;(e.target as Element).setPointerCapture?.(e.pointerId)
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  downX = e.clientX
  downY = e.clientY
  moved = false
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()]
    pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    pinchMid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }
  }
}
function onMove(e: PointerEvent) {
  if (!ptrs.has(e.pointerId)) {
    // Hover (ratón) sobre el cielo: resalta la estrella más cercana.
    if (e.pointerType === 'mouse' && scale.value >= 1) hoverNearest(e)
    return
  }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (ptrs.size >= 2) {
    e.preventDefault()
    const [a, b] = [...ptrs.values()]
    const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }
    const r = viewport.value!.getBoundingClientRect()
    if (pinchDist > 0) zoomAt(dist / pinchDist, mid.x - r.left, mid.y - r.top)
    tx.value += mid.x - pinchMid.x
    ty.value += mid.y - pinchMid.y
    clampPan()
    pinchDist = dist
    pinchMid = mid
    return
  }

  // Un solo puntero
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true
  const isMouse = e.pointerType === 'mouse'
  if ((isMouse && e.buttons === 1) || (!isMouse && scale.value > 1)) {
    // Arrastre = pan (ratón siempre; táctil solo si estamos acercados).
    e.preventDefault()
    bump()
    tx.value += e.movementX || 0
    ty.value += e.movementY || 0
    clampPan()
  }
}
function onUp(e: PointerEvent) {
  const wasOne = ptrs.size === 1
  ptrs.delete(e.pointerId)
  if (ptrs.size < 2) pinchDist = 0
  if (wasOne && !moved) {
    const id = nearestIdAt(e.clientX, e.clientY)
    if (id === activeId.value) {
      activeId.value = null
      spotlight.value = false
    } else if (id) {
      flyToId(id)
    }
  }
}

/* ── Selección de estrella (tiene en cuenta el transform) ──────────────── */
const activeId = ref<string | null>(null)
const hoverId = ref<string | null>(null)
const active = computed(() => {
  const id = activeId.value ?? hoverId.value
  return id ? getMarker(id) : null
})

function nearestIdAt(clientX: number, clientY: number): string | null {
  const vp = viewport.value
  const ct = content.value
  if (!vp || !ct) return null
  const r = vp.getBoundingClientRect()
  const W = ct.clientWidth
  const H = ct.clientHeight
  const cx = (clientX - r.left - tx.value) / scale.value
  const cy = (clientY - r.top - ty.value) / scale.value
  let bestId: string | null = null
  let bd = Infinity
  const check = (m: { id: string; x: number; y: number; size: number }, boost = 1) => {
    const dx = (m.x / 100) * W - cx
    const dy = (m.y / 100) * H - cy
    const hit = (Math.max(16, m.size * 2.2) * boost) / scale.value
    const d2 = dx * dx + dy * dy
    if (d2 < hit * hit && d2 < bd) {
      bd = d2
      bestId = m.id
    }
  }
  for (const a of anchorMarkers.value) check(a, 1.35)
  for (const s of fieldStars.value) check(s)
  return bestId
}
let raf = 0
function hoverNearest(e: PointerEvent) {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    hoverId.value = nearestIdAt(e.clientX, e.clientY)
  })
}

function money(d: { amount: number; currencyCode?: string }) {
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: d.currencyCode || 'EUR',
    maximumFractionDigits: 0,
  }).format(d.amount)
}
function timeAgo(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const rtf = new Intl.RelativeTimeFormat(locale.value === 'es' ? 'es' : 'en', { numeric: 'auto' })
  const mins = Math.round((then - Date.now()) / 60000)
  const hours = Math.round(mins / 60)
  const days = Math.round(hours / 24)
  const months = Math.round(days / 30)
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  if (Math.abs(days) < 31) return rtf.format(days, 'day')
  return rtf.format(months, 'month')
}

// Globito: posición en pantalla de la estrella activa (con el transform aplicado).
const tipStyle = computed(() => {
  const s = active.value
  const ct = content.value
  if (!s || !ct) return { display: 'none' }
  const W = ct.clientWidth
  const H = ct.clientHeight
  const sx = tx.value + (s.x / 100) * W * scale.value
  const sy = ty.value + (s.y / 100) * H * scale.value
  const below = sy < 60
  return {
    left: Math.max(70, Math.min((viewport.value?.clientWidth ?? W) - 70, sx)) + 'px',
    top: sy + 'px',
    transform: below ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 14px))',
  }
})
</script>

<style scoped>
.starmap-frame {
  position: relative;
}
.starmap-viewport {
  position: relative;
  overflow: hidden;
  height: 400px;
  border-radius: 16px;
  border: 1px solid rgba(45, 27, 61, 0.12);
  cursor: grab;
  /* Papel de cuaderno cuadriculado (mismo lenguaje que «las dos caras»). */
  background-color: #fbf7ef;
  background-image:
    linear-gradient(rgba(45, 27, 61, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 27, 61, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}
.starmap-viewport:active {
  cursor: grabbing;
}
@media (min-width: 640px) {
  .starmap-viewport {
    height: 470px;
  }
}
.starmap-content {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.starmap__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.28;
}
.starmap__beehive {
  position: absolute;
  width: 150px;
  height: 150px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(157, 68, 171, 0.16) 0%, rgba(157, 68, 171, 0) 70%);
  pointer-events: none;
}
.starmap__anchor {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%);
  opacity: 0.95;
}
.starmap-content.is-still .starmap__anchor {
  filter: drop-shadow(0 0 5px rgba(157, 68, 171, 0.5));
}
.starmap__star {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%) rotate(var(--rot, 0deg));
  opacity: var(--o, 0.5);
  transition: opacity 0.25s ease;
}
/* Magnitud: las brillantes y principales ganan un halo (las mayores aportaciones). */
.starmap-content.is-still .starmap__star--bright {
  filter: drop-shadow(0 0 2.5px rgba(157, 68, 171, 0.42));
}
.starmap-content.is-still .starmap__star--principal {
  filter: drop-shadow(0 0 7px rgba(157, 68, 171, 0.6));
}
/* Puntas de difracción de las principales (capa propia, detrás de los núcleos). */
.starmap__spike {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.starmap__star--lit {
  opacity: 1;
  filter: drop-shadow(0 0 6px rgba(157, 68, 171, 0.85));
}
.starmap-content--spotlight .starmap__star:not(.starmap__star--lit) {
  opacity: 0.14;
}
.starmap__star--spotlight {
  opacity: 1 !important;
  filter: drop-shadow(0 0 10px rgba(255, 107, 71, 0.95)) drop-shadow(0 0 18px rgba(255, 107, 71, 0.45));
}
@media (prefers-reduced-motion: no-preference) {
  .starmap__star--spotlight {
    animation: star-spotlight 1.8s ease-in-out infinite;
  }
}
@keyframes star-spotlight {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(255, 107, 71, 0.85)) drop-shadow(0 0 14px rgba(255, 107, 71, 0.35));
  }
  50% {
    filter: drop-shadow(0 0 14px rgba(255, 107, 71, 1)) drop-shadow(0 0 24px rgba(255, 107, 71, 0.55));
  }
}
.starmap__star--new {
  filter: drop-shadow(0 0 7px rgba(255, 107, 71, 0.8));
}
.starmap__title {
  position: absolute;
  display: flex;
  flex-direction: column;
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-weight: 700;
  font-size: 30px;
  line-height: 0.9;
  color: #2d1b3d;
  pointer-events: none;
}
.starmap__title small {
  font-size: 14px;
  font-weight: 400;
  color: rgba(58, 51, 64, 0.7);
}
.starmap__label {
  position: absolute;
  transform: translate(10px, -22px);
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  color: rgba(58, 51, 64, 0.72);
  pointer-events: none;
}
.starmap__label--below {
  transform: translate(12px, 18px);
}
.starmap__label--left {
  transform: translate(-12px, -22px) translateX(-100%);
}
/* M44 anotado a la IZQUIERDA del aura, alineado a la derecha hacia el cúmulo
   (antes caía encima de la etiqueta de Asellus Australis). */
.starmap__m44 {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  transform: translate(-12px, -10px) translateX(-100%);
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: #bb4128;
  pointer-events: none;
}
.starmap__m44 small {
  font-size: 12px;
  font-weight: 400;
  color: rgba(58, 51, 64, 0.6);
}
.starmap__tip {
  position: absolute;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 230px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #2d1b3d;
  color: #faf6f0;
  pointer-events: none;
  box-shadow: 0 6px 18px rgba(45, 27, 61, 0.28);
}
.starmap__tip-name {
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-weight: 700;
  font-size: 19px;
  line-height: 1.1;
}
.starmap__tip-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(250, 246, 240, 0.78);
}
.starmap__anchor--patron {
  filter: drop-shadow(0 0 8px rgba(157, 68, 171, 0.65));
  z-index: 2;
}
.starmap__anchor--patron-1 {
  filter: drop-shadow(0 0 12px rgba(255, 107, 71, 0.75));
}
.starmap__label--patron {
  font-size: 16px;
  font-weight: 700;
  color: #2d1b3d;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Controles de zoom: barra segmentada (design system). */
.starmap__zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.14);
  background: rgba(250, 246, 240, 0.94);
  box-shadow: 0 4px 14px rgba(45, 27, 61, 0.1);
  backdrop-filter: blur(6px);
}
.starmap__zoom-sep {
  width: 1px;
  height: 22px;
  margin: 0 2px;
  background: rgba(45, 27, 61, 0.14);
}
.starmap__zoom-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #2d1b3d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.starmap__zoom-btn:hover {
  background: rgba(45, 27, 61, 0.08);
}
.starmap__zoom-btn--reset:hover {
  color: #ff6b47;
}
.starmap__zoom-btn:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
@keyframes star-ignite {
  0% { opacity: 0; }
  60% { opacity: 1; }
  100% { opacity: 0.9; }
}
@media (prefers-reduced-motion: no-preference) {
  .starmap__star--new {
    animation: star-ignite 1.6s ease-out 0.4s backwards;
  }
}
</style>
