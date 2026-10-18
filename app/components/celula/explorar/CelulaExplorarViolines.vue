<script setup lang="ts">
/**
 * Violines propios (SVG, tokens del sistema), uno por grupo. En CADA fila, en la misma figura:
 *  · el violín del nivel (log10 CP10k) en las células donde el gen se detecta, con su mediana;
 *  · la barra de detección con el SUELO AMBIENTAL marcado (franja rayada): lo que no lo supera no
 *    cuenta como expresión;
 *  · el n del grupo y el número de células detectadas, a la vista.
 * Con menos de 3 células detectadas no se dibuja forma (sería inventarla): se ponen los puntos.
 * Si el gen participa en la selección del grupo de interés, esa fila lleva, ANTES de la figura, la cifra
 * medida sin esa circularidad (loo) si existe, y después el rótulo de cifra circular: la primera cifra que se
 * lee es la de la revisión, no la circular (revisión de cifras del 17-oct-2026). Sin loo, se dice que no la
 * hay. El suelo ambiental lleva el aviso de ADN genómico con las cifras de la muestra (fracción de UMI, no de
 * lecturas), que vienen del fichero (nunca del texto).
 * Sin animaciones. El estado no va solo en color: hay texto en cada fila y aria-label con las cifras.
 */
import type { Adn, FilaGrupo, Lesion, Loo } from '~/utils/celulaExplorador'
import { densidad, fmtPct, fmtPctFino, fmtPctSig } from '~/utils/celulaExplorador'
import { CIRC_HUESO, ETIQUETAS_FIJAS, ETIQUETA_GRUPO, PAPEL_SELECCION, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ filas: FilaGrupo[]; gen: string; lang: 'es' | 'en'; lesion: Lesion; adn: Adn; papel?: string; loo?: Loo }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const uid = useId()

const W = 300, H = 40, BX = 340, BW = 140
const X0 = -12, ANCHO = BX + BW + 24
/** posición (%) de una x del viewBox, para colocar las etiquetas del eje en HTML */
const pos = (xv: number) => ((xv - X0) / ANCHO) * 100
const rango = computed<[number, number]>(() => {
  const todos = props.filas.flatMap((f) => f.niveles)
  if (!todos.length) return [0, 1]
  const a = Math.floor(Math.min(...todos)), b = Math.ceil(Math.max(...todos))
  return [a, b === a ? a + 1 : b]
})
const x = (v: number) => ((v - rango.value[0]) / (rango.value[1] - rango.value[0])) * W
const ticks = computed(() => { const [a, b] = rango.value; return Array.from({ length: b - a + 1 }, (_, k) => a + k) })
const fmt10 = (e: number) => { const v = 10 ** e; return v >= 1 ? String(Math.round(v)) : String(Number(v.toPrecision(1))).replace('.', props.lang === 'en' ? '.' : ',') }

function forma(f: FilaGrupo): string {
  if (f.niveles.length < 3) return ''
  const [a, b] = rango.value, m = 48
  const ys = densidad(f.niveles, a, b, m)
  const mitad = H / 2 - 3
  const arriba = ys.map((y, j) => `${(j / (m - 1)) * W},${H / 2 - y * mitad}`)
  const abajo = ys.map((y, j) => `${(j / (m - 1)) * W},${H / 2 + y * mitad}`).reverse()
  return `M${arriba.join('L')}L${abajo.join('L')}Z`
}
const mediana = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]! }
const nf = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, props.lang === 'en' ? ',' : '.')
const adnTxt = computed(() => {
  // dos estimaciones de la MUESTRA ENTERA, con su nombre (no un rango: se leía como rango entre grupos y no cuadraba
  // con las barras de «ADN genómico por grupo»; diseño y verificacion, 18-oct). Cell Ranger, con su propia precisión.
  const a = props.adn, f = (x: number) => fmtPctFino(x, props.lang)
  const est = f(a.frac_lecturas_estimada), cr = fmtPctSig(a.frac_lecturas_cell_ranger, props.lang)
  const hueso = props.lesion === 'hueso'
  return L(`${nf(a.sondas_dentro_de_exon)} de las ${nf(a.sondas_panel)} sondas del panel caen dentro de un exón y también hibridan con el ADN genómico del tejido fijado en formol (FFPE). Para la muestra entera hay dos estimaciones de la parte de las UMI, las moléculas contadas, que viene de ese ADN: ${est} (la de este análisis) y ${cr} (la de Cell Ranger, «Estimated UMIs from genomic DNA»). En el grupo de interés, ${f(a.frac_lecturas_interes)}.${hueso ? ' En el hueso el suelo ambiental incluye ese ADN.' : ''}`,
    `${nf(a.sondas_dentro_de_exon)} of the panel’s ${nf(a.sondas_panel)} probes fall inside an exon and also bind the genomic DNA of the formalin-fixed tissue (FFPE). For the whole sample there are two estimates of the share of UMIs, the molecules counted, that comes from that DNA: ${est} (this analysis) and ${cr} (Cell Ranger’s “Estimated UMIs from genomic DNA”). In the group of interest, ${f(a.frac_lecturas_interes)}.${hueso ? ' In the bone the ambient floor includes that DNA.' : ''}`)
})
const nfCp = (x: number) => String(Math.round(x))
</script>

