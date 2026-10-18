<script setup lang="ts">
/**
 * /celula-a-celula/explorar (EN /cell-by-cell/explore): explorador para profesionales del análisis de
 * célula única (plan del 17-oct-2026, versión pública curada «B»; la matriz completa, por petición «C»).
 * La ruta la fija nuxt.config.ts (i18n.pages) para no convertir /celula-a-celula en ruta padre.
 *
 * Puerta (app/utils/celulaExplorador.ts, con test): con datos reales verificados y con el OK de
 * Miriam, el explorador se abre; si no, la página explica qué habrá y no pide ningún dato. `?demo=1`
 * (nunca en producción) abre el ejemplo sintético con su rótulo. Mientras no haya datos reales, la
 * página es noindex.
 *
 * Describe y equipa; no concluye ni recomienda. Etiquetas fijas arriba (n=1, FFPE, exploratorio;
 * ARN ≠ proteína; IHQ de HER2: 0) y el aviso de apoyo a la decisión de todas las herramientas.
 */
import { ETIQUETAS_FIJAS } from '~/utils/celulaExploradorTexto'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const { man, estado, hayReal } = useCelulaExplorador()

const titulo = () => L('Explorar los datos célula a célula', 'Explore the cell-by-cell data')
/* sin subtítulo visible (panel de expertos, 18-oct): repetía la etiqueta del buscador y empujaba el mapa fuera de la
 * primera pantalla; la descripción larga queda para SEO */
const descripcion = () => L('El mapa de células de las dos biopsias de Miriam: busca un gen o elige un marcador y míralo célula a célula en el mapa y grupo a grupo, con su n y su suelo ambiental.',
  'The cell map of Miriam’s two biopsies: search a gene or pick a marker and see it cell by cell on the map and group by group, with its n and its ambient floor.')
useSeoMeta({
  title: titulo, description: descripcion, ogTitle: titulo, ogDescription: descripcion,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: titulo, twitterDescription: descripcion,
  robots: () => (hayReal.value ? 'index, follow' : 'noindex, follow'),
})
defineOgImage('Default.takumi', { title: titulo, description: descripcion })

