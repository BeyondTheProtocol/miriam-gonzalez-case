/**
 * AlphaFold en el explorador célula a célula: la estructura PREDICHA de cada proteína de «Genes de interés», como
 * información adicional del gen abierto (bloque plegado en su detalle, CelulaExplorarEstructura.client.vue). Funciones
 * puras con test (scripts/test-alphafold.ts).
 *
 * POR QUÉ AQUÍ Y NO EN UNA PÁGINA (Miriam, 20-oct-2026): lo acordado era que lo que aporta AlphaFold sea información
 * de cada proteína que sale en célula a célula; /tres-dianas (PR #311) la sacó a una página aparte y se retiró con un
 * 301 al explorador (nuxt.config.ts).
 *
 * Lo que NO hace, a propósito:
 *  · No trae cifras del caso: la expresión, el suelo y la lectura siguen en el detalle del gen, encima del bloque.
 *  · No guarda estructuras. El modelo se pide a la API pública de AlphaFold DB por su UniProt, en el navegador del
 *    visitante (CORS abierto) y solo al desplegar el bloque; así siempre es la última versión y el crédito apunta a la fuente.
 *  · Nada sobre fármacos, epítopos ni si una proteína se puede atacar: describe la forma, no concluye.
 *
 * Gen fuera de UNIPROT = sin bloque. Los diez UniProt se cotejaron el 20-oct-2026 contra UniProt REST (Swiss-Prot,
 * humano, gene_exact) y los diez tienen modelo v6 en AlphaFold DB (CC BY 4.0).
 */

/** Gen del explorador → UniProt de su proteína (Swiss-Prot, Homo sapiens). Las diez de PANEL_INTERES, ni una más. */
export const UNIPROT: Readonly<Record<string, string>> = {
  ANKRD30A: 'Q9BXX3', TPBG: 'Q13641', ERBB3: 'P21860', SLC39A6: 'Q13433', ERBB2: 'P04626',
  TACSTD2: 'P09758', CD276: 'Q5ZPR3', NECTIN4: 'Q96NY8', MUC1: 'P15941', FGFR1: 'P11362',
}
export const uniprotDe = (gen: string): string | null => UNIPROT[gen] ?? null

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
  alta: { es: 'Alta (70–90)', en: 'High (70–90)' },   // «High», como el visor de AlphaFold DB hoy (verificacion, 20-oct)
  baja: { es: 'Baja (50–70)', en: 'Low (50–70)' },
  muy_baja: { es: 'Muy baja (< 50)', en: 'Very low (< 50)' },
}

/** Parte de los aminoácidos con confianza muy baja (pLDDT < 50), de 0 a 1: la línea de la vista previa (verificacion, 21-oct). */
export function fraccionMuyBaja(plddt: ArrayLike<number>): number {
  if (!plddt.length) return 0
  let k = 0
  for (let i = 0; i < plddt.length; i++) if (banda(plddt[i]!) === 'muy_baja') k++
  return k / plddt.length
}
/** Aviso fuerte de la vista previa: más de la mitad en confianza muy baja. El umbral es NUESTRO: la FAQ de AlphaFold DB
 * solo dice que lo < 50 no se interpreta, no da regla por proteína (verificacion, 21-oct). Con la v6, MUC1 (0,71) y
 * ANKRD30A (0,523); SLC39A6 se queda en 0,461 y lleva solo la línea. */
export const UMBRAL_AVISO = 0.5
export const avisoConfianza = (fraccion: number) => fraccion > UMBRAL_AVISO

/** Centro y radio de la traza, para encuadrar la cámara. */
export function encuadre(t: Traza): { centro: [number, number, number]; radio: number } {
  if (!t.n) return { centro: [0, 0, 0], radio: 1 }
  const c = [0, 0, 0] as [number, number, number]
  for (let i = 0; i < t.n; i++) for (let k = 0; k < 3; k++) c[k] += t.xyz[3 * i + k]! / t.n
  let r = 0
  for (let i = 0; i < t.n; i++) r = Math.max(r, Math.hypot(t.xyz[3 * i]! - c[0], t.xyz[3 * i + 1]! - c[1], t.xyz[3 * i + 2]! - c[2]))
  return { centro: c, radio: r || 1 }
}
