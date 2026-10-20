<script setup lang="ts">
/**
 * /tres-dianas (EN /three-targets): «Tres dianas, dos mapas». Para HER2, TROP2 y B7-H3, la estructura predicha de
 * AlphaFold DB y, al lado, dónde se lee su ARN en el mapa de células de las dos biopsias ya publicado en el explorador.
 *
 * Describe y equipa; no concluye. Ninguna cifra clínica nueva: el mapa marca células (sin recuentos) y la lectura es la
 * del fichero publicado, con las etiquetas del explorador; las cifras están en el explorador, a un clic. La puerta es
 * la del explorador: cerrada, la página enseña solo las estructuras. Las dianas y sus UniProt, en app/utils/tresDianas.ts.
 */
import { cargaLesion } from '~/composables/useCelulaExplorador'
import { motivoDe, traeMotivo, type Lesion, type LesionDatos } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, ETIQUETA_LESION, ETIQUETA_MOTIVO, ETIQUETAS_FIJAS, LECTURA, etiqueta, etiquetaLectura } from '~/utils/celulaExploradorTexto'
import { DIANAS, urlEntradaAlphaFold, urlUniprot } from '~/utils/tresDianas'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const { man, estado } = useCelulaExplorador()

const titulo = () => L('Tres dianas, dos mapas', 'Three targets, two maps')
const descripcion = () => L('HER2, TROP2 y B7-H3: su estructura predicha por AlphaFold y dónde se lee su ARN, célula a célula, en las dos biopsias de Miriam.',
  'HER2, TROP2 and B7-H3: their structure as predicted by AlphaFold, and where their RNA is read, cell by cell, in Miriam’s two biopsies.')
useSeoMeta({
  title: titulo, description: descripcion, ogTitle: titulo, ogDescription: descripcion,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: titulo, twitterDescription: descripcion,
})
defineOgImage('Default.takumi', { title: titulo, description: descripcion })

/* las dos biopsias, una sola vez para las tres dianas; solo con la puerta abierta (la misma regla que el explorador) */
const LESIONES: Lesion[] = ['higado', 'hueso']
const datos = ref<Partial<Record<Lesion, LesionDatos>>>({})
const fallo = ref(false)
watch(estado, async (e) => {
  if (e === 'cerrada' || Object.keys(datos.value).length) return
  try {
    const [h, b] = await Promise.all(LESIONES.map((l) => cargaLesion(man, l, e === 'ejemplo')))
    datos.value = { higado: h, hueso: b }
  }
  catch (err) { console.warn('[tres-dianas]', err); fallo.value = true }
}, { immediate: true })

const lectura = (d: LesionDatos, gen: string) => {
  const mot = motivoDe(d, gen)
  return { ver: etiquetaLectura(d.veredicto[gen] ?? 'sin_veredicto', traeMotivo(d), lang.value), mot: mot ? etiqueta(ETIQUETA_MOTIVO, mot, lang.value) : null }
}
const grupoInteres = (d: LesionDatos) => etiqueta(ETIQUETA_GRUPO, d.grupos.find((g) => g.rol === 'interes')?.id ?? '', lang.value)
const etiquetaMapa = (d: LesionDatos, proteina: string, gen: string) => L(
  `Mapa de células de la biopsia de ${ETIQUETA_LESION[d.lesion]!.es.toLowerCase()}. En violeta, las células donde se lee el ARN de ${gen} (${proteina}); en gris oscuro, el grupo «${grupoInteres(d)}»; en gris claro, el resto.`,
  `Cell map of the ${ETIQUETA_LESION[d.lesion]!.en.toLowerCase()} biopsy. In violet, cells where ${gen} (${proteina}) RNA is read; in dark grey, the “${grupoInteres(d)}” group; in light grey, the rest.`,
)
</script>

