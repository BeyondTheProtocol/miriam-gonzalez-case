<script setup lang="ts">
/**
 * Número de copias. Hueso: por célula (ventanas del fichero, p. ej. 8p11 y 11q13), una tira de puntos
 * por grupo con su mediana y su n. Es una puntuación INFERIDA de la expresión (ARN) frente a la referencia
 * (log2 de lo observado frente a lo esperado con la proporción pseudobulk de la referencia), no una lectura
 * de ADN: puede ser negativa, y la escala va del mínimo al máximo del fichero con el 0 marcado. El 0 NO es
 * «como la referencia»: con pocos UMI por célula la célula típica cae por debajo de 0 (en este caso la
 * mediana de la propia referencia queda bajo 0), así que el texto manda comparar con las rayas de los
 * grupos de referencia (revisión de cifras del 17-oct-2026). Hígado: NUNCA por célula (no se puede leer célula a
 * célula); solo el dato del conjunto (pseudobulk) con su aviso. La forma del fichero ya lo impone.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { ETIQUETAS_FIJAS, ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const cnv = computed(() => props.d.cnv)
const W = 440, H = 26, LBL = 0

interface Tira { id: string; rol: string; n: number; vals: number[] }
const ventanas = computed(() => {
  const c = cnv.value
  if (!('valores' in c)) return []
  return c.ventanas.map((v, w) => {
    const tiras: Tira[] = props.d.grupos.map((g) => ({ id: g.id, rol: g.rol, n: g.n, vals: [] as number[] }))
    c.valores[w]!.forEach((val, i) => { if (val != null) tiras[props.d.celulas.grupo[i]!]!.vals.push(val) })
    return { nombre: v, tiras: tiras.filter((t) => t.vals.length) }
  })
})
/** UNA escala para todas las ventanas: el mismo valor cae en el mismo sitio en 8p11 y en 11q13. Incluye el 0
 *  y los negativos (una puntuación log2 baja de 0 cuando se observa menos de lo esperado). */
const escala = computed<[number, number]>(() => {
  const c = cnv.value
  if (!('valores' in c)) return [0, 1]
  let lo = 0, hi = 1
  for (const fila of c.valores) for (const v of fila) if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v }
  return [Math.floor(lo), Math.ceil(hi)]
})
const pos = (x: number) => (x - escala.value[0]) / (escala.value[1] - escala.value[0])
const ticksCnv = computed(() => {
  const [lo, hi] = escala.value, ancho = hi - lo
  const paso = ancho > 10 ? 5 : ancho > 5 ? 2 : 1
  const t: number[] = []
  for (let v = Math.ceil(lo / paso) * paso; v <= hi; v += paso) t.push(v)
  return t
})
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0 }
const fmt = (x: number) => String(Math.round(x * 10) / 10).replace('.', props.lang === 'en' ? '.' : ',')
// jitter determinista (sin Math.random: el mismo dibujo en cada render)
const jit = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1
</script>

