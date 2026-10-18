<script setup lang="ts">
/**
 * Marcadores por grupo: cada grupo del contrato frente al resto de la lesión (Wilcoxon, FDR de Benjamini-Hochberg),
 * con el suelo ambiental del gen en ese grupo al lado. Solo grupos fijos del análisis: aquí no se compara una
 * selección libre (con una selección a mano se puede reconstruir algo que el análisis no sostiene). Las cifras
 * salen del fichero (`marcadores`). Un gen se puede abrir en el mapa y los violines si está en los datos.
 * Patrón de tabla de «Genes de interés» (auditoría `diseno`, 18-oct): primera columna fija, aviso de deslizar en el
 * móvil, el suelo junto al porcentaje del grupo y la fila elegida marcada.
 * Panel de expertos (18-oct): los 15 primeros con cinco columnas; «Ver los N, con FDR» abre la lista entera y el FDR.
 * Pulsar un gen abre su detalle en el panel (el explorador lo pinta en el mapa); aquí ya no se anuncia nada.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct } from '~/utils/celulaExplorador'
import { CIRC_HUESO, CIRC_REFERENCIA, ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; abribles: (gen: string) => boolean; elegido: string }>()
const emit = defineEmits<{ elegir: [gen: string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const grupos = computed(() => props.d.grupos.filter((g) => g.id in props.d.marcadores))
const grupo = ref<string>(grupos.value.find((g) => g.rol === 'interes')?.id ?? grupos.value[0]?.id ?? '')
watch(grupos, (gs) => { if (!gs.some((g) => g.id === grupo.value)) grupo.value = gs[0]?.id ?? '' })
const filas = computed(() => {
  const m = props.d.marcadores[grupo.value]
  if (!m) return []
  return m.gen.map((g, k) => ({ gen: g, logfc: m.logfc[k]!, fdr: m.fdr[k]!, a: m.frac_grupo[k]!, b: m.frac_resto[k]!, suelo: m.suelo[k]! }))
})
/** En el grupo de interés, un gen que participa en su selección sale arriba por cómo se eligió el grupo (diseño, 18-oct:
 * Genes y Violines lo rotulaban y aquí no, y «Cómo leerlo» promete que esos genes llevan su rótulo). */
const esInteres = computed(() => props.d.grupos.find((g) => g.id === grupo.value)?.rol === 'interes')
const circular = (g: string) => esInteres.value && !!props.d.seleccion[g]
const hayCirc = computed(() => vistas.value.some((f) => circular(f.gen)))
const TOP = 15
const todos = ref(false)
const vistas = computed(() => (todos.value ? filas.value : filas.value.slice(0, TOP)))
/** el FDR se ve con la lista entera (o si la lista ya es corta): en los 15 primeros, el gris ya marca FDR ≥ 0,05 */
const conFdr = computed(() => todos.value || filas.value.length <= TOP)
const corta = computed(() => !todos.value && filas.value.length > TOP)
const coma = (s: string) => (props.lang === 'en' ? s : s.replace('.', ','))
const fc = (x: number) => coma(x.toFixed(2))
// FDR 0 en el fichero = por debajo de la precisión del cálculo (doble precisión), no un FDR de 0: se da como cota
const fdr = (x: number) => (x <= 0 ? '< 1e-300' : x < 1e-3 ? coma(x.toExponential(1)) : coma(x.toFixed(3)))
const idCtl = useId()
</script>

