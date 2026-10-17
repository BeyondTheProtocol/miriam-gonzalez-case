<script setup lang="ts">
/**
 * Número de copias. Hueso: por célula (ventanas del fichero, p. ej. 8p11 y 11q13), una tira de puntos
 * por grupo con su mediana y su n. Hígado: NUNCA por célula (no se puede leer célula a célula); solo el
 * dato del conjunto (pseudobulk) con su aviso. La forma del fichero ya lo impone (motivosLesion).
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const cnv = computed(() => props.d.cnv)
const W = 440, H = 26, LBL = 0

interface Tira { id: string; rol: string; n: number; vals: number[] }
const ventanas = computed(() => {
  const c = cnv.value
  if (!('valores' in c)) return []
  return c.ventanas.map((v, w) => {
    const tiras: Tira[] = props.d.grupos.map((g, k) => ({ id: g.id, rol: g.rol, n: g.n, vals: [] as number[] }))
    c.valores[w]!.forEach((val, i) => { if (val != null) tiras[props.d.celulas.grupo[i]!]!.vals.push(val) })
    const todos = tiras.flatMap((t) => t.vals)
    const max = Math.max(1, ...todos)
    return { nombre: v, tiras: tiras.filter((t) => t.vals.length), max }
  })
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
        {{ L(`Estimación por célula del número de copias en cada ventana (método: ${cnv.metodo}). Cada punto es una célula; la raya, la mediana del grupo.`,
          `Per-cell copy-number estimate in each window (method: ${cnv.metodo}). Each dot is a cell; the tick is the group median.`) }}
      </p>
      <div v-for="v in ventanas" :key="v.nombre" class="cnv__ventana">
        <h4 class="cnv__h">{{ v.nombre }}</h4>
        <ul class="cnv__lista">
          <li v-for="t in v.tiras" :key="t.id" class="cnv__fila" :class="`cnv__fila--${t.rol}`">
            <span class="cnv__nombre">{{ etiqueta(ETIQUETA_GRUPO, t.id, lang) }} <span class="cnv__n nums">n = {{ t.vals.length }}</span></span>
            <svg class="cnv__svg" :viewBox="`0 0 ${W} ${H}`" role="img"
                 :aria-label="L(`${etiqueta(ETIQUETA_GRUPO, t.id, 'es')}, ${v.nombre}: mediana ${fmt(med(t.vals))}, ${t.vals.length} células`, `${etiqueta(ETIQUETA_GRUPO, t.id, 'en')}, ${v.nombre}: median ${fmt(med(t.vals))}, ${t.vals.length} cells`)">
              <line :x1="LBL" :x2="W" :y1="H / 2" :y2="H / 2" class="cnv__base" />
              <circle v-for="(x, i) in t.vals" :key="i" :cx="LBL + (x / v.max) * (W - LBL)" :cy="4 + jit(i) * (H - 8)" r="1.8" class="cnv__punto" />
              <line :x1="LBL + (med(t.vals) / v.max) * (W - LBL)" :x2="LBL + (med(t.vals) / v.max) * (W - LBL)" y1="1" :y2="H - 1" class="cnv__med" />
            </svg>
            <span class="cnv__val nums">{{ L('mediana', 'median') }} {{ fmt(med(t.vals)) }}</span>
          </li>
        </ul>
      </div>
    </template>
    <div v-else class="cnv__higado" role="note">
      <p class="cnv__p"><strong>{{ L('En el hígado, el número de copias no se puede leer célula a célula.', 'In the liver, copy number cannot be read cell by cell.') }}</strong></p>
      <p class="cnv__p">
        {{ L(`Solo hay un dato del conjunto de la muestra (pseudobulk): la ventana ${cnv.pseudobulk.ventana} queda en el percentil ${cnv.pseudobulk.percentil_genoma} del genoma. Dice que el amplicón está en la muestra, no qué células lo llevan.`,
          `There is only a whole-sample figure (pseudobulk): the ${cnv.pseudobulk.ventana} window sits at percentile ${cnv.pseudobulk.percentil_genoma} of the genome. It says the amplicon is in the sample, not which cells carry it.`) }}
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
.cnv__fila { display: grid; grid-template-columns: minmax(9rem, 14rem) 1fr auto; align-items: center; gap: var(--sp-8); }
@media (max-width: 639px) { .cnv__fila { grid-template-columns: 1fr auto; } .cnv__svg { grid-column: 1 / -1; grid-row: 2; } }
.cnv__nombre { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-1); }
.cnv__fila--interes .cnv__nombre { color: var(--identidad); }
.cnv__n { font: 500 11px var(--font-mono); color: var(--texto-2); }
.cnv__svg { display: block; width: 100%; height: auto; }
.cnv__base { stroke: var(--trazo-sutil); }
.cnv__punto { fill: color-mix(in srgb, var(--texto-2) 70%, transparent); }
.cnv__fila--interes .cnv__punto { fill: var(--identidad); }
.cnv__med { stroke: var(--texto-1); stroke-width: 2; }
.cnv__val { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.cnv__higado { border-left: 3px solid var(--identidad); padding-left: var(--sp-12); }
</style>