const VERAS = [
  ['El mapa de células de cada lesión, coloreado por grupo o por gen.', 'The cell map of each lesion, colored by group or by gene.'],
  ['Cualquier gen de la lista, grupo a grupo, con su n y su suelo ambiental.', 'Any gene on the list, group by group, with its n and its ambient floor.'],
  ['Los genes de interés frente a la referencia emparejada, con la lectura de Polaris en borrador.', 'The genes of interest against the matched reference, with the draft Polaris reading.'],
  ['Dos genes a la vez: en qué células se detectan los dos.', 'Two genes at once: the cells where both are detected.'],
  ['El número de copias por célula, solo en el hueso, inferido de la expresión.', 'Copy number per cell, in the bone only, inferred from expression.'],
] as const
const LEER = [
  [`${ETIQUETAS_FIJAS.n1.es}.`, 'Dos biopsias pequeñas de una sola paciente, fijadas en formol e incluidas en parafina. Sirve para generar hipótesis, que habrá que confirmar con otras pruebas.', `${ETIQUETAS_FIJAS.n1.en}.`, 'Two small biopsies from a single patient, formalin-fixed and paraffin-embedded. It generates hypotheses that other tests will have to confirm.'],
  [`${ETIQUETAS_FIJAS.arn.es}.`, 'El análisis lee ARN. Que un gen se lea no dice que la proteína esté; eso lo dice la inmunohistoquímica.', `${ETIQUETAS_FIJAS.arn.en}.`, 'The analysis reads RNA. Reading a gene does not mean the protein is there; immunohistochemistry tells you that.'],
  ['Suelo ambiental.', 'En una muestra así flota ARN suelto que cae en cualquier célula. Para cada gen y grupo se calcula cuántas células saldrían positivas solo por eso; lo que no supera ese suelo no cuenta. Además, las sondas que caen dentro de un exón también leen ADN genómico del tejido; en el hueso pesa más, y su suelo lo incluye. Junto a cada gen verás cuántas de sus sondas cruzan una unión entre exones.', 'Ambient floor.', 'In a sample like this, loose RNA floats around and lands in any cell. For each gene and group we compute how many cells would come out positive from that alone; anything that does not clear the floor does not count. Also, probes that fall inside an exon read genomic DNA from the tissue too; it weighs more in the bone, and its floor includes it. Next to each gene you will see how many of its probes span an exon junction.'],
  [`${ETIQUETAS_FIJAS.matriz.es}.`, 'Son las cuentas que da Cell Ranger con todas las sondas del panel, la misma base del análisis revisado.', `${ETIQUETAS_FIJAS.matriz.en}.`, 'These are the counts Cell Ranger gives with every probe on the panel, the same basis as the reviewed analysis.'],
  ['Cifras circulares.', 'Si un gen se usó para elegir las células de un grupo, su cifra en ese grupo sale alta (o baja) por construcción. Esos genes llevan su rótulo y, cuando la revisión lo midió sin esa circularidad, esa otra cifra al lado.', 'Circular figures.', 'If a gene was used to choose a group’s cells, its figure in that group comes out high (or low) by construction. Those genes carry a label and, where the review measured them without that circularity, that other figure next to it.'],
  [`${ETIQUETAS_FIJAS.mediana.es}.`, 'El nivel que pinta la página es la mediana en las células donde se detecta el gen; la revisión da el nivel de toda la población junta.', `${ETIQUETAS_FIJAS.mediana.en}.`, 'The level the page draws is the median in cells where the gene is detected; the review gives the level of the whole population pooled.'],
  ['Lectura de Polaris.', 'La lectura por gen es de Polaris y está en borrador, pendiente de la lectura humana del laboratorio. No habla en nombre del laboratorio.', 'Polaris reading.', 'The per-gene reading is Polaris’s and is a draft, pending the laboratory’s human reading. It does not speak for the laboratory.'],
  ['Referencia emparejada.', 'Células no tumorales de la misma muestra, con la misma profundidad (moléculas por célula). Si un gen se detecta igual o más en la referencia que en el grupo de interés, no sirve para distinguir el tumor.', 'Matched reference.', 'Non-tumor cells from the same sample, at the same depth (molecules per cell). If a gene is detected as much or more in the reference than in the group of interest, it does not tell the tumor apart.'],
  ['Grupos fijos.', 'Los grupos y su n vienen del análisis revisado. La página no vuelve a agrupar células ni calcula un «% de células tumorales» del hígado.', 'Fixed groups.', 'The groups and their n come from the reviewed analysis. The page does not regroup cells or compute a “% of tumor cells” for the liver.'],
] as const
</script>

