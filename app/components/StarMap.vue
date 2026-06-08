<template>
  <div>
    <!-- Cómo se juega: nota de gesto (dedito), antes del cielo. -->
    <Nota icon="tap" class="mb-3">{{ $t('thanksWall.sky_hint') }}</Nota>

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
        <div ref="content" class="starmap-content" :style="contentStyle" aria-hidden="true">
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

          <!-- Donantes: una estrella por aportación; importe → brillo y cercanía al corazón -->
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

          <!-- Anotaciones a mano (cuaderno) -->
          <span class="starmap__title" :style="{ left: '4%', top: '7%' }">Cáncer<small>la constelación</small></span>
          <span
            v-for="a in anchors"
            :key="'lbl-' + a.key"
            class="starmap__label"
            :style="{ left: a.x + '%', top: a.y + '%' }"
          >{{ a.name }}</span>
          <span class="starmap__m44" :style="{ left: BEEHIVE.x + '%', top: BEEHIVE.y + '%' }">M44 · el Pesebre<small>≈1000 estrellas</small></span>
        </div>

        <!-- Quién encendió la estrella activa (fuera del transform: no se escala) -->
        <div v-if="active" class="starmap__tip" :style="tipStyle">
          <span class="starmap__tip-name">{{ active.name }}</span>
          <span class="starmap__tip-meta nums">{{ money(active) }} · {{ timeAgo(active.createdAt) }}</span>
        </div>

        <!-- Controles de zoom (accesibles por teclado) -->
        <div class="starmap__zoom">
          <button type="button" :aria-label="$t('thanksWall.zoom_in')" @click="zoomBy(1.5)">+</button>
          <button type="button" :aria-label="$t('thanksWall.zoom_out')" @click="zoomBy(1 / 1.5)">−</button>
          <button type="button" :aria-label="$t('thanksWall.zoom_reset')" @click="resetView">⟲</button>
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
import type { PublicDonation } from '../../utils/fundraiser'

const props = defineProps<{ donations: PublicDonation[] }>()
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

// ── La constelación de Cáncer (Y invertida); tamaño del ancla por magnitud. ──
const BEEHIVE = { x: 41, y: 48 }
const anchors = [
  { key: 'tarf', name: 'Tarf', x: 13, y: 78, mag: 3.5 },
  { key: 'asAus', name: 'Asellus Australis', x: 45, y: 60, mag: 3.9 },
  { key: 'asBor', name: 'Asellus Borealis', x: 48, y: 34, mag: 4.7 },
  { key: 'iota', name: 'Iota Cnc', x: 53, y: 13, mag: 4.0 },
  { key: 'acubens', name: 'Acubens', x: 85, y: 64, mag: 4.2 },
].map((a) => ({ ...a, size: +Math.max(8, 17 - (a.mag - 3.5) * 3).toFixed(1) }))

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
  const sorted = [...amts].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0
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
  return ds.map((d, i) => {
    const rnd = mulberry32(hashStr(String(d.id ?? `${d.name}-${d.createdAt ?? i}`)))
    // Radio desde el corazón: mayor importe → más cerca (núcleo del Pesebre).
    const p = d.amount > 0 ? pct(d.amount) : rnd()
    const radius = 4 + (1 - p) * 44 + (rnd() - 0.5) * 6
    const ang = rnd() * Math.PI * 2
    let x = BEEHIVE.x + Math.cos(ang) * radius * 1.3
    let y = BEEHIVE.y + Math.sin(ang) * radius
    x = +Math.max(2, Math.min(98, x)).toFixed(2)
    y = +Math.max(6, Math.min(94, y)).toFixed(2)
    const o = +(0.42 + rnd() * 0.35).toFixed(2)
    let size = +(5 + rnd() * 3).toFixed(1)
    if (median > 0 && d.amount > 0) {
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

/* ── Zoom + pan ───────────────────────────────────────────────────────── */
const viewport = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const MIN_S = 1
const MAX_S = 5

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
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

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
})

/* ── Punteros: tap (selección), arrastre (pan), pellizco (zoom) ─────────── */
const ptrs = new Map<number, { x: number; y: number }>()
let downX = 0
let downY = 0
let moved = false
let pinchDist = 0
let pinchMid = { x: 0, y: 0 }

function onDown(e: PointerEvent) {
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
    const i = nearestAt(e.clientX, e.clientY)
    tapIdx.value = i === tapIdx.value ? null : i
  }
}

/* ── Selección de estrella (tiene en cuenta el transform) ──────────────── */
const tapIdx = ref<number | null>(null)
const hoverIdx = ref<number | null>(null)
const activeIdx = computed(() => tapIdx.value ?? hoverIdx.value)
const active = computed(() => (activeIdx.value != null ? (stars.value[activeIdx.value] ?? null) : null))

function nearestAt(clientX: number, clientY: number): number | null {
  const vp = viewport.value
  const ct = content.value
  if (!vp || !ct) return null
  const r = vp.getBoundingClientRect()
  const W = ct.clientWidth
  const H = ct.clientHeight
  // px del puntero → coordenadas de contenido (deshaciendo translate+scale)
  const cx = (clientX - r.left - tx.value) / scale.value
  const cy = (clientY - r.top - ty.value) / scale.value
  let best = -1
  let bd = Infinity
  const st = stars.value
  for (let i = 0; i < st.length; i++) {
    const dx = (st[i]!.x / 100) * W - cx
    const dy = (st[i]!.y / 100) * H - cy
    const d2 = dx * dx + dy * dy
    if (d2 < bd) {
      bd = d2
      best = i
    }
  }
  return best >= 0 ? best : null
}
let raf = 0
function hoverNearest(e: PointerEvent) {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    hoverIdx.value = nearestAt(e.clientX, e.clientY)
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
.starmap__m44 {
  position: absolute;
  display: flex;
  flex-direction: column;
  transform: translate(14px, 16px);
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
/* Controles de zoom: operables por teclado (foco visible). */
.starmap__zoom {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.starmap__zoom button {
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.18);
  background: rgba(250, 246, 240, 0.92);
  color: #2d1b3d;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.starmap__zoom button:hover {
  background: #f5efe6;
  border-color: rgba(45, 27, 61, 0.32);
}
.starmap__zoom button:focus-visible {
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
