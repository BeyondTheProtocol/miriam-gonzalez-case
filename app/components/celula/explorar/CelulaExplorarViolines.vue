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
import { densidad, fmtIC, fmtParSuelo, fmtPct, fmtPctFino, fmtPctSig, icLoo, r4, tsv } from '~/utils/celulaExplorador'
import { CIRC_HUESO, ETIQUETAS_FIJAS, ETIQUETA_GRUPO, IC_NOTA, PAPEL_SELECCION, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ filas: FilaGrupo[]; gen: string; lang: 'es' | 'en'; lesion: Lesion; adn: Adn; papel?: string; loo?: Loo; referencia?: number }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const uid = useId()

const W = 300, H = 40, BX = 372, BW = 140
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
/* «Copiar cifras (TSV)» (plan «muy útil a científicos», 19-oct): lo que ya se ve, en texto tabulado, sin cifras nuevas */
const { estado: copiado, copia, reinicia } = useCopiado()
watch(() => [props.gen, props.lesion], reinicia)
async function copiaTSV() {
  const cab = ['lesion', 'gen', 'grupo', 'n', 'detectadas', 'frac_detectada', 'ic95_inf', 'ic95_sup', 'suelo', 'mediana_cp10k']
  const filas = props.filas.map((f) => {
    const m = mediana(f.niveles)
    return [props.lesion, props.gen, f.id, f.n, f.detectadas, r4(f.frac), r4(f.ic?.[0]), r4(f.ic?.[1]), r4(f.suelo), m == null ? '' : Number((10 ** m).toPrecision(3))]
  })
  await copia(tsv([cab, ...filas]), L('Copiado: una fila por grupo.', 'Copied: one row per group.'), L('No se pudo copiar en este navegador.', 'Could not copy in this browser.'))
}
/** Partes de la línea de cifras. Si detectado y suelo pasan los dos de 0,9, el porcentaje no distingue nada: cuenta el
 * nivel (comité médico, 18-oct: FGFR1 del hueso salía «no supera el suelo», una lectura de negativo falsa). */
function partes(f: FilaGrupo): { t: string; fuerte?: boolean }[] {
  const [a, b] = fmtParSuelo(f.frac, f.suelo, props.lang)
  const p: { t: string; fuerte?: boolean }[] = [{ t: L(`Detectado ${a} (${nf(f.detectadas)})`, `Detected ${a} (${nf(f.detectadas)})`) }]
  // IC95 de Wilson (plan «muy útil a científicos», 19-oct): descriptivo, justo después de la cifra que acota
  if (f.ic) p.push({ t: fmtIC(f.ic, props.lang) })
  p.push({ t: L(`suelo ${b}`, `floor ${b}`) })
  if (f.frac >= 0.9 && f.suelo >= 0.9) p.push({ t: L('en casi todas las células: cuenta el nivel', 'in almost every cell: the level is what counts'), fuerte: true })
  else if (f.frac <= f.suelo) p.push({ t: L('no supera el suelo', 'does not clear the floor'), fuerte: true })
  const m = mediana(f.niveles)
  if (m != null) p.push({ t: `${L('mediana', 'median')} ${fmt10(m)} CP10k` })
  if (f.detectadas < 3) p.push({ t: L('pocas células para dibujar la forma', 'too few cells to draw a shape') })
  return p
}
</script>