<template>
  <div class="vio">
    <div class="vio__titulos" aria-hidden="true">
      <span :style="{ width: `${(W / (BX + BW)) * 100}%` }">{{ L('Nivel en las células donde se detecta (CP10k)', 'Level in cells where detected (CP10k)') }}</span>
      <span :style="{ width: `${(BW / (BX + BW)) * 100}%` }">{{ L('% de células donde se detecta', '% of cells where detected') }}</span>
    </div>
    <!-- ejes en HTML (no escalan con el viewBox: legibles también a 375 px) -->
    <div class="vio__eje" aria-hidden="true">
      <span v-for="tk in ticks" :key="tk" class="vio__tt" :style="{ left: `${pos(x(tk))}%` }">{{ fmt10(tk) }}</span>
      <span v-for="p in [0, 50, 100]" :key="`p${p}`" class="vio__tt" :style="{ left: `${pos(BX + (BW * p) / 100)}%` }">{{ p }}</span>
    </div>
    <ul class="vio__lista">
      <li v-for="f in filas" :key="f.id" class="vio__fila" :class="`vio__fila--${f.rol}`">
        <div class="vio__cab">
          <span class="vio__nombre">{{ etiqueta(ETIQUETA_GRUPO, f.id, lang) }}</span>
          <span class="vio__n nums">n = {{ nf(f.n) }}</span>
        </div>
        <!-- circularidad: la cifra sin ella va PRIMERO; la de la figura (este grupo) queda rotulada como circular -->
        <p v-if="f.rol === 'interes' && lesion === 'hueso'" class="vio__circ vio__circ--grupo" role="note"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
        <p v-if="f.rol === 'interes' && papel" class="vio__circ" role="note">
          <template v-if="loo">
            <strong>{{ L('Sin esa circularidad', 'Without that circularity') }}</strong>
            {{ L(`(grupo construido sin ese criterio, n\u00a0=\u00a0${nf(loo.n)}):`, `(group built without that criterion, n\u00a0=\u00a0${nf(loo.n)}):`) }}
            <template v-if="loo.frac != null">{{ L('detectado', 'detected') }} {{ fmtPct(loo.frac, lang) }}</template><template v-if="loo.ref != null"> · {{ L('referencia', 'reference') }} {{ fmtPct(loo.ref, lang) }}</template><template v-if="loo.cp10k_pseudobulk != null"> · pseudobulk&nbsp;{{ nfCp(loo.cp10k_pseudobulk) }}&nbsp;CP10k</template>.
          </template>
          <strong>{{ L('Cifra circular.', 'Circular figure.') }}</strong>
          {{ L(`La de abajo es la de este grupo, y ${gen} ${PAPEL_SELECCION[papel]?.es ?? ''}.`, `The one below is this group’s, and ${gen} ${PAPEL_SELECCION[papel]?.en ?? ''}.`) }}
          <template v-if="!loo">{{ L('No hay cifra medida sin esa circularidad.', 'There is no figure measured without that circularity.') }}</template>
        </p>
        <svg class="vio__svg" :viewBox="`${X0} 0 ${ANCHO} ${H}`" aria-hidden="true">
          <defs>
            <pattern :id="`${uid}-raya`" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" class="vio__raya" />
            </pattern>
          </defs>
          <line x1="0" :x2="W" :y1="H / 2" :y2="H / 2" class="vio__base" />
          <path v-if="forma(f)" :d="forma(f)" class="vio__forma" />
          <template v-else>
            <circle v-for="(v, k) in f.niveles" :key="k" :cx="x(v)" :cy="H / 2" r="3" class="vio__punto" />
          </template>
          <line v-if="mediana(f.niveles) != null" :x1="x(mediana(f.niveles)!)" :x2="x(mediana(f.niveles)!)" :y1="H / 2 - 9" :y2="H / 2 + 9" class="vio__mediana" />
          <!-- detección y suelo ambiental, en la misma figura -->
          <rect :x="BX" y="12" :width="BW" height="16" class="vio__marco" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.frac)" height="16" class="vio__det" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.suelo)" height="16" :fill="`url(#${uid}-raya)`" class="vio__suelo" />
          <line :x1="BX + BW * Math.min(1, f.suelo)" :x2="BX + BW * Math.min(1, f.suelo)" y1="8" y2="32" class="vio__suelo-linea" />
        </svg>
        <p class="vio__txt nums">
          <template v-if="f.rol === 'interes' && papel">{{ L('Circular · ', 'Circular · ') }}</template><span class="vio__par">{{ L(`Detectado ${fmtPct(f.frac, 'es')} (${nf(f.detectadas)})`, `Detected ${fmtPct(f.frac, 'en')} (${nf(f.detectadas)})`) }}</span> · <span class="vio__par">{{ L(`suelo ${fmtPct(f.suelo, 'es')}`, `floor ${fmtPct(f.suelo, 'en')}`) }}</span><template v-if="mediana(f.niveles) != null"> · <span class="vio__par">{{ L('mediana', 'median') }} {{ fmt10(mediana(f.niveles)!) }} CP10k</span></template>
          <template v-if="f.detectadas < 3"> · {{ L('pocas células para dibujar la forma', 'too few cells to draw a shape') }}</template>
        </p>
      </li>
    </ul>
    <div class="vio__leyenda">
      <span class="vio__muestra vio__muestra--raya" aria-hidden="true" />
      <div>
        <p>
          {{ L('Suelo ambiental: el porcentaje de células en las que el gen saldría solo por ARN suelto en la muestra. Lo que no lo supera no cuenta como expresión, pero superarlo no basta: en los grupos no tumorales, parte de la señal de los genes del tumor viene de gotas con dos células o de ARN del tumor que el suelo no recoge, y no es expresión de esas células. Si el suelo supera lo detectado, está sobreestimado para ese gen en ese grupo.',
            'Ambient floor: the share of cells where the gene would show up from loose RNA in the sample alone. Anything at or below it does not count as expression, but clearing it is not enough: in non-tumor groups, part of the signal from tumor genes comes from droplets holding two cells or from tumor RNA the floor does not capture, and it is not expression by those cells. If the floor is above what is detected, it is overestimated for that gene in that group.') }}
        </p>
        <p class="vio__adn"><strong>{{ L(`${ETIQUETAS_FIJAS.matriz.es}.`, `${ETIQUETAS_FIJAS.matriz.en}.`) }}</strong> {{ adnTxt }}</p>
      </div>
    </div>
    <p class="vio__leyenda">
      {{ L('El violín es el nivel (CP10k, escala logarítmica) solo en las células donde el gen se detecta; la raya vertical es la mediana.',
        'The violin is the level (CP10k, log scale) only in cells where the gene is detected; the vertical tick is the median.') }}
      {{ L(`${ETIQUETAS_FIJAS.mediana.es}.`, `${ETIQUETAS_FIJAS.mediana.en}.`) }}
    </p>
  </div>
