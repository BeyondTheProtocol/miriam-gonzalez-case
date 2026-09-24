<script setup lang="ts">
/**
 * CargaTumoral — «la regla y el globo». La misma enfermedad hepática medida de dos formas entre
 * el 13-jul y el 8-sep-2026:
 *  · la REGLA es la suma RECIST del radiólogo (longitud en mm): se alarga un 8,8 %;
 *  · el GLOBO es el volumen tumoral que calcula un modelo (área ∝ ml): se hincha ×4,3, y dentro
 *    aparecen las lesiones contadas (9 → 20).
 * Al entrar en pantalla, las dos pasan de julio a septiembre a la vez: se ve de un golpe lo que
 * una tabla dice en dos números. Las cifras van escritas al lado (un área engaña si no se
 * rotula). La raya fina de la regla marca +20 %, el umbral de progresión de RECIST 1.1
 * (Eisenhauer 2009). Descriptivo: qué medida manda lo deciden sus médicos.
 */
import type { Lang } from '~/utils/datosCaso'

interface Medida { fecha: string; suma_mm?: number; ml?: number; n_lesiones?: number }
const props = defineProps<{ recist: Medida[]; volumen: Medida[]; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const { armado, visto } = useAlVer(caja, 0.4)
const f = ref(1) // 0 = julio, 1 = septiembre (estado final si no hay animación)
watch(armado, (a) => { if (a && !visto.value) f.value = 0 })
watch(visto, (v) => { if (!v) return; f.value = 0; setTimeout(() => tween(1800, (x) => { f.value = x }), 350) })

const r0 = computed(() => props.recist[0]); const r1 = computed(() => props.recist[props.recist.length - 1])
const v0 = computed(() => props.volumen[0]); const v1 = computed(() => props.volumen[props.volumen.length - 1])
const lerp = (a: number, b: number) => a + (b - a) * f.value

const geo = computed(() => {
  const w = W.value
  // regla: 0 mm a la izquierda; escala para que +20 % quepa
  const maxMm = (r0.value.suma_mm ?? 1) * 1.28
  const XR = (mm: number) => 12 + (mm / maxMm) * (w - 24)
  // globo: radio ∝ √ml, el de septiembre ocupa ~ 38 % del alto útil
  const rMax = Math.min(88, w * 0.26)
  const R = (ml: number) => rMax * Math.sqrt(ml / (v1.value.ml ?? 1))
  // el globo va DEBAJO de su título: centro = título + margen + radio máximo (no pisa el texto)
  const cy = 98 + rMax
  return { XR, R, cx: w / 2, cy, H: cy + rMax + 26, umbral: XR((r0.value.suma_mm ?? 0) * 1.2) }
})
const mm = computed(() => lerp(r0.value.suma_mm ?? 0, r1.value.suma_mm ?? 0))
const ml = computed(() => lerp(v0.value.ml ?? 0, v1.value.ml ?? 0))
const nLes = computed(() => Math.round(lerp(v0.value.n_lesiones ?? 0, v1.value.n_lesiones ?? 0)))
/** Lesiones como puntos dentro del globo, colocados en espiral (posición ilustrativa, no anatómica). */
const puntos = computed(() => Array.from({ length: nLes.value }, (_, i) => {
  const a = i * 2.39996
  const rr = geo.value.R(ml.value) * 0.78 * Math.sqrt((i + 0.5) / Math.max(nLes.value, 1))
  return { x: rc(geo.value.cx + rr * Math.cos(a)), y: rc(geo.value.cy + rr * Math.sin(a)), nuevo: i >= (v0.value.n_lesiones ?? 0) }
}))
const pct = (a: number, b: number) => `${b >= a ? '+' : ''}${numCaso(Math.round((b / a - 1) * 1000) / 10, props.lang)} %`
function otra() { f.value = 0; tween(1800, (x) => { f.value = x }) }
const fechaTxt = computed(() => (f.value < 0.5 ? fechaCorta(r0.value.fecha, props.lang) : fechaCorta(r1.value.fecha, props.lang)))
</script>

<template>
  <figure ref="caja" class="ct" :class="{ 'ct--armado': armado }">
    <svg :viewBox="`0 0 ${W} ${geo.H}`" :width="W" :height="geo.H" class="ct__svg" role="img"
         :aria-label="L(`Del ${fechaCorta(r0.fecha, 'es')} al ${fechaCorta(r1.fecha, 'es')}: suma RECIST ${r0.suma_mm} a ${r1.suma_mm} mm; volumen del modelo ${numCaso(v0.ml ?? 0, 'es')} a ${numCaso(v1.ml ?? 0, 'es')} ml; lesiones ${v0.n_lesiones} a ${v1.n_lesiones}.`,
                        `From ${fechaCorta(r0.fecha, 'en')} to ${fechaCorta(r1.fecha, 'en')}: RECIST sum ${r0.suma_mm} to ${r1.suma_mm} mm; model volume ${v0.ml} to ${v1.ml} ml; lesions ${v0.n_lesiones} to ${v1.n_lesiones}.`)">
      <!-- la regla -->
      <text x="12" y="16" class="ct__etq">{{ L('Suma RECIST (radiólogo)', 'RECIST sum (radiologist)') }}</text>
      <line :x1="geo.XR(0)" :x2="geo.XR(mm)" y1="34" y2="34" class="ct__regla" />
      <line v-for="t in [0, 20, 40, 60, 80]" :key="t" :x1="geo.XR(t)" :x2="geo.XR(t)" y1="28" y2="40" class="ct__marca" />
      <line :x1="geo.umbral" :x2="geo.umbral" y1="24" y2="46" class="ct__umbral" />
      <text :x="geo.umbral" y="58" text-anchor="middle" class="ct__umbral-txt">+20 %</text>
      <!-- la cifra, encima del final de la regla; la marca de +20 % queda libre debajo -->
      <text :x="geo.XR(mm)" y="22" text-anchor="end" class="ct__cifra nums">{{ Math.round(mm) }} mm</text>
      <!-- el globo -->
      <text x="12" y="84" class="ct__etq">{{ L('Volumen tumoral en el hígado (modelo)', 'Tumor volume in the liver (model)') }}</text>
      <circle :cx="geo.cx" :cy="geo.cy" :r="geo.R(v0.ml ?? 0)" class="ct__sombra" />
      <circle :cx="geo.cx" :cy="geo.cy" :r="geo.R(ml)" class="ct__globo" />
      <circle v-for="(p, i) in puntos" :key="i" :cx="p.x" :cy="p.y" :r="p.nuevo ? 3.2 : 2.6" :class="p.nuevo ? 'ct__les ct__les--nueva' : 'ct__les'" />
      <text :x="geo.cx" :y="geo.cy + 5" text-anchor="middle" class="ct__ml nums">{{ numCaso(Math.round(ml * 10) / 10, lang) }} ml</text>
      <text :x="geo.cx" :y="geo.H - 4" text-anchor="middle" class="ct__fecha nums">{{ fechaTxt }} · {{ nLes }} {{ L('lesiones', 'lesions') }}</text>
    </svg>
    <div class="ct__resumen">
      <p><strong class="nums">{{ pct(r0.suma_mm ?? 1, r1.suma_mm ?? 1) }}</strong> {{ L(`la suma RECIST (${r0.suma_mm} → ${r1.suma_mm} mm). RECIST llama progresión a partir de +20 %.`, `RECIST sum (${r0.suma_mm} → ${r1.suma_mm} mm). RECIST calls progression from +20%.`) }}</p>
      <p><strong class="nums">×{{ numCaso(Math.round(((v1.ml ?? 1) / (v0.ml ?? 1)) * 10) / 10, lang) }}</strong> {{ L(`el volumen del modelo (${numCaso(v0.ml ?? 0, lang)} → ${numCaso(v1.ml ?? 0, lang)} ml) y de ${v0.n_lesiones} a ${v1.n_lesiones} lesiones.`, `model volume (${v0.ml} → ${v1.ml} ml) and ${v0.n_lesiones} to ${v1.n_lesiones} lesions.`) }}</p>
      <button type="button" class="ct__otra" @click="otra">↻ {{ L('Verlo otra vez', 'Play again') }}</button>
    </div>
  </figure>
