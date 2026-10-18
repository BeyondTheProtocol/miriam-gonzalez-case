<script setup lang="ts">
/**
 * El explorador con la puerta ABIERTA (datos reales con OK, o el ejemplo con ?demo=1 fuera de
 * producción). Solo existe en el navegador: lo monta la página cuando la puerta lo permite.
 *
 * Qué enseña (plan del 17-oct-2026): mapa por lesión (Vitessce), un gen de la lista con n y suelo
 * ambiental por grupo (violines propios), la tabla de genes de interés con referencia emparejada y
 * lectura de Polaris (borrador), co-expresión de dos genes y número de copias (por célula SOLO en el hueso,
 * inferido de la expresión frente a la referencia; no es lectura de ADN).
 * Qué NO enseña: «% de células tumorales» del hígado, re-clustering ni comparación tumor/hepatocito.
 * Móvil y tableta (< 1024 px): vista reducida y avisada, sin el mapa (WebGL pesado; su lienzo atrapa
 * el scroll con el dedo).
 * Claro/oscuro: el tema del sistema es manual (data-tema), no prefers-color-scheme; el conmutador
 * «Fondo» pone data-tema="oscuro" en este bloque, el tema oscuro de Vitessce y su paleta de tokens.
 * Violeta = grupo de interés, selección, foco y enlaces; los avisos van en tinta (auditoría `diseno`).
 */
import type { Coexp, Lesion, LesionDatos, Manifiesto } from '~/utils/celulaExplorador'
import { coexpresion, porGrupo } from '~/utils/celulaExplorador'
import { cssRgb, paleta, type RGB } from '~/utils/celulaExploradorColor'
import { ETIQUETA_GRUPO, ETIQUETA_LESION, ETIQUETA_TIPO, PANEL_INTERES, etiqueta, nombreGen } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ man: Manifiesto; ejemplo: boolean; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

// vista reducida también en tableta: el lienzo de Vitessce lleva touch-action:none y atraparía el scroll con el dedo
const movil = useMediaQuery('(max-width: 1023px)')
const lesion = ref<Lesion>(props.man.lesiones.includes('higado') ? 'higado' : props.man.lesiones[0]!)
const cache = shallowReactive<Partial<Record<Lesion, LesionDatos>>>({})
const error = ref('')
const cargando = ref(false)
const d = computed(() => cache[lesion.value] ?? null)
const gen = ref('ANKRD30A')
const genB = ref('TPBG')
const modo = ref<'grupo' | 'tipo' | 'gen' | 'coexp'>('grupo')
const tema = ref<'claro' | 'oscuro'>('claro')
const errorMapa = ref('')
const aviso = ref('')

async function asegura(l: Lesion) {
  if (cache[l]) return
  cargando.value = true; error.value = ''
  try { cache[l] = await cargaLesion(props.man, l, props.ejemplo) }
  catch (e) { error.value = String((e as Error)?.message ?? e) }
  finally { cargando.value = false }
}
watch(lesion, (l) => asegura(l), { immediate: true })
watch(d, (x) => {
  if (!x) return
  if (!x.genes.includes(gen.value)) gen.value = PANEL_INTERES.find((g) => x.genes.includes(g)) ?? x.genes[0]!
  if (!x.genes.includes(genB.value) || genB.value === gen.value) genB.value = x.genes.find((g) => g !== gen.value)!
})

const genesInteres = computed(() => (d.value ? PANEL_INTERES.filter((g) => d.value!.genes.includes(g)) : []))
const genesOtros = computed(() => (d.value ? d.value.genes.filter((g) => !PANEL_INTERES.includes(g)).sort() : []))
const filas = computed(() => (d.value ? porGrupo(d.value, gen.value) : []))
const etiquetasCx = computed(() => (d.value ? coexpresion(d.value, gen.value, genB.value) : null))
const nombresCx = computed<Record<Coexp, string>>(() => ({
  ambos: L('Los dos', 'Both'), solo_a: L(`Solo ${PROT(gen.value)}`, `${PROT(gen.value)} only`), solo_b: L(`Solo ${PROT(genB.value)}`, `${PROT(genB.value)} only`), ninguno: L('Ninguno', 'Neither'),
}))
const PROT = (g: string) => nombreGen(g).split(' (')[0]!
const nTotal = computed(() => (d.value ? fmtN(d.value.n_celulas, props.lang) : ''))
const MODOS = [['grupo', 'Grupo', 'Group'], ['tipo', 'Tipo celular', 'Cell type'], ['gen', 'Gen elegido', 'Selected gene'], ['coexp', 'Dos genes', 'Two genes']] as const
const idCtl = useId()
const ej = computed(() => (props.ejemplo ? L(' · ejemplo', ' · example') : ''))

