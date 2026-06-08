<template>
  <div>
    <!-- Cómo se juega: nota de gesto (dedito), antes del cielo. -->
    <Nota icon="tap" class="mb-3">{{ $t('thanksWall.sky_hint') }}</Nota>

    <!-- La carta celeste. Interactiva pero decorativa para lectores de
         pantalla: la tabla de abajo es la versión accesible de estos datos. -->
    <div
      ref="card"
      class="starmap"
      aria-hidden="true"
      @pointerdown="onTap"
      @pointermove="onMove"
      @pointerleave="hoverIdx = null"
    >
      <svg class="starmap__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
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

      <!-- Quién encendió la estrella activa -->
      <div v-if="active" class="starmap__tip" :style="tipStyle">
        <span class="starmap__tip-name">{{ active.name }}</span>
        <span class="starmap__tip-meta nums">{{ money(active) }} · {{ timeAgo(active.createdAt) }}</span>
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
  </div>
</template>

<script setup lang="ts">
/**
 * Carta celeste interactiva — 1 estrella = 1 aportación (todas, no muestra).
 *  · MOBILE FIRST: tocas en cualquier punto y se enciende la estrella MÁS
 *    CERCANA al dedo (un solo listener, sin dianas minúsculas); el scroll
 *    vertical sigue funcionando (touch-action: pan-y). Hover = extra desktop.
 *  · Posiciones estables por hash del id de la donación: tu estrella no se
 *    mueve aunque entren nuevas (importante para «encontrar la mía»).
 *  · Magnitud logarítmica por importe (Pogson) y líneas de vecindad, como
 *    en Constellation.vue. La más reciente es coral y se enciende al entrar.
 *  · aria-hidden: la tabla-catálogo de abajo es la vía accesible a los
 *    mismos datos; este mapa es su versión jugable.
 */
import type { PublicDonation } from '../../utils/fundraiser'

const props = defineProps<{ donations: PublicDonation[] }>()
const { locale } = useI18n()
const { GOFUNDME_URL, trackSupport } = useSupport()

const MAX_STARS = 2000 // techo de cordura para el DOM (efectivamente, todas)

// Estrella de 4 puntas dibujada a mano (brazos curvos y asimétricos): cada
// donación es una estrella garabateada en el cuaderno.
const STAR_D =
  'M10 1.6 C10.8 5,11.4 6.2,12.6 7.4 C14 8.8,16.4 9.4,18.4 10 C16.2 10.8,14.2 11.4,12.8 12.7 C11.5 13.9,10.9 15.7,10 18.4 C9.3 15.9,8.5 14.2,7.2 12.9 C5.8 11.6,3.4 10.7,1.6 10 C3.8 9.1,5.8 8.4,7.2 7.1 C8.4 6,9.2 4.2,10 1.6 Z'

// Traza una línea «a mano»: recta con leve curvatura perpendicular en el medio.
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
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return h >>> 0
}

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
    const t = new Date(d.createdAt ?? 0).getTime()
    if (t > newestT) {
      newestT = t
      newestIdx = i
    }
  })
  return ds.map((d, i) => {
    // OJO: d.id es numérico en el JSON real — hay que pasarlo a string para
    // que el hash itere sus caracteres (con un número devolvía siempre la
    // misma semilla y las 900+ estrellas se apilaban en el mismo punto).
    const rnd = mulberry32(hashStr(String(d.id ?? `${d.name}-${d.createdAt ?? i}`)))
    const x = +(2 + rnd() * 96).toFixed(2)
    const y = +(5 + rnd() * 90).toFixed(2)
    const o = +(0.35 + rnd() * 0.4).toFixed(2)
    let size = +(5 + rnd() * 5).toFixed(1)
    if (median > 0 && d.amount > 0) {
      // Magnitud (log): 6px en la mediana, ±2.2px por década de importe.
      size = +Math.min(12, Math.max(4.5, 6 + 2.2 * Math.log10(d.amount / median))).toFixed(1)
    }
    const newest = i === newestIdx
    return {
      id: String(d.id ?? i),
      x,
      y,
      size: newest ? 14 : size,
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

// Trazos de carta celeste: vecina previa más cercana (ventana acotada),
// distancia ponderada al formato apaisado del panel; pocas y finas.
const lines = computed(() => {
  const st = stars.value
  const rnd = mulberry32(424242)
  const out: { d: string }[] = []
  for (let i = 1; i < st.length && out.length < 160; i++) {
    let best = -1
    let bd = Infinity
    for (let j = Math.max(0, i - 60); j < i; j++) {
      const dx = st[i]!.x - st[j]!.x
      const dy = (st[i]!.y - st[j]!.y) * 2.5
      const d2 = dx * dx + dy * dy
      if (d2 < bd) {
        bd = d2
        best = j
      }
    }
    if (best >= 0 && bd < 49) {
      out.push({ d: penLine(st[i]!.x, st[i]!.y, st[best]!.x, st[best]!.y, rnd) })
    }
  }
  return out
})

/* ── Interacción: la estrella más cercana al puntero ───────────────── */
const card = ref<HTMLElement | null>(null)
const tapIdx = ref<number | null>(null)
const hoverIdx = ref<number | null>(null)
const activeIdx = computed(() => tapIdx.value ?? hoverIdx.value)
const active = computed(() =>
  activeIdx.value != null ? (stars.value[activeIdx.value] ?? null) : null
)

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

function onTap(e: PointerEvent) {
  const i = nearest(e)
  tapIdx.value = i === tapIdx.value ? null : i
}

let raf = 0
function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    hoverIdx.value = nearest(e)
  })
}
onBeforeUnmount(() => cancelAnimationFrame(raf))

// El globito, sin salirse del panel: clampa X y baja si la estrella está arriba.
const tipStyle = computed(() => {
  const s = active.value
  if (!s) return {}
  const left = Math.min(86, Math.max(14, s.x))
  const below = s.y < 24
  return {
    left: left + '%',
    top: s.y + '%',
    transform: below ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 12px))',
  }
})

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
  const rtf = new Intl.RelativeTimeFormat(locale.value === 'es' ? 'es' : 'en', {
    numeric: 'auto',
  })
  const mins = Math.round((then - Date.now()) / 60000)
  const hours = Math.round(mins / 60)
  const days = Math.round(hours / 24)
  const months = Math.round(days / 30)
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  if (Math.abs(days) < 31) return rtf.format(days, 'day')
  return rtf.format(months, 'month')
}
</script>

<style scoped>
.starmap {
  position: relative;
  height: 300px;
  border-radius: 16px;
  border: 1px solid rgba(45, 27, 61, 0.12);
  overflow: hidden;
  cursor: pointer;
  /* El tap selecciona, pero el scroll vertical del pulgar sigue pasando. */
  touch-action: pan-y;
  /* Papel de cuaderno cuadriculado (mismo lenguaje que «las dos caras»). */
  background-color: #fbf7ef;
  background-image:
    linear-gradient(rgba(45, 27, 61, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 27, 61, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}
@media (min-width: 640px) {
  .starmap {
    height: 380px;
  }
}
.starmap__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.14;
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
.starmap__star--new.starmap__star--lit {
  filter: drop-shadow(0 0 7px rgba(255, 107, 71, 0.85));
}
.starmap__tip {
  position: absolute;
  z-index: 2;
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
  /* Manuscrita: como un nombre anotado a mano junto a su estrella. */
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
