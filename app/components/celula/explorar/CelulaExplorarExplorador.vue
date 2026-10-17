<script setup lang="ts">
/**
 * El explorador con la puerta ABIERTA (datos reales con OK, o el ejemplo con ?demo=1 fuera de
 * producción). Solo existe en el navegador: lo monta la página cuando la puerta lo permite.
 *
 * Qué enseña (plan del 17-oct-2026): mapa por lesión (Vitessce), un gen de la lista con n y suelo
 * ambiental por grupo (violines propios), la tabla de genes de interés con referencia emparejada y
 * lectura de la revisión, co-expresión de dos genes y número de copias (por célula SOLO en el hueso).
 * Qué NO enseña: «% de células tumorales» del hígado, re-clustering ni comparación tumor/hepatocito.
 * Móvil (< 768 px): vista reducida y avisada, sin el mapa (WebGL pesado y poco legible a ese ancho).
 * Claro/oscuro: el tema del sistema es manual (data-tema), no prefers-color-scheme; el conmutador
 * «Lienzo» pone data-tema="oscuro" en este bloque y el tema oscuro de Vitessce en el mapa.
 */
import type { Coexp, Lesion, LesionDatos, Manifiesto } from '~/utils/celulaExplorador'
import { coexpresion, porGrupo } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, ETIQUETA_LESION, PANEL_INTERES, etiqueta, nombreGen } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ man: Manifiesto; ejemplo: boolean; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const movil = useMediaQuery('(max-width: 767px)')
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
  ambos: L('Los dos', 'Both'), solo_a: L(`Solo ${gen.value}`, `${gen.value} only`), solo_b: L(`Solo ${genB.value}`, `${genB.value} only`), ninguno: L('Ninguno', 'Neither'),
}))
const nTotal = computed(() => (d.value ? fmtN(d.value.n_celulas, props.lang) : ''))
const MODOS = [['grupo', 'Grupo', 'Group'], ['tipo', 'Tipo celular', 'Cell type'], ['gen', 'Gen elegido', 'Selected gene'], ['coexp', 'Dos genes', 'Two genes']] as const
const idCtl = useId()

// el aviso del hígado queda fijo bajo la cabecera del sitio (que es sticky y cambia de alto)
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
</script>