<template>
  <div class="mk">
    <!-- panel de expertos y diseño (18-oct): datos primero; las notas, debajo de la tabla -->
    <div class="mk__campo">
      <span :id="`${idCtl}-g`" class="mk__eti">{{ L('Grupo', 'Group') }}</span>
      <div class="mk__seg" role="group" :aria-labelledby="`${idCtl}-g`">
        <button v-for="g in grupos" :key="g.id" type="button" class="mk__btn" :aria-pressed="grupo === g.id" @click="grupo = g.id">{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</button>
      </div>
    </div>
    <p class="mk__desliza" :class="conFdr ? 'mk__desliza--6' : 'mk__desliza--5'" aria-hidden="true">{{ conFdr ? L('Desplaza para ver las seis columnas →', 'Scroll to see all six columns →') : L('Desplaza para ver las cinco columnas →', 'Scroll to see all five columns →') }}</p>
    <div class="mk__tabla" role="region" :aria-labelledby="`${idCtl}-cap`" tabindex="0">
      <table :class="{ 'mk__t5': !conFdr }">
        <thead>
          <tr>
            <th scope="col">{{ L('Gen', 'Gene') }}</th>
            <th scope="col">{{ L('En el grupo', 'In the group') }}</th>
            <th scope="col">{{ L('Suelo ambiental', 'Ambient floor') }}</th>
            <th scope="col">{{ L('En el resto', 'In the rest') }}</th>
            <th scope="col">log2FC</th>
            <th v-if="conFdr" scope="col">FDR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in vistas" :key="f.gen" :class="{ 'mk__nsig': f.fdr >= 0.05 }">
            <th scope="row">
              <button v-if="abribles(f.gen)" type="button" class="mk__gen" :data-gen="f.gen" :aria-pressed="f.gen === elegido" @click="emit('elegir', f.gen)">{{ f.gen }}</button>
              <span v-else class="mk__gen mk__gen--fijo">{{ f.gen }}</span>
              <span v-if="circular(f.gen)" class="mk__ast" :title="L('Circular: ver la nota de debajo de la tabla', 'Circular: see the note below the table')"><span aria-hidden="true">*</span><span class="sr-only">{{ L('(circular)', '(circular)') }}</span></span>
            </th>
            <td class="nums">{{ fmtPct(f.a, lang) }}</td>
            <td class="nums">{{ fmtPct(f.suelo, lang) }}</td>
            <td class="nums">{{ fmtPct(f.b, lang) }}</td>
            <td class="nums">{{ fc(f.logfc) }}</td>
            <td v-if="conFdr" class="nums">{{ fdr(f.fdr) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <button v-if="filas.length > TOP" type="button" class="mk__ir mk__todos" :aria-expanded="todos" @click="todos = !todos">
      {{ todos ? L(`Ver solo los ${TOP} primeros`, `Show only the top ${TOP}`) : L(`Ver los ${filas.length}, con FDR`, `See all ${filas.length}, with FDR`) }}
    </button>
    <p :id="`${idCtl}-cap`" class="mk__cap">
      {{ L(`${etiqueta(ETIQUETA_GRUPO, grupo, 'es')}: ${corta ? `los ${TOP} primeros de ${filas.length} genes` : `${filas.length} genes`}, ordenados por el estadístico de Wilcoxon. En gris, los de FDR de 0,05 o más: con ese umbral no distinguen al grupo.`,
        `${etiqueta(ETIQUETA_GRUPO, grupo, 'en')}: ${corta ? `the top ${TOP} of ${filas.length} genes` : `${filas.length} genes`}, ranked by the Wilcoxon statistic. In grey, those with FDR of 0.05 or more: at that threshold they do not set the group apart.`) }}
    </p>
    <p class="mk__p">
      <strong>{{ L('Detectado no es positivo.', 'Detected is not positive.') }}</strong>
      {{ L('El porcentaje de células del grupo se lee contra su suelo ambiental: si quedan cerca, la señal puede venir del fondo.',
        'Compare the share of cells in the group with its ambient floor: if close, the signal may come from the background.') }}
    </p>
    <p class="mk__cap">{{ L('Wilcoxon compara el nivel de expresión de cada célula del grupo con el de las del resto, por rangos, no solo cuántas células lo detectan: un gen presente en casi todas puede distinguir al grupo por su nivel. El estadístico no se publica; el orden de la tabla es el suyo.', 'Wilcoxon compares the expression level of each cell in the group with that of the rest, by ranks, not just how many cells detect it: a gene present in almost every cell can set the group apart by its level. The statistic is not published; the table follows its order.') }}</p>
    <p v-if="hayCirc" class="mk__circ">
      * <strong>{{ L('Circular.', 'Circular.') }}</strong>
      {{ L('Los genes con asterisco participan en la selección de este grupo o van ligados al programa con el que se seleccionó: su diferencia con el resto sale en parte de cómo se eligió el grupo, no es una medida independiente.',
        'Genes with an asterisk take part in selecting this group or are tied to the program it was selected by: their difference from the rest partly comes from how the group was chosen, so it is not an independent measurement.') }}
    </p>
    <p v-if="esInteres && d.lesion === 'hueso'" class="mk__circ"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
    <p v-if="!esInteres && grupo !== 'otras'" class="mk__cap">{{ L(CIRC_REFERENCIA.es, CIRC_REFERENCIA.en) }}</p>
    <p v-if="grupo === 'otras'" class="mk__cap">{{ L('«Otras» reúne las células que no entran en ningún grupo fijo: sus marcadores describen una mezcla, no un tipo.', '“Other” gathers the cells that do not fall in any fixed group: its markers describe a mix, not a type.') }}</p>
    <!-- simulador (18-oct): el método, plegado; el grupo, la tabla y los avisos de circularidad, a la vista -->
    <details class="mk__como">
      <summary>{{ L('Cómo se calcula', 'How it is computed') }}</summary>
    <p class="mk__p">
      {{ L('Genes que más distinguen a cada grupo frente al resto de la lesión (prueba de Wilcoxon, FDR de Benjamini-Hochberg). Solo grupos fijos del análisis; no se compara una selección hecha a mano. Se omiten los genes que solo aparecen en uno de los dos lados (log2FC infinito): no se pueden dar como cifra.',
        'Genes that best set each group apart from the rest of the lesion (Wilcoxon test, Benjamini-Hochberg FDR). Fixed groups of the analysis only; no hand-made selection is compared. Genes seen on only one of the two sides (infinite log2FC) are left out: they cannot be given as a figure.') }}
    </p>
    </details>
  </div>
</template>

<style scoped>
.mk__p { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.mk__p strong { color: var(--texto-1); }
.mk__campo { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.mk__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.mk__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.mk__btn {
  min-height: 44px; padding: 0 var(--sp-12); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); background: transparent; color: var(--texto-1);
  font: 600 var(--texto-xs)/1 var(--font-body);
  transition: background-color var(--dur-micro) var(--curva-salida), color var(--dur-micro) var(--curva-salida), transform var(--dur-micro) var(--curva-salida);
  -webkit-tap-highlight-color: transparent;
}
.mk__btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .mk__btn { transition: none; } .mk__btn:active { transform: none; } }
.mk__btn[aria-pressed='true'] { background: color-mix(in srgb, var(--identidad) 14%, transparent); color: var(--texto-1); border-color: var(--identidad); box-shadow: inset 0 0 0 1px var(--identidad); }
.mk__btn:focus-visible, .mk__gen:focus-visible, .mk__tabla:focus-visible, .mk__ir:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.mk__desliza { display: none; margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
/* por el ancho de SU caja, no de la ventana: en el simulador la tabla vive en el panel estrecho de escritorio */
.mk { container-type: inline-size; }
/* el aviso solo cuando la tabla desborda su caja: 560 px con seis columnas, 420 con cinco (diseño, 18-oct: salía con todo a la vista) */
@container (max-width: 600px) { .mk__desliza--6 { display: block; } }
@container (max-width: 440px) { .mk__desliza--5 { display: block; } }
.mk__tabla { overflow-x: auto; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); margin-bottom: var(--sp-4); }   /* sin alto máximo: el panel ya desplaza (diseño, 18-oct: se cortaba la fila 12) */
.mk__circ { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); max-width: var(--measure); }
.mk__ast { margin-left: 2px; font: 600 var(--texto-xs) var(--font-body); color: var(--texto-1); }
.mk__tabla table { width: 100%; min-width: 560px; border-collapse: separate; border-spacing: 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); }
.mk__cap { margin: 0 0 var(--sp-8); color: var(--texto-2); font: var(--tipo-body-sm); font-size: var(--texto-xs); max-width: var(--measure); }
.mk__tabla th, .mk__tabla td { padding: var(--sp-8) var(--sp-12); text-align: right; border-bottom: 1px solid var(--trazo-sutil); white-space: nowrap; }
.mk__tabla thead th { position: sticky; top: 0; z-index: 2; background: var(--superficie); color: var(--texto-2); font-weight: 600; box-shadow: inset 0 -1px 0 var(--trazo-fuerte); }
.mk__tabla th:first-child { text-align: left; position: sticky; left: 0; z-index: 1; background: var(--fondo); }
.mk__tabla thead th:first-child { z-index: 3; background: var(--superficie); }
.mk__tabla .nums { font-family: var(--font-mono); color: var(--texto-1); }
.mk__nsig .nums, .mk__nsig .mk__gen { color: var(--texto-2); }
.mk__gen {
  display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; padding: 0 var(--sp-8); margin: -10px 0 -10px calc(-1 * var(--sp-8));
  border: 0; border-radius: var(--radius-sm); background: none; color: var(--identidad); font: 600 var(--texto-xs) var(--font-mono);
  text-decoration: underline; text-underline-offset: 2px; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.mk__gen--fijo { color: var(--texto-1); text-decoration: none; cursor: default; }
@media (hover: hover) { .mk__gen:not(.mk__gen--fijo):hover { background: var(--trazo-sutil); } }
.mk__gen[aria-pressed='true'] { background: color-mix(in srgb, var(--identidad) 14%, transparent); text-decoration-thickness: 2px; box-shadow: inset 0 0 0 1px var(--identidad); }
.mk__ir { padding: 0; border: 0; background: none; color: var(--identidad); font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.mk__como { margin: var(--sp-4) 0 0; }
.mk__todos { min-height: 44px; margin-top: var(--sp-4); font-size: var(--texto-sm); }
.mk__tabla table.mk__t5 { min-width: 420px; }
.mk__como summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--identidad); }
.mk__como summary::-webkit-details-marker { display: none; }
.mk__como summary::before { content: ''; display: inline-block; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s ease; flex-shrink: 0; margin-right: var(--sp-8); }
.mk__como[open] summary::before { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .mk__como summary::before { transition: none; } }
.mk__como summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
</style>
