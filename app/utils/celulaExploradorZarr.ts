/**
 * Nivel «todos los genes»: lee el AnnData-Zarr de una lesión GEN A GEN, sin bajar la matriz entera.
 *
 * X va en csc_matrix (Zarr v2, contrato de Polaris `escribe_zarr_lesion`): la columna de un gen es el tramo
 * indptr[j]..indptr[j+1] de `indices` y `data`, así que pedir un gen baja uno o dos trozos. Los valores son CP10k
 * a 3 cifras, los mismos que `expr` del JSON (lo coteja el test). `var` trae el suelo ambiental por grupo, la
 * referencia emparejada y las sondas de cada gen; `uns.genes_sin_sonda`, los que no tienen sonda en este modo.
 *
 * Solo se usa si `nivelMatriz` lo permite (publicar todos los genes es publicar la matriz completa).
 */
import * as zarr from 'zarrita'

export interface ZarrLesion {
  genes: string[]
  sinSonda: Set<string>
  tiene(gen: string): boolean
  sueloDe(gen: string): Record<string, number>
  refDe(gen: string): number
  sondasDe(gen: string): [number, number]
  columna(gen: string): Promise<Float32Array>
}

type Leible = Parameters<typeof zarr.root>[0]

export async function abreZarr(store: Leible, n: number, grupos: string[]): Promise<ZarrLesion> {
  const root = zarr.root(store)
  const arr = (p: string) => zarr.open(root.resolve(p), { kind: 'array' })
  const todo = async (p: string) => (await zarr.get(await arr(p))).data as ArrayLike<unknown>
  const genes = Array.from(await todo('var/_index'), String)
  const indptr = Array.from(await todo('X/indptr'), Number)
  if (indptr.length !== genes.length + 1) throw new Error('X no es una csc_matrix de esta lesión')
  const [ind, dat] = await Promise.all([arr('X/indices'), arr('X/data')])
  const suelos: Record<string, ArrayLike<number>> = {}
  for (const g of grupos) suelos[g] = (await todo(`var/suelo__${g}`)) as ArrayLike<number>
  const ref = (await todo('var/referencia_emparejada')) as ArrayLike<number>
  const ns = (await todo('var/n_sondas')) as ArrayLike<number>
  const nu = (await todo('var/n_sondas_union')) as ArrayLike<number>
  let sin: string[] = []
  try { sin = Array.from(await todo('uns/genes_sin_sonda'), String) }
  catch { sin = [] }                                   // vacío: anndata puede no escribir el array
  const pos = new Map(genes.map((g, k) => [g, k]))
  const idx = (g: string) => { const j = pos.get(g); if (j === undefined) throw new Error(`${g} no está en la matriz`); return j }
  const cache = new Map<string, Float32Array>()
  return {
    genes,
    sinSonda: new Set(sin),
    tiene: (g) => pos.has(g),
    sueloDe: (g) => { const j = idx(g); return Object.fromEntries(grupos.map((x) => [x, Number(suelos[x]![j])])) },
    refDe: (g) => Number(ref[idx(g)]),
    sondasDe: (g) => { const j = idx(g); return [Number(nu[j]), Number(ns[j])] },
    async columna(g) {
      const hecho = cache.get(g)
      if (hecho) return hecho
      const j = idx(g)
      const a = indptr[j]!, b = indptr[j + 1]!
      const out = new Float32Array(n)
      if (b > a) {
        const [ii, vv] = await Promise.all([zarr.get(ind, [zarr.slice(a, b)]), zarr.get(dat, [zarr.slice(a, b)])])
        const I = ii.data as ArrayLike<number>, V = vv.data as ArrayLike<number>
        for (let k = 0; k < I.length; k++) out[Number(I[k])] = Number(V[k])
      }
      cache.set(g, out)
      return out
    },
  }
}

/** Store del navegador para el Zarr de una lesión publicado junto a la página. */
export const storeWeb = (lesion: string) => new zarr.FetchStore(new URL(`/celula/explorador/zarr/${lesion}.zarr`, window.location.origin).href)
