<script setup lang="ts">
/**
 * Lista corta de genes de interés: lo que se ve en el panel AL LLEGAR (panel de expertos, 18-oct: un médico viene a
 * preguntar «¿se detecta el gen X en el grupo de interés, por encima del suelo y frente a la referencia?»). Cuatro columnas:
 * gen, % en el grupo de interés, % en la referencia emparejada y suelo ambiental del grupo. Las cifras salen del
 * fichero (las mismas de la tabla completa, CelulaExplorarGenes, que sigue en «Más análisis» con las sondas y la
 * lectura). Un toque en un gen lo abre: se pinta en el mapa y se lee grupo a grupo.
 * Avisos que viajan con la cifra (verificacion): asterisco y nota de circularidad, nota de grupo del hueso (CIRC_HUESO)
 * y «IHQ de HER2: 0» junto a ERBB2.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { fmtParSuelo, fmtPct, porGrupo } from '~/utils/celulaExplorador'
import { CIRC_HUESO, ETIQUETA_GRUPO, ETIQUETA_VEREDICTO, ETIQUETAS_FIJAS, PANEL_INTERES, PROTEINA, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; activo: string | null }>()
const emit = defineEmits<{ elegir: [string]; tabla: [] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const interes = computed(() => props.d.grupos.find((g) => g.rol === 'interes')!)
const filas = computed(() => PANEL_INTERES.filter((g) => props.d.genes.includes(g)).map((gen) => {
  const f = porGrupo(props.d, gen).find((x) => x.rol === 'interes')!
  const [tf, ts] = fmtParSuelo(f.frac, f.suelo, props.lang)
  return { gen, frac: f.frac, suelo: f.suelo, tf, ts, ref: props.d.referencia[gen] ?? 0, circular: !!props.d.seleccion[gen], ver: props.d.veredicto[gen] ?? 'sin_veredicto' }
}))
const hayCirc = computed(() => filas.value.some((f) => f.circular))
const nombre = (g: string) => PROTEINA[g] ?? g
</script>

<template>
  <div class="gin">
    <table class="gin__tabla">
      <caption class="sr-only">{{ L(`Genes de interés en ${etiqueta(ETIQUETA_GRUPO, interes.id, 'es')}, frente a la referencia emparejada y el suelo ambiental. Pulsa un gen para verlo en el mapa y grupo a grupo.`, `Genes of interest in ${etiqueta(ETIQUETA_GRUPO, interes.id, 'en')}, against the matched reference and the ambient floor. Press a gene to see it on the map and group by group.`) }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ L('Gen', 'Gene') }}</th>
          <th scope="col" class="gin__num">{{ etiqueta(ETIQUETA_GRUPO, interes.id, lang) }} <span class="gin__sub nums">n&nbsp;=&nbsp;{{ fmtN(interes.n, lang) }}</span></th>
          <th scope="col" class="gin__num">{{ L('Referencia', 'Reference') }}</th>
          <th scope="col" class="gin__num">{{ L('Suelo', 'Floor') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in filas" :key="f.gen" :class="{ 'gin__fila--activa': f.gen === activo }">
          <th scope="row">
            <button type="button" class="gin__gen" :aria-pressed="f.gen === activo" :data-gen="f.gen" @click="emit('elegir', f.gen)">
              <span class="gin__prot">{{ nombre(f.gen) }}</span>
              <span v-if="PROTEINA[f.gen]" class="gin__sim">{{ f.gen }}</span>
            </button>
            <span v-if="f.gen === 'ERBB2'" class="gin__ihq">{{ ETIQUETAS_FIJAS.her2[lang] }}</span>
            <!-- la lectura va con la cifra (comité médico, 18-oct): sin ella, TROP2 o B7-H3 «sobre el suelo y la referencia» se
                 leían como positivos y la revisión dice «No se sostiene» -->
            <span class="gin__lec">{{ L('Lectura (borrador):', 'Reading (draft):') }} {{ (ETIQUETA_VEREDICTO[f.ver] ?? ETIQUETA_VEREDICTO.sin_veredicto)[lang] }}</span>
          </th>
          <td class="gin__num nums">{{ f.tf }}<span v-if="f.circular" class="gin__ast"><span aria-hidden="true">*</span><span class="sr-only">{{ L('(circular)', '(circular)') }}</span></span></td>
          <td class="gin__num nums">{{ fmtPct(f.ref, lang) }}</td>
          <td class="gin__num nums">{{ f.ts }}</td>
        </tr>
      </tbody>
    </table>
    <p class="gin__pie">
      {{ L('Porcentaje de células con al menos una molécula (UMI) del gen. Referencia: células no tumorales de la misma muestra, con la misma profundidad. Suelo ambiental: lo que saldría solo por ARN suelto de la muestra; lo que no lo supera no cuenta como expresión. Lectura: la de Polaris, en borrador, pendiente de la lectura humana del laboratorio.' + (d.lesion === 'hueso' ? ' En el hueso, el suelo incluye además el ADN genómico del tejido.' : ''),
        'Share of cells with at least one molecule (UMI) of the gene. Reference: non-tumor cells from the same sample, at the same depth. Ambient floor: what would show up from loose RNA in the sample alone; anything that does not clear it does not count as expression. Reading: Polaris’s, in draft, pending the laboratory’s human reading.' + (d.lesion === 'hueso' ? ' In the bone, the floor also includes the tissue’s genomic DNA.' : '')) }}
    </p>
    <p v-if="hayCirc" class="gin__pie gin__circ">
      * <strong>{{ L('Circular.', 'Circular.') }}</strong>
      {{ L('El gen participa en la selección de este grupo o va ligado al programa con el que se seleccionó: su cifra en el grupo sale en parte de cómo se eligió. Al abrirlo verás la cifra sin esa circularidad, si existe.',
        'The gene takes part in selecting this group or is tied to the program it was selected by: its figure in the group partly comes from how it was chosen. Open it to see the figure without that circularity, where it exists.') }}
    </p>
    <p v-if="d.lesion === 'hueso'" class="gin__pie gin__circ"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
    <p class="gin__acciones">
      <span>{{ L('Pulsa un gen para verlo en el mapa y grupo a grupo.', 'Press a gene to see it on the map and group by group.') }}</span>
      <button type="button" class="gin__enlace" @click="emit('tabla')">{{ L('Tabla completa, con sondas y lectura', 'Full table, with probes and reading') }}</button>
    </p>
  </div>
</template>

<style scoped>
.gin__tabla { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); }
.gin { container-type: inline-size; }
.gin__tabla th, .gin__tabla td { padding: var(--sp-4) var(--sp-8); border-bottom: 1px solid var(--trazo-sutil); text-align: left; vertical-align: top; }
/* la cifra, a la altura del nombre del gen (botón de 44 px con el texto centrado), no centrada en la fila entera */
.gin__tabla tbody td { line-height: 44px; }
.gin__tabla thead th { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); vertical-align: bottom; }
.gin__num { text-align: right !important; white-space: nowrap; }
/* el nombre del grupo de interés puede partirse en la cabecera (a 375 no cabía en una línea); las cifras, nunca */
.gin__tabla thead th.gin__num { white-space: normal; }
.gin__sub { display: block; font: 500 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-2); }
.gin__gen { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 0 var(--sp-8); min-height: 44px; padding: 0 var(--sp-8); margin-left: calc(-1 * var(--sp-8)); border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--identidad); font: 600 var(--texto-sm)/1.2 var(--font-body); text-align: left; cursor: pointer; }
/* subrayado solo en el nombre: en el botón entero alcanzaba también al símbolo */
.gin__prot { white-space: nowrap; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
@media (hover: hover) { .gin__gen:hover { background: var(--trazo-sutil); } }
.gin__gen:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 1px; }
.gin__gen[aria-pressed='true'] { background: color-mix(in srgb, var(--identidad) 14%, transparent); box-shadow: inset 0 0 0 1px var(--identidad); }
.gin__gen[aria-pressed='true'] .gin__prot { text-decoration-thickness: 2px; }
.gin__sim { font: 500 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
/* panel estrecho (móvil, 311 px útiles): nombre y símbolo uno encima del otro y menos relleno, para que quepan las cuatro columnas */
@container (max-width: 440px) {
  .gin__tabla th, .gin__tabla td { padding: var(--sp-4) var(--sp-4); }
  .gin__gen { flex-direction: column; align-items: flex-start; justify-content: center; padding-block: var(--sp-4); }
}
.gin__ihq { display: block; font: 600 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-1); }
.gin__lec { display: block; margin-bottom: var(--sp-4); font: 500 var(--texto-xs)/1.35 var(--font-body); color: var(--texto-2); }
.gin__ast { display: inline-block; width: 0; overflow: visible; margin-left: 1px; font-weight: 700; color: var(--texto-1); }   /* no empuja la cifra: los «%» alinean */
.gin__tabla td.nums { font-family: var(--font-mono); color: var(--texto-1); }
.gin__pie { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.gin__circ { color: var(--texto-1); }
.gin__acciones { display: flex; flex-wrap: wrap; gap: var(--sp-8) var(--sp-16); align-items: center; margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.gin__enlace { min-height: 44px; padding: 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-sm)/1.2 var(--font-body); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.gin__enlace:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
</style>