<template>
  <section ref="raiz" class="exp" :data-tema="tema === 'oscuro' ? 'oscuro' : undefined" :style="{ '--exp-top': `${altoCabecera + 8}px` }" :aria-label="L('Explorador de datos', 'Data explorer')">
    <div v-if="ejemplo" class="exp__demo" role="note">
      <strong>{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</strong>
      {{ L('Todo lo que ves aquí es inventado y solo sirve para ver cómo funciona la página. No son datos de Miriam.', 'Everything here is made up and only shows how the page works. It is not Miriam’s data.') }}
    </div>

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
        <span :id="`${idCtl}-tema`" class="exp__eti">{{ L('Lienzo', 'Canvas') }}</span>
        <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-tema`">
          <button type="button" class="exp__btn" :aria-pressed="tema === 'claro'" @click="tema = 'claro'">{{ L('Claro', 'Light') }}</button>
          <button type="button" class="exp__btn" :aria-pressed="tema === 'oscuro'" @click="tema = 'oscuro'">{{ L('Oscuro', 'Dark') }}</button>
        </div>
      </div>
    </div>

    <p v-if="movil" class="exp__movil" role="note">
      <Icon name="ph:device-mobile-bold" class="exp__ico" aria-hidden="true" />
      {{ L('En el móvil ves una versión reducida, sin el mapa de células. Para verlo, abre esta página en una pantalla más grande.',
        'On a phone you see a reduced version, without the cell map. To see it, open this page on a larger screen.') }}
    </p>

    <div v-if="lesion === 'higado'" class="exp__banner" role="note">
      <Icon name="ph:warning-bold" class="exp__ico" aria-hidden="true" />
      <p>
        <strong>{{ L('Hígado: tumor frente a hepatocito no está resuelto célula a célula.', 'Liver: tumor versus hepatocyte is not resolved cell by cell.') }}</strong>
        {{ L('El grupo «luminal de alta confianza» es un subconjunto, no el tumor entero, y sus cifras no son «% de células tumorales».',
          'The “high-confidence luminal” group is a subset, not the whole tumor, and its figures are not “% of tumor cells”.') }}
      </p>
    </div>

    <p v-if="cargando" class="exp__estado" role="status">{{ L('Cargando los datos…', 'Loading the data…') }}</p>
    <p v-else-if="error" class="exp__estado exp__estado--error" role="alert">
      {{ L('No se han podido cargar los datos de esta lesión, así que no se enseña nada.', 'The data for this lesion could not be loaded, so nothing is shown.') }}
      <span class="exp__det">({{ error }})</span>
    </p>

    <template v-else-if="d">
      <div class="exp__rejilla" :class="{ 'exp__rejilla--movil': movil }">
        <div v-if="!movil" class="exp__col">
          <h2 class="exp__h2">{{ L('Mapa de células', 'Cell map') }}</h2>
          <div class="exp__campo exp__campo--fila">
            <span :id="`${idCtl}-modo`" class="exp__eti">{{ L('Colorear por', 'Colour by') }}</span>
            <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-modo`">
              <button v-for="[k, es, en] in MODOS" :key="k" type="button" class="exp__btn exp__btn--sm" :aria-pressed="modo === k" @click="modo = k">{{ L(es, en) }}</button>
            </div>
          </div>
          <CelulaExplorarMapa :d="d" :modo="modo" :gen="gen" :gen-b="genB" :coexp="modo === 'coexp' ? etiquetasCx : null" :etiquetas-coexp="nombresCx"
                   :tema="tema === 'oscuro' ? 'dark' : 'light'" :lang="lang" @error="errorMapa = $event" />
          <p v-if="errorMapa" class="exp__estado exp__estado--error" role="alert">{{ L('El mapa no se ha podido dibujar en este navegador. El resto de la página no depende de él.', 'The map could not be drawn in this browser. The rest of the page does not depend on it.') }}</p>
          <p class="exp__nota">{{ L(`${nTotal} células de la biopsia, colocadas según se parecen entre sí (UMAP). Dos puntos cerca son dos células parecidas; la distancia entre grupos lejanos no significa nada.`,
            `${nTotal} cells from the biopsy, placed by how similar they are (UMAP). Two nearby dots are two similar cells; the distance between far-apart groups means nothing.`) }}</p>
        </div>
        <div class="exp__col">
          <h2 class="exp__h2">{{ L(`${nombreGen(gen)}, grupo a grupo`, `${nombreGen(gen)}, group by group`) }}</h2>
          <CelulaExplorarViolines :filas="filas" :gen="gen" :lang="lang" />
        </div>
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Células por grupo', 'Cells per group') }}</h2>
        <ul class="exp__grupos">
          <li v-for="g in d.grupos" :key="g.id" :class="`exp__g--${g.rol}`">
            <span>{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</span>
            <span class="nums">n = {{ fmtN(g.n, lang) }}</span>
          </li>
        </ul>
        <p class="exp__nota">{{ L('El n de cada grupo sale del fichero de datos, no del texto de la página.', 'Each group’s n comes from the data file, not from the page text.') }}</p>
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Genes de interés', 'Genes of interest') }}</h2>
        <CelulaExplorarGenes :d="d" :lang="lang" :elegido="gen" @elegir="gen = $event" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Dos genes a la vez', 'Two genes at once') }}</h2>
        <div class="exp__campo exp__campo--fila">
          <span class="exp__eti">{{ nombreGen(gen) }} {{ L('con', 'with') }}</span>
          <label :for="`${idCtl}-genb`" class="sr-only">{{ L('Segundo gen', 'Second gene') }}</label>
          <select :id="`${idCtl}-genb`" v-model="genB" class="exp__sel">
            <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
          </select>
        </div>
        <CelulaExplorarCoexp v-if="etiquetasCx" :d="d" :etiquetas="etiquetasCx" :gen-a="gen" :gen-b="genB" :lang="lang" />
      </div>

      <div class="exp__bloque">
        <h2 class="exp__h2">{{ L('Número de copias', 'Copy number') }}</h2>
        <CelulaExplorarCnv :d="d" :lang="lang" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.exp { min-width: 0; background: var(--fondo); color: var(--texto-1); border-radius: var(--radius-card); padding: var(--sp-16); border: 1px solid var(--trazo-medio); }
@media (min-width: 640px) { .exp { padding: var(--sp-24); } }
.exp__demo { margin: 0 0 var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 2px dashed var(--texto-1); border-radius: var(--radius-btn); font: 600 var(--texto-sm)/1.45 var(--font-body); }
.exp__demo strong { display: block; font: 700 var(--texto-sm)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); color: var(--identidad); }
.exp__ctl { display: flex; flex-wrap: wrap; gap: var(--sp-16) var(--sp-24); align-items: flex-end; padding-bottom: var(--sp-16); border-bottom: 1px solid var(--trazo-medio); }
.exp__campo { display: grid; gap: var(--sp-4); }
.exp__campo--fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.exp__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.exp__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.exp__btn { min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); color: var(--texto-1); font: 600 var(--texto-sm)/1 var(--font-body); background: transparent; }
.exp__btn--sm { font-size: var(--texto-xs); padding: 0 var(--sp-12); }
.exp__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.exp__btn:focus-visible, .exp__sel:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__sel { min-height: 44px; min-width: 14rem; max-width: 100%; padding: 0 var(--sp-12); border-radius: var(--radius-btn); border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1); font: 500 var(--texto-base)/1 var(--font-body); }
.exp__movil, .exp__banner { display: flex; gap: var(--sp-8); align-items: flex-start; margin: var(--sp-16) 0 0; padding: var(--sp-12) var(--sp-16); border-radius: var(--radius-btn); font: var(--tipo-body-sm); }
.exp__movil { background: var(--superficie); color: var(--texto-1); }
.exp__banner { position: sticky; top: var(--exp-top, 8px); z-index: 5; background: var(--fondo); border: 2px solid var(--identidad); color: var(--texto-1); box-shadow: 0 2px 0 var(--fondo); }
.exp__banner p { margin: 0; }
.exp__ico { width: 20px; height: 20px; flex: none; margin-top: 1px; color: var(--identidad); }
.exp__estado { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.exp__estado--error { color: var(--texto-1); font-weight: 600; }
.exp__det { font: 400 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
.exp__rejilla { display: grid; gap: var(--sp-24); margin-top: var(--sp-24); }
@media (min-width: 1024px) { .exp__rejilla:not(.exp__rejilla--movil) { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); } }
.exp__col { min-width: 0; }
.exp__h2 { font: var(--tipo-h3); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.exp__nota { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.exp__bloque { margin-top: var(--sp-32); padding-top: var(--sp-24); border-top: 1px solid var(--trazo-medio); }
.exp__grupos { list-style: none; margin: 0; padding: 0; display: grid; gap: 0 var(--sp-24); grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); }
.exp__grupos li { display: flex; justify-content: space-between; gap: var(--sp-8); padding: var(--sp-8) 0; border-bottom: 1px solid var(--trazo-sutil); font: var(--tipo-body-sm); }
.exp__grupos .nums { font-family: var(--font-mono); color: var(--texto-2); }
.exp__g--interes span:first-child { color: var(--identidad); font-weight: 600; }
</style>
