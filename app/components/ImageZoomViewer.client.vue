<script setup lang="ts">
/**
 * Visor de imagen con ZOOM y PAN para los recortes PET/TC, los MIP, los
 * sagitales de fusión y demás imágenes reconstruidas de los DICOM.
 *  - rueda = zoom (hacia el cursor) · arrastre = pan · doble-clic / botón = reset
 *  - ratón + táctil (pinza) · teclado (+ − 0 y flechas) · límites de zoom 1×–6×
 *  - marcador opcional (diana) en (markerX, markerY) en fracción 0-1 de la imagen;
 *    se mantiene a tamaño constante en pantalla (contra-escala) y acompaña al pan/zoom.
 * Es un visor para MIRAR la imagen real; no añade interpretación.
 */
const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    markerX?: number | null
    markerY?: number | null
    approx?: boolean
    minZoom?: number
    maxZoom?: number
    initialZoom?: number
    maxWidth?: string
  }>(),
  { alt: '', markerX: null, markerY: null, approx: false, minZoom: 1, maxZoom: 6, initialZoom: 1, maxWidth: '420px' }
)

const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const frame = ref<HTMLElement | null>(null)
const scale = ref(props.initialZoom)
const tx = ref(0)
const ty = ref(0)

const hasMarker = computed(() => props.markerX != null && props.markerY != null)
const stageStyle = computed(() => ({
  transform: `translate(${tx.value.toFixed(2)}px, ${ty.value.toFixed(2)}px) scale(${scale.value.toFixed(3)})`,
}))
const zoomPct = computed(() => Math.round(scale.value * 100))

function clampPan() {
  const el = frame.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const minTx = w * (1 - scale.value)
  const minTy = h * (1 - scale.value)
  tx.value = Math.min(0, Math.max(minTx, tx.value))
  ty.value = Math.min(0, Math.max(minTy, ty.value))
}

function zoomAround(px: number, py: number, next: number) {
  const ns = Math.min(props.maxZoom, Math.max(props.minZoom, next))
  if (ns === scale.value) return
  // mantener fijo el punto bajo el cursor (origen de transform 0,0)
  const cx = (px - tx.value) / scale.value
  const cy = (py - ty.value) / scale.value
  scale.value = ns
  tx.value = px - cx * ns
  ty.value = py - cy * ns
  if (ns <= props.minZoom) { tx.value = 0; ty.value = 0 }
  clampPan()
}

function reset() { scale.value = props.minZoom; tx.value = 0; ty.value = 0 }

function centerOf() {
  const el = frame.value
  return el ? { x: el.clientWidth / 2, y: el.clientHeight / 2 } : { x: 0, y: 0 }
}
function zoomBtn(factor: number) { const c = centerOf(); zoomAround(c.x, c.y, scale.value * factor) }

function onWheel(e: WheelEvent) {
  const el = frame.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18
  zoomAround(e.clientX - rect.left, e.clientY - rect.top, scale.value * factor)
}

/* ---- puntero: arrastre (1 dedo) + pinza (2 dedos) ---- */
const pointers = new Map<number, { x: number; y: number }>()
let dragging = false
let last = { x: 0, y: 0 }
let pinchStartDist = 0
let pinchStartScale = 1

function onPointerDown(e: PointerEvent) {
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) { dragging = true; last = { x: e.clientX, y: e.clientY } }
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y) || 1
    pinchStartScale = scale.value
    dragging = false
  }
}
function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size >= 2) {
    const el = frame.value
    if (!el) return
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
    const rect = el.getBoundingClientRect()
    const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top }
    zoomAround(mid.x, mid.y, pinchStartScale * (dist / pinchStartDist))
  } else if (dragging && scale.value > props.minZoom) {
    tx.value += e.clientX - last.x
    ty.value += e.clientY - last.y
    last = { x: e.clientX, y: e.clientY }
    clampPan()
  }
}
function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinchStartDist = 0
  if (pointers.size === 1) { const p = [...pointers.values()][0]; last = { x: p.x, y: p.y }; dragging = true }
  if (pointers.size === 0) dragging = false
}

function onKey(e: KeyboardEvent) {
  const step = 28
  if (e.key === '+' || e.key === '=') { zoomBtn(1.18); e.preventDefault() }
  else if (e.key === '-' || e.key === '_') { zoomBtn(1 / 1.18); e.preventDefault() }
  else if (e.key === '0') { reset(); e.preventDefault() }
  else if (e.key === 'ArrowUp' && scale.value > props.minZoom) { ty.value += step; clampPan(); e.preventDefault() }
  else if (e.key === 'ArrowDown' && scale.value > props.minZoom) { ty.value -= step; clampPan(); e.preventDefault() }
  else if (e.key === 'ArrowLeft' && scale.value > props.minZoom) { tx.value += step; clampPan(); e.preventDefault() }
  else if (e.key === 'ArrowRight' && scale.value > props.minZoom) { tx.value -= step; clampPan(); e.preventDefault() }
}

