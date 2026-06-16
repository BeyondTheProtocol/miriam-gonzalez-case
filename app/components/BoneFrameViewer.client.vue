<script setup lang="ts">
/**
 * Visor de fotogramas del hueso reconstruido del CT (arrastra para girar 360°,
 * flechas ←/→ para pasar de fotograma). Robusto: se ve en cualquier navegador
 * (no depende de WebGL). Dos fuentes, según `kind`:
 *  - 'vertebra' → /metastasis/vertebra/${KEY}-NN.jpg : el CT con la captación
 *    co-registrada (violeta = receptor/Galio · naranja = azúcar/FDG).
 *  - 'morfo'    → /metastasis/morfo/${KEY}-NN.jpg : la FORMA del hueso (densidad
 *    del CT), sin captación.
 *
 * Con `enhance` (para 'morfo'): el fotograma sale "todo blanco" y el blástico
 * (hueso denso/escleroso) no se distingue. Aquí remapeamos por canvas: estiramos
 * el contraste de la banda ósea (que vive comprimida en los claros) y aplicamos
 * un degradado de relieve — sombras→cálido (recovecos), altas luces→frío y claro
 * (hueso denso/blástico) — para que el relieve y las zonas densas SÍ se aprecien.
 * Es un realce de densidad/relieve del CT, ORIENTATIVO; no es una medida ni una
 * lectura biológica.
 */
const props = defineProps<{
  meshKey?: string
  kind: 'vertebra' | 'morfo'
  enhance?: boolean
}>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)

const NF = 12
const frame = ref(3)
const display = ref('')               // url cruda o dataURL realzado
const imgFailed = ref(false)
const enhCache = new Map<number, string>()

const rawSrc = (i: number) =>
  props.meshKey ? `/metastasis/${props.kind}/${props.meshKey}-${String(i).padStart(2, '0')}.jpg` : ''

/* ---------- realce de densidad/relieve (solo 'morfo' + enhance) ---------- */
const STOPS: [number, number[]][] = [
  [0.00, [74, 52, 33]],     // recoveco profundo · umbra cálida
  [0.28, [150, 120, 86]],   // bajo · tostado cálido
  [0.58, [225, 214, 190]],  // hueso normal · marfil
  [0.82, [238, 242, 250]],  // denso · marfil frío
  [1.00, [185, 210, 248]],  // blástico · realce claro y frío
]
const BG = [13, 17, 23]
function ramp(t: number): number[] {
  for (let s = 0; s < STOPS.length - 1; s++) {
    const [t0, a] = STOPS[s], [t1, b] = STOPS[s + 1]
    if (t <= t1) { const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f] }
  }
  return STOPS[STOPS.length - 1][1]
}
function enhanceMorfo(img: HTMLImageElement): string {
  const w = img.naturalWidth || 460, h = img.naturalHeight || 460
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const ctx = cv.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const idata = ctx.getImageData(0, 0, w, h), d = idata.data
  const N = w * h
  const lums = new Float32Array(N)
  const bone: number[] = []
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    const l = 0.2126 * d[p] + 0.7152 * d[p + 1] + 0.114 * d[p + 2]
    lums[i] = l
    if (l > 45) bone.push(l)
  }
  // estira la banda ósea (comprimida en los claros) a alto contraste
  bone.sort((a, b) => a - b)
  const lo = bone.length ? bone[Math.floor(bone.length * 0.02)] : 45
  let hi = bone.length ? bone[Math.floor(bone.length * 0.985)] : 255
  if (hi - lo < 1) hi = lo + 1
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    const l = lums[i]
    // borde suave hueso↔fondo (evita dentado): smoothstep en [38,52]
    let a = (l - 38) / 14; a = a < 0 ? 0 : a > 1 ? 1 : a; a = a * a * (3 - 2 * a)
    if (a <= 0) { d[p] = BG[0]; d[p + 1] = BG[1]; d[p + 2] = BG[2]; continue }
    let t = (l - lo) / (hi - lo); t = t < 0 ? 0 : t > 1 ? 1 : t; t = Math.pow(t, 0.72)
    const c = ramp(t)
    d[p] = BG[0] + (c[0] - BG[0]) * a
    d[p + 1] = BG[1] + (c[1] - BG[1]) * a
    d[p + 2] = BG[2] + (c[2] - BG[2]) * a
  }
  ctx.putImageData(idata, 0, 0)
  return cv.toDataURL('image/png')
}

