<script setup lang="ts">
/**
 * Tabla «Genes de interés»: los diez genes del plan, con el grupo de interés frente a la referencia
 * emparejada y el suelo ambiental, las sondas del gen (unión exón-exón / total) y la lectura de Polaris
 * (borrador, vocabulario cerrado del fichero). Todas las cifras salen del fichero de la lesión; aquí solo
 * se redondean a % entero (pct). Un gen que participa en la selección del grupo lleva su rótulo de
 * circularidad y, si existe, la cifra medida sin ella (loo); si no existe, lo dice. Un toque en el gen lo elige arriba.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct, porGrupo } from '~/utils/celulaExplorador'
import { CIRC_HUESO, ETIQUETA_GRUPO, ETIQUETA_VEREDICTO, LECTURA, PANEL_INTERES, PAPEL_SELECCION, PROTEINA, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; elegido: string }>()
const emit = defineEmits<{ elegir: [string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const interes = computed(() => props.d.grupos.find((g) => g.rol === 'interes')!)
const filas = computed(() => PANEL_INTERES.filter((g) => props.d.genes.includes(g)).map((gen) => {
  const f = porGrupo(props.d, gen).find((x) => x.rol === 'interes')!
  return { gen, frac: f.frac, suelo: f.suelo, ref: props.d.referencia[gen] ?? 0, ver: props.d.veredicto[gen] ?? 'sin_veredicto',
    sondas: props.d.sondas[gen], papel: props.d.seleccion[gen], loo: props.d.loo[gen] }
}))
const nf = (n: number) => fmtN(n, props.lang)
const fmtCp = (x: number) => String(Math.round(x))
</script>

<template>
  <div class="gi">
    <p class="gi__desliza" aria-hidden="true">{{ L('Desliza para ver las seis columnas →', 'Swipe to see all six columns →') }}</p>
    <div class="gi__scroll" tabindex="0" role="region" :aria-label="L('Tabla de genes de interés', 'Genes of interest table')">
      <table class="gi__tabla">
        <caption class="sr-only">{{ L(`Genes de interés en ${etiqueta(ETIQUETA_GRUPO, interes.id, 'es')}, frente a la referencia emparejada y el suelo ambiental`, `Genes of interest in ${etiqueta(ETIQUETA_GRUPO, interes.id, 'en')}, against the matched reference and the ambient floor`) }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ L('Gen', 'Gene') }}</th>
            <th scope="col" class="gi__num">{{ etiqueta(ETIQUETA_GRUPO, interes.id, lang) }} <span class="gi__sub nums">n = {{ fmtN(interes.n, lang) }}</span></th>
            <th scope="col" class="gi__num">{{ L('Referencia emparejada', 'Matched reference') }}</th>
            <th scope="col" class="gi__num">{{ L('Suelo ambiental', 'Ambient floor') }}</th>
            <th scope="col" class="gi__num">{{ L('Sondas', 'Probes') }} <span class="gi__sub">{{ L('unión / total', 'junction / total') }}</span></th>
            <th scope="col">{{ L(LECTURA.columna.es, LECTURA.columna.en) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.gen" :class="{ 'gi__fila--sel': f.gen === elegido }">
            <th scope="row">
              <button type="button" class="gi__gen" :aria-pressed="f.gen === elegido" @click="emit('elegir', f.gen)">
                <span class="gi__prot">{{ PROTEINA[f.gen] ?? f.gen }}</span>
                <span v-if="PROTEINA[f.gen]" class="gi__sim">{{ f.gen }}</span>
              </button>
              <span v-if="f.gen === 'ERBB2' && d.lesion === 'higado'" class="gi__nota">{{ L('IHQ de HER2 (hígado): 0', 'HER2 IHC (liver): 0') }}</span>
              <span v-else-if="f.gen === 'ERBB2'" class="gi__nota">{{ L('IHQ de HER2: 0 en el primario y en el hígado; en el hueso no se hizo', 'HER2 IHC: 0 in the primary and the liver; not done in the bone') }}</span>
              <span v-if="f.gen === 'ERBB3' && d.lesion === 'higado'" class="gi__nota">{{ L('Los hepatocitos sanos lo detectan igual o más', 'Healthy hepatocytes detect it as much or more') }}</span>
              <span v-if="f.papel" class="gi__circ">
                {{ L(`Circular: ${f.gen} ${PAPEL_SELECCION[f.papel]?.es ?? ''}.`, `Circular: ${f.gen} ${PAPEL_SELECCION[f.papel]?.en ?? ''}.`) }}
                <template v-if="f.loo">
                  {{ L(`Sin esa circularidad (n\u00a0=\u00a0${nf(f.loo.n)}):`, `Without that circularity (n\u00a0=\u00a0${nf(f.loo.n)}):`) }}
                  <template v-if="f.loo.frac != null">{{ fmtPct(f.loo.frac, lang) }}</template><template v-if="f.loo.ref != null"> · {{ L('referencia', 'reference') }} {{ fmtPct(f.loo.ref, lang) }}</template><template v-if="f.loo.cp10k_pseudobulk != null"> · pseudobulk&nbsp;{{ fmtCp(f.loo.cp10k_pseudobulk) }}&nbsp;CP10k</template>.
                </template>
                <template v-else>{{ L('No hay cifra medida sin esa circularidad.', 'There is no figure measured without that circularity.') }}</template>
              </span>
            </th>
            <td class="gi__num nums">{{ fmtPct(f.frac, lang) }}<span v-if="f.papel" class="gi__ast" :title="L('Cifra circular: ver la nota del gen', 'Circular figure: see the gene note')"><span aria-hidden="true">*</span><span class="sr-only">{{ L('(circular)', '(circular)') }}</span></span></td>
            <td class="gi__num nums">{{ fmtPct(f.ref, lang) }}</td>
            <td class="gi__num nums">{{ fmtPct(f.suelo, lang) }}</td>
            <td class="gi__num nums">{{ f.sondas ? `${f.sondas[0]} / ${f.sondas[1]}` : '' }}</td>
            <td>{{ etiqueta(ETIQUETA_VEREDICTO, f.ver, lang) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="gi__pie">
      {{ L('Porcentaje de células con al menos una molécula (UMI) del gen. La referencia emparejada son células no tumorales de la misma muestra, con la misma profundidad (moléculas por célula); en el hígado son linfocitos T y NK, mieloides y endotelio, sin hepatocitos. Algunos veredictos dependen también de comparaciones que aquí no se pintan. Es ARN: que el gen se lea no dice que la proteína esté en la membrana; eso lo dice la IHQ.',
        'Share of cells with at least one molecule (UMI) of the gene. The matched reference is non-tumor cells from the same sample, at the same depth (molecules per cell); in the liver they are T and NK cells, myeloid cells and endothelium, without hepatocytes. Some verdicts also depend on comparisons not drawn here. This is RNA: reading the gene does not mean the protein is on the membrane; IHC tells you that.') }}
    </p>
    <p class="gi__pie">
      {{ L('Sondas: cuántas sondas del panel tiene el gen y cuántas cruzan una unión entre exones; las demás caen dentro de un exón y también pueden leer ADN genómico.',
        'Probes: how many panel probes the gene has and how many span an exon junction; the rest fall inside an exon and can also read genomic DNA.') }}
      {{ L(LECTURA.pie.es, LECTURA.pie.en) }}
    </p>
    <p v-if="d.lesion === 'hueso'" class="gi__pie gi__circh"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
  </div>
</template>

<style scoped>
.gi__scroll { overflow-x: auto; border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.gi__scroll:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.gi__tabla { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); color: var(--texto-1); min-width: 620px; }
.gi__tabla th, .gi__tabla td { padding: var(--sp-8) var(--sp-12); text-align: left; border-bottom: 1px solid var(--trazo-sutil); vertical-align: top; }
/* diseño, 18-oct: en móvil «Lectura de Polaris» se partía en 5 líneas e hinchaba las filas */
@media (max-width: 899px) { .gi__tabla td:last-child { min-width: 14rem; } }
.gi__circh { color: var(--texto-1); }
.gi__tabla thead th { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); background: var(--superficie); }
.gi__tabla tbody tr:last-child > * { border-bottom: 0; }
.gi__num { text-align: right !important; white-space: nowrap; }
.gi__sub { display: block; font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
.gi__gen { display: inline-flex; align-items: baseline; gap: var(--sp-8); min-height: 44px; padding: 0 var(--sp-8); margin: -10px 0 -10px calc(-1 * var(--sp-8)); border-radius: var(--radius-sm); color: var(--texto-1); text-align: left; }
@media (hover: hover) { .gi__gen:hover { background: var(--trazo-sutil); } }
.gi__gen { -webkit-tap-highlight-color: transparent; }
/* primera columna fija: en 375 px las cifras se deslizan y el gen queda a la vista */
.gi__tabla tbody th, .gi__tabla thead th:first-child { position: sticky; left: 0; z-index: 1; background: var(--fondo); }
.gi__tabla thead th:first-child { background: var(--superficie); }
.gi__fila--sel th { background: color-mix(in srgb, var(--identidad) 8%, var(--fondo)) !important; }
.gi__desliza { display: none; margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
@media (max-width: 639px) { .gi__gen { flex-direction: column; align-items: flex-start; gap: 0; justify-content: center; margin-block: 0; } .gi__nota, .gi__circ { margin-top: var(--sp-4); } }
/* diseño, 18-oct: a 768 la tabla ya se corta (Sondas, Lectura) y el aviso solo salía por debajo de 640 */
@media (max-width: 899px) { .gi__desliza { display: block; } }
.gi__gen:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 1px; }
.gi__gen[aria-pressed='true'] .gi__prot { color: var(--identidad); text-decoration: underline; text-underline-offset: 3px; }
.gi__prot { font-weight: 600; white-space: nowrap; }
.gi__sim { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.gi__nota { display: block; font: 600 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-1); }
.gi__fila--sel { background: color-mix(in srgb, var(--identidad) 8%, transparent); }
.gi__circ { display: block; max-width: 22rem; margin-top: var(--sp-4); font: 500 var(--texto-xs)/1.35 var(--font-body); color: var(--texto-1); white-space: normal; }
.gi__ast { margin-left: 2px; font-weight: 700; color: var(--texto-1); }
.gi__pie { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
</style>