</template>

<style scoped>
.ct { margin: 0; }
.ct__svg { display: block; overflow: visible; }
.ct__etq { font: 600 12px var(--font-body); fill: var(--color-text-soft); }
.ct__regla { stroke: var(--color-text); stroke-width: 8; stroke-linecap: round; }
.ct__marca { stroke: var(--color-text); stroke-opacity: 0.35; }
.ct__umbral { stroke: var(--color-miriam); stroke-width: 2; stroke-dasharray: 3 2; }
.ct__umbral-txt { font: 700 10px var(--font-mono); fill: var(--color-miriam); }
.ct__cifra { font: 700 13px var(--font-mono); fill: var(--color-text); }
.ct__sombra { fill: none; stroke: var(--color-text); stroke-opacity: 0.35; stroke-dasharray: 4 3; }
.ct__globo { fill: var(--color-miriam); }
.ct__les { fill: var(--color-bg); fill-opacity: 0.75; }
.ct__les--nueva { fill: var(--color-bg); fill-opacity: 1; }
.ct__ml { font: 700 20px var(--font-display); fill: var(--color-bg); paint-order: stroke; stroke: rgb(var(--color-text-rgb) / 0.35); stroke-width: 2px; }
.ct__fecha { font: 600 12px var(--font-mono); fill: var(--color-text-soft); }
.ct__resumen { display: grid; gap: 4px; font: 400 13.5px/1.45 var(--font-body); color: var(--color-text); margin-top: 6px; }
.ct__resumen p { margin: 0; }
.ct__resumen strong { font-family: var(--font-mono); }
.ct__otra { justify-self: start; min-height: 44px; font: 700 13px var(--font-body); color: var(--color-miriam); text-decoration: underline; text-underline-offset: 3px; }
</style>
