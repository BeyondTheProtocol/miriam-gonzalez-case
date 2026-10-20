/**
 * «Tres dianas, dos mapas» (/tres-dianas · EN /three-targets): para cada diana, la estructura PREDICHA de AlphaFold DB
 * y, a su lado, dónde se lee su ARN en el mapa de células ya publicado (/celula-a-celula/explorar). Funciones puras con
 * test (scripts/test-tres-dianas.ts).
 *
 * Lo que NO hace, a propósito:
 *  · No trae cifras. El mapa marca las células con al menos una molécula del gen (lo mismo que pinta el explorador en
 *    su modo gen) y la lectura es la del fichero publicado, con las etiquetas del explorador. Los porcentajes, el suelo
 *    ambiental y la referencia viven en el explorador, a un clic (enlace profundo ?gen=&biopsia=).
 *  · No guarda estructuras. El modelo se pide a la API pública de AlphaFold DB por su UniProt, en el navegador del
 *    visitante (CORS abierto); así siempre es la última versión del modelo y el crédito apunta a la fuente.
 *  · La puerta es la del explorador (useCelulaExplorador): con la puerta cerrada, sin mapa ni lectura.
 *
 * Diana fuera de esta lista = no sale. Las tres pasaron el paso 0 de `verificacion` (20-oct-2026): expresión ya pública
 * en el explorador (manifiesto verificado, ok_titular) y modelo de AlphaFold DB con licencia CC BY 4.0.
 */

export interface Diana {
  /** símbolo del gen, la clave del fichero del explorador */
  gen: string
  /** nombre de la proteína con el que se la conoce */
  proteina: string
  uniprot: string
  /** qué es, en una línea, sin promesas terapéuticas */
  que: { es: string; en: string }
}

export const DIANAS: readonly Diana[] = [
  { gen: 'ERBB2', proteina: 'HER2', uniprot: 'P04626', que: { es: 'Receptor de la membrana de la familia EGFR.', en: 'A membrane receptor of the EGFR family.' } },
  { gen: 'TACSTD2', proteina: 'TROP2', uniprot: 'P09758', que: { es: 'Glicoproteína de la superficie de las células epiteliales.', en: 'A surface glycoprotein of epithelial cells.' } },
  { gen: 'CD276', proteina: 'B7-H3', uniprot: 'Q5ZPR3', que: { es: 'Proteína de la familia B7, en la superficie celular.', en: 'A B7-family protein on the cell surface.' } },
] as const

const RE_UNIPROT = /^[OPQ][0-9][A-Z0-9]{3}[0-9]$|^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/
export const uniprotValido = (u: string) => RE_UNIPROT.test(u)

/** API pública de AlphaFold DB (devuelve una lista con pdbUrl, cifUrl, latestVersion…). */
export const urlApiAlphaFold = (uniprot: string) => `https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(uniprot)}`
/** Página pública de la entrada (el enlace del crédito). */
export const urlEntradaAlphaFold = (uniprot: string) => `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(uniprot)}`
export const urlUniprot = (uniprot: string) => `https://www.uniprot.org/uniprotkb/${encodeURIComponent(uniprot)}/entry`

/** Del JSON de la API, la URL del PDB, solo si es de AlphaFold DB, de ESE UniProt y por https. Si no, null. */
export function pdbDeRespuesta(r: unknown, uniprot: string): { url: string; version: number | null } | null {
  if (!Array.isArray(r)) return null
  const e = r.find((x) => x && typeof x === 'object' && (x as { uniprotAccession?: unknown }).uniprotAccession === uniprot) as
    | { pdbUrl?: unknown; latestVersion?: unknown } | undefined
  if (!e || typeof e.pdbUrl !== 'string') return null
  let u: URL
  try { u = new URL(e.pdbUrl) }
  catch { return null }
  if (u.protocol !== 'https:' || u.hostname !== 'alphafold.ebi.ac.uk' || !u.pathname.startsWith(`/files/AF-${uniprot}-`)) return null
  return { url: u.toString(), version: typeof e.latestVersion === 'number' ? e.latestVersion : null }
}

export interface Traza { xyz: Float32Array; plddt: Float32Array; n: number }
/** Carbonos alfa (columnas fijas del formato PDB) y su pLDDT, que AlphaFold guarda en la columna del factor B. */
export function trazaCA(pdb: string): Traza {
  const xs: number[] = [], ps: number[] = []
  let ultimo = ''
  for (const linea of pdb.split('\n')) {
    if (!linea.startsWith('ATOM') || linea.slice(12, 16).trim() !== 'CA') continue
    const res = linea.slice(21, 27)   // cadena + número + código de inserción: un CA por residuo
    if (res === ultimo) continue
    ultimo = res
    const x = Number(linea.slice(30, 38)), y = Number(linea.slice(38, 46)), z = Number(linea.slice(46, 54)), b = Number(linea.slice(60, 66))
    if (![x, y, z, b].every(Number.isFinite)) continue
    xs.push(x, y, z); ps.push(b)
  }
  return { xyz: new Float32Array(xs), plddt: new Float32Array(ps), n: ps.length }
}

/** Bandas de confianza de AlphaFold DB (las de su web): muy alta > 90, alta 70-90, baja 50-70, muy baja < 50. */
export type Banda = 'muy_alta' | 'alta' | 'baja' | 'muy_baja'
export const BANDAS: readonly Banda[] = ['muy_alta', 'alta', 'baja', 'muy_baja']
export const banda = (p: number): Banda => (p > 90 ? 'muy_alta' : p > 70 ? 'alta' : p > 50 ? 'baja' : 'muy_baja')
export const ETIQUETA_BANDA: Record<Banda, { es: string; en: string }> = {
  muy_alta: { es: 'Muy alta (> 90)', en: 'Very high (> 90)' },
  alta: { es: 'Alta (70–90)', en: 'Confident (70–90)' },
  baja: { es: 'Baja (50–70)', en: 'Low (50–70)' },
  muy_baja: { es: 'Muy baja (< 50)', en: 'Very low (< 50)' },
}

/** Centro y radio de la traza, para encuadrar la cámara. */
export function encuadre(t: Traza): { centro: [number, number, number]; radio: number } {
  if (!t.n) return { centro: [0, 0, 0], radio: 1 }
  const c = [0, 0, 0] as [number, number, number]
  for (let i = 0; i < t.n; i++) for (let k = 0; k < 3; k++) c[k] += t.xyz[3 * i + k]! / t.n
  let r = 0
  for (let i = 0; i < t.n; i++) r = Math.max(r, Math.hypot(t.xyz[3 * i]! - c[0], t.xyz[3 * i + 1]! - c[1], t.xyz[3 * i + 2]! - c[2]))
  return { centro: c, radio: r || 1 }
}

/** Índices de las células donde el explorador lee el gen (≥ 1 molécula): lo que su modo gen pinta fuera del gris. */
export function detectadas(expr: Record<string, { i: number[]; v: number[] }> | undefined, gen: string): number[] {
  const e = expr?.[gen]
  if (!e || !Array.isArray(e.i)) return []
  return e.i.filter((k, j) => Number.isInteger(k) && k >= 0 && (e.v[j] ?? 0) > 0)
}

/** Enlace profundo al explorador con el gen y la biopsia (los lee su URL desde el 19-oct). */
export const queryExplorador = (gen: string, biopsia: 'higado' | 'hueso') => ({ gen, biopsia })
