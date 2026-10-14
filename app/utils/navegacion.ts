/**
 * Fuente única de la navegación del sitio (dictamen `diseno`, 14-oct-2026).
 *
 * La leen el menú (SiteNav), el pie (SiteFooter) y el índice de herramientas
 * (/herramientas). Cada enlace lleva:
 * · `key`  → la etiqueta (`nav.<key>` en i18n) y el valor `destino` del evento
 *            «Navegar» de Umami. Es la misma en ES y EN, así que suman juntos.
 * · `name` → el nombre BASE de la ruta (sin el sufijo `___es`/`___en` que añade
 *            i18n). Se navega por nombre, nunca por path escrito a mano, y así
 *            funciona igual en /lesiones y en /en/lesiones.
 */

export interface EnlaceNav {
  key: string
  name: string
}

const e = (key: string, name: string): EnlaceNav => ({ key, name })

// Enlaces del sitio, una sola vez.
export const NAV = {
  home: e('home', 'index'),
  science: e('science', 'ciencia'),
  evidence: e('evidence', 'ciencia-evidencia'),
  tools: e('tools', 'herramientas'),
  allTools: e('all_tools', 'herramientas'),
  data: e('data', 'datos'),
  lesions: e('lesions', 'lesiones'),
  map: e('map', 'mapa-metastasis'),
  port: e('port', 'reservorio'),
  boneBiopsy: e('bone_biopsy', 'biopsia-osea'),
  story: e('story', 'historia'),
  timeline: e('timeline', 'timeline'),
  team: e('team', 'equipo'),
  collaborate: e('collaborate', 'colabora'),
  press: e('press', 'prensa'),
  brands: e('brands', 'marcas'),
  expenses: e('expenses', 'gastos'),
  contact: e('contact', 'contacto'),
} as const

// Menú principal. En escritorio no va «Inicio»: el logo ya lleva a la home y así
// cabe «Herramientas» a 1024 px. En móvil sí va, el primero.
export const MENU_ESCRITORIO: EnlaceNav[] = [NAV.science, NAV.tools, NAV.timeline, NAV.team, NAV.collaborate]
export const MENU_MOVIL: EnlaceNav[] = [NAV.home, ...MENU_ESCRITORIO]

// Las herramientas, en el orden del índice y del pie.
export const HERRAMIENTAS: EnlaceNav[] = [NAV.data, NAV.lesions, NAV.map, NAV.port, NAV.boneBiopsy]

// Pie: tres columnas por intención (`heading` es la clave i18n de su título).
export const PIE: { id: string; heading: string; enlaces: EnlaceNav[] }[] = [
  { id: 'caso', heading: 'footer.group_case', enlaces: [NAV.science, NAV.evidence, NAV.story, NAV.timeline, NAV.team] },
  { id: 'herramientas', heading: 'footer.group_tools', enlaces: [NAV.allTools, ...HERRAMIENTAS] },
  { id: 'participa', heading: 'footer.group_involved', enlaces: [NAV.collaborate, NAV.press, NAV.brands, NAV.expenses, NAV.contact] },
]

// Estado activo del menú: qué rutas cuelgan de cada ítem. La primera de cada lista
// es la raíz de la sección (allí el ítem lleva aria-current="page"); en las demás,
// aria-current="true" y el mismo estilo activo. Por nombre de ruta y no por prefijo
// de path, porque las herramientas no cuelgan de la URL /herramientas.
export const SECCIONES: Record<string, string[]> = {
  home: ['index'],
  science: ['ciencia', 'ciencia-evidencia', 'ciencia-slug'],
  tools: ['herramientas', 'datos', 'lesiones', 'mapa-metastasis', 'reservorio', 'biopsia-osea'],
  timeline: ['timeline', 'historia', 'historia-slug'],
  team: ['equipo'],
  collaborate: ['colabora', 'prensa', 'marcas', 'gastos', 'contacto'],
}

/** aria-current del ítem `key` estando en la ruta de nombre base `actual`. */
export function ariaCurrentSeccion(key: string, actual: string | undefined): 'page' | 'true' | undefined {
  const rutas = SECCIONES[key]
  if (!rutas || !actual) return undefined
  if (actual === rutas[0]) return 'page'
  return rutas.includes(actual) ? 'true' : undefined
}
