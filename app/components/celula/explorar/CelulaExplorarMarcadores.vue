<script setup lang="ts">
/**
 * Marcadores por grupo: cada grupo del contrato frente al resto de la lesión (Wilcoxon, FDR de Benjamini-Hochberg),
 * con el suelo ambiental del gen en ese grupo al lado. Solo grupos fijos del análisis: aquí no se compara una
 * selección libre (con una selección a mano se puede reconstruir algo que el análisis no sostiene). Las cifras
 * salen del fichero (`marcadores`). Un gen se puede abrir en el mapa y los violines si está en los datos.
 * Patrón de tabla de «Genes de interés» (auditoría `diseno`, 18-oct): primera columna fija, aviso de deslizar en el
 * móvil, el suelo junto al porcentaje del grupo y la fila elegida marcada, con enlace a los violines.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct } from '~/utils/celulaExplorador'
import { CIRC_HUESO, CIRC_REFERENCIA, ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; abribles: (gen: string) => boolean; elegido: string; conMapa: boolean }>()
const emit = defineEmits<{ elegir: [gen: string]; irGen: [] }>()
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
const hayCirc = computed(() => filas.value.some((f) => circular(f.gen)))
const pulsado = ref('')
function elige(g: string) { pulsado.value = g; emit('elegir', g) }
const coma = (s: string) => (props.lang === 'en' ? s : s.replace('.', ','))
const fc = (x: number) => coma(x.toFixed(2))
// FDR 0 en el fichero = por debajo de la precisión del cálculo (doble precisión), no un FDR de 0: se da como cota
const fdr = (x: number) => (x <= 0 ? '< 1e-300' : x < 1e-3 ? coma(x.toExponential(1)) : coma(x.toFixed(3)))
const idCtl = useId()
</script>

<template>
  <div class="mk">
    <!-- simulador (18-oct): el método, plegado; el grupo, la tabla y los avisos de circularidad, a la vista -->
    <details class="mk__como">
      <summary>{{ L('Cómo se calcula', 'How it is computed') }}</summary>
    <p class="mk__p">
      {{ L('Genes que más distinguen a cada grupo frente al resto de la lesión (prueba de Wilcoxon, FDR de Benjamini-Hochberg). Solo grupos fijos del análisis; no se compara una selección hecha a mano. Se omiten los genes que solo aparecen en uno de los dos lados (log2FC infinito): no se pueden dar como cifra.',
        'Genes that best set each group apart from the rest of the lesion (Wilcoxon test, Benjamini-Hochberg FDR). Fixed groups of the analysis only; no hand-made selection is compared. Genes seen on only one of the two sides (infinite log2FC) are left out: they cannot be given as a figure.') }}
    </p>
    <p class="mk__p">
      <strong>{{ L('Detectado no es positivo.', 'Detected is not positive.') }}</strong>
      {{ L('El porcentaje de células del grupo se lee contra su suelo ambiental: si quedan cerca, la señal puede venir del fondo.',
        'Compare the share of cells in the group with its ambient floor: if close, the signal may come from the background.') }}
    </p>
    </details>
    <div class="mk__campo">
      <span :id="`${idCtl}-g`" class="mk__eti">{{ L('Grupo', 'Group') }}</span>
      <div class="mk__seg" role="group" :aria-labelledby="`${idCtl}-g`">
        <button v-for="g in grupos" :key="g.id" type="button" class="mk__btn" :aria-pressed="grupo === g.id" @click="grupo = g.id">{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</button>
      </div>
    </div>
    <p :id="`${idCtl}-cap`" class="mk__cap">
      {{ L(`${etiqueta(ETIQUETA_GRUPO, grupo, 'es')}: ${filas.length} genes, ordenados por el estadístico de Wilcoxon. En gris, los de FDR de 0,05 o más: con ese umbral no distinguen al grupo.`,
        `${etiqueta(ETIQUETA_GRUPO, grupo, 'en')}: ${filas.length} genes, ranked by the Wilcoxon statistic. In grey, those with FDR of 0.05 or more: at that threshold they do not set the group apart.`) }}
    </p>
    <p v-if="hayCirc" class="mk__circ">
      * <strong>{{ L('Circular.', 'Circular.') }}</strong>
      {{ L('Los genes con asterisco participan en la selección de este grupo o van ligados al programa con el que se seleccionó: su diferencia con el resto sale en parte de cómo se eligió el grupo, no es una medida independiente.',
        'Genes with an asterisk take part in selecting this group or are tied to the program it was selected by: their difference from the rest partly comes from how the group was chosen, so it is not an independent measurement.') }}
    </p>
    <p v-if="esInteres && d.lesion === 'hueso'" class="mk__circ"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
    <p v-if="!esInteres && grupo !== 'otras'" class="mk__cap">{{ L(CIRC_REFERENCIA.es, CIRC_REFERENCIA.en) }}</p>
    <p v-if="grupo === 'otras'" class="mk__cap">{{ L('«Otras» reúne las células que no entran en ningún grupo fijo: sus marcadores describen una mezcla, no un tipo.', '“Other” gathers the cells that do not fall in any fixed group: its markers describe a mix, not a type.') }}</p>
    <p class="mk__desliza" aria-hidden="true">{{ L('Desliza para ver las seis columnas →', 'Swipe to see all six columns →') }}</p>
    <div class="mk__tabla" role="region" :aria-labelledby="`${idCtl}-cap`" tabindex="0">
      <table>
        <thead>
          <tr>
            <th scope="col">{{ L('Gen', 'Gene') }}</th>
            <th scope="col">{{ L('En el grupo', 'In the group') }}</th>
            <th scope="col">{{ L('Suelo ambiental', 'Ambient floor') }}</th>
            <th scope="col">{{ L('En el resto', 'In the rest') }}</th>
            <th scope="col">log2FC</th>
            <th scope="col">FDR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.gen" :class="{ 'mk__nsig': f.fdr >= 0.05 }">
            <th scope="row">
              <button v-if="abribles(f.gen)" type="button" class="mk__gen" :aria-pressed="f.gen === elegido" @click="elige(f.gen)">{{ f.gen }}</button>
              <span v-else class="mk__gen mk__gen--fijo">{{ f.gen }}</span>
              <span v-if="circular(f.gen)" class="mk__ast" :title="L('Circular: ver la nota de encima de la tabla', 'Circular: see the note above the table')"><span aria-hidden="true">*</span><span class="sr-only">{{ L('(circular)', '(circular)') }}</span></span>
            </th>
            <td class="nums">{{ fmtPct(f.a, lang) }}</td>
            <td class="nums">{{ fmtPct(f.suelo, lang) }}</td>
            <td class="nums">{{ fmtPct(f.b, lang) }}</td>
            <td class="nums">{{ fc(f.logfc) }}</td>
            <td class="nums">{{ fdr(f.fdr) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mk__estado" role="status">
      <template v-if="pulsado && pulsado === elegido">
        {{ conMapa ? L(`${pulsado} está ahora en el mapa y en los violines.`, `${pulsado} is now on the map and in the violins.`) : L(`${pulsado} está ahora en los violines.`, `${pulsado} is now in the violins.`) }}
        <button type="button" class="mk__ir" @click="emit('irGen')">{{ L('Ir a los violines', 'Go to the violins') }}</button>
      </template>
    </p>
  </div>
</template>

<style scoped>
.mk__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
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
.mk__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.mk__btn:focus-visible, .mk__gen:focus-visible, .mk__tabla:focus-visible, .mk__ir:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.mk__desliza { display: none; margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
@media (max-width: 719px) { .mk__desliza { display: block; } }   /* tabla de 560 px + márgenes del bloque */
.mk__tabla { overflow: auto; max-height: 30rem; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); }
@media (max-width: 1023px) { .mk__tabla { max-height: none; } }   /* sin scroll dentro del scroll en táctil (diseño, 18-oct) */
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
.mk__gen[aria-pressed='true'] { background: color-mix(in srgb, var(--identidad) 14%, transparent); text-decoration-thickness: 2px; }
.mk__estado { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); }
.mk__estado:empty { margin: 0; }
.mk__ir { margin-left: var(--sp-8); padding: 0; border: 0; background: none; color: var(--identidad); font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.mk__como { margin: 0 0 var(--sp-12); }
.mk__como summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--identidad); }
.mk__como summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
</style>
