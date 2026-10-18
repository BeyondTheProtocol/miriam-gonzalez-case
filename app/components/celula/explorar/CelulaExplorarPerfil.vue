<script setup lang="ts">
/**
 * Perfil por regiones del genoma (bins de 10 Mb): log2 de la expresión del grupo de interés frente a la referencia
 * emparejada, mediana por región y centrado. Es EXPRESIÓN, no ADN: una región alta es compatible con más copias,
 * no lo demuestra. Cromosomas 1 a 22. Las cifras salen del fichero (`perfil_bins`).
 */
import type { LesionDatos } from '~/utils/celulaExplorador'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const W = 720, H = 180, M = 22
const puntos = computed(() => {
  const p = props.d.perfil_bins
  return p.cromosoma.map((c, k) => ({ c, mb: p.inicio_mb[k]!, v: p.log2_rel[k]! }))
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
const xs = computed(() => puntos.value.map((_, k) => (k + 0.5) * (W / Math.max(1, puntos.value.length))))
const tramos = computed(() => cromos.value.map((c, j) => {
  const ks = puntos.value.map((x, k) => (x.c === c ? k : -1)).filter((k) => k >= 0)
  const a = (ks[0]! / puntos.value.length) * W, b = ((ks[ks.length - 1]! + 1) / puntos.value.length) * W
  return { c, a, b, par: j % 2 === 0 }
}))
const fmt = (x: number) => String(x).replace('.', props.lang === 'en' ? '.' : ',')
</script>

<template>
  <div class="pf">
    <p class="pf__p">
      {{ L('Para cada región de 10 Mb, la expresión del grupo de interés frente a la referencia emparejada (log2, mediana por región, centrada). Cromosomas 1 a 22.',
        'For each 10 Mb region, expression in the group of interest against the matched reference (log2, median per region, centred). Chromosomes 1 to 22.') }}
    </p>
    <p class="pf__p">
      <strong>{{ L('Expresión, no ADN.', 'Expression, not DNA.') }}</strong>
      {{ L('Una región alta es compatible con más copias de ADN, pero no lo demuestra.', 'A high region is compatible with more DNA copies, but does not prove it.') }}
    </p>
    <svg class="pf__svg" :viewBox="`0 0 ${W} ${H}`" role="img"
         :aria-label="L(`Perfil por regiones del genoma, ${puntos.length} regiones de los cromosomas 1 a 22`, `Genome region profile, ${puntos.length} regions of chromosomes 1 to 22`)">
      <rect v-for="t in tramos" :key="t.c" :x="t.a" :width="t.b - t.a" y="0" :height="H" :class="t.par ? 'pf__par' : 'pf__impar'" />
      <line x1="0" :x2="W" :y1="y(0)" :y2="y(0)" class="pf__cero" />
      <polyline :points="puntos.map((p, k) => `${xs[k]},${y(p.v)}`).join(' ')" class="pf__linea" />
      <text v-for="t in tramos" :key="`l-${t.c}`" :x="(t.a + t.b) / 2" :y="H - 6" class="pf__eti">{{ t.c.replace('chr', '') }}</text>
      <text x="4" :y="y(escala[1]) + 10" class="pf__eje">{{ fmt(escala[1]) }}</text>
      <text x="4" :y="y(escala[0]) - 4" class="pf__eje">{{ fmt(escala[0]) }}</text>
    </svg>
  </div>
</template>

<style scoped>
.pf__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.pf__p strong { color: var(--texto-1); }
.pf__svg { display: block; width: 100%; height: auto; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); }
.pf__par { fill: var(--superficie); }
.pf__impar { fill: var(--fondo); }
.pf__cero { stroke: var(--trazo-fuerte); stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.pf__linea { fill: none; stroke: var(--identidad); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.pf__eti, .pf__eje { font: 500 9px var(--font-mono); fill: var(--texto-2); }
.pf__eti { text-anchor: middle; }
</style>
