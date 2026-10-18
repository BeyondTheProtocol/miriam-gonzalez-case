<script setup lang="ts">
/**
 * ADN genómico por grupo: qué parte de las moléculas contadas (UMI) se estima que viene de ADN y no de ARN.
 * Las sondas que caen dentro de un exón también hibridan con el ADN genómico. La estimación es un cociente del
 * grupo entero: célula a célula no es fiable (en células con pocas UMI puede salir imposible), por eso no se da.
 * Las cifras salen del fichero (`adn_por_grupo`).
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPctFino } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const filas = computed(() => props.d.grupos.filter((g) => g.id in props.d.adn_por_grupo)
  .map((g) => ({ id: g.id, rol: g.rol, n: g.n, v: props.d.adn_por_grupo[g.id]! })))
const max = computed(() => Math.max(1e-9, ...filas.value.map((f) => f.v)))
</script>

<template>
  <div class="adng">
    <p class="adng__p">
      {{ L('Parte de las UMI, las moléculas contadas, que se estima que viene de ADN genómico y no de ARN: las sondas que caen dentro de un exón también hibridan con el ADN genómico. Si un gen aparece en pocas células de un grupo con mucho ADN, puede ser ADN y no expresión.',
        'Share of UMI, the molecules counted, estimated to come from genomic DNA rather than RNA: probes that fall inside an exon also hybridize to genomic DNA. If a gene shows up in a few cells of a group with a lot of DNA, it may be DNA, not expression.') }}
    </p>
    <p class="adng__p">
      <strong>{{ L('Solo por grupo.', 'Per group only.') }}</strong>
      {{ L('Es un cociente sobre el grupo entero. Célula a célula, la estimación puede superar el total de moléculas de la célula, y eso es imposible. Aquí se muestra para las dos lesiones, pero el suelo ambiental de los violines incluye este ADN solo en el hueso, no en el hígado.',
        'It is a ratio over the whole group. Cell by cell, the estimate can exceed the cell’s total molecules, which is impossible. It is shown here for both lesions, but the ambient floor in the violins includes this DNA only in the bone, not in the liver.') }}
    </p>
    <p class="adng__escala">{{ L(`Escala de las barras: de 0 a ${fmtPctFino(max, 'es')}, el valor mayor.`, `Bar scale: from 0 to ${fmtPctFino(max, 'en')}, the largest value.`) }}</p>
    <ul class="adng__lista">
      <li v-for="f in filas" :key="f.id" class="adng__fila" :class="`adng__fila--${f.rol}`">
        <span class="adng__nombre">{{ etiqueta(ETIQUETA_GRUPO, f.id, lang) }} <span class="adng__n nums">n = {{ fmtN(f.n, lang) }}</span></span>
        <span class="adng__barra" aria-hidden="true"><span :style="{ width: `${(100 * f.v) / max}%` }" /></span>
        <span class="adng__val nums">{{ fmtPctFino(f.v, lang) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.adng__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.adng__p strong { color: var(--texto-1); }
.adng__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-4); }
.adng__fila { display: grid; grid-template-columns: min(14rem, 40%) 1fr 4.5rem; align-items: center; gap: var(--sp-8); }
.adng__nombre { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-1); }
.adng__fila--interes .adng__nombre { color: var(--identidad); }
.adng__n { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.adng__escala { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.adng__barra { display: block; height: 10px; background: var(--trazo-sutil); border-radius: 999px; overflow: hidden; }
.adng__barra span { display: block; height: 100%; background: color-mix(in srgb, var(--texto-2) 70%, transparent); }
.adng__fila--interes .adng__barra span { background: var(--identidad); }
.adng__val { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-1); text-align: right; }
</style>
