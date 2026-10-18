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
import { ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

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
const pulsado = ref('')
function elige(g: string) { pulsado.value = g; emit('elegir', g) }
const coma = (s: string) => (props.lang === 'en' ? s : s.replace('.', ','))
const fc = (x: number) => coma(x.toFixed(2))
const fdr = (x: number) => (x < 1e-3 ? coma(x.toExponential(1)) : coma(x.toFixed(3)))
const idCtl = useId()
</script>

<template>
  <div class="mk">
    <p class="mk__p">
      {{ L('Genes que más distinguen a cada grupo frente al resto de la lesión (prueba de Wilcoxon, FDR de Benjamini-Hochberg). Solo grupos fijos del análisis; no se compara una selección hecha a mano. Se omiten los genes que solo aparecen en uno de los dos lados (log2FC infinito): no se pueden dar como cifra.',
        'Genes that best set each group apart from the rest of the lesion (Wilcoxon test, Benjamini-Hochberg FDR). Fixed groups of the analysis only; no hand-made selection is compared. Genes seen on only one of the two sides (infinite log2FC) are left out: they cannot be given as a figure.') }}
    </p>
    <p class="mk__p">
      <strong>{{ L('Detectado no es positivo.', 'Detected is not positive.') }}</strong>
      {{ L('El porcentaje de células del grupo se lee contra su suelo ambiental: si quedan cerca, la señal puede venir del fondo.',
        'Compare the share of cells in the group with its ambient floor: if close, the signal may come from the background.') }}
    </p>
    <div class="mk__campo">
      <span :id="`${idCtl}-g`" class="mk__eti">{{ L('Grupo', 'Group') }}</span>
      <div class="mk__seg" role="group" :aria-labelledby="`${idCtl}-g`">
        <button v-for="g in grupos" :key="g.id" type="button" class="mk__btn" :aria-pressed="grupo === g.id" @click="grupo = g.id">{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</button>
      </div>
    </div>
    <p class="mk__desliza" aria-hidden="true">{{ L('Desliza para ver las seis columnas →', 'Swipe to see all six columns →') }}</p>
    <div class="mk__tabla" role="region" :aria-labelledby="`${idCtl}-cap`" tabindex="0">
      <table>
        <caption :id="`${idCtl}-cap`" class="mk__cap">
          {{ L(`${filas.length} genes de ${etiqueta(ETIQUETA_GRUPO, grupo, 'es')}, ordenados por el estadístico de Wilcoxon; en gris, los de FDR de 0,05 o más (no distinguen al grupo).`,
            `${filas.length} genes of ${etiqueta(ETIQUETA_GRUPO, grupo, 'en')}, ordered by the Wilcoxon statistic; in grey, those with FDR of 0.05 or more (they do not set the group apart).`) }}
        </caption>
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
        {{ L(`${pulsado} está ahora en el mapa y en los violines.`, `${pulsado} is now on the map and in the violins.`) }}
        <a class="mk__ir" href="#exp-violines">{{ L('Ir a los violines', 'Go to the violins') }}</a>
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
@media (max-width: 639px) { .mk__desliza { display: block; } }
.mk__tabla { overflow: auto; max-height: 30rem; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); }
.mk__tabla table { width: 100%; min-width: 560px; border-collapse: separate; border-spacing: 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); }
.mk__cap { caption-side: top; text-align: left; padding: var(--sp-8) var(--sp-12); color: var(--texto-2); font: var(--tipo-body-sm); font-size: var(--texto-xs); }
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
.mk__ir { margin-left: var(--sp-8); color: var(--identidad); font-weight: 600; }
</style>