<template>
  <div class="cnv">
    <template v-if="'valores' in cnv">
      <p class="cnv__p">
        <strong>{{ L(`${ETIQUETAS_FIJAS.cnv.es}.`, `${ETIQUETAS_FIJAS.cnv.en}.`) }}</strong>
        {{ L('Puntuación por célula de cada ventana: log2 de lo que se lee frente a lo que se esperaría si la célula tuviera, en esa ventana, la misma proporción que la referencia en su conjunto (pseudobulk). Cada punto es una célula; la raya, la mediana del grupo.',
          'Per-cell score for each window: log2 of what is read against what would be expected if the cell carried, in that window, the same share as the reference as a whole (pseudobulk). Each dot is a cell; the tick is the group median.') }}
      </p>
      <p class="cnv__p">
        <strong>{{ L('El 0 no es «como la referencia».', 'The 0 is not «like the reference».') }}</strong>
        {{ L('Con pocas moléculas (UMI) por célula, la célula típica sale por debajo de 0 aunque no tenga menos copias, y por eso la propia referencia puede quedar por debajo de 0. Compare cada grupo con las rayas de los grupos de referencia, no con el 0.',
          'With few molecules (UMI) per cell, the typical cell falls below 0 without having fewer copies, which is why the reference itself can sit below 0. Compare each group with the ticks of the reference groups, not with the 0.') }}
      </p>
      <p class="cnv__p">
        {{ L('Las células malignas del hueso se eligieron con una inferencia de número de copias del genoma entero, también desde la expresión: que su ventana salga alta no es una medida independiente de esa elección.',
          'The malignant bone cells were chosen with a whole-genome copy-number inference, also from expression: their window scoring high is not a measure independent of that choice.') }}
      </p>
      <div v-for="v in ventanas" :key="v.nombre" class="cnv__ventana">
        <h3 class="cnv__h">{{ v.nombre }}</h3>
        <div class="cnv__eje" aria-hidden="true"><span v-for="tk in ticksCnv" :key="tk" :style="{ left: `${pos(tk) * 100}%` }">{{ fmt(tk) }}</span></div>
        <ul class="cnv__lista">
          <li v-for="t in v.tiras" :key="t.id" class="cnv__fila" :class="`cnv__fila--${t.rol}`">
            <span class="cnv__nombre">{{ etiqueta(ETIQUETA_GRUPO, t.id, lang) }} <span class="cnv__n nums">n = {{ fmtN(t.vals.length, lang) }}</span></span>
            <svg class="cnv__svg" :viewBox="`0 0 ${W} ${H}`" role="img"
                 :aria-label="L(`${etiqueta(ETIQUETA_GRUPO, t.id, 'es')}, ${v.nombre}: mediana ${fmt(med(t.vals))}, ${t.vals.length} células`, `${etiqueta(ETIQUETA_GRUPO, t.id, 'en')}, ${v.nombre}: median ${fmt(med(t.vals))}, ${t.vals.length} cells`)">
              <line :x1="LBL" :x2="W" :y1="H / 2" :y2="H / 2" class="cnv__base" />
              <line :x1="LBL + pos(0) * (W - LBL)" :x2="LBL + pos(0) * (W - LBL)" y1="0" :y2="H" class="cnv__cero" />
              <circle v-for="(x, i) in t.vals" :key="i" :cx="LBL + pos(x) * (W - LBL)" :cy="4 + jit(i) * (H - 8)" r="1.8" class="cnv__punto" />
              <line :x1="LBL + pos(med(t.vals)) * (W - LBL)" :x2="LBL + pos(med(t.vals)) * (W - LBL)" y1="1" :y2="H - 1" class="cnv__med" />
            </svg>
            <span class="cnv__val nums">{{ L('mediana', 'median') }} {{ fmt(med(t.vals)) }}</span>
          </li>
        </ul>
      </div>
    </template>
    <div v-else class="cnv__higado" role="note">
      <p class="cnv__p"><strong>{{ L('En el hígado, el número de copias no se puede leer célula a célula.', 'In the liver, copy number cannot be read cell by cell.') }}</strong></p>
      <p class="cnv__p">
        {{ L(`Solo hay un dato del conjunto de la muestra (pseudobulk): la ventana ${cnv.pseudobulk.ventana} queda en el percentil ${cnv.pseudobulk.percentil_genoma} del genoma. Describe la muestra entera; no dice qué células aportan esa señal.`,
          `There is only a whole-sample figure (pseudobulk): the ${cnv.pseudobulk.ventana} window sits at percentile ${cnv.pseudobulk.percentil_genoma} of the genome. It describes the whole sample; it cannot say which cells contribute that signal.`) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.cnv__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.cnv__p strong { color: var(--texto-1); }
.cnv__ventana + .cnv__ventana { margin-top: var(--sp-16); }
.cnv__h { margin: 0 0 var(--sp-8); font: 600 var(--texto-sm)/1.3 var(--font-mono); color: var(--texto-1); }
.cnv__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-4); }
.cnv__fila { display: grid; grid-template-columns: min(14rem, 30%) 1fr 6rem; align-items: center; gap: var(--sp-8); }
@media (max-width: 639px) { .cnv__fila { grid-template-columns: 1fr auto; } .cnv__svg { grid-column: 1 / -1; grid-row: 2; } }
.cnv__nombre { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-1); }
.cnv__fila--interes .cnv__nombre { color: var(--identidad); }
.cnv__n { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
.cnv__eje { position: relative; height: 1.3em; margin: 0 0 var(--sp-4); border-bottom: 1px solid var(--trazo-fuerte); font: 500 var(--texto-xs)/1.2 var(--font-mono); color: var(--texto-2); }
.cnv__eje span { position: absolute; top: 0; transform: translateX(-50%); }
@media (min-width: 640px) { .cnv__eje { margin-left: calc(min(14rem, 30%) + var(--sp-8)); margin-right: 6.5rem; } }
.cnv__svg { display: block; width: 100%; height: auto; }
.cnv__base, .cnv__med { vector-effect: non-scaling-stroke; }
.cnv__base { stroke: var(--trazo-sutil); }
.cnv__cero { stroke: var(--trazo-fuerte); stroke-dasharray: 2 2; vector-effect: non-scaling-stroke; }
.cnv__punto { fill: color-mix(in srgb, var(--texto-2) 70%, transparent); }
.cnv__fila--interes .cnv__punto { fill: var(--identidad); }
.cnv__med { stroke: var(--texto-1); stroke-width: 2; }
.cnv__val { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.cnv__higado { border-left: 3px solid var(--texto-1); padding-left: var(--sp-12); }
</style>