<template>
  <div class="overflow-x-clip">
    <section class="xp-seccion" :aria-label="titulo()">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          compact
          class="!mb-4"
          :parent="{ to: localePath({ name: 'celula-a-celula' }), label: L('Célula a célula', 'Cell by cell') }"
          :tag="L('Para profesionales', 'For professionals')"
          :title="titulo()"
        />
        <!-- aviso y etiquetas fijas en una sola franja en escritorio: el mapa tiene que asomar al entrar -->
        <div class="xp-marco">
          <CelulaAviso />
          <CelulaExplorarEtiquetas :lang="lang" />
        </div>

        <div class="xp-flujo">
          <ClientOnly v-if="estado !== 'cerrada'">
            <CelulaExplorarExplorador :man="man" :ejemplo="estado === 'ejemplo'" :lang="lang" />
            <template #fallback>
              <div class="xp-espera" aria-busy="true">{{ L('Cargando el explorador…', 'Loading the explorer…') }}</div>
            </template>
          </ClientOnly>
          <section v-else class="card-base xp-cerrado" aria-labelledby="xp-cerrado-t">
            <h2 id="xp-cerrado-t" class="cel-h2">{{ L('Todavía no está abierto', 'Not open yet') }}</h2>
            <p class="cel-p">
              {{ L('El explorador se abrirá cuando los datos estén verificados y Miriam dé el visto bueno. Mientras tanto, lo ya revisado está en', 'The explorer will open once the data are verified and Miriam signs off. In the meantime, what has been reviewed is in') }}
              <NuxtLink :to="localePath({ name: 'celula-a-celula' })" class="link-underline">{{ L('Célula a célula', 'Cell by cell') }}</NuxtLink>.
            </p>
            <p class="cel-p xp-cerrado__sub">{{ L('Cuando se abra, vas a poder ver:', 'Once it opens, you will be able to see:') }}</p>
            <ul class="xp-lista">
              <li v-for="[es, en] in VERAS" :key="es">{{ L(es, en) }}</li>
            </ul>
          </section>

          <!-- simulador (18-oct): «Cómo leerlo» plegado; el resumen con texto está en Célula a célula -->
          <details class="xp-leer-pl">
            <summary><span class="xp-leer-t">{{ L('Cómo leerlo', 'How to read it') }}</span></summary>
            <dl class="xp-leer">
              <div v-for="[tEs, dEs, tEn, dEn] in LEER" :key="tEs" class="xp-leer__fila">
                <dt>{{ L(tEs, tEn) }}</dt>
                <dd>{{ L(dEs, dEn) }}</dd>
              </div>
            </dl>
            <p class="cel-p">{{ L('El resumen en texto de estos datos está en', 'The text summary of these data is in') }} <NuxtLink :to="localePath({ name: 'celula-a-celula' })" class="link-underline">{{ L('Célula a célula', 'Cell by cell') }}</NuxtLink>.</p>
          </details>

          <!-- la matriz a petición (opción C) solo se ofrece con datos reales y el OK de Miriam: antes no hay qué ofrecer -->
          <section v-if="hayReal" class="card-base cel-card" aria-labelledby="xp-pide-t">
            <h2 id="xp-pide-t" class="cel-h3">{{ L('Los datos completos, a petición', 'The full data, on request') }}</h2>
            <p class="cel-card__p">
              {{ L('La matriz completa (h5ad, sin identificadores) se puede pedir para investigación. Va con sus condiciones de uso y la revisión que la acompaña. Escríbenos desde', 'The full matrix (h5ad, no identifiers) can be requested for research. It comes with its terms of use and the accompanying review. Write to us through') }}
              <NuxtLink :to="localePath({ name: 'contacto' })" class="link-underline">{{ L('Contacto', 'Contact') }}</NuxtLink>.
            </p>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* simulador: menos aire arriba que una página de lectura, para que el mapa asome al entrar */
.xp-seccion { padding: 1rem 0 4rem; }
.xp-marco { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.xp-flujo { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-48); }
.xp-cerrado { padding: var(--sp-24); }
.xp-espera { min-height: 60vh; display: grid; place-items: center; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.xp-cerrado__sub { margin-top: var(--sp-16); }
.xp-lista { list-style: disc; margin: var(--sp-8) 0 0; padding-left: 1.2em; font: var(--tipo-body); color: var(--color-text-soft); max-width: var(--measure); }
.xp-lista li + li { margin-top: var(--sp-4); }
.xp-leer { margin: 0; display: grid; gap: var(--sp-12); max-width: var(--measure); }
.xp-leer__fila dt { font: 600 var(--texto-base)/1.4 var(--font-body); color: var(--color-text); }
.xp-leer__fila dd { margin: var(--sp-4) 0 0; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.xp-leer-pl { border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); padding: 0 var(--sp-16); }
.xp-leer-pl[open] { padding-bottom: var(--sp-16); }
.xp-leer-pl summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; gap: var(--sp-8); }
.xp-leer-t { font: 600 var(--texto-base)/1.3 var(--font-body); color: var(--color-text); }
/* chevron del sistema (main.css .notes-disclosure), no glifos */
.xp-leer-pl summary::before { content: ''; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s ease; flex-shrink: 0; color: var(--color-text-soft); }
.xp-leer-pl[open] summary::before { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .xp-leer-pl summary::before { transition: none; } }
.xp-leer-pl summary::-webkit-details-marker { display: none; }
.xp-leer-pl summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.xp-leer-pl .xp-leer { margin-top: var(--sp-16); }
</style>
