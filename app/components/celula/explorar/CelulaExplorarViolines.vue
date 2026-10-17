<script setup lang="ts">
/**
 * Violines propios (SVG, tokens del sistema), uno por grupo. En CADA fila, en la misma figura:
 *  · el violín del nivel (log10 CP10k) en las células donde el gen se detecta, con su mediana;
 *  · la barra de detección con el SUELO AMBIENTAL marcado (franja rayada): lo que no lo supera no
 *    cuenta como expresión;
 *  · el n del grupo y el número de células detectadas, a la vista.
 * Con menos de 3 células detectadas no se dibuja forma (sería inventarla): se ponen los puntos.
 * Sin animaciones. El estado no va solo en color: hay texto en cada fila y aria-label con las cifras.
 */
import type { FilaGrupo } from '~/utils/celulaExplorador'
import { densidad, fmtPct } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ filas: FilaGrupo[]; gen: string; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const uid = useId()

const W = 300, H = 40, BX = 340, BW = 140
const X0 = -12, ANCHO = BX + BW + 24
/** posición (%) de una x del viewBox, para colocar las etiquetas del eje en HTML */
const pos = (xv: number) => ((xv - X0) / ANCHO) * 100
const rango = computed<[number, number]>(() => {
  const todos = props.filas.flatMap((f) => f.niveles)
  if (!todos.length) return [0, 1]
  const a = Math.floor(Math.min(...todos)), b = Math.ceil(Math.max(...todos))
  return [a, b === a ? a + 1 : b]
})
const x = (v: number) => ((v - rango.value[0]) / (rango.value[1] - rango.value[0])) * W
const ticks = computed(() => { const [a, b] = rango.value; return Array.from({ length: b - a + 1 }, (_, k) => a + k) })
const fmt10 = (e: number) => { const v = 10 ** e; return v >= 1 ? String(Math.round(v)) : String(Number(v.toPrecision(1))).replace('.', props.lang === 'en' ? '.' : ',') }

function forma(f: FilaGrupo): string {
  if (f.niveles.length < 3) return ''
  const [a, b] = rango.value, m = 48
  const ys = densidad(f.niveles, a, b, m)
  const mitad = H / 2 - 3
  const arriba = ys.map((y, j) => `${(j / (m - 1)) * W},${H / 2 - y * mitad}`)
  const abajo = ys.map((y, j) => `${(j / (m - 1)) * W},${H / 2 + y * mitad}`).reverse()
  return `M${arriba.join('L')}L${abajo.join('L')}Z`
}
const mediana = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]! }
const nf = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, props.lang === 'en' ? ',' : '.')
</script>

<template>
  <div class="vio">
    <div class="vio__titulos" aria-hidden="true">
      <span :style="{ width: `${(W / (BX + BW)) * 100}%` }">{{ L('Nivel en las células donde se detecta (CP10k)', 'Level in cells where detected (CP10k)') }}</span>
      <span :style="{ width: `${(BW / (BX + BW)) * 100}%` }">{{ L('% de células donde se detecta', '% of cells where detected') }}</span>
    </div>
    <!-- ejes en HTML (no escalan con el viewBox: legibles también a 375 px) -->
    <div class="vio__eje" aria-hidden="true">
      <span v-for="tk in ticks" :key="tk" class="vio__tt" :style="{ left: `${pos(x(tk))}%` }">{{ fmt10(tk) }}</span>
      <span v-for="p in [0, 50, 100]" :key="`p${p}`" class="vio__tt" :style="{ left: `${pos(BX + (BW * p) / 100)}%` }">{{ p }}</span>
    </div>
    <ul class="vio__lista">
      <li v-for="f in filas" :key="f.id" class="vio__fila" :class="`vio__fila--${f.rol}`">
        <div class="vio__cab">
          <span class="vio__nombre">{{ etiqueta(ETIQUETA_GRUPO, f.id, lang) }}</span>
          <span class="vio__n nums">n = {{ nf(f.n) }}</span>
        </div>
        <svg class="vio__svg" :viewBox="`${X0} 0 ${ANCHO} ${H}`" aria-hidden="true">
          <defs>
            <pattern :id="`${uid}-raya`" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" class="vio__raya" />
            </pattern>
          </defs>
          <line x1="0" :x2="W" :y1="H / 2" :y2="H / 2" class="vio__base" />
          <path v-if="forma(f)" :d="forma(f)" class="vio__forma" />
          <template v-else>
            <circle v-for="(v, k) in f.niveles" :key="k" :cx="x(v)" :cy="H / 2" r="3" class="vio__punto" />
          </template>
          <line v-if="mediana(f.niveles) != null" :x1="x(mediana(f.niveles)!)" :x2="x(mediana(f.niveles)!)" :y1="H / 2 - 9" :y2="H / 2 + 9" class="vio__mediana" />
          <!-- detección y suelo ambiental, en la misma figura -->
          <rect :x="BX" y="12" :width="BW" height="16" class="vio__marco" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.frac)" height="16" class="vio__det" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.suelo)" height="16" :fill="`url(#${uid}-raya)`" class="vio__suelo" />
          <line :x1="BX + BW * Math.min(1, f.suelo)" :x2="BX + BW * Math.min(1, f.suelo)" y1="8" y2="32" class="vio__suelo-linea" />
        </svg>
        <p class="vio__txt nums">
          {{ L(`Detectado ${fmtPct(f.frac, 'es')} (${nf(f.detectadas)}) · suelo ${fmtPct(f.suelo, 'es')}`, `Detected ${fmtPct(f.frac, 'en')} (${nf(f.detectadas)}) · floor ${fmtPct(f.suelo, 'en')}`) }}<template v-if="mediana(f.niveles) != null"> · {{ L('mediana', 'median') }} {{ fmt10(mediana(f.niveles)!) }} CP10k</template>
          <template v-if="f.detectadas < 3"> · {{ L('pocas células para dibujar la forma', 'too few cells to draw a shape') }}</template>
        </p>
      </li>
    </ul>
    <p class="vio__leyenda">
      <span class="vio__muestra vio__muestra--raya" aria-hidden="true" />
      {{ L('Suelo ambiental: el porcentaje de células en las que el gen saldría solo por ARN suelto en la muestra. Lo que no lo supera no cuenta como expresión.',
        'Ambient floor: the share of cells where the gene would show up from loose RNA in the sample alone. Anything at or below it does not count as expression.') }}
    </p>
    <p class="vio__leyenda">
      {{ L('El violín es el nivel (CP10k, escala logarítmica) solo en las células donde el gen se detecta; la raya vertical es la mediana.',
        'The violin is the level (CP10k, log scale) only in cells where the gene is detected; the vertical tick is the median.') }}
    </p>
  </div>