/* ── colores del mapa y su leyenda (paleta derivada de los tokens) ── */
const montado = ref(false)
onMounted(() => { montado.value = true })
const pal = computed(() => {
  void montado.value
  if (typeof window === 'undefined') return null
  const css = getComputedStyle(document.documentElement)
  return paleta(tema.value === 'oscuro' ? 'dark' : 'light', (v) => css.getPropertyValue(v))
})
const nombreSet = computed(() => ({ grupo: L('Grupo', 'Group'), tipo: L('Tipo celular', 'Cell type'), coexp: L('Co-expresión', 'Co-expression') }))
const conjuntos = computed(() => {
  const x = d.value
  if (!x) return []
  const c = [
    { nombre: nombreSet.value.grupo, columna: 'grupo', valores: x.celulas.grupo.map((k) => etiqueta(ETIQUETA_GRUPO, x.grupos[k]!.id, props.lang)) },
    { nombre: nombreSet.value.tipo, columna: 'tipo', valores: x.celulas.tipo.map((k) => etiqueta(ETIQUETA_TIPO, x.tipos[k]!, props.lang)) },
  ]
  if (modo.value === 'coexp' && etiquetasCx.value) c.push({ nombre: nombreSet.value.coexp, columna: 'coexp', valores: etiquetasCx.value.map((k) => nombresCx.value[k]) })
  return c
})
/** Leyenda del modo activo: [etiqueta, color, n]. Es también la alternativa en texto de los colores. */
const leyenda = computed<{ etiqueta: string; rgb: RGB; n: number }[]>(() => {
  const x = d.value, p = pal.value
  if (!x || !p) return []
  if (modo.value === 'grupo') {
    let r = 0
    return x.grupos.map((g) => ({ etiqueta: etiqueta(ETIQUETA_GRUPO, g.id, props.lang), n: g.n, rgb: g.rol === 'interes' ? p.interes : g.rol === 'otras' ? p.otras : p.ref[r++ % p.ref.length]! }))
  }
  if (modo.value === 'tipo') {
    const cuenta = x.tipos.map((_, k) => x.celulas.tipo.filter((t) => t === k).length)
    return x.tipos.map((t, k) => ({ etiqueta: etiqueta(ETIQUETA_TIPO, t, props.lang), n: cuenta[k]!, rgb: p.ref[k % p.ref.length]! }))
  }
  if (modo.value === 'coexp' && etiquetasCx.value) {
    const cx = etiquetasCx.value
    return (['ambos', 'solo_a', 'solo_b', 'ninguno'] as Coexp[]).map((c) => ({ etiqueta: nombresCx.value[c], n: cx.filter((v) => v === c).length, rgb: p.coexp[c] }))
  }
  return []
})
const colores = computed(() => {
  const set = modo.value === 'tipo' ? nombreSet.value.tipo : modo.value === 'coexp' ? nombreSet.value.coexp : nombreSet.value.grupo
  return leyenda.value.map((l) => ({ ruta: [set, l.etiqueta] as [string, string], rgb: l.rgb }))
})
const colorearPor = computed(() => (modo.value === 'tipo' ? nombreSet.value.tipo : modo.value === 'coexp' ? nombreSet.value.coexp : nombreSet.value.grupo))

/** Elegir un gen desde la tabla: los violines y el mapa cambian arriba, y se anuncia. */
function elegirDesdeTabla(g: string) {
  gen.value = g
  aviso.value = L(`Mostrando ${nombreGen(g)} en el mapa y en los violines, más arriba.`, `Showing ${nombreGen(g)} on the map and in the violins, further up.`)
}

