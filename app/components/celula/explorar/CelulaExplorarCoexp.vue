<script setup lang="ts">
/**
 * Co-expresión de dos genes: cuántas células de cada grupo tienen los dos, solo uno o ninguno
 * (≥1 lectura = detectado). El mapa puede colorearse con estas cuatro clases (ExpMapa). Sin
 * estadística añadida: recuentos y su % del grupo, con el n a la vista.
 */
import type { Coexp, LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct, tablaCoexp } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, etiqueta, nombreGen } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; etiquetas: Coexp[]; genA: string; genB: string; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const filas = computed(() => tablaCoexp(props.d, props.etiquetas))
const COLS: Coexp[] = ['ambos', 'solo_a', 'solo_b', 'ninguno']
const titulo = (c: Coexp) => ({
  ambos: L('Los dos', 'Both'), solo_a: L(`Solo ${props.genA}`, `${props.genA} only`), solo_b: L(`Solo ${props.genB}`, `${props.genB} only`), ninguno: L('Ninguno', 'Neither'),
})[c]
</script>

<template>
  <div class="cx">
    <p class="cx__desliza" aria-hidden="true">{{ L('Desliza para ver todas las columnas →', 'Swipe to see all columns →') }}</p>
    <div class="cx__scroll" tabindex="0" role="region" :aria-label="L('Tabla de co-expresión', 'Co-expression table')">
      <table class="cx__tabla">
        <caption class="sr-only">{{ L(`Co-expresión de ${nombreGen(genA)} y ${nombreGen(genB)} por grupo`, `Co-expression of ${nombreGen(genA)} and ${nombreGen(genB)} by group`) }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ L('Grupo', 'Group') }}</th>
            <th scope="col" class="cx__num">n</th>
            <th v-for="c in COLS" :key="c" scope="col" class="cx__num">{{ titulo(c) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.id">
            <th scope="row">{{ etiqueta(ETIQUETA_GRUPO, f.id, lang) }}</th>
            <td class="cx__num nums">{{ fmtN(f.n, lang) }}</td>
            <td v-for="c in COLS" :key="c" class="cx__num nums">{{ fmtN(f.c[c], lang) }} <span class="cx__pct">({{ fmtPct(f.n ? f.c[c] / f.n : 0, lang) }})</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="cx__pie">
      {{ L('«Detectado» quiere decir al menos una lectura del gen. Una célula puede salir positiva solo por ARN suelto de la muestra, así que «los dos» puede incluir coincidencias por ruido.',
        '“Detected” means at least one read of the gene. A cell can come out positive from loose RNA in the sample alone, so “both” may include chance overlaps from noise.') }}
    </p>
  </div>
</template>

<style scoped>
.cx__scroll { overflow-x: auto; border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.cx__scroll:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.cx__tabla { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); color: var(--texto-1); min-width: 560px; }
.cx__tabla th, .cx__tabla td { padding: var(--sp-8) var(--sp-12); text-align: left; border-bottom: 1px solid var(--trazo-sutil); }
.cx__tabla thead th { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); background: var(--superficie); }
.cx__tabla tbody tr:last-child > * { border-bottom: 0; }
.cx__num { text-align: right !important; white-space: nowrap; }
.cx__tabla tbody th, .cx__tabla thead th:first-child { position: sticky; left: 0; z-index: 1; background: var(--fondo); }
.cx__tabla thead th:first-child { background: var(--superficie); }
.cx__desliza { display: none; margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
@media (max-width: 639px) { .cx__desliza { display: block; } }
.cx__pct { color: var(--texto-2); font-size: var(--texto-xs); }
.cx__pie { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
</style>
