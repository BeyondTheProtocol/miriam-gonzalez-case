/**
 * Motor del explorador: Vitessce (React) montado como isla dentro de un componente Vue.
 *
 * Solo se importa con `await import()` desde ExpMotor.client.vue, así que React y Vitessce viajan en
 * un chunk aparte que SOLO carga /celula-a-celula/explorar, y solo en el navegador (nunca en el HTML
 * estático). Vitessce pinta el mapa (UMAP) y la lista de conjuntos; lo que tiene que llevar avisos,
 * n y suelo (violines, tabla de genes de interés, CNV) son componentes propios con el design system.
 *
 * Los datos NO se piden a ningún servidor: la página ya tiene la lesión en memoria (contrato de
 * app/utils/celulaExplorador.ts) y aquí se convierten en tres CSV en memoria (blob:) con lo mínimo
 * que pide cada vista: el mapa, los conjuntos (grupo, tipo celular, co-expresión) y la columna del
 * gen elegido. Con un gen nuevo se rehace la matriz de ese gen, no la lesión entera.
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { VitSContainer } from '@vitessce/vit-s'
import { upgradeAndParse } from '@vitessce/schemas'
import { COORDINACION, FICHEROS, VISTAS } from './plugins'

export interface ConjuntoCsv { nombre: string; columna: string; valores: string[] }
export interface EntradaMotor {
  uid: string
  tema: 'light' | 'dark'
  alto: number
  /** coordenadas planas x0,y0,x1,y1… */
  umap: number[]
  conjuntos: ConjuntoCsv[]
  /** colores por ruta de conjunto: [[nombre, valor], [r,g,b]] */
  colores: { ruta: [string, string]; rgb: [number, number, number] }[]
  /** gen que colorea el mapa; null = colorear por conjunto */
  gen: { simbolo: string; valores: Float32Array } | null
  /** conjunto que colorea el mapa cuando no hay gen */
  colorearPor: string
  etiquetas: { mapa: string }
  lang: 'es' | 'en'
  /** rótulos de conjunto sobre el mapa (solo tiene sentido con los grupos) */
  rotulos: boolean
  /** tamaño de los rótulos (px de Vitessce) */
  tamRotulo?: number
  /** encuadre inicial con margen: ancho del contenedor (px) y fracción del lienzo que ocupan los datos. Sin él, Vitessce
   * encaja los datos de borde a borde y en el móvil los rótulos de los cúmulos del borde se cortaban (diseño, 18-oct). */
  encuadre?: { ancho: number; margen: number }
  /** orden de dibujo de las células (las últimas, encima): con un gen, lo detectado encima de lo no detectado */
  orden?: number[]
}

