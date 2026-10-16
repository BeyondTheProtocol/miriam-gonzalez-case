/**
 * Resultados de /celula-a-celula (fase 2). Una sola puerta, función pura y con test
 * (scripts/test-celula-puerta.ts): un bloque se pinta SOLO si en public/celula/resultados.json
 * trae `sello: "verificado"` Y `ok_miriam: true`. Si no, no se pinta nada (ni hueco ni esqueleto).
 *
 * CONTRATO PARA QUIEN ESCRIBA EL JSON (analistas / Polaris):
 *  · public/ se sirve tal cual y la preview de Netlify también es pública, y el JSON viaja además en
 *    el JS de la web. Por eso este fichero SOLO contiene bloques ya verificados y con el OK de Miriam
 *    (o, mientras no haya ninguno, el ejemplo falso con `ejemplo: true`). Lo que está en revisión
 *    vive en Polaris, nunca aquí. El test `test:celula-puerta` falla si esto se incumple.
 *  · Todas las cifras llegan hechas: enteros por cada `por_cada` (suman `por_cada` en el censo), IC
 *    calculados por el analista. La página no redondea ni calcula nada; lo que no esté en el JSON
 *    no se muestra (test:celula-cifras).
 *  · Etiquetas de gen tal cual («TROP2»), sin guion de ancho cero ni formato.
 */

export type ClaveBloque = 'R0' | 'R1' | 'R3' | 'R4' | 'R5'
export const ORDEN_BLOQUES: ClaveBloque[] = ['R0', 'R1', 'R3', 'R4', 'R5']
export type Muestra = 'higado' | 'hueso'
export const MUESTRAS: Muestra[] = ['higado', 'hueso']
export type Categoria = 'tumoral' | 'inmune' | 'sosten' | 'otras'
export const CATEGORIAS: Categoria[] = ['tumoral', 'inmune', 'sosten', 'otras']

export interface Intervalo { n: number; n_con: number; por_100: number; ic_inf: number; ic_sup: number }
export interface Gen extends Partial<Intervalo> { gen: string; en_panel: boolean }
export interface R0 { muestras: Record<Muestra, { leidas: number; usadas: number; usadas_por_100: number; genes_mediana: number }> }
export interface R1 { muestras: Record<Muestra, { n_total: number; categorias: { clave: Categoria; n: number; por_100: number }[] }> }
export interface R3 { muestras: Record<Muestra, { n_tumorales: number; dianas: Gen[] }> }
export interface R4 { sin_sonda: string[]; muestras: Record<Muestra, { n_tumorales: number; genes: Gen[] }> }
export interface R5 {
  dianas: { gen: string; higado: Intervalo; hueso: Intervalo }[]
  cielo: Record<Muestra, { grupos: { clave: Categoria; x: number; y: number; n: number }[] }>
}
export interface Bloque<D = unknown> { sello: string; ok_miriam: boolean; ejemplo?: boolean; datos: D }
export interface Resultados {
  version: number
  ejemplo?: boolean
  por_cada: number
  ic_nivel: number
  bloques: Partial<Record<ClaveBloque, Bloque>>
}

/** Fecha de «estado» de la página: UNA fuente para Estado, Ficha y el resto del copy. */
export const CELULA_ESTADO_ISO = '2026-10-16'
const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
export function fechaEstado(lang: 'es' | 'en'): string {
  const [a, m, d] = CELULA_ESTADO_ISO.split('-').map(Number) as [number, number, number]
  return lang === 'en' ? `${d} ${MESES.en[m - 1]} ${a}` : `${d} de ${MESES.es[m - 1]} de ${a}`
}

/** La puerta. Nada más abre un bloque en producción. */
export function puertaAbierta(b: Bloque | undefined | null): boolean {
  return !!b && b.sello === 'verificado' && b.ok_miriam === true
}

const ent = (v: unknown, min = 0, max = Infinity) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
function intervaloOk(i: Partial<Intervalo> | undefined, por: number): boolean {
  return !!i && ent(i.n, 1) && ent(i.n_con, 0, i.n) && ent(i.por_100, 0, por) && ent(i.ic_inf, 0, por) && ent(i.ic_sup, 0, por)
    && i.ic_inf! <= i.por_100! && i.por_100! <= i.ic_sup!
}
function genOk(g: Gen, por: number): boolean {
  return typeof g.gen === 'string' && g.gen.length > 0 && (g.en_panel === false || intervaloOk(g, por))
}
/** Forma y coherencia de un bloque. Un bloque mal formado se oculta entero: mejor nada que algo roto. */
export function bloqueValido(k: ClaveBloque, b: Bloque, por: number): boolean {
  const d = b.datos as any
  try {
    if (k === 'R0') return MUESTRAS.every((m) => { const x = d.muestras[m]; return ent(x.leidas, 1) && ent(x.usadas, 0, x.leidas) && ent(x.usadas_por_100, 0, por) && ent(x.genes_mediana, 0) })
    if (k === 'R1') return MUESTRAS.every((m) => { const x = d.muestras[m]; const c = x.categorias; return ent(x.n_total, 1) && c.length > 0
      && c.every((q: any) => CATEGORIAS.includes(q.clave) && ent(q.n, 0, x.n_total) && ent(q.por_100, 0, por))
      && c.reduce((s: number, q: any) => s + q.por_100, 0) === por && new Set(c.map((q: any) => q.clave)).size === c.length })
    if (k === 'R3') return MUESTRAS.every((m) => { const x = d.muestras[m]; return ent(x.n_tumorales, 1) && x.dianas.length > 0 && x.dianas.every((g: Gen) => genOk(g, por)) })
    if (k === 'R4') return Array.isArray(d.sin_sonda) && MUESTRAS.every((m) => { const x = d.muestras[m]; return ent(x.n_tumorales, 1) && x.genes.length > 0 && x.genes.every((g: Gen) => genOk(g, por)) })
    if (k === 'R5') return d.dianas.length > 0 && d.dianas.every((q: any) => typeof q.gen === 'string' && intervaloOk(q.higado, por) && intervaloOk(q.hueso, por))
      && MUESTRAS.every((m) => d.cielo[m].grupos.length > 0 && d.cielo[m].grupos.every((g: any) => CATEGORIAS.includes(g.clave) && ent(g.x, 0, 100) && ent(g.y, 0, 100) && ent(g.n, 1)))
  }
  catch { return false }
  return false
}

/** Hosts donde se puede mirar el ejemplo con ?demo=1: nunca el de producción. */
export function hostPermiteDemo(host: string): boolean {
  return !/(^|\.)helpmiriam\.com$/i.test(host)
}

/**
 * Qué bloques se pintan. `demo` solo abre bloques marcados `ejemplo: true` (jamás datos reales), y el
 * llamador solo lo pasa a true en un host que no es producción.
 */
export function bloquesVisibles(res: Resultados | null | undefined, opt: { demo?: boolean } = {}): ClaveBloque[] {
  if (!res || !res.bloques) return []
  const por = res.por_cada
  return ORDEN_BLOQUES.filter((k) => {
    const b = res.bloques[k]
    if (!b || !bloqueValido(k, b, por)) return false
    return puertaAbierta(b) || (opt.demo === true && b.ejemplo === true)
  })
}

/** Cifra con miles siempre (como /datos): «1.234» en ES, «1,234» en EN. */
export function fmtN(n: number, lang: 'es' | 'en'): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.')
}
