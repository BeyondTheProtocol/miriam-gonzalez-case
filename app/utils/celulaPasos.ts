/**
 * Próximos pasos de /celula-a-celula: la ruta del análisis hacia la terapia personalizada, como pasos con
 * estado. Los datos viven en public/celula/pasos.json (Polaris solo cambia `estado` cuando cambia de
 * verdad). Funciones puras y con test (scripts/test-celula-pasos.ts).
 *
 * CONTRATO PARA QUIEN EDITE EL JSON:
 *  · public/ se sirve tal cual y la preview de Netlify también es pública: nada de fuentes, rutas de
 *    Polaris, fechas de citas, lugares, nombres de personas ni de centros. Solo el estado.
 *  · Un paso incierto es `pendiente`, nunca `en_curso`. `en_curso` es solo para lo que se sabe en marcha.
 *  · La barra cuenta pasos `hecho` sobre el total de ESTA lista. No mide distancia a ninguna meta médica.
 */
export type EstadoPaso = 'hecho' | 'en_curso' | 'pendiente'
export const ESTADOS_PASO: EstadoPaso[] = ['hecho', 'en_curso', 'pendiente']
export type Bilingue = { es: string, en: string }
export interface Paso {
  id: string
  estado: EstadoPaso
  titulo: Bilingue
  detalle: Bilingue
  /** Clave opcional del glosario de la página (app/utils/celulaGlosario.ts). */
  termino?: string
}
export interface PasosJson { version: number, actualizado: string, pasos: Paso[] }

export interface ResumenPasos { hechos: number, enCurso: number, pendientes: number, total: number }

/** Solo los `hecho` cuentan para la barra; `en_curso` se muestra pero no suma. */
export function resumenPasos(pasos: Pick<Paso, 'estado'>[]): ResumenPasos {
  const n = (e: EstadoPaso) => pasos.filter((p) => p.estado === e).length
  return { hechos: n('hecho'), enCurso: n('en_curso'), pendientes: n('pendiente'), total: pasos.length }
}

/** «3 de 8 pasos dados»: el mismo texto para la vista y para el lector de pantalla. */
export function textoProgreso(r: Pick<ResumenPasos, 'hechos' | 'total'>, lang: 'es' | 'en'): string {
  if (lang === 'en') return `${r.hechos} of ${r.total} ${r.total === 1 ? 'step' : 'steps'} taken`
  return `${r.hechos} de ${r.total} ${r.total === 1 ? 'paso dado' : 'pasos dados'}`
}

const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
/** `actualizado` (AAAA-MM-DD) en lenguaje llano. */
export function fechaActualizado(iso: string, lang: 'es' | 'en'): string {
  const [a, m, d] = iso.split('-').map(Number) as [number, number, number]
  return lang === 'en' ? `${d} ${MESES.en[m - 1]} ${a}` : `${d} de ${MESES.es[m - 1]} de ${a}`
}