/* reset al cambiar de imagen O de foco (el sagital se reutiliza con marcador distinto) */
watch(() => [props.src, props.markerX, props.markerY], () => reset())
</script>

<template>
  <div class="izv mx-auto" :style="{ maxWidth: props.maxWidth }">
    <div
      ref="frame"
      class="izv-frame"
      :class="scale > minZoom ? 'cursor-grab' : 'cursor-zoom-in'"
      tabindex="0"
      role="group"
      :aria-label="(props.alt || L('Imagen', 'Image')) + ' — ' + L('visor con zoom', 'zoom viewer')"
      aria-describedby="izv-help"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
      @dblclick="reset"
      @keydown="onKey">
      <div class="izv-stage" :style="stageStyle">
        <img :src="props.src" :alt="props.alt" class="izv-img" draggable="false" loading="lazy" />
        <!-- diana: ubicación aproximada del foco -->
        <div v-if="hasMarker" class="izv-marker" :style="{ left: (props.markerX as number) * 100 + '%', top: (props.markerY as number) * 100 + '%' }">
          <div class="izv-marker__inner" :style="{ transform: `translate(-50%,-50%) scale(${(1 / scale).toFixed(3)})` }">
            <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="13" fill="none" stroke="#1a1320" stroke-width="4.5" />
              <circle cx="30" cy="30" r="13" fill="none" stroke="#ffd166" stroke-width="2.2" />
              <circle v-if="props.approx" cx="30" cy="30" r="13" fill="none" stroke="#ffd166" stroke-width="1.6" class="izv-pulse" />
              <g stroke="#ffd166" stroke-width="2" stroke-linecap="round">
                <line x1="30" y1="9" x2="30" y2="18" /><line x1="30" y1="42" x2="30" y2="51" />
                <line x1="9" y1="30" x2="18" y2="30" /><line x1="42" y1="30" x2="51" y2="30" />
              </g>
              <circle cx="30" cy="30" r="2.4" fill="#ffd166" stroke="#1a1320" stroke-width="0.8" />
            </svg>
          </div>
        </div>
      </div>

      <!-- controles -->
      <div class="izv-controls">
        <button type="button" class="izv-btn" @click.stop="zoomBtn(1.18)" :aria-label="L('Acercar', 'Zoom in')">+</button>
        <button type="button" class="izv-btn" @click.stop="zoomBtn(1 / 1.18)" :aria-label="L('Alejar', 'Zoom out')">−</button>
        <button type="button" class="izv-btn izv-btn--reset" @click.stop="reset" :aria-label="L('Restablecer el zoom', 'Reset zoom')">⟲</button>
      </div>
      <div class="izv-zoomlabel tabular-nums" aria-hidden="true">{{ zoomPct }}%</div>
    </div>

    <p id="izv-help" class="sr-only">
      {{ L('Imagen con zoom. Usa la rueda del ratón o el gesto de pinza para acercar y alejar; arrastra para desplazar; doble clic o el botón restablecer para volver. Con el teclado: + y − para el zoom, 0 para restablecer y las flechas para desplazar.',
            'Zoomable image. Use the mouse wheel or pinch gesture to zoom; drag to pan; double-click or the reset button to return. With the keyboard: + and − to zoom, 0 to reset and the arrow keys to pan.') }}
    </p>
  </div>
</template>

<style scoped>
.izv-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #000;
  touch-action: none;
  outline-offset: 2px;
}
.izv-frame:focus-visible { outline: 2px solid #9d44ab; }
.izv-stage {
  transform-origin: 0 0;
  will-change: transform;
}
.izv-img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}
.izv-marker { position: absolute; width: 0; height: 0; pointer-events: none; }
.izv-marker__inner { position: absolute; left: 0; top: 0; transform-origin: center; }
.izv-marker__inner svg { display: block; transform: translate(-50%, -50%); filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)); }
@keyframes izvPulse { 0% { opacity: 0.9; transform: scale(0.7); } 70% { opacity: 0; transform: scale(2); } 100% { opacity: 0; transform: scale(2); } }
.izv-pulse { transform-origin: 30px 30px; animation: izvPulse 1.8s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .izv-pulse { animation: none; opacity: 0.45; } }

.izv-controls {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 6px;
}
/* WCAG 2.2 (2.5.8) — botones de zoom con área táctil cómoda (44px en táctil,
   ≥34px en escritorio). Siempre por encima del mínimo de 24px. */
.izv-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.15s;
}
@media (pointer: coarse) {
  .izv-controls { gap: 8px; }
  .izv-btn { width: 44px; height: 44px; font-size: 20px; }
}
.izv-btn:hover { background: rgba(45, 27, 61, 0.95); }
.izv-btn:focus-visible { outline: 2px solid #ffd166; outline-offset: 1px; }
.izv-btn--reset { font-size: 15px; }
.izv-zoomlabel {
  position: absolute;
  left: 8px;
  bottom: 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #cfeee2;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}
</style>