function setDisplay() {
  const i = frame.value
  if (!props.meshKey) { display.value = ''; return }
  if (!props.enhance) { display.value = rawSrc(i); return }
  const cached = enhCache.get(i)
  if (cached) { display.value = cached; return }
  const img = new Image()
  img.onload = () => {
    try { const out = enhanceMorfo(img); enhCache.set(i, out); if (frame.value === i) display.value = out }
    catch { if (frame.value === i) display.value = rawSrc(i) }   // realce falla → fotograma crudo, digno
  }
  img.onerror = () => { if (frame.value === i) { imgFailed.value = true } }
  img.src = rawSrc(i)
}

watch(() => [props.meshKey, props.kind, props.enhance], () => { enhCache.clear(); imgFailed.value = false; setDisplay() })
watch(frame, setDisplay)
onMounted(setDisplay)

/* ---------- arrastrar para girar ---------- */
let drag = false, lx = 0, acc = 0
function down(e: PointerEvent) { drag = true; lx = e.clientX; acc = 0; (e.currentTarget as Element).setPointerCapture?.(e.pointerId) }
function move(e: PointerEvent) {
  if (!drag) return
  acc += e.clientX - lx; lx = e.clientX
  const step = Math.trunc(acc / 14)
  if (step !== 0) { frame.value = ((frame.value + step) % NF + NF) % NF; acc = 0 }
}
function up() { drag = false }
/* teclado: ←/→ pasa de fotograma (gira) */
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') { frame.value = ((frame.value - 1) % NF + NF) % NF; e.preventDefault() }
  else if (e.key === 'ArrowRight') { frame.value = ((frame.value + 1) % NF + NF) % NF; e.preventDefault() }
}
const dragHint = computed(() => L('arrastra o usa ←/→ para girar', 'drag or use ←/→ to rotate'))
</script>

<template>
  <div class="w-full">
    <div
      v-if="meshKey && !imgFailed"
      class="relative w-full select-none cursor-grab active:cursor-grabbing outline-none"
      style="aspect-ratio:5/4;background:#0d1117;border-radius:0.5rem;overflow:hidden"
      tabindex="0"
      role="img"
      :aria-label="kind === 'morfo'
        ? L('Forma del hueso reconstruida del CT, con realce de densidad. ' + dragHint, 'Bone shape reconstructed from the CT, with density enhancement. ' + dragHint)
        : L('Hueso del CT con la captación co-registrada. ' + dragHint, 'CT bone with co-registered uptake. ' + dragHint)"
      @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="up"
      @keydown="onKey"
    >
      <img
        v-if="display"
        :src="display"
        alt=""
        class="absolute inset-0 w-full h-full pointer-events-none"
        style="object-fit:contain;background:#0d1117"
        @error="imgFailed = true"
      >
      <div v-else class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="bfv-spin" />
      </div>
      <span class="bfv-hint">{{ dragHint }}</span>
    </div>

    <!-- sin fotogramas / error de carga: estado honesto -->
    <div
      v-else
      class="relative w-full flex items-center justify-center text-center text-[12px] px-5 leading-snug"
      style="aspect-ratio:5/4;background:#0d1117;border-radius:0.5rem;color:#aeb6c2"
    >
      {{ L('Sin reconstrucción 3D individual para este foco.', 'No individual 3D reconstruction for this focus.') }}
    </div>
  </div>
</template>

<style scoped>
.bfv-spin {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(174, 182, 194, 0.25);
  border-top-color: #c061d6;
  animation: bfv-rot 0.8s linear infinite;
}
@keyframes bfv-rot { to { transform: rotate(360deg); } }
.bfv-hint {
  position: absolute;
  left: 8px;
  bottom: 7px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: #cdd5e0;
  background: rgba(13, 17, 23, 0.55);
  padding: 2px 7px;
  border-radius: 999px;
  pointer-events: none;
}
.outline-none:focus-visible { outline: 2px solid #c061d6; outline-offset: 2px; }
</style>