<template>
  <div class="overflow-x-clip">
    <section class="td" :aria-label="titulo()">
      <div class="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          compact
          :parent="{ to: localePath({ name: 'celula-a-celula-explorar' }), label: L('Explorar célula a célula', 'Explore cell by cell') }"
          :title="titulo()"
        />
        <div class="td__intro">
          <p class="td__p">
            {{ L('Tres de los genes de interés del explorador, cada uno con dos mapas. A la izquierda, la forma de la proteína tal como la predice AlphaFold: un modelo, no una medición. A la derecha, las células de las dos biopsias de Miriam en las que se lee su ARN.',
                 'Three of the explorer’s genes of interest, each with two maps. On the left, the shape of the protein as AlphaFold predicts it: a model, not a measurement. On the right, the cells in Miriam’s two biopsies where its RNA is read.') }}
          </p>
          <p class="td__p">
            {{ L('Leer el ARN de un gen no dice que la proteína esté en la célula; eso lo dice la inmunohistoquímica. Las cifras, con su suelo ambiental y su referencia, están en el explorador.',
                 'Reading a gene’s RNA does not mean the protein is in the cell; immunohistochemistry tells you that. The figures, with their ambient floor and reference, are in the explorer.') }}
          </p>
          <ul class="td__fijas" :aria-label="L('Cómo leer estos datos', 'How to read these data')">
            <li>{{ ETIQUETAS_FIJAS.n1[lang] }}</li>
            <li>{{ ETIQUETAS_FIJAS.arn[lang] }}</li>
          </ul>
        </div>

        <article v-for="dn in DIANAS" :key="dn.gen" class="td__diana" :aria-labelledby="`td-${dn.gen}`">
          <header class="td__cab">
            <h2 :id="`td-${dn.gen}`" class="td__h2">{{ dn.proteina }} <span class="td__gen">{{ dn.gen }}</span></h2>
            <p class="td__que">{{ dn.que[lang] }} <a :href="urlUniprot(dn.uniprot)" class="link-underline" target="_blank" rel="noopener">UniProt {{ dn.uniprot }}</a></p>
          </header>
          <div class="td__rejilla">
            <section class="td__col" :aria-label="L('Estructura predicha', 'Predicted structure')">
              <h3 class="td__h3">{{ L('Su forma (predicha)', 'Its shape (predicted)') }}</h3>
              <ClientOnly>
                <DianaEstructura :diana="dn" :lang="lang" />
                <template #fallback><div class="td__espera" aria-hidden="true" /></template>
              </ClientOnly>
            </section>
            <section class="td__col" :aria-label="L('Dónde se lee su ARN', 'Where its RNA is read')">
              <h3 class="td__h3">{{ L('Dónde se lee su ARN', 'Where its RNA is read') }}</h3>
              <p v-if="estado === 'cerrada'" class="td__p td__p--sm">{{ L('El mapa de células se enseña cuando el explorador está abierto.', 'The cell map is shown when the explorer is open.') }}</p>
              <p v-else-if="fallo" class="td__p td__p--sm" role="status">
                {{ L('No se ha podido cargar el mapa aquí. Está en el', 'The map could not be loaded here. It is in the') }}
                <NuxtLink :to="localePath({ name: 'celula-a-celula-explorar', query: { gen: dn.gen } })" class="link-underline">{{ L('explorador', 'explorer') }}</NuxtLink>.
              </p>
              <div v-else class="td__mapas">
                <figure v-for="l in LESIONES" :key="l" class="td__mapa">
                  <figcaption class="td__mapa-t">{{ ETIQUETA_LESION[l]![lang] }}</figcaption>
                  <ClientOnly>
                    <DianaMapaCelulas v-if="datos[l]" :d="datos[l]!" :gen="dn.gen" :etiqueta="etiquetaMapa(datos[l]!, dn.proteina, dn.gen)" />
                    <div v-else class="td__espera td__espera--mapa" aria-busy="true" />
                    <template #fallback><div class="td__espera td__espera--mapa" aria-hidden="true" /></template>
                  </ClientOnly>
                  <p v-if="datos[l]" class="td__lec">
                    <span class="td__lec-t">{{ ETIQUETAS_FIJAS.lecturaCorta[lang] }}</span>
                    <strong>{{ lectura(datos[l]!, dn.gen).ver }}</strong><template v-if="lectura(datos[l]!, dn.gen).mot"> ({{ lectura(datos[l]!, dn.gen).mot }})</template>
                  </p>
                  <p v-if="dn.gen === 'ERBB2'" class="td__ihq">{{ (l === 'hueso' ? ETIQUETAS_FIJAS.her2Hueso : ETIQUETAS_FIJAS.her2)[lang] }}</p>
                  <NuxtLink :to="localePath({ name: 'celula-a-celula-explorar', query: { gen: dn.gen, biopsia: l } })" class="td__ir">
                    {{ L(`Ver ${dn.proteina} en el ${ETIQUETA_LESION[l]!.es.toLowerCase()}, con sus cifras`, `See ${dn.proteina} in the ${ETIQUETA_LESION[l]!.en.toLowerCase()}, with its figures`) }}<span aria-hidden="true"> →</span>
                  </NuxtLink>
                </figure>
              </div>
              <ul v-if="estado !== 'cerrada' && !fallo" class="td__clave" :aria-label="L('Leyenda del mapa', 'Map legend')">
                <li><span class="td__punto td__punto--gen" aria-hidden="true" />{{ L(`Se lee ARN de ${dn.gen} (al menos una molécula; incluye el ARN ambiental)`, `${dn.gen} RNA is read (at least one molecule; includes ambient RNA)`) }}</li>
                <li><span class="td__punto td__punto--interes" aria-hidden="true" />{{ L('Grupo de interés de cada biopsia', 'Each biopsy’s group of interest') }}</li>
                <li><span class="td__punto" aria-hidden="true" />{{ L('Resto de células', 'Other cells') }}</li>
              </ul>
              <p v-if="estado !== 'cerrada' && !fallo" class="td__p td__p--sm">{{ LECTURA.pie[lang] }}</p>
            </section>
          </div>
          <p class="td__af">
            <a :href="urlEntradaAlphaFold(dn.uniprot)" class="link-underline" target="_blank" rel="noopener">{{ L(`Entrada de ${dn.proteina} en AlphaFold DB`, `${dn.proteina} entry in AlphaFold DB`) }}</a>
          </p>
        </article>

        <footer class="td__creditos">
          <p class="td__credito">Structures: AlphaFold DB (Google DeepMind · EMBL-EBI), <a href="https://creativecommons.org/licenses/by/4.0/" class="link-underline" target="_blank" rel="noopener license">CC BY 4.0</a></p>
          <p class="td__p td__p--sm">
            {{ L('AlphaFold (Google DeepMind) predice la estructura y AlphaFold DB (EMBL-EBI) la publica; el visor la pide a su API pública por el código UniProt cada vez que se abre, sin cambiarla. El mapa de células y la lectura por gen son los del explorador ya publicado; Polaris, el sistema de IA de Miriam, junta las dos piezas.',
                 'AlphaFold (Google DeepMind) predicts the structure and AlphaFold DB (EMBL-EBI) publishes it; the viewer requests it from their public API by UniProt code each time it opens, without changing it. The cell map and the per-gene reading are those of the already published explorer; Polaris, Miriam’s AI system, puts the two together.') }}
          </p>
          <p class="td__p td__p--sm">
            {{ L('Citas:', 'Citations:') }}
            Jumper J. et al. <cite>Nature</cite> 596, 583–589 (2021), <a href="https://doi.org/10.1038/s41586-021-03819-2" class="link-underline" target="_blank" rel="noopener">doi:10.1038/s41586-021-03819-2</a> ·
            Bertoni D. et al. <cite>Nucleic Acids Research</cite> (2025), <a href="https://doi.org/10.1093/nar/gkaf1226" class="link-underline" target="_blank" rel="noopener">doi:10.1093/nar/gkaf1226</a> ·
            AlphaFold Data Copyright (2022) DeepMind Technologies Limited
          </p>
          <p class="td__p td__p--sm">{{ L('Material de apoyo a la decisión: no es consejo médico ni concluye nada sobre el tratamiento.', 'Decision-support material: not medical advice, and it concludes nothing about treatment.') }}</p>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped>
