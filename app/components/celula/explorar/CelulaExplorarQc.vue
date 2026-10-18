<script setup lang="ts">
/**
 * Control de calidad agregado de la lesión: cuántas células entraron y cuántas quedaron, con qué umbrales y
 * cuántos dobletes se quitaron. Es el QC que fija las células del explorador (el mismo en los dos análisis
 * independientes). Todas las cifras salen del fichero (`qc`); aquí no se escribe ninguna a mano.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const q = computed(() => props.d.qc)
const n = (x: number) => fmtN(Math.round(x), props.lang)
const dec = (x: number) => String(Math.round(x * 100) / 100).replace('.', props.lang === 'en' ? '.' : ',')
const mt = computed(() => {
  const v = q.value.umbral_pct_MT
  if (typeof v === 'number') return L(`hasta ${dec(v)} por ciento de UMI mitocondriales`, `up to ${dec(v)} percent mitochondrial UMI`)
  return L('no aplica: el panel no tiene sondas mitocondriales', 'not applicable: the panel has no mitochondrial probes')
})
const filas = computed(() => {
  const x = q.value
  const f: [string, string][] = [
    [L('Células antes del control', 'Cells before QC'), n(x.n_inicial)],
    [L('Células tras el control', 'Cells after QC'), n(x.n_final)],
    [L('Moléculas (UMI) por célula admitidas', 'Molecules (UMI) per cell allowed'), `${n(x.umbral_UMI[0])} – ${n(x.umbral_UMI[1])}`],
    [L('Genes detectados por célula admitidos', 'Detected genes per cell allowed'), `${n(x.umbral_genes[0])} – ${n(x.umbral_genes[1])}`],
    [L('Mitocondriales', 'Mitochondrial'), mt.value],
    [L('Dobletes quitados (Scrublet)', 'Doublets removed (Scrublet)'), n(x.scrublet_dobletes)],
  ]
  if (typeof x.mediana_UMI_final === 'number') f.push([L('Mediana de UMI por célula, tras el control', 'Median UMI per cell, after QC'), n(x.mediana_UMI_final)])
  if (typeof x.mediana_genes_final === 'number') f.push([L('Mediana de genes por célula, tras el control', 'Median genes per cell, after QC'), n(x.mediana_genes_final)])
  return f
})
</script>

<template>
  <div class="qc">
    <p class="qc__p">
      {{ L('Qué células entran en el explorador y por qué. Umbrales por desviación mediana absoluta (MAD) sobre moléculas y genes por célula; después se quitan los dobletes. Las células del explorador son las que quedan tras este control.',
        'Which cells enter the explorer and why. Thresholds by median absolute deviation (MAD) on molecules and genes per cell; doublets are removed afterwards. The cells in the explorer are the ones left after this QC.') }}
    </p>
    <dl class="qc__lista">
      <div v-for="[k, v] in filas" :key="k" class="qc__fila">
        <dt>{{ k }}</dt>
        <dd :class="{ nums: /\d/.test(v) }">{{ v }}</dd>
      </div>
    </dl>
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
