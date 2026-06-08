<template>
  <div>
    <!-- Cómo se juega: nota de gesto (dedito), antes del cielo. -->
    <Nota icon="tap" class="mb-3">{{ $t('thanksWall.sky_hint') }}</Nota>

    <!-- Carta celeste = la constelación REAL de Cáncer (el Cangrejo, una Y
         invertida). Sus estrellas con nombre (Tarf, los dos Asellus, Acubens,
         Iota) son el esqueleto; en el corazón, el Cúmulo del Pesebre (M44) es
         un nudo denso de donantes. Cada donación es una estrella; el asterismo
         se recorre deslizando. Decorativa para lectores de pantalla: la tabla
         de abajo y el resumen sr-only son la vía accesible a estos datos. -->
    <div class="starmap-frame">
      <div ref="scroller" class="starmap-scroll">
        <div
          ref="card"
          class="starmap-world"
          aria-hidden="true"
          :style="{ '--world-w': worldWidth + 'px' }"
          @pointerdown="onDown"
          @pointerup="onUp"
          @pointermove="onMove"
          @pointerleave="onLeave"
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

          <!-- Cúmulo del Pesebre (M44): aura tenue tras el enjambre de donantes -->
          <div class="starmap__beehive" :style="{ left: BEEHIVE.x + '%', top: BEEHIVE.y + '%' }" />

          <!-- Estrellas con nombre (anclas reales de la constelación) -->
          <svg
            v-for="a in anchors"
            :key="a.key"
            class="starmap__anchor"
            :style="{ left: a.x + '%', top: a.y + '%', width: a.size + 'px', height: a.size + 'px' }"
            viewBox="0 0 20 20"
          >
            <path fill="#9d44ab" :d="STAR_D" />
          </svg>

          <!-- Donantes: una estrella por aportación (el Pesebre concentra muchas) -->
          <svg
            v-for="(s, i) in stars"
            :key="s.id"
            class="starmap__star"
            :class="{ 'starmap__star--new': s.newest, 'starmap__star--lit': i === activeIdx }"
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
          </svg>

          <!-- Anotaciones a mano (cuaderno): título + nombres de estrellas + M44 -->
          <span class="starmap__title" :style="{ left: '4%', top: '7%' }">
            Cáncer<small>la constelación</small>
          </span>
          <span
            v-for="a in anchors"
            :key="'lbl-' + a.key"
            class="starmap__label"
            :style="{ left: a.x + '%', top: a.y + '%' }"
          >{{ a.name }}</span>
          <span class="starmap__m44" :style="{ left: BEEHIVE.x + '%', top: BEEHIVE.y + '%' }">
            M44 · el Pesebre<small>≈1000 estrellas</small>
          </span>

          <!-- Quién encendió la estrella activa -->
          <div v-if="active" class="starmap__tip" :style="tipStyle">
            <span class="starmap__tip-name">{{ active.name }}</span>
            <span class="starmap__tip-meta nums">{{ money(active) }} · {{ timeAgo(active.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- El juego: tu estrella se enciende donando. -->
    <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p class="text-sm text-tinta">{{ $t('thanksWall.sky_cta_pre') }}</p>
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
      <p class="text-xs text-tinta/80">{{ $t('thanksWall.sky_cta_note') }}</p>
    </div>

    <!-- Lectura accesible del concepto (el mapa es decorativo / aria-hidden). -->
    <p class="sr-only">{{ $t('thanksWall.sky_a11y', { n: stars.length }) }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Carta celeste = la constelación REAL de Cáncer (el Cangrejo, Y invertida).
 *  · CONCEPTO: «Cáncer» es también una constelación. Aquí la dibujan las
 *    donaciones — se reapropia la palabra. En su corazón, el Cúmulo del Pesebre
 *    (M44 / Praesepe, ~1000 estrellas reales) es el nudo denso de donantes.
 *  · CIENCIA: estrellas con nombre en sus posiciones relativas reales (Tarf β,
 *    Asellus Australis δ, Asellus Borealis γ, Acubens α, Iota ι) unidas por el
 *    asterismo; tamaño de las anclas por magnitud aparente. Donantes: magnitud
 *    logarítmica por importe (Pogson). Posiciones de donante estables por hash.
 *  · MOBILE FIRST: el mundo es más ancho que la pantalla y se recorre
 *    deslizando (scroll nativo; el gesto vertical sigue scrolleando la página).
 *    Tap = enciende la estrella más cercana; arrastre con ratón en desktop.
 *  · A11Y: aria-hidden + resumen sr-only; la tabla de DonationsWall es la vía
 *    accesible a los datos. Animaciones con prefers-reduced-motion.
 */
import type { PublicDonation } from '../../utils/fundraiser'

const props = defineProps<{ donations: PublicDonation[] }>()
const { t, locale } = useI18n()
const { GOFUNDME_URL, trackSupport } = useSupport()

const MAX_STARS = 2000

// Estrella de 4 puntas dibujada a mano (brazos curvos y asimétricos).
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

// ── La constelación de Cáncer: estrellas con nombre en posiciones relativas
//    reales (Y invertida) y su magnitud aparente → tamaño del ancla. ──────────
const BEEHIVE = { x: 40, y: 47 } // M44, entre los dos Asellus (el pesebre)
const anchors = [
  { key: 'tarf', name: 'Tarf', x: 13, y: 76, mag: 3.5 }, // β, la más brillante (pata SO)
  { key: 'asAus', name: 'Asellus Australis', x: 44, y: 58, mag: 3.9 }, // δ, centro
  { key: 'asBor', name: 'Asellus Borealis', x: 47, y: 33, mag: 4.7 }, // γ, al norte de δ
  { key: 'iota', name: 'Iota Cnc', x: 52, y: 13, mag: 4.0 }, // ι, vértice norte
  { key: 'acubens', name: 'Acubens', x: 84, y: 63, mag: 4.2 }, // α, la pinza (E)
].map((a) => ({ ...a, size: +Math.max(7, 16 - (a.mag - 3.5) * 3).toFixed(1) }))

// Asterismo: la Y invertida del Cangrejo (ι→γ→δ, y δ se bifurca a β y a α).
const asterism = computed(() => {
  const by = Object.fromEntries(anchors.map((a) => [a.key, a]))
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
  name: string
  amount: number
  currencyCode?: string
  createdAt?: string
}

const stars = computed<Star[]>(() => {
  const ds = props.donations.slice(0, MAX_STARS)
  if (!ds.length) return []
  const amts = ds.map((d) => d.amount).filter((a) => a > 0)
  const median = amts.length ? [...amts].sort((a, b) => a - b)[Math.floor(amts.length / 2)]! : 0
  let newestIdx = 0
  let newestT = -Infinity
  ds.forEach((d, i) => {
    const tt = new Date(d.createdAt ?? 0).getTime()
    if (tt > newestT) {
      newestT = tt
      newestIdx = i
    }
  })
  return ds.map((d, i) => {
    const rnd = mulberry32(hashStr(String(d.id ?? `${d.name}-${d.createdAt ?? i}`)))
    // ~30% caen en el Pesebre (Gaussiana ancha → cúmulo, no borrón); el resto,
    // cielo abierto repartido por todo el mundo (que es ancho → respira).
    let x: number
    let y: number
    if (rnd() < 0.3) {
      const gx = (rnd() + rnd() + rnd()) / 3 - 0.5
      const gy = (rnd() + rnd() + rnd()) / 3 - 0.5
      x = BEEHIVE.x + gx * 22
      y = BEEHIVE.y + gy * 38
    } else {
      x = 2 + rnd() * 96
      y = 8 + rnd() * 84
    }
    x = +Math.max(2, Math.min(98, x)).toFixed(2)
    y = +Math.max(6, Math.min(93, y)).toFixed(2)
    const o = +(0.4 + rnd() * 0.35).toFixed(2)
    let size = +(5 + rnd() * 3.5).toFixed(1)
    if (median > 0 && d.amount > 0) {
      // Magnitud (log): ~7px en la mediana, ±2.4px por década; tope < anclas.
      size = +Math.min(11, Math.max(4.5, 7 + 2.4 * Math.log10(d.amount / median))).toFixed(1)
    }
    const newest = i === newestIdx
    return {
      id: String(d.id ?? i),
      x,
      y,
      size: newest ? 18 : size,
      o: newest ? 1 : o,
      rot: +(rnd() * 44 - 22).toFixed(1),
      newest,
      name: d.name,
      amount: d.amount,
      currencyCode: d.currencyCode,
      createdAt: d.createdAt,
    }
  })
})

// El mundo se ensancha con el nº de estrellas: cuantas más, más cielo para que
// respiren (en vez de apelotonarse). Se explora deslizando.
const worldWidth = computed(() => Math.min(2600, Math.max(1180, Math.round(stars.value.length * 1.4))))

/* ── Interacción: la estrella (donante) más cercana al puntero ─────────── */
const card = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const tapIdx = ref<number | null>(null)
const hoverIdx = ref<number | null>(null)
const activeIdx = computed(() => tapIdx.value ?? hoverIdx.value)
const active = computed(() => (activeIdx.value != null ? (stars.value[activeIdx.value] ?? null) : null))

function nearest(e: PointerEvent): number | null {
  const el = card.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  const px = e.clientX - r.left
  const py = e.clientY - r.top
  let best = -1
  let bd = Infinity
  const st = stars.value
  for (let i = 0; i < st.length; i++) {
    const dx = (st[i]!.x / 100) * r.width - px
    const dy = (st[i]!.y / 100) * r.height - py
    const d2 = dx * dx + dy * dy
    if (d2 < bd) {
      bd = d2
      best = i
    }
  }
  return best >= 0 ? best : null
}

// Tap vs. arrastre: < 8px entre down y up es un tap; si no, exploraba el mapa.
let downX = 0
let downY = 0
let mousePanning = false
function onDown(e: PointerEvent) {
  downX = e.clientX
  downY = e.clientY
  mousePanning = e.pointerType === 'mouse'
}
function onUp(e: PointerEvent) {
  mousePanning = false
  if (Math.hypot(e.clientX - downX, e.clientY - downY) < 8) {
    const i = nearest(e)
    tapIdx.value = i === tapIdx.value ? null : i
  }
}
function onLeave() {
  hoverIdx.value = null
  mousePanning = false
}
let raf = 0
function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  if (mousePanning && e.buttons === 1 && scroller.value) {
    scroller.value.scrollLeft -= e.movementX
    return
  }
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    hoverIdx.value = nearest(e)
  })
}
onBeforeUnmount(() => cancelAnimationFrame(raf))

// Vista inicial centrada en el corazón (el Pesebre): abre con foco y revela cielo a los lados.
const centered = ref(false)
watch(
  stars,
  async (st) => {
    if (centered.value || !st.length) return
    await nextTick()
    const sc = scroller.value
    const world = card.value
    if (!sc || !world) return
    const x = (BEEHIVE.x / 100) * world.offsetWidth
    sc.scrollLeft = Math.max(0, Math.min(x - sc.clientWidth / 2, world.offsetWidth - sc.clientWidth))
    centered.value = true
  },
  { immediate: true }
)

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

// Globito sin salirse del mundo.
const tipStyle = computed(() => {
  const s = active.value
  if (!s) return {}
  const left = Math.min(92, Math.max(8, s.x))
  const below = s.y < 22
  return {
    left: left + '%',
    top: s.y + '%',
    transform: below ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 14px))',
  }
})
</script>

