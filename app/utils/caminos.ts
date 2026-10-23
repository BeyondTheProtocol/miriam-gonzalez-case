/**
 * Accesos directos de «Elige tu camino» (Miriam, 20-oct-2026: «en la home la gente sepa qué mirar…
 * acceso directo a las diferentes herramientas porque /ciencia es muy largo»). Plan aprobado el
 * 20-oct, con diseño, comité médico, voz, verificación y técnico.
 *
 * Fuente única: el componente (VisitorPathways → PathwayAccesos) y el test (scripts/test-caminos.ts)
 * leen esto. Import relativo para que `tsx` lo cargue sin el alias `~`.
 *
 * Reglas (las comprueba el test):
 * · De 1 a 3 accesos por camino; más de 3 recrea el «me pierdo» que se quiere quitar.
 * · Los rótulos son textos YA publicados: `nav.*` para herramientas y contacto.
 * · El explorador tiene puerta: si está cerrada, su hueco lo ocupa Célula a célula (siempre visible),
 *   para que la tarjeta de single-cell no se quede sin nada single-cell ni con un hueco.
 * · En «research», /datos nunca va primero (diseno: con clínica al lado, se alinearía con su /datos).
 */
import { NAV, type EnlaceNav } from './navegacion'

// `etiqueta` (clave i18n) solo cuando el rótulo no es el del menú: en prensa y tech el acceso es un paso
// ya publicado de la propia tarjeta, que sale de la lista de pasos y pasa a ser enlace sin cambiar el texto.
export type Acceso =
  | { tipo: 'herramienta'; enlace: EnlaceNav; etiqueta?: string }
  | { tipo: 'contacto'; rol: 'oncologist' | 'researcher'; etiqueta: 'nav.contact' }
  | { tipo: 'externo'; href: string; etiqueta: string; icono?: string }

export type CaminoConAccesos = 'clinician' | 'research' | 'press' | 'tech'

// El repo público, el mismo que enlazan el layout (schema.org) y /colabora.
export const REPO_URL = 'https://github.com/beyondtheprotocol/miriam-gonzalez-case'

const h = (enlace: EnlaceNav): Acceso => ({ tipo: 'herramienta', enlace })
// /datos se llamaba «El caso en datos» en estas tarjetas cuando el menú aún lo llamaba así; el menú pasó a «Datos» (F3) y
// aquí se conserva el rótulo publicado, con su nueva clave. La key (analítica, icono) es la de siempre.
const datos: Acceso = { tipo: 'herramienta', enlace: NAV.data, etiqueta: 'nav.data_case' }

// Clínica: datos → lesiones → contacto. «Mama, hígado y hueso» y no el mapa (comité médico, 20-oct, y
// decisión de Miriam al aprobar el plan): el mapa sale de estudios de marzo a junio de 2026; /lesiones,
// de la imagen del 8-sep. El mapa sigue en la banda y en /ciencia (/caso ya no lo abre: desde el 23-oct aterriza en «Qué buscamos»).
// Single-cell: explorador → datos (qué tejido, cuándo, con qué tratamiento) → laminillas (antes, la biopsia ósea).
// Prensa y tech (PR 2, regla de diseño «una lista, un tipo»): solo se enlaza el paso que ya nombra un
// destino que su botón no cubre. Prensa: «Datos del caso listos para citar» → /datos (prensa.vue no
// enlaza /datos). Tech: «Repo público y documentación» → el repo. Curiosos, pacientes y donar, sin
// accesos: sus pasos son acciones y sus herramientas ya están en la banda.
export const ACCESOS: Record<CaminoConAccesos, Acceso[]> = {
  clinician: [datos, h(NAV.lesions), { tipo: 'contacto', rol: 'oncologist', etiqueta: 'nav.contact' }],
  research: [h(NAV.cellExplorer), datos, h(NAV.slides)],
  press: [{ tipo: 'herramienta', enlace: NAV.data, etiqueta: 'pathways.press_acceso' }],
  // Logo de GitHub, no ph:code: este repite el icono del título de tech y no dice adónde lleva (diseno, 20-oct).
  tech: [{ tipo: 'externo', href: REPO_URL, etiqueta: 'pathways.tech_acceso', icono: 'ph:github-logo-fill' }],
}

/**
 * Accesos que se pintan para `camino`. `visible` es el de useHerramientas() (recibe el enlace, no la
 * clave): con la puerta del explorador cerrada, el explorador se cambia por Célula a célula.
 */
export function accesosDe(camino: CaminoConAccesos, visible: (e: EnlaceNav) => boolean): Acceso[] {
  return ACCESOS[camino].map((a) =>
    a.tipo === 'herramienta' && !visible(a.enlace) ? h(NAV.cellByCell) : a
  )
}

/**
 * Las cuatro puertas (rediseño de arquitectura, F3, 23-oct-2026): la taxonomía ÚNICA de «qué quiere hacer quien llega».
 * Sustituye a los dos enrutadores que había (las 7 tarjetas de la home y el selector «por perfil» del pie y de /colabora):
 * ni minutos ni pasos, un nombre y un destino. La home (F5) y /colabora (F10) las pintan; hasta entonces conviven con
 * ACCESOS, que sigue siendo la lista de la home actual.
 *
 * · `etiqueta` → clave i18n (`puertas.*`).
 * · `destino` → la campaña (`apoyo`: quien pinta resuelve GOFUNDME_URL y mide con trackSupport) o una ruta por NOMBRE, con su
 *   ancla. «Clínico o laboratorio» aterriza en «Qué buscamos» (/datos#que-buscamos), la petición concreta.
 */
export type PuertaId = 'apoyar' | 'clinico' | 'prensa' | 'otras'
export type DestinoPuerta = { tipo: 'apoyo' } | { tipo: 'ruta'; name: string; hash?: string }
export interface Puerta {
  id: PuertaId
  etiqueta: string
  destino: DestinoPuerta
}

export const PUERTAS: Puerta[] = [
  { id: 'apoyar', etiqueta: 'puertas.apoyar', destino: { tipo: 'apoyo' } },
  { id: 'clinico', etiqueta: 'puertas.clinico', destino: { tipo: 'ruta', name: 'datos', hash: '#que-buscamos' } },
  { id: 'prensa', etiqueta: 'puertas.prensa', destino: { tipo: 'ruta', name: 'prensa' } },
  { id: 'otras', etiqueta: 'puertas.otras', destino: { tipo: 'ruta', name: 'colabora' } },
]