</template>

<style scoped>
.vio { color: var(--texto-1); }
.vio__titulos { display: flex; justify-content: space-between; gap: var(--sp-8); font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.vio__titulos span:last-child { text-align: right; }
.vio__eje { position: relative; height: 1.4em; margin: var(--sp-4) 0; border-bottom: 1px solid var(--trazo-fuerte); }
.vio__tt { position: absolute; top: 0; transform: translateX(-50%); font: 500 var(--texto-xs)/1.2 var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.vio__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-8); }
.vio__fila { padding: var(--sp-8) 0; border-top: 1px solid var(--trazo-sutil); }
.vio__cab { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sp-8); }
.vio__nombre { font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.vio__fila--interes .vio__nombre { color: var(--identidad); }
.vio__n { font: 500 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-2); }
.vio__svg { display: block; width: 100%; height: auto; margin-top: var(--sp-4); overflow: visible; }
.vio__base { stroke: var(--trazo-medio); }
.vio__forma { fill: color-mix(in srgb, var(--texto-2) 40%, transparent); stroke: var(--texto-2); stroke-width: 1; vector-effect: non-scaling-stroke; }
.vio__fila--interes .vio__forma { fill: color-mix(in srgb, var(--identidad) 45%, transparent); stroke: var(--identidad); }
.vio__punto { fill: var(--texto-2); }
.vio__mediana { stroke: var(--texto-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
.vio__marco { fill: none; stroke: var(--trazo-interactivo); vector-effect: non-scaling-stroke; }
.vio__det { fill: color-mix(in srgb, var(--texto-2) 55%, transparent); }
.vio__fila--interes .vio__det { fill: color-mix(in srgb, var(--identidad) 70%, transparent); }
.vio__raya { stroke: var(--texto-1); stroke-width: 2; }
.vio__suelo { stroke: var(--texto-1); stroke-width: 1; }
.vio__suelo-linea { stroke: var(--texto-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
.vio__txt { margin: var(--sp-4) 0 0; font: 500 var(--texto-xs)/1.4 var(--font-mono); color: var(--texto-2); }
.vio__leyenda { display: flex; gap: var(--sp-8); align-items: flex-start; margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.vio__muestra { flex: none; width: 22px; height: 12px; margin-top: 3px; border: 1px solid var(--texto-1); }
.vio__muestra--raya { background: repeating-linear-gradient(45deg, var(--texto-1) 0 2px, transparent 2px 5px); }
@media (forced-colors: active) {
  .vio__forma, .vio__det { fill: CanvasText; }
  .vio__raya, .vio__suelo-linea, .vio__mediana { stroke: Highlight; }
}
</style>
