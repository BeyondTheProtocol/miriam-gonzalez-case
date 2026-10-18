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
 *  · Solo viajan las cifras del texto aprobado por Miriam (enteros «por cada `por_cada`», o el recuento
 *    de células). R5 y R6 no llevan ningún número. La página no redondea ni calcula nada; lo que no
 *    esté en el JSON no se muestra (test:celula-cifras). Cada bloque lleva `fecha_ok` (el día del OK).
 *  · Etiquetas de gen tal cual («TROP2»), sin guion de ancho cero ni formato.
 */

export type ClaveBloque = 'R0' | 'R3' | 'R4' | 'R5' | 'R6'
/** R1 (censo de tipos de célula) NO se publica: ni está en el JSON ni existe aquí. */
export const ORDEN_BLOQUES: ClaveBloque[] = ['R0', 'R3', 'R4', 'R5', 'R6']
export type Muestra = 'higado' | 'hueso'
export const MUESTRAS: Muestra[] = ['higado', 'hueso']

/** Solo lo que dice el texto aprobado: ni IC ni medianas; el único n es el del grupo de R3 (auditoría 18-oct). Lo que no está aquí no se puede pintar. */
export interface R0 { muestras: Record<Muestra, { celulas: number; tras_qc?: number }> }
export interface Diana { gen: string; por_100: number; aprox?: boolean }
/** `n_grupo`: células del grupo en el que se mide (auditoría 18-oct: grupo seleccionado, no el tumor entero). */
export interface R3 { muestras: Record<Muestra, { n_grupo?: number; dianas: Diana[] }>; ausentes: { gen: string; por_100: number }[] }
/** `o_menos`: «en torno a N de cada 100, o menos» (linfocitos T: la cifra depende de los marcadores; auditoría 18-oct). */
export interface R4 { higado: { por_100: number; menos_de: boolean; o_menos?: boolean } }
export interface R5 { gen: string; activo: Record<Muestra, boolean> }
export interface R6 { patron: 'dispersos' }
export interface Bloque<D = unknown> { sello: string; ok_miriam: boolean; fecha_ok?: string; ejemplo?: boolean; datos: D }
export interface Resultados {
  version: number
  ejemplo?: boolean
  por_cada: number
  bloques: Partial<Record<ClaveBloque, Bloque>>
}

/** Fecha de «estado» de la página: UNA fuente para Estado, Ficha y el resto del copy. */
export const CELULA_ESTADO_ISO = '2026-10-18'
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
/** Forma y coherencia de un bloque. Un bloque mal formado se oculta entero: mejor nada que algo roto. */
export function bloqueValido(k: ClaveBloque, b: Bloque, por: number): boolean {
  const d = b.datos as any
  try {
    if (k === 'R0') return MUESTRAS.every((m) => ent(d.muestras[m].celulas, 1) && (d.muestras[m].tras_qc === undefined || ent(d.muestras[m].tras_qc, 1, d.muestras[m].celulas)))
    if (k === 'R3') return MUESTRAS.every((m) => {
      const x = d.muestras[m].dianas as Diana[]
      return ['NY-BR-1', '5T4'].every((g) => x.some((q) => q.gen === g)) && x.every((q) => typeof q.gen === 'string' && q.gen.length > 0 && ent(q.por_100, 1, por))
        && (d.muestras[m].n_grupo === undefined || ent(d.muestras[m].n_grupo, 1))
    }) && d.ausentes.length > 0 && d.ausentes.every((q: any) => typeof q.gen === 'string' && q.por_100 === 0)
    if (k === 'R4') return ent(d.higado.por_100, 1, por) && typeof d.higado.menos_de === 'boolean' && (d.higado.o_menos === undefined || typeof d.higado.o_menos === 'boolean') && !(d.higado.menos_de && d.higado.o_menos)
    if (k === 'R5') return typeof d.gen === 'string' && MUESTRAS.every((m) => d.activo[m] === true)
    if (k === 'R6') return d.patron === 'dispersos'
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