</template>

<style scoped>
.vio { color: var(--texto-1); }
.vio__titulos { display: flex; justify-content: space-between; gap: var(--sp-8); font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.vio__titulos span:last-child { text-align: right; }
.vio__eje { position: relative; height: 1.4em; margin: var(--sp-4) 0; border-bottom: 1px solid var(--trazo-fuerte); }
.vio__tt { position: absolute; top: 0; transform: translateX(-50%); font: 500 var(--texto-xs)/1.2 var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.vio__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-8); }
.vio__fila { padding: var(--sp-8) 0; border-top: 1px solid var(--trazo-sutil); }
.vio__cab { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sp-8); }
.vio__nombre { font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.vio__fila--interes .vio__nombre { color: var(--identidad); }
.vio__n { font: 500 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.vio__par { white-space: nowrap; }
.vio__svg { display: block; width: 100%; height: auto; margin-top: var(--sp-4); overflow: visible; }
.vio__base { stroke: var(--trazo-medio); }
.vio__forma { fill: color-mix(in srgb, var(--texto-2) 40%, transparent); stroke: var(--texto-2); stroke-width: 1; vector-effect: non-scaling-stroke; }
.vio__fila--interes .vio__forma { fill: color-mix(in srgb, var(--identidad) 45%, transparent); stroke: var(--identidad); }
.vio__punto { fill: var(--texto-2); }
.vio__mediana { stroke: var(--texto-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
.vio__marco { fill: none; stroke: var(--trazo-interactivo); vector-effect: non-scaling-stroke; }
.vio__det { fill: color-mix(in srgb, var(--texto-2) 55%, transparent); }
.vio__fila--interes .vio__det { fill: color-mix(in srgb, var(--identidad) 70%, transparent); }
.vio__raya { stroke: var(--texto-1); stroke-width: 2; }
.vio__suelo { stroke: var(--texto-1); stroke-width: 1; }
.vio__suelo-linea { stroke: var(--texto-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
.vio__txt { margin: var(--sp-4) 0 0; font: 500 var(--texto-xs)/1.4 var(--font-mono); color: var(--texto-2); }
.vio__leyenda { display: flex; gap: var(--sp-8); align-items: flex-start; margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.vio__leyenda p { margin: 0; }
.vio__adn { margin-top: var(--sp-8) !important; color: var(--texto-1); }
.vio__circ { margin: var(--sp-4) 0 var(--sp-4); padding: var(--sp-8) var(--sp-12); border-left: 3px solid var(--texto-1); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); max-width: var(--measure); }
.vio__muestra { flex: none; width: 22px; height: 12px; margin-top: 3px; border: 1px solid var(--texto-1); }
.vio__muestra--raya { background: repeating-linear-gradient(45deg, var(--texto-1) 0 2px, transparent 2px 5px); }
@media (forced-colors: active) {
  .vio__forma, .vio__det { fill: CanvasText; }
  .vio__raya, .vio__suelo-linea, .vio__mediana { stroke: Highlight; }
}
</style>
