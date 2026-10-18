<script setup lang="ts">
/**
 * Expresión por regiones del genoma (bins de 10 Mb): log2 de la expresión del grupo de interés frente a la referencia
 * emparejada, mediana por región y centrado en la mediana de todas las regiones. Es EXPRESIÓN, no ADN: una región alta
 * es compatible con más copias, no lo demuestra. Cromosomas 1 a 22. Las cifras salen del fichero (`perfil_bins`).
 * Auditoría `diseno` (18-oct): la figura mantiene su tamaño (texto legible) y se desliza en pantallas estrechas;
 * el 0 y la unidad van rotulados, la línea del cero con contraste 3:1, y un resumen en texto como alternativa.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const W = 760, H = 200, M = 24, IZQ = 34
const puntos = computed(() => {
  const p = props.d.perfil_bins
  // orden del genoma (1, 2, … 22), no el del fichero: allí va en orden de texto (1, 10, 11…) y el eje salía así
  const num = (c: string) => Number(c.replace('chr', ''))
  return p.cromosoma.map((c, k) => ({ c, mb: p.inicio_mb[k]!, v: p.log2_rel[k]! }))
    .sort((a, b) => num(a.c) - num(b.c) || a.mb - b.mb)
})
const cromos = computed(() => {
  const orden: string[] = []
  for (const x of puntos.value) if (!orden.includes(x.c)) orden.push(x.c)
  return orden
})
const escala = computed<[number, number]>(() => {
  let lo = -1, hi = 1
  for (const x of puntos.value) { if (x.v < lo) lo = x.v; if (x.v > hi) hi = x.v }
  return [Math.floor(lo * 2) / 2, Math.ceil(hi * 2) / 2]
})
const y = (v: number) => M + (1 - (v - escala.value[0]) / (escala.value[1] - escala.value[0])) * (H - 2 * M)
const ancho = W - IZQ
const xs = computed(() => puntos.value.map((_, k) => IZQ + (k + 0.5) * (ancho / Math.max(1, puntos.value.length))))
const tramos = computed(() => cromos.value.map((c, j) => {
  const ks = puntos.value.map((x, k) => (x.c === c ? k : -1)).filter((k) => k >= 0)
  const a = IZQ + (ks[0]! / puntos.value.length) * ancho, b = IZQ + ((ks[ks.length - 1]! + 1) / puntos.value.length) * ancho
  return { c, a, b, par: j % 2 === 0 }
}))
const signo = (s: string) => s.replace('-', '−')
const fmt = (x: number) => signo(props.lang === 'en' ? String(x) : String(x).replace('.', ','))
/** valores del resumen: 3 cifras significativas, las mismas que guarda el fichero */
const fmtV = (x: number) => fmt(Number(x.toPrecision(3)))
const region = (p: { c: string; mb: number }) => `${p.c.replace('chr', L('crom. ', 'chr'))}, ${fmt(p.mb)}-${fmt(p.mb + 10)} Mb`
const extremos = computed(() => {
  const orden = [...puntos.value].sort((a, b) => b.v - a.v)
  return { altas: orden.slice(0, 3), bajas: orden.slice(-3).reverse() }
})
</script>

<template>
  <div class="pf">
    <p class="pf__p">
      {{ L('Para cada región de 10 Mb, la expresión del grupo de interés frente a la referencia emparejada (log2, mediana por región, centrada en la mediana de todas las regiones). Cromosomas 1 a 22.',
        'For each 10 Mb region, expression in the group of interest against the matched reference (log2, median per region, centered on the median of all regions). Chromosomes 1 to 22.') }}
    </p>
    <p class="pf__p">
      <strong>{{ L('Expresión, no ADN.', 'Expression, not DNA.') }}</strong>
      {{ L('Una región alta es compatible con más copias de ADN, pero no lo demuestra.', 'A high region is compatible with more DNA copies, but does not prove it.') }}
    </p>
    <p class="pf__desliza" aria-hidden="true">{{ L('Desliza para ver el genoma entero →', 'Swipe to see the whole genome →') }}</p>
    <div class="pf__marco" tabindex="0" role="region" :aria-label="L('Gráfica de expresión por regiones del genoma', 'Chart of expression by genome region')">
      <svg class="pf__svg" :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" aria-hidden="true">
        <rect v-for="t in tramos" :key="t.c" :x="t.a" :width="t.b - t.a" y="0" :height="H" :class="t.par ? 'pf__par' : 'pf__impar'" />
        <line :x1="IZQ" :x2="W" :y1="y(0)" :y2="y(0)" class="pf__cero" />
        <polyline :points="puntos.map((p, k) => `${xs[k]},${y(p.v)}`).join(' ')" class="pf__linea" />
        <text v-for="(t, j) in tramos" :key="`l-${t.c}`" :x="(t.a + t.b) / 2" :y="H - 6 - ((t.b - t.a) < 15 && j % 2 ? 12 : 0)" class="pf__eti">{{ t.c.replace('chr', '') }}</text>
        <text :x="IZQ - 4" :y="y(escala[1]) + 4" class="pf__eje">{{ fmt(escala[1]) }}</text>
        <text :x="IZQ - 4" :y="y(0) + 4" class="pf__eje">0</text>
        <text :x="IZQ - 4" :y="y(escala[0]) + 4" class="pf__eje">{{ fmt(escala[0]) }}</text>
        <text x="2" y="12" class="pf__unidad">log2</text>
      </svg>
    </div>
    <p class="pf__p pf__resumen">
      {{ L('Expresión relativa más alta (log2)', 'Highest relative expression (log2)') }}: <span v-for="(p, k) in extremos.altas" :key="`a${k}`" class="nums">{{ region(p) }} ({{ fmtV(p.v) }}){{ k < extremos.altas.length - 1 ? '; ' : '.' }}</span>
      {{ L('Más baja', 'Lowest') }}: <span v-for="(p, k) in extremos.bajas" :key="`b${k}`" class="nums">{{ region(p) }} ({{ fmtV(p.v) }}){{ k < extremos.bajas.length - 1 ? '; ' : '.' }}</span>
    </p>
  </div>
</template>

<style scoped>
.pf__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.pf__p strong { color: var(--texto-1); }
.pf__desliza { display: none; margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
@media (max-width: 899px) { .pf__desliza { display: block; } }   /* figura de 760 px + márgenes del bloque */
.pf__marco { overflow-x: auto; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); }
.pf__marco:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.pf__svg { display: block; width: 100%; min-width: 760px; height: auto; }
.pf__par { fill: var(--superficie); }
.pf__impar { fill: var(--fondo); }
.pf__cero { stroke: var(--texto-2); stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }
.pf__linea { fill: none; stroke: var(--identidad); stroke-width: 1.75; vector-effect: non-scaling-stroke; }
.pf__eti, .pf__eje, .pf__unidad { font: 500 11px var(--font-mono); fill: var(--texto-2); }
.pf__eti { text-anchor: middle; }
.pf__eje { text-anchor: end; }
.pf__resumen { margin-top: var(--sp-12); color: var(--texto-1); }
.pf__resumen .nums { font-family: var(--font-mono); font-size: var(--texto-xs); }
</style>
