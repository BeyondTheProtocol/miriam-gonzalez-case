<script setup lang="ts">
/**
 * Marcadores por grupo: cada grupo del contrato frente al resto de la lesión (Wilcoxon, FDR de Benjamini-Hochberg),
 * con el suelo ambiental del gen en ese grupo al lado. Solo grupos fijos del análisis: aquí no se compara una
 * selección libre (con una selección a mano se puede reconstruir algo que el análisis no sostiene). Las cifras
 * salen del fichero (`marcadores`). Un gen se puede abrir en el mapa si está en los datos que se pintan.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtPct } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; abribles: (gen: string) => boolean }>()
const emit = defineEmits<{ elegir: [gen: string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const grupos = computed(() => props.d.grupos.filter((g) => g.id in props.d.marcadores))
const elegido = ref<string>(grupos.value.find((g) => g.rol === 'interes')?.id ?? grupos.value[0]?.id ?? '')
watch(grupos, (gs) => { if (!gs.some((g) => g.id === elegido.value)) elegido.value = gs[0]?.id ?? '' })
const filas = computed(() => {
  const m = props.d.marcadores[elegido.value]
  if (!m) return []
  return m.gen.map((g, k) => ({ gen: g, logfc: m.logfc[k]!, fdr: m.fdr[k]!, a: m.frac_grupo[k]!, b: m.frac_resto[k]!, suelo: m.suelo[k]! }))
})
const dec = (x: number, d = 2) => String(Math.round(x * 10 ** d) / 10 ** d).replace('.', props.lang === 'en' ? '.' : ',')
const fdr = (x: number) => (x < 1e-3 ? x.toExponential(1).replace('.', props.lang === 'en' ? '.' : ',') : dec(x, 3))
const idCtl = useId()
</script>

<template>
  <div class="mk">
    <p class="mk__p">
      {{ L('Genes que más distinguen a cada grupo frente al resto de la lesión (prueba de Wilcoxon, FDR de Benjamini-Hochberg). Solo grupos fijos del análisis; no se compara una selección hecha a mano.',
        'Genes that best set each group apart from the rest of the lesion (Wilcoxon test, Benjamini-Hochberg FDR). Fixed groups of the analysis only; no hand-made selection is compared.') }}
    </p>
    <p class="mk__p">
      <strong>{{ L('Detectado no es positivo.', 'Detected is not positive.') }}</strong>
      {{ L('Compara el porcentaje del grupo con su suelo ambiental: si quedan cerca, la señal puede ser ambiente.',
        'Compare the group percentage with its ambient floor: if they are close, the signal may be ambient.') }}
    </p>
    <div class="mk__campo">
      <span :id="`${idCtl}-g`" class="mk__eti">{{ L('Grupo', 'Group') }}</span>
      <div class="mk__seg" role="group" :aria-labelledby="`${idCtl}-g`">
        <button v-for="g in grupos" :key="g.id" type="button" class="mk__btn" :aria-pressed="elegido === g.id" @click="elegido = g.id">{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</button>
      </div>
    </div>
    <div class="mk__tabla" role="region" :aria-label="L('Tabla de marcadores', 'Marker table')" tabindex="0">
      <table>
        <thead>
          <tr>
            <th scope="col">{{ L('Gen', 'Gene') }}</th>
            <th scope="col">log2FC</th>
            <th scope="col">FDR</th>
            <th scope="col">{{ L('En el grupo', 'In the group') }}</th>
            <th scope="col">{{ L('En el resto', 'In the rest') }}</th>
            <th scope="col">{{ L('Suelo', 'Floor') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.gen">
            <th scope="row">
              <button v-if="abribles(f.gen)" type="button" class="mk__gen" @click="emit('elegir', f.gen)">{{ f.gen }}</button>
              <span v-else>{{ f.gen }}</span>
            </th>
            <td class="nums">{{ dec(f.logfc) }}</td>
            <td class="nums">{{ fdr(f.fdr) }}</td>
            <td class="nums">{{ fmtPct(f.a, lang) }}</td>
            <td class="nums">{{ fmtPct(f.b, lang) }}</td>
            <td class="nums">{{ fmtPct(f.suelo, lang) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mk__p { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.mk__p strong { color: var(--texto-1); }
.mk__campo { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.mk__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.mk__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.mk__btn { min-height: 44px; padding: 0 var(--sp-12); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); background: transparent; color: var(--texto-1); font: 600 var(--texto-xs)/1 var(--font-body); }
.mk__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.mk__btn:focus-visible, .mk__gen:focus-visible, .mk__tabla:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.mk__tabla { overflow-x: auto; max-height: 28rem; overflow-y: auto; border: 1px solid var(--trazo-sutil); border-radius: var(--radius-btn); }
.mk__tabla table { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); font-size: var(--texto-xs); }
.mk__tabla th, .mk__tabla td { padding: var(--sp-8) var(--sp-12); text-align: right; border-bottom: 1px solid var(--trazo-sutil); white-space: nowrap; }
.mk__tabla th:first-child { text-align: left; }
.mk__tabla thead th { position: sticky; top: 0; background: var(--fondo); color: var(--texto-2); font-weight: 600; }
.mk__tabla .nums { font-family: var(--font-mono); color: var(--texto-1); }
.mk__gen { min-height: 32px; padding: 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-xs) var(--font-mono); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
</style>
