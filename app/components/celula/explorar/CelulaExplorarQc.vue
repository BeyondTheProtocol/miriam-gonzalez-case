<script setup lang="ts">
/**
 * Control de calidad agregado de la lesión: cuántas células entraron y cuántas quedaron, con qué umbrales y
 * cuántos dobletes se quitaron. Es el QC que fija las células del explorador (el mismo en los dos análisis
 * independientes). Todas las cifras salen del fichero (`qc`); aquí no se escribe ninguna a mano.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct } from '~/utils/celulaExplorador'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const q = computed(() => props.d.qc)
const n = (x: number) => fmtN(Math.round(x), props.lang)
const dec = (x: number) => String(Math.round(x * 100) / 100).replace('.', props.lang === 'en' ? '.' : ',')
const mt = computed(() => {
  const v = q.value.umbral_pct_MT
  if (typeof v === 'number') return L(`${dec(v)} %`, `${dec(v)}%`)
  return L('no aplica: el panel no tiene sondas mitocondriales', 'not applicable: the panel has no mitochondrial probes')
})
const filas = computed(() => {
  const x = q.value
  const f: [string, string][] = [
    [L('Células antes del control', 'Cells before QC'), n(x.n_inicial)],
    [L('Células tras el control', 'Cells after QC'), n(x.n_final)],
    [L('Moléculas (UMI) por célula admitidas', 'Molecules (UMI) per cell allowed'), `${n(x.umbral_UMI[0])} – ${n(x.umbral_UMI[1])}`],
    [L('Genes detectados por célula admitidos', 'Detected genes per cell allowed'), `${n(x.umbral_genes[0])} – ${n(x.umbral_genes[1])}`],
    [L('UMI mitocondriales, máximo admitido', 'Mitochondrial UMI, maximum allowed'), mt.value],
    [L('Dobletes quitados (Scrublet)', 'Doublets removed (Scrublet)'), n(x.scrublet_dobletes)],
    ...(typeof x.scrublet_umbral === 'number' ? [[L('Umbral de Scrublet (automático)', 'Scrublet threshold (automatic)'), dec(x.scrublet_umbral)] as [string, string]] : []),
  ]
  if (typeof x.mediana_UMI_final === 'number') f.push([L('Mediana de UMI por célula, tras el control', 'Median UMI per cell, after QC'), n(x.mediana_UMI_final)])
  if (typeof x.mediana_genes_final === 'number') f.push([L('Mediana de genes por célula, tras el control', 'Median genes per cell, after QC'), n(x.mediana_genes_final)])
  return f
})
/** Matiz de verificacion (18-oct): 1-2 dobletes quitados no es un recuento de dobletes. En el hueso, cuántas células
 * comparten gota con una del hígado (las que no tienen número de copias: GEM no limpio), calculado del fichero. */
const sinGem = computed(() => {
  const c = props.d.cnv
  if (!('valores' in c) || !c.valores.length) return 0
  return c.valores[0]!.filter((v) => v == null).length
})
const matizDobletes = computed(() => {
  const x = q.value, u = typeof x.scrublet_umbral === 'number' ? x.scrublet_umbral : null
  // sin interpretar el umbral (verificacion, 18-oct: «no separó una población» no lo sostiene ningún fichero)
  const es = `Scrublet quitó ${u != null ? `las células por encima de un umbral automático de ${dec(u)}: ${n(x.scrublet_dobletes)}` : n(x.scrublet_dobletes)}. Una gota con dos células de la misma biopsia no se distingue por su código. Esta cifra no es un recuento de dobletes.`
  const en = `Scrublet removed ${u != null ? `the cells above an automatic threshold of ${dec(u)}: ${n(x.scrublet_dobletes)}` : n(x.scrublet_dobletes)}. A droplet with two cells from the same biopsy cannot be told apart by its barcode. This figure is not a doublet count.`
  const g = sinGem.value
  const extra = g ? L(` En el hueso, ${n(g)} de las ${n(x.n_final)} células (${fmtPct(g / x.n_final, 'es')}) comparten gota con una célula del hígado.`, ` In the bone, ${n(g)} of the ${n(x.n_final)} cells (${fmtPct(g / x.n_final, 'en')}) share a droplet with a liver cell.`) : ''
  return L(es, en) + extra
})
</script>

<template>
  <div class="qc">
    <p class="qc__p">
      {{ L('Qué células entran en el explorador y por qué. Umbrales por desviación mediana absoluta (MAD) sobre moléculas, genes y % mitocondrial por célula; después se quitan los dobletes. Las células del explorador son las que quedan tras este control.',
        'Which cells enter the explorer and why. Thresholds by median absolute deviation (MAD) on molecules, genes and mitochondrial % per cell; doublets are removed afterwards. The cells in the explorer are the ones left after this QC.') }}
    </p>
    <dl class="qc__lista">
      <div v-for="[k, v] in filas" :key="k" class="qc__fila">
        <dt>{{ k }}</dt>
        <dd :class="{ nums: /^[\d.,\s–%-]+$/.test(v) }">{{ v }}</dd>
      </div>
    </dl>
    <p class="qc__p qc__matiz">{{ matizDobletes }}</p>
  </div>
</template>

<style scoped>
.qc__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.qc__lista { margin: 0; display: grid; gap: 0 var(--sp-24); grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr)); }
.qc__fila { display: flex; justify-content: space-between; gap: var(--sp-12); padding: var(--sp-8) 0; border-bottom: 1px solid var(--trazo-sutil); font: var(--tipo-body-sm); }
.qc__fila dt { color: var(--texto-2); }
.qc__fila dd { margin: 0; color: var(--texto-1); text-align: right; }
.qc__fila dd.nums { font-family: var(--font-mono); white-space: nowrap; }
</style>
