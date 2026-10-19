<script setup lang="ts">
/**
 * «Datos y cómo citarlos» (plan «muy útil a científicos», aprobado por Miriam el 19-oct-2026; revisado por diseno y el
 * comité médico). Solo lo que YA es público: los dos JSON de la página, la matriz completa como AnnData-Zarr (decisión 2
 * de Miriam, 18-oct) y el manifiesto con sus sha256. No toca la tarjeta «El fichero completo, a petición» (h5ad).
 * Cómo leerlo: probado el 19-oct con anndata 0.13.4, zarr 3.4.1, fsspec y aiohttp en un entorno limpio de Python 3.12
 * (hueso 25 s, hígado 63 s). La cita va sin DOI, por versión y huella: la autora es Miriam y nadie más.
 */
import type { Manifiesto } from '~/utils/celulaExplorador'
import { ETIQUETAS_FIJAS } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ man: Manifiesto; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const SITIO = 'https://helpmiriam.com'
const BASE = `${SITIO}/celula/explorador`
const PAGINA = `${SITIO}/celula-a-celula/explorar`
const NOMBRE = { higado: ['Hígado', 'Liver'], hueso: ['Hueso', 'Bone'] } as const
const nombre = (l: string) => { const n = NOMBRE[l as keyof typeof NOMBRE]; return n ? L(n[0], n[1]) : l }

const lesiones = computed(() => props.man.lesiones.map((l) => ({
  l, json: props.man.ficheros.find((f) => f.ruta === `${l}.json`), zarr: props.man.zarr?.find((z) => z.ruta === `zarr/${l}.zarr`),
})))
const corto = (sha?: string) => (sha ? sha.slice(0, 12) : '')
const fecha = computed(() => props.man.fecha_ok ?? '')
const huellas = computed(() => lesiones.value.filter((x) => x.json).map((x) => `${corto(x.json!.sha256)} (${nombre(x.l).toLowerCase()})`).join(', '))
const cita = computed(() => L(
  `González, Miriam (2026). Explorador célula a célula de dos biopsias de cáncer de mama metastásico, hígado y hueso (10x Flex, FFPE). Versión ${props.man.version}${fecha.value ? `, ${fecha.value}` : ''}. ${PAGINA}. Huella sha256 de los datos: ${huellas.value}.`,
  `González, Miriam (2026). Cell-by-cell explorer of two metastatic breast cancer biopsies, liver and bone (10x Flex, FFPE). Version ${props.man.version}${fecha.value ? `, ${fecha.value}` : ''}. ${PAGINA}. Data sha256 fingerprint: ${huellas.value}.`))
const bibtex = computed(() => [
  '@misc{gonzalez2026celula,',
  '  author = {Gonz{\\\'a}lez, Miriam},',
  `  title = {${L('Explorador célula a célula de dos biopsias de cáncer de mama metastásico, hígado y hueso (10x Flex, FFPE)', 'Cell-by-cell explorer of two metastatic breast cancer biopsies, liver and bone (10x Flex, FFPE)')}},`,
  '  year = {2026},',
  `  version = {${props.man.version}},`,
  `  howpublished = {\\url{${PAGINA}}},`,
  `  note = {sha256 ${huellas.value}${fecha.value ? `; ${fecha.value}` : ''}}`,
  '}',
].join('\n'))
/* Lo que se copia se ejecuta tal cual en Python (pase de diseño, 19-oct: mezclaba shell y Python): la instalación va
 * comentada y la biopsia es una variable. Probado el 19-oct en un entorno limpio. */
const codigoTxt = computed(() => [
  `# ${L('en un terminal', 'in a terminal')}: pip install anndata zarr fsspec aiohttp`,
  'import anndata as ad',
  '',
  `lesion = "higado"   # ${L('o', 'or')} "hueso"`,
  `adata = ad.read_zarr(f"${BASE}/zarr/{lesion}.zarr")`,
].join('\n'))
/** En pantalla la fecha no se parte (guiones de no separación); lo copiado lleva el texto original. */
const citaVista = computed(() => (fecha.value ? cita.value.replace(fecha.value, fecha.value.replaceAll('-', '\u2011')) : cita.value))

const { estado: estadoCodigo, copia: copiaCodigo } = useCopiado()
const { estado: estadoCita, copia: copiaCita } = useCopiado()
const NO = () => L('No se pudo copiar en este navegador.', 'Could not copy in this browser.')
</script>