/* ── el aviso del hígado queda fijo bajo la cabecera del sitio (sticky y de alto variable) ── */
const raiz = ref<HTMLElement | null>(null)
const altoCabecera = ref(0)
let ro: ResizeObserver | null = null
onMounted(() => {
  const cab = document.querySelector<HTMLElement>('[data-cabecera-fija]')
  if (!cab) return
  const mide = () => { altoCabecera.value = Math.ceil(cab.getBoundingClientRect().height) }
  mide()
  ro = new ResizeObserver(mide)
  ro.observe(cab)
})
onBeforeUnmount(() => ro?.disconnect())
/** WCAG 2.4.11: el foco no puede quedar tapado por la cabecera ni por el aviso fijo. */
function sinTapar(ev: FocusEvent) {
  const el = ev.target as HTMLElement
  if (!el?.matches?.(':focus-visible')) return
  const b = raiz.value?.querySelector<HTMLElement>('.exp__banner')
  const tope = altoCabecera.value + (b?.offsetHeight ?? 0) + 24
  const r = el.getBoundingClientRect()
  if (r.top < tope) window.scrollBy({ top: r.top - tope, behavior: 'instant' as ScrollBehavior })
}
</script>

<template>
  <section ref="raiz" class="exp" :data-tema="tema === 'oscuro' ? 'oscuro' : undefined" :style="{ '--exp-top': `${altoCabecera + 8}px` }"
           :aria-label="L('Explorador de datos', 'Data explorer')" @focusin="sinTapar">
    <div v-if="ejemplo" class="exp__demo" role="note">
      <strong>{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</strong>
      {{ L('Todo lo que ves aquí es sintético y solo sirve para enseñar cómo funciona la página. No son datos de Miriam.', 'Everything here is synthetic and only shows how the page works. None of it is Miriam’s data.') }}
    </div>

    <p v-if="movil" class="exp__movil" role="note">
      <svg class="exp__ico" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M176 16H80a24 24 0 0 0-24 24v176a24 24 0 0 0 24 24h96a24 24 0 0 0 24-24V40a24 24 0 0 0-24-24Zm8 200a8 8 0 0 1-8 8H80a8 8 0 0 1-8-8V40a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8ZM140 60a12 12 0 1 1-12-12 12 12 0 0 1 12 12Z" /></svg>
      {{ L('En el móvil o la tableta ves una versión reducida, sin el mapa de células. Para verlo, abre esta página en un ordenador.',
        'On a phone or tablet you see a reduced version, without the cell map. To see it, open this page on a computer.') }}
    </p>

    <div class="exp__ctl" role="group" :aria-label="L('Controles del explorador', 'Explorer controls')">
      <div class="exp__campo">
        <span :id="`${idCtl}-les`" class="exp__eti">{{ L('Lesión', 'Lesion') }}</span>
        <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-les`">
          <button v-for="l in man.lesiones" :key="l" type="button" class="exp__btn" :aria-pressed="lesion === l" @click="lesion = l">{{ etiqueta(ETIQUETA_LESION, l, lang) }}</button>
        </div>
      </div>
      <div v-if="d" class="exp__campo">
        <label :for="`${idCtl}-gen`" class="exp__eti">{{ L('Gen', 'Gene') }}</label>
        <select :id="`${idCtl}-gen`" v-model="gen" class="exp__sel">
          <optgroup :label="L('Genes de interés', 'Genes of interest')">
            <option v-for="g in genesInteres" :key="g" :value="g">{{ nombreGen(g) }}</option>
          </optgroup>
          <optgroup :label="L('Otros genes', 'Other genes')">
            <option v-for="g in genesOtros" :key="g" :value="g">{{ g }}</option>
          </optgroup>
        </select>
      </div>
      <div class="exp__campo">
        <span :id="`${idCtl}-tema`" class="exp__eti">{{ L('Fondo', 'Background') }}</span>
        <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-tema`">
          <button type="button" class="exp__btn" :aria-pressed="tema === 'claro'" @click="tema = 'claro'">{{ L('Claro', 'Light') }}</button>
          <button type="button" class="exp__btn" :aria-pressed="tema === 'oscuro'" @click="tema = 'oscuro'">{{ L('Oscuro', 'Dark') }}</button>
        </div>
      </div>
    </div>

    <template v-if="lesion === 'higado'">
      <div class="exp__banner" role="note">
        <svg class="exp__ico" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M240.26 186.1 152.81 34.23a28.74 28.74 0 0 0-49.62 0L15.74 186.1a27.45 27.45 0 0 0 0 27.71A28.31 28.31 0 0 0 40.55 228h174.9a28.31 28.31 0 0 0 24.79-14.19 27.45 27.45 0 0 0 .02-27.71ZM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0Zm8 88a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z" /></svg>
        <p><strong>{{ L('Hígado: tumor frente a hepatocito no está resuelto célula a célula.', 'Liver: tumor versus hepatocyte is not resolved cell by cell.') }}</strong></p>
      </div>
      <p class="exp__nota exp__nota--banner">
        {{ L('El grupo «luminal de alta confianza» es un subconjunto, no el tumor entero, y sus cifras no son «% de células tumorales».',
          'The “high-confidence luminal” group is a subset, not the whole tumor, and its figures are not “% of tumor cells”.') }}
      </p>
    </template>

    <p v-if="cargando" class="exp__estado" role="status">{{ L('Cargando los datos…', 'Loading the data…') }}</p>
    <div v-else-if="error" class="exp__estado exp__estado--error" role="alert">
      <p>{{ L('No se han podido cargar los datos de esta lesión. Para no enseñar datos a medias, no se muestra nada.', 'The data for this lesion could not be loaded. To avoid showing partial data, nothing is shown.') }}</p>
      <p class="exp__det">{{ L('Detalle técnico:', 'Technical detail:') }} {{ error }}</p>
    </div>

    <template v-else-if="d">
      <div class="exp__rejilla" :class="{ 'exp__rejilla--movil': movil }">
        <div v-if="!movil" class="exp__col">
          <h2 class="exp__h2">{{ L('Mapa de células', 'Cell map') }}{{ ej }}</h2>
          <div class="exp__campo exp__campo--fila">
            <span :id="`${idCtl}-modo`" class="exp__eti">{{ L('Colorear por', 'Color by') }}</span>
            <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-modo`">
              <button v-for="[k, es, en] in MODOS" :key="k" type="button" class="exp__btn exp__btn--sm" :aria-pressed="modo === k" @click="modo = k">{{ L(es, en) }}</button>
            </div>
          </div>
          <div v-if="modo === 'coexp'" class="exp__campo exp__campo--fila">
            <label :for="`${idCtl}-genb-mapa`" class="exp__eti">{{ L(`${nombreGen(gen)} con`, `${nombreGen(gen)} with`) }}</label>
            <select :id="`${idCtl}-genb-mapa`" v-model="genB" class="exp__sel">
              <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
            </select>
          </div>
          <a class="sr-only focus:not-sr-only exp__salto" href="#exp-violines">{{ L('Saltar el mapa', 'Skip the map') }}</a>
          <CelulaExplorarMapa :d="d" :modo="modo" :gen="gen" :gen-b="genB" :conjuntos="conjuntos" :colores="colores" :colorear-por="colorearPor"
                              :tema="tema === 'oscuro' ? 'dark' : 'light'" :lang="lang" @error="errorMapa = $event" />
          <p v-if="errorMapa" class="exp__estado exp__estado--error" role="alert">{{ L('El mapa no se ha podido dibujar en este navegador. El resto de la página no depende de él.', 'The map could not be drawn in this browser. The rest of the page does not depend on it.') }}</p>
          <ul v-if="leyenda.length" class="exp__leyenda" :aria-label="L('Leyenda del mapa', 'Map legend')">
            <li v-for="l in leyenda" :key="l.etiqueta"><span class="exp__muestra" :style="{ background: cssRgb(l.rgb) }" aria-hidden="true" />{{ l.etiqueta }} <span class="nums">{{ fmtN(l.n, lang) }}</span></li>
          </ul>
          <p v-else class="exp__nota">{{ L(`Color: nivel de ${nombreGen(gen)} en cada célula (CP10k).`, `Color: level of ${nombreGen(gen)} in each cell (CP10k).`) }}</p>
          <p class="exp__nota">{{ L(`${nTotal} células de la biopsia, colocadas según lo que se parecen entre sí (UMAP). Dos puntos cercanos son células parecidas; la distancia entre grupos alejados no se interpreta.`,
            `${nTotal} cells from the biopsy, placed by how similar they are (UMAP). Nearby dots are similar cells; distances between far-apart groups are not meaningful.`) }}</p>
        </div>
        <div id="exp-violines" class="exp__col" tabindex="-1">
          <h2 class="exp__h2">{{ L(`${nombreGen(gen)}, grupo a grupo`, `${nombreGen(gen)}, group by group`) }}{{ ej }}</h2>
          <CelulaExplorarViolines :filas="filas" :gen="gen" :lang="lang" :lesion="lesion" :adn="d.adn" :papel="d.seleccion[gen]" :loo="d.loo[gen]" />
        </div>
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Células por grupo', 'Cells per group') }}{{ ej }}</h2>
        <ul class="exp__grupos">
          <li v-for="g in d.grupos" :key="g.id" :class="`exp__g--${g.rol}`">
            <span>{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</span>
            <span class="nums">n = {{ fmtN(g.n, lang) }}</span>
          </li>
        </ul>
        <p class="exp__nota">{{ L('El n de cada grupo sale directamente del fichero de datos.', 'Each group’s n comes straight from the data file.') }}</p>
      </div>

      <div id="exp-genes" class="exp__bloque">
        <h2 class="exp__h2">{{ L('Genes de interés', 'Genes of interest') }}{{ ej }}</h2>
        <CelulaExplorarGenes :d="d" :lang="lang" :elegido="gen" @elegir="elegirDesdeTabla" />
        <p class="exp__estado" role="status">{{ aviso }}</p>
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Dos genes a la vez', 'Two genes at once') }}{{ ej }}</h2>
        <div v-if="!(modo === 'coexp' && !movil)" class="exp__campo exp__campo--fila">
          <label :for="`${idCtl}-genb`" class="exp__eti">{{ L(`${nombreGen(gen)} con`, `${nombreGen(gen)} with`) }}</label>
          <select :id="`${idCtl}-genb`" v-model="genB" class="exp__sel">
            <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
          </select>
        </div>
        <p v-else class="exp__nota">{{ L('El segundo gen se elige junto al mapa, arriba.', 'The second gene is chosen next to the map, above.') }}</p>
        <CelulaExplorarCoexp v-if="etiquetasCx" :d="d" :etiquetas="etiquetasCx" :gen-a="gen" :gen-b="genB" :lang="lang" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Número de copias (inferido)', 'Copy number (inferred)') }}{{ ej }}</h2>
        <CelulaExplorarCnv :d="d" :lang="lang" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Marcadores por grupo', 'Markers per group') }}{{ ej }}</h2>
        <CelulaExplorarMarcadores :d="d" :lang="lang" :abribles="(g: string) => d!.genes.includes(g)" @elegir="elegirDesdeTabla" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Perfil por regiones del genoma', 'Genome region profile') }}{{ ej }}</h2>
        <CelulaExplorarPerfil :d="d" :lang="lang" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('ADN genómico por grupo', 'Genomic DNA per group') }}{{ ej }}</h2>
        <CelulaExplorarAdn :d="d" :lang="lang" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Control de calidad', 'Quality control') }}{{ ej }}</h2>
        <CelulaExplorarQc :d="d" :lang="lang" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.exp { min-width: 0; background: var(--fondo); color: var(--texto-1); border-radius: var(--radius-card); padding: var(--sp-16); border: 1px solid var(--trazo-medio); }
@media (min-width: 640px) { .exp { padding: var(--sp-24); } }
.exp__demo { margin: 0 0 var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 2px dashed var(--texto-1); border-radius: var(--radius-btn); font: 600 var(--texto-sm)/1.45 var(--font-body); }
.exp__demo strong { display: block; font: 700 var(--texto-sm)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); color: var(--texto-1); }
.exp__ctl { display: flex; flex-wrap: wrap; gap: var(--sp-16) var(--sp-24); align-items: flex-end; padding-bottom: var(--sp-16); border-bottom: 1px solid var(--trazo-medio); }
.exp__campo { display: grid; gap: var(--sp-4); }
.exp__campo--fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.exp__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.exp__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.exp__btn {
  min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); color: var(--texto-1);
  font: 600 var(--texto-sm)/1 var(--font-body); background: transparent;
  transition: background-color var(--dur-micro) var(--curva-salida), color var(--dur-micro) var(--curva-salida), transform var(--dur-micro) var(--curva-salida);
  -webkit-tap-highlight-color: transparent;
}
.exp__btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .exp__btn { transition: none; } .exp__btn:active { transform: none; } }
.exp__btn--sm { font-size: var(--texto-xs); padding: 0 var(--sp-12); }
.exp__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.exp__btn:focus-visible, .exp__sel:focus-visible, .exp__salto:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__sel { min-height: 44px; min-width: 14rem; max-width: 100%; padding: 0 var(--sp-12); border-radius: var(--radius-btn); border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1); font: 500 var(--texto-base)/1 var(--font-body); }
.exp__movil, .exp__banner { display: flex; gap: var(--sp-8); align-items: flex-start; padding: var(--sp-12) var(--sp-16); border-radius: var(--radius-btn); font: var(--tipo-body-sm); }
.exp__movil { margin: 0 0 var(--sp-16); background: var(--superficie); color: var(--texto-1); }
.exp__banner { margin: var(--sp-16) 0 0; position: sticky; top: var(--exp-top, 8px); z-index: 5; background: var(--fondo); border: 2px solid var(--texto-1); color: var(--texto-1); }
@media (max-width: 1023px) { .exp__banner { padding: var(--sp-8) var(--sp-12); font-size: var(--texto-xs); } }
.exp__banner p { margin: 0; }
.exp__ico { width: 20px; height: 20px; flex: none; margin-top: 1px; color: var(--texto-1); }
.exp__estado { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.exp__estado:empty { margin: 0; }
.exp__estado--error { color: var(--texto-1); font-weight: 600; }
.exp__estado--error p { margin: 0; }
.exp__det { margin-top: var(--sp-4) !important; font: 400 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
.exp__rejilla { display: grid; gap: var(--sp-24); margin-top: var(--sp-24); }
@media (min-width: 1024px) { .exp__rejilla:not(.exp__rejilla--movil) { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); } }
.exp__col { min-width: 0; }
.exp__col:focus { outline: none; }
.exp__h2 { font: var(--tipo-h3); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.exp__nota { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.exp__nota--banner { margin-top: var(--sp-8); }
.exp__salto { display: inline-block; margin-bottom: var(--sp-8); color: var(--identidad); font: 600 var(--texto-sm) var(--font-body); }
.exp__leyenda { list-style: none; margin: var(--sp-12) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-4) var(--sp-16); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); }
.exp__leyenda li { display: inline-flex; align-items: center; gap: var(--sp-8); }
.exp__leyenda .nums { font-family: var(--font-mono); color: var(--texto-2); }
.exp__muestra { width: 12px; height: 12px; border-radius: 999px; flex: none; box-shadow: 0 0 0 1px var(--trazo-fuerte); }
.exp__bloque { margin-top: var(--sp-32); padding-top: var(--sp-24); border-top: 1px solid var(--trazo-medio); }
.exp__grupos { list-style: none; margin: 0; padding: 0; display: grid; gap: 0 var(--sp-24); grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr)); }
.exp__grupos li { display: flex; justify-content: space-between; gap: var(--sp-8); padding: var(--sp-8) 0; border-bottom: 1px solid var(--trazo-sutil); font: var(--tipo-body-sm); }
.exp__grupos .nums { font-family: var(--font-mono); color: var(--texto-2); }
.exp__g--interes span:first-child { color: var(--identidad); font-weight: 600; }
</style>
