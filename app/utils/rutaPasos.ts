/**
 * La ruta a una terapia personalizada: 5 pasos y el ESTADO real de cada uno. Fuente única para
 * /ciencia (RutaPersonalizada) y la home (HomeProximosPasos), para que no puedan contar cosas
 * distintas. Los textos viven en i18n (`ciencia.ruta.pasos.<key>`); aquí solo el estado.
 * Cambiar un estado = cambiar una línea, y cotejarlo antes con la fuente de verdad del caso.
 */
import { insigniaDe } from './estadoInsignia'

export type EstadoRuta = 'hecho' | 'curso' | 'pendiente' | 'abierto'

export const RUTA_PASOS: { key: string, estado: EstadoRuta, icono: string }[] = [
  { key: 'tejido', estado: 'hecho', icono: 'ph:flask-fill' },
  { key: 'leer', estado: 'curso', icono: 'ph:dna-fill' },
  { key: 'dianas', estado: 'pendiente', icono: 'ph:crosshair-fill' },
  { key: 'disenar', estado: 'pendiente', icono: 'ph:syringe-fill' },
  { key: 'llegar', estado: 'abierto', icono: 'ph:globe-hemisphere-west-fill' },
]

// Sistema v3 (P1): la insignia de cada paso es la del mapa ÚNICO de estados (utils/estadoInsignia.ts): hecho, en curso, pendiente y
// «abierto» (que pide atención), todos con icono y palabra y sin hex. Antes eran cuatro variantes viejas de .status-badge con hex y 10 px.
export const BADGE_RUTA: Record<EstadoRuta, string> = {
  hecho: insigniaDe('hecho'),
  curso: insigniaDe('curso'),
  pendiente: insigniaDe('pendiente'),
  abierto: insigniaDe('abierto'),
}

/** Solo los `hecho` cuentan como pasos dados; `curso` se cuenta aparte y no suma. */
export function resumenRuta(pasos: { estado: EstadoRuta }[] = RUTA_PASOS) {
  return {
    hechos: pasos.filter((p) => p.estado === 'hecho').length,
    curso: pasos.filter((p) => p.estado === 'curso').length,
    total: pasos.length,
  }
}
