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
const descripcion = () => L('Para oncólogos moleculares: el mapa de células de las dos biopsias de Miriam, gen a gen, con el n, el suelo ambiental y la referencia a la vista en cada medida.',
  'For molecular oncologists: the cell map of Miriam’s two biopsies, gene by gene, with the n, the ambient floor and the reference shown for every measure.')
useSeoMeta({
  title: titulo, description: descripcion, ogTitle: titulo, ogDescription: descripcion,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: titulo, twitterDescription: descripcion,
  robots: () => (hayReal.value ? 'index, follow' : 'noindex, follow'),
})
defineOgImage('Default.takumi', { title: titulo, description: descripcion })

const VERAS = [
  ['El mapa de células de cada lesión, coloreado por grupo, tipo celular o gen.', 'The cell map of each lesion, coloured by group, cell type or gene.'],
  ['Cualquier gen de la lista, grupo a grupo, con su n y su suelo ambiental.', 'Any gene on the list, group by group, with its n and its ambient floor.'],
  ['Los genes de interés frente a la referencia emparejada, con la valoración de la revisión.', 'The genes of interest against the matched reference, with the review assessment.'],
  ['Dos genes a la vez: en qué células se detectan los dos.', 'Two genes at once: the cells where both are detected.'],
  ['El número de copias por célula, solo en el hueso.', 'Copy number per cell, in the bone only.'],
] as const
const LEER = [
  [`${ETIQUETAS_FIJAS.n1.es}.`, 'Dos biopsias pequeñas de una sola paciente, fijadas en formol e incluidas en parafina. Sirve para generar hipótesis, que habrá que confirmar con otras pruebas.', `${ETIQUETAS_FIJAS.n1.en}.`, 'Two small biopsies from a single patient, formalin-fixed and paraffin-embedded. It generates hypotheses that other tests will have to confirm.'],
  [`${ETIQUETAS_FIJAS.arn.es}.`, 'El análisis lee ARN. Que un gen se lea no dice que la proteína esté; eso lo dice la inmunohistoquímica.', `${ETIQUETAS_FIJAS.arn.en}.`, 'The analysis reads RNA. Reading a gene does not mean the protein is there; immunohistochemistry tells you that.'],
  ['Suelo ambiental.', 'En una muestra así flota ARN suelto que cae en cualquier célula. Para cada gen y grupo se calcula cuántas células saldrían positivas solo por eso; lo que no supera ese suelo no cuenta.', 'Ambient floor.', 'In a sample like this, loose RNA floats around and lands in any cell. For each gene and group we compute how many cells would come out positive from that alone; anything that does not clear the floor does not count.'],
  ['Referencia emparejada.', 'Células no tumorales de la misma muestra, con la misma profundidad de lectura. Si un gen se detecta igual o más en la referencia que en el grupo de interés, no sirve para distinguir el tumor.', 'Matched reference.', 'Non-tumor cells from the same sample, at the same read depth. If a gene is detected as much or more in the reference than in the group of interest, it does not tell the tumor apart.'],
  ['Grupos fijos.', 'Los grupos y su n vienen del análisis revisado. La página no vuelve a agrupar células ni calcula un «% de células tumorales» del hígado.', 'Fixed groups.', 'The groups and their n come from the reviewed analysis. The page does not regroup cells or compute a “% of tumor cells” for the liver.'],
] as const
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="titulo()">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          class="!mb-6"
          :parent="{ to: localePath({ name: 'celula-a-celula' }), label: L('Célula a célula', 'Cell by cell') }"
          :tag="L('Para profesionales', 'For professionals')"
          :title="titulo()"
          :subtitle="descripcion()"
        />
        <CelulaAviso class="mb-4" />
        <CelulaExplorarEtiquetas :lang="lang" class="mb-8" />

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

          <section aria-labelledby="xp-leer-t">
            <h2 id="xp-leer-t" class="cel-h2">{{ L('Cómo leerlo', 'How to read it') }}</h2>
            <dl class="xp-leer">
              <div v-for="[tEs, dEs, tEn, dEn] in LEER" :key="tEs" class="xp-leer__fila">
                <dt>{{ L(tEs, tEn) }}</dt>
                <dd>{{ L(dEs, dEn) }}</dd>
              </div>
            </dl>
          </section>

          <section class="card-base cel-card" aria-labelledby="xp-pide-t">
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
.xp-flujo { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-48); }
.xp-cerrado { padding: var(--sp-24); }
.xp-espera { min-height: 60vh; display: grid; place-items: center; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.xp-cerrado__sub { margin-top: var(--sp-16); }
.xp-lista { list-style: disc; margin: var(--sp-8) 0 0; padding-left: 1.2em; font: var(--tipo-body); color: var(--color-text-soft); max-width: var(--measure); }
.xp-lista li + li { margin-top: var(--sp-4); }
.xp-leer { margin: 0; display: grid; gap: var(--sp-12); max-width: var(--measure); }
.xp-leer__fila dt { font: 600 var(--texto-base)/1.4 var(--font-body); color: var(--color-text); }
.xp-leer__fila dd { margin: var(--sp-4) 0 0; font: var(--tipo-body-sm); color: var(--color-text-soft); }
</style>