.td { padding: 1rem 0 4rem; }
.td__intro { display: grid; gap: var(--sp-12); margin-bottom: var(--sp-48); }
.td__p { font: var(--tipo-body); color: var(--texto-2); max-width: var(--measure); margin: 0; }
.td__p--sm { font: var(--tipo-body-sm); }
.td__fijas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-8); }
.td__fijas li { font: var(--tipo-body-sm); color: var(--texto-1); border: 1px solid var(--trazo-fuerte); border-radius: 9999px; padding: 2px var(--sp-12); }
.td__diana { padding: var(--sp-32) 0; border-top: 1px solid var(--trazo-medio); }
.td__cab { margin-bottom: var(--sp-24); }
.td__h2 { font: var(--tipo-h2); color: var(--texto-1); margin: 0; }
.td__gen { font: 500 0.55em/1 var(--font-mono); color: var(--texto-2); margin-left: var(--sp-8); vertical-align: middle; }
.td__que { font: var(--tipo-body); color: var(--texto-2); margin: var(--sp-8) 0 0; }
.td__rejilla { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-32); }
@media (min-width: 900px) { .td__rejilla { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); } }
.td__col { display: grid; gap: var(--sp-12); align-content: start; }
.td__h3 { font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0; }
.td__mapas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-16); }
.td__mapa { margin: 0; display: grid; gap: var(--sp-8); align-content: start; }
.td__mapa-t { font: 600 var(--texto-base)/1.3 var(--font-body); color: var(--texto-1); }
.td__espera { aspect-ratio: 1 / 1; max-height: 420px; border-radius: var(--radius-btn); background: var(--superficie); border: 1px solid var(--trazo-medio); }
.td__lec { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.td__lec-t { display: block; color: var(--texto-3); }
.td__ihq { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.td__ir { display: inline-block; padding: 10px 0; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--color-link); text-decoration: underline; text-underline-offset: 3px; }
.td__ir:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; border-radius: 4px; }
.td__clave { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-4); font: var(--tipo-body-sm); color: var(--texto-2); }
.td__clave li { display: flex; align-items: center; gap: var(--sp-8); }
.td__punto { width: 12px; height: 12px; border-radius: 9999px; flex-shrink: 0; background: rgb(var(--color-text-rgb) / 0.16); border: 1px solid var(--trazo-fuerte); }
.td__punto--interes { background: rgb(var(--color-text-rgb) / 0.42); }
.td__punto--gen { background: var(--color-miriam); border-color: var(--color-miriam); }
.td__af { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); }
.td__creditos { display: grid; gap: var(--sp-12); padding-top: var(--sp-32); border-top: 1px solid var(--trazo-medio); }
.td__credito { margin: 0; font: 600 var(--texto-base)/1.4 var(--font-body); color: var(--texto-1); }
</style>
