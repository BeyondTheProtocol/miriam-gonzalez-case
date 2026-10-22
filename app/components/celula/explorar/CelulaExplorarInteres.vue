<script setup lang="ts">
/**
 * Lista corta de genes de interés: lo que se ve en el panel AL LLEGAR (panel de expertos, 18-oct: un médico viene a
 * preguntar «¿se detecta el gen X en el grupo de interés, por encima del suelo y frente a la referencia?»). Cuatro columnas:
 * gen, % en el grupo de interés, % en la referencia emparejada y suelo ambiental del grupo. Las cifras salen del
 * fichero (las mismas de la tabla completa, CelulaExplorarGenes, que sigue en «Más análisis» con las sondas y la
 * lectura). Un toque en un gen lo abre: se pinta en el mapa y se lee grupo a grupo.
 * Avisos que viajan con la cifra (verificacion): asterisco y nota de circularidad, nota de grupo del hueso (CIRC_HUESO)
 * y «IHQ de HER2: 0 (primario e hígado)» junto a ERBB2, solo en el hígado.
 * «3D» junto a cada proteína con modelo de AlphaFold (21-oct-2026): abre su vista previa (CelulaExplorarVistaForma, que
 * vive en el explorador); botón hermano del del gen, nunca dentro, y sin quinta columna (diseno).
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { uniprotDe } from '~/utils/alphafold'
import { fmtParSuelo, fmtPct, motivoDe, porGrupo, traeMotivo } from '~/utils/celulaExplorador'
import { AVISO_HIGADO, CIRC_HUESO, ETIQUETA_GRUPO, ETIQUETA_MOTIVO, LECTURA, etiquetaInteres, etiquetaLectura, pieMotivo, ETIQUETAS_FIJAS, PANEL_INTERES, PROTEINA, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ d: LesionDatos; lang: 'es' | 'en'; activo: string | null; sinMapa?: boolean; formaAbierta?: string | null }>()
/** forma: ratón que entra o sale de «3D», o pulsación (con `tactil` si fue con el dedo: abre la hoja) */
const emit = defineEmits<{ elegir: [string]; tabla: []; forma: [tipo: 'entra' | 'sale' | 'fija', gen: string, el: HTMLElement, tactil: boolean] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const interes = computed(() => props.d.grupos.find((g) => g.rol === 'interes')!)
const filas = computed(() => PANEL_INTERES.filter((g) => props.d.genes.includes(g)).map((gen) => {
  const f = porGrupo(props.d, gen).find((x) => x.rol === 'interes')!
  const [tf, ts] = fmtParSuelo(f.frac, f.suelo, props.lang)
  return { gen, frac: f.frac, suelo: f.suelo, tf, ts, ref: props.d.referencia[gen] ?? 0, circular: !!props.d.seleccion[gen], ver: props.d.veredicto[gen] ?? 'sin_veredicto', mot: motivoDe(props.d, gen) }
}))
const hayCirc = computed(() => filas.value.some((f) => f.circular))
const conMotivo = computed(() => traeMotivo(props.d))
const nombre = (g: string) => PROTEINA[g] ?? g
/** con qué se pulsó «3D»: el clic no siempre lo dice (Safari, teclado); un pointerdown de hace menos de 1 s, sí */
let puntero = { tipo: '', t: 0 }
function marcaPuntero(e: PointerEvent) { puntero = { tipo: e.pointerType, t: performance.now() } }
function forma3d(e: Event, tipo: 'entra' | 'sale' | 'fija', gen: string) {
  const el = e.currentTarget as HTMLElement
  if (tipo !== 'fija') { if ((e as PointerEvent).pointerType === 'mouse') emit('forma', tipo, gen, el, false); return }
  const tactil = (puntero.tipo === 'touch' || puntero.tipo === 'pen') && performance.now() - puntero.t < 1000
  puntero = { tipo: '', t: 0 }
  emit('forma', 'fija', gen, el, tactil)
}
</script>

<template>
  <div class="gin">
    <!-- estrecho: la cabecera se iba de la pantalla tras cuatro genes; el grupo se nombra aquí y cada cifra lleva su rótulo -->
    <p class="gin__cabest" aria-hidden="true">{{ L('Grupo de interés:', 'Group of interest:') }} {{ etiquetaInteres(interes.id, lang) }} · n&nbsp;=&nbsp;{{ fmtN(interes.n, lang) }}</p>
    <!-- de quién son las lecturas, una vez y arriba (avisos aligerados, 22-oct-2026: antes «(borrador)» en cada fila) -->
    <p class="gin__autor">{{ L(LECTURA.pie.es, LECTURA.pie.en) }}</p>
    <table class="gin__tabla">
      <caption class="sr-only">{{ L(`Genes de interés en ${etiqueta(ETIQUETA_GRUPO, interes.id, 'es')}, frente a la referencia emparejada y el suelo ambiental. Pulsa un gen para verlo ${sinMapa ? '' : 'en el mapa y '}grupo a grupo.`, `Genes of interest in ${etiqueta(ETIQUETA_GRUPO, interes.id, 'en')}, against the matched reference and the ambient floor. Press a gene to see it ${sinMapa ? '' : 'on the map and '}group by group.`) }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ L('Gen', 'Gene') }}</th>
          <th scope="col" class="gin__num">{{ etiqueta(ETIQUETA_GRUPO, interes.id, lang) }} <span class="gin__sub nums">{{ interes.id === 'luminal_alta_confianza' ? `${AVISO_HIGADO.rotulo[lang]} · ` : '' }}n&nbsp;=&nbsp;{{ fmtN(interes.n, lang) }}</span></th>
          <th scope="col" class="gin__num">{{ L('Referencia', 'Reference') }}</th>
          <th scope="col" class="gin__num">{{ L('Suelo', 'Floor') }}</th>
        </tr>
      </thead>
      <tbody>
        <!-- dos filas por gen: cifras y, a todo el ancho, IHQ y lectura (en 375 la lectura se partía en tres líneas) -->
        <template v-for="f in filas" :key="f.gen">
          <tr class="gin__fila" :class="{ 'gin__fila--activa': f.gen === activo }">
            <th scope="row">
              <div class="gin__genfila">
                <button type="button" class="gin__gen" :aria-pressed="f.gen === activo" :data-gen="f.gen" @click="emit('elegir', f.gen)">
                  <span class="gin__prot">{{ nombre(f.gen) }}</span>
                  <span v-if="PROTEINA[f.gen]" class="gin__sim">{{ f.gen }}</span>
                </button>
                <!-- icono Phosphor «cube» (regular), path tal cual de @phosphor-icons/core 2.1.1; con «3D» escrito: un icono
                     solo es lo que no se encontraba (diseno, 21-oct) -->
                <button v-if="uniprotDe(f.gen)" type="button" class="gin__3d" :data-gen3d="f.gen" aria-haspopup="dialog" :aria-expanded="formaAbierta === f.gen"
                        :aria-label="L(`Forma 3D de ${nombre(f.gen)}`, `3D shape of ${nombre(f.gen)}`)"
                        @pointerdown="marcaPuntero"
                        @pointerenter="forma3d($event, 'entra', f.gen)" @pointerleave="forma3d($event, 'sale', f.gen)" @click="forma3d($event, 'fija', f.gen)">
                  <svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z" /></svg>
                  <span aria-hidden="true">3D</span>
                </button>
              </div>
            </th>
            <td class="gin__num nums" :data-eti="L('Grupo', 'Group')">{{ f.tf }}<span v-if="f.circular" class="gin__ast"><span aria-hidden="true">*</span><span class="sr-only">{{ L('(circular)', '(circular)') }}</span></span></td>
            <td class="gin__num nums" :data-eti="L('Ref.', 'Ref.')">{{ fmtPct(f.ref, lang) }}</td>
            <td class="gin__num nums" :data-eti="L('Suelo', 'Floor')">{{ f.ts }}</td>
          </tr>
          <!-- la lectura va con la cifra (comité médico, 18-oct): sin ella, TROP2 o B7-H3 «sobre el suelo y la referencia» se
               leían como positivos y la revisión dice «No se sostiene» -->
          <tr class="gin__lecfila" :data-gen="f.gen">
            <td colspan="4">
              <span class="sr-only">{{ nombre(f.gen) }}: </span>
              <span v-if="f.gen === 'ERBB2'" class="gin__ihq">{{ (d.lesion === 'higado' ? ETIQUETAS_FIJAS.her2 : ETIQUETAS_FIJAS.her2Hueso)[lang] }}</span>
              <span v-if="f.gen === 'ERBB3' && d.lesion === 'higado' && !f.mot" class="gin__ihq">{{ ETIQUETAS_FIJAS.her3Higado[lang] }}</span>
              <span class="gin__lec">{{ ETIQUETAS_FIJAS.lecturaCorta[lang] }} <strong class="gin__ver">{{ etiquetaLectura(f.ver, conMotivo, lang) }}</strong><span v-if="f.mot" class="gin__mot" :data-motivo="f.mot"> ({{ etiqueta(ETIQUETA_MOTIVO, f.mot, lang) }})</span></span>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <p class="gin__pie">
      {{ L('% de células con al menos una molécula (UMI) del gen. Referencia: células no tumorales de la misma muestra, a la misma profundidad' + (d.lesion === 'higado' ? ' (en el hígado, sin hepatocitos ni fibroblastos)' : '') + '. Suelo ambiental: lo que daría solo el ARN suelto; si no lo supera, no cuenta como expresión.' + (d.lesion === 'hueso' ? ' En el hueso, el suelo incluye también ADN genómico.' : ''),
        '% of cells with at least one molecule (UMI) of the gene. Reference: non-tumor cells from the same sample, at the same depth' + (d.lesion === 'higado' ? ' (in the liver, no hepatocytes or fibroblasts)' : '') + '. Ambient floor: what loose RNA alone would give; anything that doesn’t clear it isn’t counted as expression.' + (d.lesion === 'hueso' ? ' In the bone, the floor also includes genomic DNA.' : '')) }}
    </p>
    <p v-if="conMotivo" class="gin__pie gin__pmot">{{ pieMotivo(lang) }}</p>
    <p v-if="hayCirc" class="gin__pie gin__circ">
      * <strong>{{ L('Circular.', 'Circular.') }}</strong>
      {{ L('El gen entra en la selección del grupo o va ligado al programa que lo seleccionó. Al abrirlo verás la cifra sin esa circularidad, si la hay.',
        'The gene helps select this group, or is tied to the program that selected it. Open it to see the figure without that circularity, if there is one.') }}
    </p>
    <p v-if="d.lesion === 'hueso'" class="gin__pie gin__circ"><strong>{{ L('Circular.', 'Circular.') }}</strong> {{ L(CIRC_HUESO.es, CIRC_HUESO.en) }}</p>
    <p class="gin__acciones">
      <span>{{ sinMapa ? L('Pulsa un gen para verlo grupo a grupo.', 'Press a gene to see it group by group.') : L('Pulsa un gen para verlo en el mapa y grupo a grupo.', 'Press a gene to see it on the map and group by group.') }}</span>
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
/* el gen y su «3D» en la misma celda (sin quinta columna); en rejilla, para que los «3D» formen columna aunque los
   nombres midan distinto (diseno, 21-oct). 1fr respeta el ancho mínimo del nombre: no lo monta encima del botón */
