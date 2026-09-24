<script setup lang="ts">
/**
 * CargaTumoral — gráfico de pendiente, un solo eje (% de cambio desde el TC basal), para las dos
 * formas de medir la enfermedad hepática entre el 13-jul y el 8-sep-2026: la suma RECIST del
 * radiólogo y el volumen tumoral de un modelo de segmentación. Lo que enseña es la distancia
 * entre las dos. La raya de +20 % es el umbral de progresión de RECIST 1.1 (Eisenhauer 2009:
 * +20 % sobre el nadir y al menos 5 mm): se dibuja para que se lea dónde queda cada pendiente.
 * Es descriptivo: no dice cuál manda, eso es cosa de sus médicos.
 */
import type { Lang } from '~/utils/datosCaso'

interface Medida { fecha: string; suma_mm?: number; ml?: number; n_lesiones?: number; sello?: string }
const props = defineProps<{ recist: Medida[]; volumen: Medida[]; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const H = 230
const Y0 = 16
const Y1 = H - 50

const series = computed(() => {
  const r = props.recist.filter((m) => m.suma_mm != null)
  const v = props.volumen.filter((m) => m.ml != null)
  const out = []
  if (r.length >= 2) {
    const a = r[0].suma_mm!, b = r[r.length - 1].suma_mm!
    out.push({ k: 'r', a, b, pct: (b / a - 1) * 100, fa: r[0].fecha, fb: r[r.length - 1].fecha, u: 'mm',
      nombre: L('Suma RECIST (radiólogo)', 'RECIST sum (radiologist)'), sello: r[r.length - 1].sello })
  }
  if (v.length >= 2) {
    const a = v[0].ml!, b = v[v.length - 1].ml!
    out.push({ k: 'v', a, b, pct: (b / a - 1) * 100, fa: v[0].fecha, fb: v[v.length - 1].fecha, u: 'ml',
      nombre: L('Volumen tumoral hepático (modelo)', 'Liver tumor volume (model)'), sello: v[v.length - 1].sello,
      n: [v[0].n_lesiones, v[v.length - 1].n_lesiones] })
  }
  return out
})
const geo = computed(() => {
  const max = Math.max(40, ...series.value.map((s) => s.pct)) * 1.08
  const Y = linEscala(0, max, Y1, Y0)
  const xa = 40
  const xb = Math.max(150, Math.min(W.value - 230, Math.round(W.value * 0.6)))
  const ticks = [0, 20, 100, 200, 300, 400].filter((t) => t <= max).map((t) => ({ t, y: Y(t) }))
  return { Y, xa, xb, ticks, umbral: Y(20) }
})
const pctTxt = (p: number) => `${p >= 0 ? '+' : ''}${numCaso(Math.round(p * 10) / 10, props.lang)} %`
</script>

<template>
  <figure ref="caja" class="ct">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="ct__svg" role="img"
         :aria-label="series.map((s) => `${s.nombre}: ${pctTxt(s.pct)}`).join('. ')">
      <template v-for="tk in geo.ticks" :key="tk.t">
        <line :x1="geo.xa" :x2="W - 4" :y1="tk.y" :y2="tk.y" class="ct__rej" />
        <text :x="geo.xa - 5" :y="tk.y + 3.5" text-anchor="end" class="ct__tick">{{ tk.t ? `+${tk.t} %` : '0' }}</text>
      </template>
      <line :x1="geo.xa" :x2="W - 4" :y1="geo.umbral" :y2="geo.umbral" class="ct__umbral" />
      <text :x="geo.xa" :y="H - 4" text-anchor="middle" class="ct__tick">{{ series[0] ? fechaCorta(series[0].fa, lang) : '' }}</text>
      <text :x="geo.xb" :y="H - 4" text-anchor="end" class="ct__tick">{{ series[0] ? fechaCorta(series[0].fb, lang) : '' }}</text>
      <g v-for="s in series" :key="s.k">
        <line :x1="geo.xa" :x2="geo.xb" :y1="geo.Y(0)" :y2="geo.Y(s.pct)" :class="['ct__linea', { 'ct__linea--v': s.k === 'v' }]" />
        <circle :cx="geo.xa" :cy="geo.Y(0)" r="4.5" class="ct__p" />
        <path :d="pathForma(s.k === 'v' ? 'circulo' : 'cuadrado', geo.xb, geo.Y(s.pct), 5)" :class="['ct__p', { 'ct__p--v': s.k === 'v' }]" />
        <!-- la etiqueta de RECIST va DEBAJO de su punto: encima está la raya del +20 % -->
        <text :x="geo.xb + 10" :y="geo.Y(s.pct) + (s.k === 'r' ? 16 : -3)" class="ct__nombre">{{ s.nombre }}</text>
        <text :x="geo.xb + 10" :y="geo.Y(s.pct) + (s.k === 'r' ? 31 : 12)" class="ct__cifra nums">{{ pctTxt(s.pct) }} · {{ numCaso(s.a, lang) }} → {{ numCaso(s.b, lang) }} {{ s.u }}</text>
      </g>
    </svg>
    <p class="ct__ley"><svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" class="ct__umbral" /></svg>
      {{ L('+20 %: umbral de progresión de RECIST 1.1', '+20%: RECIST 1.1 progression threshold') }}</p>
  </figure>
</template>

<style scoped>
.ct { margin: 0; }
.ct__svg { display: block; overflow: visible; }
.ct__rej { stroke: var(--viz-rejilla); }
.ct__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.ct__umbral { stroke: var(--color-text); stroke-opacity: 0.6; stroke-dasharray: 5 4; }
.ct__ley { display: flex; align-items: center; gap: 6px; font: 400 12px var(--font-body); color: var(--color-text-soft); margin: 4px 0 0; }
.ct__linea { stroke: var(--viz-div-2); stroke-width: 2.5; }
.ct__linea--v { stroke: var(--color-miriam); stroke-width: 3; }
.ct__p { fill: var(--color-text); }
.ct__p--v { fill: var(--color-miriam); }
.ct__nombre { font: 600 11.5px var(--font-body); fill: var(--color-text); }
.ct__cifra { font: 700 12px var(--font-mono); fill: var(--color-text); }
</style>