<style scoped>
/* Marco con fundidos en los bordes: pista de que el cielo continúa. */
.starmap-frame {
  position: relative;
}
.starmap-frame::before,
.starmap-frame::after {
  content: '';
  position: absolute;
  top: 1px;
  bottom: 1px;
  width: 26px;
  z-index: 4;
  pointer-events: none;
}
.starmap-frame::before {
  left: 1px;
  border-radius: 16px 0 0 16px;
  background: linear-gradient(90deg, #fbf7ef, rgba(251, 247, 239, 0));
}
.starmap-frame::after {
  right: 1px;
  border-radius: 0 16px 16px 0;
  background: linear-gradient(270deg, #fbf7ef, rgba(251, 247, 239, 0));
}
.starmap-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 16px;
  border: 1px solid rgba(45, 27, 61, 0.12);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(45, 27, 61, 0.25) transparent;
}
.starmap-world {
  position: relative;
  width: max(var(--world-w, 1180px), 100%);
  height: 400px;
  cursor: grab;
  /* Papel de cuaderno cuadriculado (mismo lenguaje que «las dos caras»). */
  background-color: #fbf7ef;
  background-image:
    linear-gradient(rgba(45, 27, 61, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 27, 61, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}
.starmap-world:active {
  cursor: grabbing;
}
@media (min-width: 640px) {
  .starmap-world {
    height: 440px;
  }
}
.starmap__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.28;
}
/* Aura del Pesebre (M44): halo suave que insinúa el cúmulo bajo el enjambre. */
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
  filter: drop-shadow(0 0 5px rgba(157, 68, 171, 0.5));
}
.starmap__star {
  position: absolute;
  display: block;
  transform: translate(-50%, -50%) rotate(var(--rot, 0deg));
  opacity: var(--o, 0.5);
  transition: opacity 0.25s ease, filter 0.25s ease;
}
.starmap__star--lit {
  opacity: 1;
  filter: drop-shadow(0 0 6px rgba(157, 68, 171, 0.85));
}
.starmap__star--new {
  filter: drop-shadow(0 0 7px rgba(255, 107, 71, 0.8));
}
.starmap__star--new.starmap__star--lit {
  filter: drop-shadow(0 0 9px rgba(255, 107, 71, 0.9));
}
/* Anotaciones manuscritas (cuaderno) */
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
  z-index: 3;
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
  z-index: 3;
}
.starmap__m44 {
  position: absolute;
  display: flex;
  flex-direction: column;
  transform: translate(14px, 20px);
  font-family: 'Caveat', 'Bradley Hand', cursive;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: #bb4128;
  pointer-events: none;
  z-index: 3;
}
.starmap__m44 small {
  font-size: 12px;
  font-weight: 400;
  color: rgba(58, 51, 64, 0.6);
}
.starmap__tip {
  position: absolute;
  z-index: 5;
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
