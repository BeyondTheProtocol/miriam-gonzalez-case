<script setup lang="ts">
/**
 * Tabla «Genes de interés»: los diez genes del plan, con el grupo de interés frente a la referencia
 * emparejada y el suelo ambiental, y la lectura de la revisión (vocabulario cerrado del fichero).
 * Todas las cifras salen del fichero de la lesión; aquí solo se redondean a % entero (pct).
 * Un toque en el gen lo elige arriba (violines y mapa).
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { pct, porGrupo } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, ETIQUETA_VEREDICTO, PANEL_INTERES, PROTEINA, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; elegido: string }>()
const emit = defineEmits<{ elegir: [string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const interes = computed(() => props.d.grupos.find((g) => g.rol === 'interes')!)
const filas = computed(() => PANEL_INTERES.filter((g) => props.d.genes.includes(g)).map((gen) => {
  const f = porGrupo(props.d, gen).find((x) => x.rol === 'interes')!
  return { gen, frac: f.frac, suelo: f.suelo, ref: props.d.referencia[gen] ?? 0, ver: props.d.veredicto[gen] ?? 'sin_veredicto' }
}))
</script>

<template>
  <div class="gi">
    <div class="gi__scroll" tabindex="0" role="region" :aria-label="L('Tabla de genes de interés', 'Genes of interest table')">
      <table class="gi__tabla">
        <caption class="sr-only">{{ L(`Genes de interés en ${etiqueta(ETIQUETA_GRUPO, interes.id, 'es')}, frente a la referencia emparejada y el suelo ambiental`, `Genes of interest in ${etiqueta(ETIQUETA_GRUPO, interes.id, 'en')}, against the matched reference and the ambient floor`) }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ L('Gen', 'Gene') }}</th>
            <th scope="col" class="gi__num">{{ etiqueta(ETIQUETA_GRUPO, interes.id, lang) }} <span class="gi__sub nums">n = {{ interes.n }}</span></th>
            <th scope="col" class="gi__num">{{ L('Referencia emparejada', 'Matched reference') }}</th>
            <th scope="col" class="gi__num">{{ L('Suelo ambiental', 'Ambient floor') }}</th>
            <th scope="col">{{ L('Lectura de la revisión', 'Review reading') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.gen" :class="{ 'gi__fila--sel': f.gen === elegido }">
            <th scope="row">
              <button type="button" class="gi__gen" :aria-pressed="f.gen === elegido" @click="emit('elegir', f.gen)">
                <span class="gi__prot">{{ PROTEINA[f.gen] ?? f.gen }}</span>
                <span v-if="PROTEINA[f.gen]" class="gi__sim">{{ f.gen }}</span>
              </button>
              <span v-if="f.gen === 'ERBB2'" class="gi__nota">{{ L('IHQ de HER2: 0', 'HER2 IHC: 0') }}</span>
            </th>
            <td class="gi__num nums">{{ pct(f.frac) }} %</td>
            <td class="gi__num nums">{{ pct(f.ref) }} %</td>
            <td class="gi__num nums">{{ pct(f.suelo) }} %</td>
            <td>{{ etiqueta(ETIQUETA_VEREDICTO, f.ver, lang) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="gi__pie">
      {{ L('Porcentaje de células con al menos una lectura del gen. La referencia emparejada son células no tumorales de la misma muestra, con la misma profundidad de lectura. Es ARN: que el gen se lea no dice que la proteína esté en la membrana; eso lo dice la IHQ.',
        'Share of cells with at least one read of the gene. The matched reference is non-tumor cells from the same sample, at the same read depth. This is RNA: reading the gene does not mean the protein is on the membrane; IHC tells you that.') }}
    </p>
  </div>
</template>

<style scoped>
.gi__scroll { overflow-x: auto; border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.gi__scroll:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.gi__tabla { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); color: var(--texto-1); min-width: 620px; }
.gi__tabla th, .gi__tabla td { padding: var(--sp-8) var(--sp-12); text-align: left; border-bottom: 1px solid var(--trazo-sutil); vertical-align: top; }
.gi__tabla thead th { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); background: var(--superficie); }
.gi__tabla tbody tr:last-child > * { border-bottom: 0; }
.gi__num { text-align: right !important; white-space: nowrap; }
.gi__sub { display: block; font: 500 11px var(--font-mono); color: var(--texto-2); }
.gi__gen { display: inline-flex; align-items: baseline; gap: var(--sp-8); min-height: 44px; padding: 0 var(--sp-8); margin: -10px 0 -10px calc(-1 * var(--sp-8)); border-radius: var(--radius-sm); color: var(--texto-1); text-align: left; }
.gi__gen:hover { background: var(--trazo-sutil); }
.gi__gen:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 1px; }
.gi__gen[aria-pressed='true'] .gi__prot { color: var(--identidad); text-decoration: underline; text-underline-offset: 3px; }
.gi__prot { font-weight: 600; }
.gi__sim { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
.gi__nota { display: block; font: 600 11px/1.3 var(--font-mono); color: var(--texto-2); }
.gi__fila--sel { background: color-mix(in srgb, var(--identidad) 8%, transparent); }
.gi__pie { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
</style>
