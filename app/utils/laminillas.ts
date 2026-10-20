/**
 * Visor /laminillas: tipos del manifest (app/data/laminillas.json) y las reglas que salen de él.
 *
 * El manifest es la única fuente. Para añadir una columna (p. ej. «Hueso · Zúrich») basta con
 * añadir una entrada a `muestras` y sus laminillas: la matriz, el orden de filas, el paneo y la
 * HE de referencia se recalculan solos. Nada de esto conoce los ids de muestra.
 *
 * Paneo: dos laminillas de la misma muestra o de muestras con el mismo `grupo_paneo` (mismo
 * bloque de tejido) mueven el paneo juntas; de grupos distintos, el paneo es libre. El zoom se
 * sincroniza siempre en unidades físicas (µm por píxel de pantalla), con el µm/px de cada escáner.
 */

export type Idioma = 'es' | 'en'
export type Texto = Record<Idioma, string>
export type Sello = 'verificado' | 'inferido' | 'sin-verificar'

export interface Muestra {
  id: string
  corto: Texto
  largo: Texto
  grupo_paneo: string
  escaner: string
  mpp: number
  aumento: string
  /** Texto corto de procedencia de la columna, apto para público (sin siglas ni números de bloque). */
  nota?: Texto
}

export interface Marcador {
  id: string
  nombre: Texto
  /** Aclaración visible junto al nombre (p. ej. «SNF = sinaptofisina, inferido»). */
  nota?: Texto
}

export interface Ficha {
  laboratorio: Texto | null
  fecha: Texto | null
  resultado: Texto | null
  fuente: Texto | null
  sello: Sello
  nota?: Texto
}

export interface Laminilla {
  id: string
  muestra: string
  marcador: string
  /** Rótulo del corte cuando una muestra tiene más de una del mismo marcador («corte 1»). */
  variante?: Texto
  dzi: string
  ancho: number
  alto: number
  mpp: number
  miniatura: string
  ficha: Ficha
}

export interface Manifest {
  version: number
  /** Raíz pública de las teselas (bucket). Cada `dzi` es relativo a ella. */
  teselas: string
  tile: number
  overlap: number
  muestras: Muestra[]
  marcadores: Marcador[]
  laminillas: Laminilla[]
}

export interface Fila {
  marcador: Marcador
  /** Laminillas de la fila por id de muestra (una muestra puede tener varias del mismo marcador). */
  celdas: Record<string, Laminilla[]>
  /** Número de muestras con al menos una laminilla. */
  n: number
}

/**
 * Filas de la matriz. Primero las que están en TODAS las columnas, después las que están en más
 * de una, y al final las de una sola; dentro de cada bloque, el orden de `marcadores`.
 */
export function filas(m: Manifest): Fila[] {
  const out: Fila[] = m.marcadores.map((marcador) => {
    const celdas: Record<string, Laminilla[]> = {}
    for (const l of m.laminillas) {
      if (l.marcador !== marcador.id) continue
      ;(celdas[l.muestra] ??= []).push(l)
    }
    return { marcador, celdas, n: Object.keys(celdas).length }
  }).filter((f) => f.n > 0)
  const orden = new Map(m.marcadores.map((x, i) => [x.id, i]))
  return out.sort((a, b) => (b.n - a.n) || ((orden.get(a.marcador.id) ?? 0) - (orden.get(b.marcador.id) ?? 0)))
}

/** La HE de referencia de una muestra: la primera laminilla de HE que tenga. */
export function heDe(m: Manifest, muestra: string): Laminilla | undefined {
  return m.laminillas.find((l) => l.muestra === muestra && l.marcador === 'he')
}

/** Todas las laminillas de una muestra en el orden de las filas (para recorrer la columna). */
export function deMuestra(m: Manifest, muestra: string): Laminilla[] {
  return filas(m).flatMap((f) => f.celdas[muestra] ?? [])
}

export function grupoPaneo(m: Manifest, muestra: string): string {
  return m.muestras.find((x) => x.id === muestra)?.grupo_paneo ?? muestra
}

/** Longitud «redonda» (1, 2 o 5 × 10ⁿ µm) que ocupa entre `min` y `max` px a esta escala. */
export function reglaRedonda(umPorPx: number, idioma: Idioma = 'es', min = 64, max = 160): { um: number; px: number; texto: string } {
  const objetivo = umPorPx * ((min + max) / 2)
  const p = 10 ** Math.floor(Math.log10(objetivo))
  let um = p
  for (const k of [1, 2, 5, 10]) {
    if (k * p / umPorPx <= max) um = k * p
  }
  const loc = idioma === 'en' ? 'en-US' : 'es-ES'
  const texto = um >= 1000 ? `${(um / 1000).toLocaleString(loc)} mm` : `${um.toLocaleString(loc)} µm`
  return { um, px: um / umPorPx, texto }
}

/** Fuente DZI en línea para OpenSeadragon: así no hace falta pedir el .dzi (ni CORS para él). */
export function fuenteDzi(m: Manifest, l: Laminilla, base = m.teselas) {
  return {
    Image: {
      xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
      Url: base + l.dzi.replace(/\.dzi$/, '_files/'),
      Format: 'jpg',
      Overlap: String(m.overlap),
      TileSize: String(m.tile),
      Size: { Width: String(l.ancho), Height: String(l.alto) },
    },
  }
}