.gin__genfila { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: var(--sp-4); }
.gin__3d {
  display: inline-flex; align-items: center; gap: var(--sp-4); flex: none; min-height: 44px; min-width: 44px; padding: 0 var(--sp-8);
  border: 1px solid var(--trazo-interactivo); border-radius: 9999px; background: transparent; color: var(--identidad);
  font: 600 var(--texto-xs)/1 var(--font-body); cursor: pointer;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: transform var(--dur-micro) var(--curva-entrada);
}
.gin__3d svg { display: block; width: 16px; height: 16px; }
.gin__3d:active { transform: scale(0.97); }
/* sobre el fondo tintado el violeta bajaba de 4,5:1 (4,10–4,37; diseno, 21-oct): el texto pasa a tinta */
@media (hover: hover) and (pointer: fine) { .gin__3d:hover { background: var(--trazo-sutil); color: var(--texto-1); } }
.gin__3d:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 1px; }
.gin__3d[aria-expanded='true'] { background: color-mix(in srgb, var(--identidad) 14%, transparent); border-color: var(--identidad); color: var(--texto-1); }
/* a 320 px la tabla se salía de la tarjeta con el «3D» al lado: debajo del símbolo (diseno, 21-oct) */
@container (max-width: 300px) {
  .gin__genfila { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .gin__3d { justify-self: start; }
}
@media (prefers-reduced-motion: reduce) { .gin__3d { transition: none; } .gin__3d:active { transform: none; } }
/* panel estrecho (móvil, 311 px útiles): nombre y símbolo uno encima del otro y menos relleno, para que quepan las cuatro columnas */
@container (max-width: 440px) {
  .gin__tabla th, .gin__tabla td { padding: var(--sp-4) var(--sp-4); }
  .gin__gen { flex-direction: column; align-items: flex-start; justify-content: center; padding-block: var(--sp-4); }
  .gin .gin__cabest { display: block; }   /* más específico: la regla base va después en el fichero */
  .gin__tabla thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }   /* oculta solo a la vista */
  .gin__tabla tbody td.gin__num { line-height: 1.3; padding-top: var(--sp-8); }
  .gin__num[data-eti]::before { content: attr(data-eti); display: block; font: 500 var(--texto-xs)/1.2 var(--font-body); color: var(--texto-2); }
}
.gin__ihq { display: block; text-wrap: balance; font: 600 var(--texto-xs)/1.35 var(--font-mono); color: var(--texto-1); }
.gin__lec { font: 500 var(--texto-xs)/1.35 var(--font-body); color: var(--texto-2); }
.gin__ver { font-weight: 600; color: var(--texto-1); }
/* diseño (revisión del motivo): a 375 quedaban huérfanos de una palabra («más)», «la IHQ)») */
.gin__tabla .gin__lecfila td { text-wrap: pretty; }
.gin__cabest { display: none; margin: 0 0 var(--sp-4); font: 600 var(--texto-xs)/1.35 var(--font-body); color: var(--texto-1); }
.gin__tabla .gin__fila th, .gin__tabla .gin__fila td { border-bottom: 0; }
.gin__tabla .gin__lecfila td { padding-top: 0; padding-bottom: var(--sp-8); line-height: 1.35; text-align: left; }
.gin__ast { display: inline-block; width: 0; overflow: visible; margin-left: 1px; margin-right: -1px; font-weight: 700; color: var(--texto-1); }   /* no empuja la cifra: los «%» alinean */
.gin__tabla td.nums { font-family: var(--font-mono); color: var(--texto-1); }
.gin__pie { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
/* de quién son las lecturas, una línea encima de la lista (sustituye a «(borrador)» en cada fila; 22-oct-2026) */
.gin__autor { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.gin__circ { color: var(--texto-1); }
.gin__acciones { display: flex; flex-wrap: wrap; gap: var(--sp-8) var(--sp-16); align-items: center; margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.gin__enlace { min-height: 44px; padding: 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-sm)/1.2 var(--font-body); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.gin__enlace:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
</style>
