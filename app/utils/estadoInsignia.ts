/**
 * UN solo mapa de estado a insignia para todo el sitio (sistema v3, S4).
 *
 * Hoy hay dos: la ruta de la home pinta «en curso» en violeta (BADGE_RUTA en rutaPasos.ts) y /celula-a-celula lo pinta
 * en melocotón (CelulaProximosPasos): dos colores para el mismo estado. Aquí cada estado de proceso cae en uno de los
 * cinco estados del sistema (--estado-* en btp-tokens.css), que llevan icono y palabra además de color.
 *
 * Los nombres de entrada son los que ya existen en el código (utils/rutaPasos.ts y utils/celulaPasos.ts); la salida es el
 * modificador de .status-badge: `status-badge--hecho|curso|pendiente|nopuede|atencion`.
 */
export type EstadoSistema = 'hecho' | 'curso' | 'pendiente' | 'nopuede' | 'atencion'

export const ESTADO_A_SISTEMA: Record<string, EstadoSistema> = {
  hecho: 'hecho',
  curso: 'curso',
  en_curso: 'curso',
  pendiente: 'pendiente',
  /** «abierto»: falta una decisión o un hueco por cubrir; pide atención, no es «en curso» */
  abierto: 'atencion',
  atencion: 'atencion',
  /** no puede hacerse (todavía): se dice, no se esconde */
  nopuede: 'nopuede',
  bloqueado: 'nopuede',
}

/** Clase de .status-badge para un estado de proceso. Un estado desconocido cae en `pendiente` (neutro), nunca en `hecho`. */
export function insigniaDe(estado: string): string {
  return `status-badge--${ESTADO_A_SISTEMA[estado] ?? 'pendiente'}`
}

/** Cuenta cuántos pasos están hechos (solo `hecho` suma; `curso` no). */
export function pasosHechos(pasos: { estado: string }[]): number {
  return pasos.filter((p) => ESTADO_A_SISTEMA[p.estado] === 'hecho').length
}

/** Un paso de <RutaPasos>: su estado es el de proceso (hecho, curso, abierto…), no el del sistema. */
export interface PasoRuta {
  id: string
  titulo: string
  estado: string
  detalle?: string
  /** icono de Phosphor (decorativo) */
  icono?: string
}