<template>
  <div class="vio">
    <div class="vio__leyenda vio__leyenda--arriba">
      <span class="vio__muestra vio__muestra--raya" aria-hidden="true" />
      <div>
        <p>
          {{ L('Suelo ambiental: el porcentaje de células en las que el gen saldría solo por ARN suelto en la muestra. Lo que no lo supera no cuenta como expresión.' + (lesion === 'hueso' ? ' En el hueso, el suelo incluye además el ADN genómico del tejido (ver «Cómo se lee»).' : ' En el hígado el suelo es un mínimo: para los genes del tumor decide la referencia emparejada.'),
            'Ambient floor: the share of cells where the gene would show up from loose RNA in the sample alone. Anything at or below it does not count as expression.' + (lesion === 'hueso' ? ' In the bone, the floor also includes the tissue’s genomic DNA (see “How to read it”).' : ' In the liver the floor is a minimum: for tumor genes, the matched reference decides.')) }}
        </p>
      </div>
    </div>
    <div class="vio__titulos" aria-hidden="true">
      <span :style="{ width: `${(W / (BX + BW)) * 100}%` }">{{ L('Nivel en las células donde se detecta (CP10k)', 'Level in cells where detected (CP10k)') }}</span>
      <span :style="{ width: `${(BW / (BX + BW)) * 100}%` }">{{ L('% de células donde se detecta', '% of cells where detected') }}</span>
    </div>
    <!-- ejes en HTML (no escalan con el viewBox: legibles también a 375 px) -->
    <div class="vio__eje" aria-hidden="true">
      <span v-for="(tk, k) in ticks" :key="tk" class="vio__tt" :class="{ 'vio__tt--salta': ticks.length > 4 && k % 2 === 1 }" :style="{ left: `${pos(x(tk))}%` }">{{ fmt10(tk) }}</span>
      <span v-for="p in [0, 50, 100]" :key="`p${p}`" class="vio__tt" :style="{ left: `${pos(BX + (BW * p) / 100)}%` }">{{ p }}</span>
    </div>
    <ul class="vio__lista" role="list">
      <li v-for="f in filas" :key="f.id" class="vio__fila" :class="`vio__fila--${f.rol}`">
        <div class="vio__cab">
          <span class="vio__nombre">{{ etiqueta(ETIQUETA_GRUPO, f.id, lang) }}</span>
          <span class="vio__n nums">n = {{ nf(f.n) }}</span>
        </div>
        <!-- circularidad: la cifra sin ella va PRIMERO; la de la figura (este grupo) queda rotulada como circular -->
        <p v-if="f.rol === 'interes' && papel" class="vio__circ" role="note">
          <template v-if="loo">
            <strong>{{ L('Sin esa circularidad', 'Without that circularity') }}</strong>
            {{ L(`(grupo construido sin ese criterio, n\u00a0=\u00a0${nf(loo.n)}):`, `(group built without that criterion, n\u00a0=\u00a0${nf(loo.n)}):`) }}
            <template v-if="loo.frac != null">{{ L('detectado', 'detected') }} {{ fmtPct(loo.frac, lang) }}<template v-if="icLoo(loo)"> ({{ fmtIC(icLoo(loo), lang) }})</template></template><template v-if="loo.ref != null">, {{ L('referencia', 'reference') }} {{ fmtPct(loo.ref, lang) }}</template><template v-if="loo.cp10k_pseudobulk != null">, pseudobulk&nbsp;{{ nfCp(loo.cp10k_pseudobulk) }}&nbsp;CP10k</template>.
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
          <line v-if="mediana(f.niveles) != null" :x1="x(mediana(f.niveles)!)" :x2="x(mediana(f.niveles)!)" :y1="H / 2 - 6" :y2="H / 2 + 6" class="vio__mediana" />
          <!-- detección y suelo ambiental, en la misma figura -->
          <rect :x="BX" y="12" :width="BW" height="16" class="vio__marco" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.frac)" height="16" class="vio__det" />
          <rect :x="BX" y="12" :width="BW * Math.min(1, f.suelo)" height="16" :fill="`url(#${uid}-raya)`" class="vio__suelo" />
          <line :x1="BX + BW * Math.min(1, f.suelo)" :x2="BX + BW * Math.min(1, f.suelo)" y1="8" y2="32" class="vio__suelo-linea" />
        </svg>
        <p class="vio__txt nums">
          <strong v-if="f.rol === 'interes' && papel" class="vio__bajo">{{ L('Circular', 'Circular') }}</strong><span v-for="(x, k) in partes(f)" :key="k" class="vio__par"><strong v-if="x.fuerte" class="vio__bajo">{{ x.t }}</strong><template v-else>{{ x.t }}</template></span>
        </p>
        <!-- la referencia emparejada no es ningún grupo de la lista: se da aquí, junto al grupo de interés (comité médico, 18-oct) -->
        <p v-if="f.rol === 'interes' && referencia != null" class="vio__ref nums">{{ L(`Referencia emparejada (células no tumorales de la misma muestra, a la misma profundidad): ${fmtPct(referencia, 'es')}`, `Matched reference (non-tumor cells from the same sample, at the same depth): ${fmtPct(referencia, 'en')}`) }}</p>
        <!-- en el hueso el grupo entero es circular: la nota cierra la fila -->
        <p v-if="f.rol === 'interes' && lesion === 'hueso'" class="vio__circ vio__circ--grupo" role="note"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
      </li>
    </ul>
    <div class="vio__copiar">
      <button type="button" class="vio__btn" @click="copiaTSV">{{ L('Copiar cifras (TSV)', 'Copy figures (TSV)') }}</button>
      <span class="vio__estado" role="status">{{ copiado }}</span>
    </div>
    <!-- auditoría 18-oct: superar el suelo no basta en los grupos no tumorales (a la vista, después de las cifras) -->
    <p class="vio__leyenda vio__noBasta"><strong>{{ L('Superar el suelo no basta.', 'Clearing the floor is not enough.') }}</strong> {{ L('En los grupos no tumorales, parte de la señal de los genes del tumor viene de gotas con dos células o de ARN del tumor que el suelo no recoge, y no es expresión de esas células. Vale cuando el grupo de interés supera a esos grupos; si un grupo no tumoral lo supera, esa señal no se explica así.', 'In non-tumor groups, part of the signal from tumor genes comes from droplets holding two cells or from tumor RNA the floor does not capture, and it is not expression by those cells. This holds when the group of interest exceeds those groups; if a non-tumor group exceeds it, that signal is not explained this way.') }}</p>
    <!-- simulador (18-oct): lo explicativo, plegado; las cifras, el n, el suelo y la circularidad quedan siempre a la vista -->
    <details class="vio__como">
      <summary>{{ L('Cómo se lee', 'How to read it') }}</summary>
      <p class="vio__leyenda">{{ L('Si el suelo supera lo detectado, el suelo está sobreestimado para ese gen en ese grupo o, en grupos pequeños, la diferencia cabe en el azar del muestreo.', 'If the floor is above what is detected, the floor is overestimated for that gene in that group or, in small groups, the difference is within sampling chance.') }}</p>
      <p class="vio__leyenda">{{ L(IC_NOTA.es, IC_NOTA.en) }}</p>
      <p class="vio__adn"><strong>{{ L(`${ETIQUETAS_FIJAS.matriz.es}.`, `${ETIQUETAS_FIJAS.matriz.en}.`) }}</strong> {{ adnTxt }}</p>
      <p class="vio__leyenda">
        {{ L('El violín es el nivel (CP10k, escala logarítmica) solo en las células donde el gen se detecta; la raya vertical es la mediana.',
          'The violin is the level (CP10k, log scale) only in cells where the gene is detected; the vertical tick is the median.') }}
        {{ L(`${ETIQUETAS_FIJAS.mediana.es}.`, `${ETIQUETAS_FIJAS.mediana.en}.`) }}
      </p>
    </details>
  </div>