const csvCampo = (s: string) => (/[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s)
const id = (i: number) => `c${i}`

function blob(texto: string, urls: string[]): string {
  const u = URL.createObjectURL(new Blob([texto], { type: 'text/csv' }))
  urls.push(u)
  return u
}

function construyeConfig(e: EntradaMotor, urls: string[]) {
  const n = e.umap.length / 2
  const orden = e.orden?.length === n ? e.orden : Array.from({ length: n }, (_, i) => i)
  const emb = ['id,umap_1,umap_2']
  for (const i of orden) emb.push(`${id(i)},${e.umap[2 * i]},${e.umap[2 * i + 1]}`)
  const sets = [['id', ...e.conjuntos.map((c) => c.columna)].join(',')]
  for (const i of orden) sets.push([id(i), ...e.conjuntos.map((c) => csvCampo(c.valores[i] ?? ''))].join(','))

  const files: Record<string, unknown>[] = [
    { fileType: 'obsEmbedding.csv', url: blob(emb.join('\n'), urls), coordinationValues: { obsType: 'cell', embeddingType: 'UMAP' }, options: { obsIndex: 'id', obsEmbedding: ['umap_1', 'umap_2'] } },
    { fileType: 'obsSets.csv', url: blob(sets.join('\n'), urls), coordinationValues: { obsType: 'cell' }, options: { obsIndex: 'id', obsSets: e.conjuntos.map((c) => ({ name: c.nombre, column: c.columna })) } },
  ]
  if (e.gen) {
    const m = [`id,${csvCampo(e.gen.simbolo)}`]
    for (let i = 0; i < n; i++) m.push(`${id(i)},${e.gen.valores[i] ?? 0}`)
    files.push({ fileType: 'obsFeatureMatrix.csv', url: blob(m.join('\n'), urls), coordinationValues: { obsType: 'cell', featureType: 'gene', featureValueType: 'expression' } })
  }
  // misma cuenta que Vitessce (log2 de píxeles por unidad), con margen; «Recentrar» vuelve a este encuadre
  const vista: Record<string, { A: number }> = {}
  if (e.encuadre && e.encuadre.ancho > 0 && n > 1) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (let i = 0; i < n; i++) {
      const x = e.umap[2 * i]!, y = e.umap[2 * i + 1]!
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    const w = Math.max(100, e.encuadre.ancho - 24), h = Math.max(100, e.alto - 60)   // lienzo: sin el relleno ni el título de la tarjeta
    vista.embeddingZoom = { A: Math.log2(Math.min(w / (x1 - x0), h / (y1 - y0)) * e.encuadre.margen) }
    vista.embeddingTargetX = { A: x0 + (x1 - x0) / 2 }
    vista.embeddingTargetY = { A: -(y0 + (y1 - y0) / 2) }   // Vitessce dibuja con el eje y hacia abajo
  }
  const primero = e.conjuntos.find((c) => c.nombre === e.colorearPor) ?? e.conjuntos[0]!
  const seleccion = [...new Set(primero.valores)].sort().map((v) => [primero.nombre, v])
  return {
    version: '1.0.16',
    name: e.etiquetas.mapa,
    uid: e.uid,
    description: '',
    datasets: [{ uid: 'd', name: 'd', files }],
    initStrategy: 'auto',
    coordinationSpace: {
      dataset: { A: 'd' },
      embeddingType: { A: 'UMAP' },
      obsColorEncoding: { A: e.gen ? 'geneSelection' : 'cellSetSelection' },
      featureSelection: { A: e.gen ? [e.gen.simbolo] : null },
      obsSetSelection: { A: seleccion },
      obsSetColor: { A: e.colores.map((c) => ({ path: c.ruta, color: c.rgb })) },
      embeddingObsRadiusMode: { A: 'manual' },
      embeddingObsRadius: { A: 2 },
      // rótulos solo por grupo: en tipo (12 en hueso) y co-expresión se pisaban y parecían nombres de cúmulo
      embeddingObsSetLabelsVisible: { A: e.rotulos },
      embeddingObsSetLabelSize: { A: e.tamRotulo ?? 14 },
      ...vista,
    },
    // UNA vista: el mapa. Sin el gestor de conjuntos de Vitessce (permitía crear grupos nuevos por
    // unión/intersección, y la página no reagrupa células); la leyenda va debajo, con el design system.
    layout: [
      { component: 'scatterplot', coordinationScopes: { dataset: 'A', embeddingType: 'A', obsColorEncoding: 'A', featureSelection: 'A', obsSetSelection: 'A', obsSetColor: 'A', embeddingObsRadiusMode: 'A', embeddingObsRadius: 'A', embeddingObsSetLabelsVisible: 'A', embeddingObsSetLabelSize: 'A', ...Object.fromEntries(Object.keys(vista).map((k) => [k, 'A'])) }, x: 0, y: 0, w: 12, h: 12, props: { title: e.etiquetas.mapa, closeButtonVisible: false, downloadButtonVisible: false } },
    ],
  }
}

export interface Motor { pinta(e: EntradaMotor): void; desmonta(): void }

/** Vitessce pide `getTermMapping` (ensembl → hgnc) para los rótulos de gen; con la lista vacía tiraba «TypeError: n is
 * not a function» en consola (diseño, 18-oct). Aquí los genes ya van por su símbolo: un mapa vacío, local, sin red. */
const FUNCIONES = [{ functionType: 'getTermMapping', asyncFunction: async () => new Map<string, string>() }]

/** La interfaz de Vitessce viene en inglés y con títulos de nivel 1: se ajusta a la página (ES/EN, h3). */
const TEXTOS: Record<string, { es: string; en: string }> = {
  'Pointer tool': { es: 'Mover y hacer zoom', en: 'Pan and zoom' },
  'click to recenter': { es: 'Recentrar el mapa', en: 'Recenter the map' },
  'Recenter': { es: 'Recentrar el mapa', en: 'Recenter the map' },
}
function ajusta(el: HTMLElement, lang: 'es' | 'en') {
  for (const h of el.querySelectorAll('[role="heading"][aria-level="1"]')) h.setAttribute('aria-level', '3')
  for (const b of el.querySelectorAll<HTMLElement>('[title], [aria-label]')) {
    for (const a of ['title', 'aria-label']) {
      const v = b.getAttribute(a)
      if (v && TEXTOS[v]) b.setAttribute(a, TEXTOS[v][lang])
    }
  }
  // pie «19,047 cells» de Vitessce: fijo en inglés y con coma de miles; la página ya da «19.047 células…» debajo
  for (const n of el.querySelectorAll<HTMLElement>('p, span, div')) {
    if (!n.childElementCount && /^\s*[\d,]+ cells?\s*$/.test(n.textContent ?? '')) n.style.display = 'none'
  }
  // el lienzo no se maneja con teclado: que no sea una parada de tabulación sin nombre
  for (const d of el.querySelectorAll<HTMLElement>('div[tabindex="0"]')) if (!d.getAttribute('aria-label')) d.setAttribute('tabindex', '-1')
}

export function montaMotor(el: HTMLElement): Motor {
  const raiz: Root = createRoot(el)
  let lang: 'es' | 'en' = 'es'
  const vigia = new MutationObserver(() => ajusta(el, lang))
  vigia.observe(el, { childList: true, subtree: true })
  let urls: string[] = []
  const libera = () => { for (const u of urls) URL.revokeObjectURL(u); urls = [] }
  return {
    pinta(e) {
      lang = e.lang
      const nuevas: string[] = []
      const config = upgradeAndParse(construyeConfig(e, nuevas))
      raiz.render(createElement(VitSContainer, {
        config, theme: e.tema, height: e.alto, uid: 'exp', validateConfig: true,
        viewTypes: VISTAS, fileTypes: FICHEROS, jointFileTypes: [], coordinationTypes: COORDINACION, asyncFunctions: FUNCIONES,
        remountOnUidChange: true,
      }))
      // las URL de la config anterior se liberan cuando la nueva ya está pedida
      setTimeout(() => { for (const u of urls) URL.revokeObjectURL(u); urls = nuevas }, 4000)
    },
    desmonta() { vigia.disconnect(); raiz.unmount(); libera() },
  }
}