<template>
  <section id="datos" class="card-base dat" aria-labelledby="dat-t">
    <h2 id="dat-t" class="dat__h">{{ L('Datos y cómo citarlos', 'Data and how to cite it') }}</h2>
    <p class="dat__p">{{ L(`Los datos de esta página son públicos y se pueden usar para investigar. Son de una sola paciente (${ETIQUETAS_FIJAS.n1.es}) y son ARN, no proteína.`, `The data on this page are public and can be used for research. They come from a single patient (${ETIQUETAS_FIJAS.n1.en}) and are RNA, not protein.`) }}</p>

    <h3 class="dat__sub">{{ L('Ficheros', 'Files') }}</h3>
    <ul class="dat__lista" role="list">
      <li v-for="x in lesiones" :key="x.l" class="dat__fila">
        <strong class="dat__les">{{ nombre(x.l) }}</strong>
        <span v-if="x.zarr" class="dat__item">
          {{ L('Matriz completa, todos los genes (AnnData-Zarr v3):', 'Full matrix, every gene (AnnData-Zarr v3):') }}
          <code class="dat__url">{{ `${BASE}/${x.zarr.ruta}` }}</code>
        </span>
        <span v-if="x.json" class="dat__item">
          <a :href="`/celula/explorador/${x.json.ruta}`" download class="link-underline">{{ L(`Lo que pinta la página (${x.json.ruta})`, `What the page draws (${x.json.ruta})`) }}</a>
          <span class="dat__sha nums">sha256 {{ corto(x.json.sha256) }}…</span>
        </span>
      </li>
    </ul>
    <p class="dat__p dat__p--sm">
      <a href="/celula/explorador/manifiesto.json" download class="link-underline">manifiesto.json</a>
      {{ L('lleva la versión, el sello de verificación y el sha256 completo de cada fichero.', 'carries the version, the verification seal and the full sha256 of every file.') }}
    </p>

    <h3 class="dat__sub">{{ L('Abrirlo en Python', 'Open it in Python') }}</h3>
    <pre class="dat__code" tabindex="0" role="region" :aria-label="L('Código para abrirlo en Python', 'Code to open it in Python')"><code>{{ codigoTxt }}</code></pre>
    <div class="dat__acciones">
      <button type="button" class="dat__btn" @click="copiaCodigo(codigoTxt, L('Copiado: el código.', 'Copied: the code.'), NO())">{{ L('Copiar el código', 'Copy the code') }}</button>
      <span class="dat__estado" role="status">{{ estadoCodigo }}</span>
    </div>
    <p class="dat__p dat__p--sm">{{ L('Probado el 19-oct-2026 con anndata 0.13 y zarr 3.4. Se lee por partes desde la web: el hígado tarda alrededor de un minuto. Las células van con un índice propio, no con su código de barras.', 'Tested on 19 Oct 2026 with anndata 0.13 and zarr 3.4. It is read piece by piece from the web: the liver takes about a minute. Cells carry an index of their own, not their barcode.') }}</p>

    <h3 class="dat__sub">{{ L('Cómo citarlo', 'How to cite it') }}</h3>
    <p class="dat__cita">{{ citaVista }}</p>
    <div class="dat__acciones">
      <button type="button" class="dat__btn" @click="copiaCita(cita, L('Copiado: la cita.', 'Copied: the citation.'), NO())">{{ L('Copiar la cita', 'Copy the citation') }}</button>
      <button type="button" class="dat__btn" @click="copiaCita(bibtex, L('Copiado: BibTeX.', 'Copied: BibTeX.'), NO())">{{ L('Copiar BibTeX', 'Copy BibTeX') }}</button>
      <span class="dat__estado" role="status">{{ estadoCita }}</span>
    </div>
    <p class="dat__p dat__p--sm">{{ L('Si los datos cambian, cambian la versión y la huella: cítalo con las dos.', 'If the data change, the version and the fingerprint change: cite it with both.') }}</p>
  </section>
</template>

<style scoped>
.dat { padding: var(--sp-16) var(--sp-24); color: var(--texto-1); }
@media (min-width: 640px) { .dat { padding: var(--sp-24); } }
.dat__h { font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0; }
.dat__sub { font: 600 var(--texto-base)/1.3 var(--font-body); color: var(--texto-1); margin: var(--sp-24) 0 var(--sp-8); }
.dat__p { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.dat__p--sm { font-size: var(--texto-xs); }
.dat__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); }
.dat__fila { display: grid; gap: var(--sp-4); padding-top: var(--sp-8); border-top: 1px solid var(--trazo-sutil); }
.dat__les { font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.dat__item { font: var(--tipo-body-sm); color: var(--texto-2); overflow-wrap: anywhere; }
.dat__url, .dat__sha { font: 500 var(--texto-xs)/1.4 var(--font-mono); color: var(--texto-1); overflow-wrap: anywhere; }
.dat__sha { margin-left: var(--sp-8); color: var(--texto-2); }
.dat__code { margin: 0; max-width: 46rem; padding: var(--sp-12) var(--sp-16); border: 1px solid var(--trazo-fuerte); border-radius: var(--radius-btn); background: var(--fondo); font: 500 var(--texto-xs)/1.5 var(--font-mono); color: var(--texto-1); white-space: pre; overflow-x: auto; }
.dat__code:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.dat__cita { margin: 0; padding: var(--sp-12) var(--sp-16); border-left: 3px solid var(--trazo-fuerte); font: var(--tipo-body-sm); color: var(--texto-1); max-width: 46rem; user-select: all; overflow-wrap: anywhere; }
.dat__acciones { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-12); margin-top: var(--sp-12); }
.dat__btn { min-height: 44px; padding: 0 var(--sp-16); border: 1px solid var(--trazo-interactivo); border-radius: var(--radius-btn); background: var(--fondo); color: var(--texto-1); font: 600 var(--texto-sm)/1.2 var(--font-body); -webkit-tap-highlight-color: transparent; }
@media (hover: hover) { .dat__btn:hover { background: var(--trazo-sutil); } }
.dat__btn:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.dat__estado { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
@media (max-width: 639px) { .dat__btn { flex: 1 1 100%; } }
</style>