</template>

<style scoped>
.vio { color: var(--texto-1); container-type: inline-size; }
@container (max-width: 440px) { .vio__tt--salta { display: none; } }
.vio__titulos { display: flex; justify-content: space-between; gap: var(--sp-8); font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.vio__titulos span:last-child { text-align: right; }
.vio__eje { position: relative; height: 1.4em; margin: var(--sp-4) 0; border-bottom: 1px solid var(--trazo-fuerte); }
.vio__tt { position: absolute; top: 0; transform: translateX(-50%); font: 500 var(--texto-xs)/1.2 var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.vio__lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-8); }   /* ninguna fila ensancha la columna */
.vio__fila { min-width: 0; padding: var(--sp-8) 0; border-top: 1px solid var(--trazo-sutil); }
.vio__cab { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sp-8); }
.vio__nombre { font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.vio__fila--interes .vio__nombre { color: var(--identidad); }
.vio__n { font: 500 var(--texto-xs)/1.3 var(--font-mono); color: var(--texto-2); white-space: nowrap; }
.vio__txt { display: flex; flex-wrap: wrap; gap: 0 1.7em; overflow-wrap: anywhere; }   /* partes separadas por aire, sin «·» colgados (diseño, 18-oct) */
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
.vio__bajo { color: var(--texto-1); font-weight: 700; }
.vio__ref { margin: var(--sp-4) 0 0; font: 500 var(--texto-xs)/1.4 var(--font-mono); color: var(--texto-1); }
.vio__leyenda { display: flex; gap: var(--sp-8); align-items: flex-start; margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.vio__leyenda p { margin: 0; }
.vio__noBasta strong { color: var(--texto-1); }
.vio__leyenda--arriba { margin: 0 0 var(--sp-12); }
.vio__adn { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); max-width: var(--measure); }
.vio__copiar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-12); margin-top: var(--sp-12); }
.vio__btn { min-height: 44px; padding: 0 var(--sp-16); border: 1px solid var(--trazo-interactivo); border-radius: var(--radius-btn); background: var(--fondo); color: var(--texto-1); font: 600 var(--texto-sm)/1.2 var(--font-body); -webkit-tap-highlight-color: transparent; }
@media (hover: hover) { .vio__btn:hover { background: var(--trazo-sutil); } }
.vio__btn:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.vio__estado { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.vio__como { margin-top: var(--sp-12); }
.vio__como summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--identidad); }
.vio__como summary::-webkit-details-marker { display: none; }
.vio__como summary::before { content: ''; display: inline-block; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s ease; flex-shrink: 0; margin-right: var(--sp-8); }
.vio__como[open] summary::before { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .vio__como summary::before { transition: none; } }
.vio__como summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.vio__circ { margin: var(--sp-4) 0 var(--sp-4); padding: var(--sp-8) var(--sp-12); border-left: 3px solid var(--texto-1); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); max-width: var(--measure); }
.vio__muestra { flex: none; width: 22px; height: 12px; margin-top: 3px; border: 1px solid var(--texto-1); }
.vio__muestra--raya { background: repeating-linear-gradient(45deg, var(--texto-1) 0 2px, transparent 2px 5px); }
@media (forced-colors: active) {
  .vio__forma, .vio__det { fill: CanvasText; }
  .vio__raya, .vio__suelo-linea, .vio__mediana { stroke: Highlight; }
}
</style>
