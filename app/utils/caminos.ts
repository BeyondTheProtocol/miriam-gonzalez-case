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

export type Acceso =
  | { tipo: 'herramienta'; enlace: EnlaceNav }
  | { tipo: 'contacto'; rol: 'oncologist' | 'researcher'; etiqueta: 'nav.contact' }
  | { tipo: 'externo'; href: string; etiqueta: string }

export type CaminoConAccesos = 'clinician' | 'research'

const h = (enlace: EnlaceNav): Acceso => ({ tipo: 'herramienta', enlace })

// Clínica: datos → lesiones → contacto. «Mama, hígado y hueso» y no el mapa (comité médico, 20-oct, y
// decisión de Miriam al aprobar el plan): el mapa sale de estudios de marzo a junio de 2026; /lesiones,
// de la imagen del 8-sep. El mapa sigue en la banda, en /ciencia y en /caso.
// Single-cell: explorador → datos (qué tejido, cuándo, con qué tratamiento) → biopsia ósea.
export const ACCESOS: Record<CaminoConAccesos, Acceso[]> = {
  clinician: [h(NAV.data), h(NAV.lesions), { tipo: 'contacto', rol: 'oncologist', etiqueta: 'nav.contact' }],
  research: [h(NAV.cellExplorer), h(NAV.data), h(NAV.boneBiopsy)],
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
