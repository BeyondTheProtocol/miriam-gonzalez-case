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
  cellByCell: e('cell_by_cell', 'celula-a-celula'),
  story: e('story', 'historia'),
  videos: e('videos', 'videos'),
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
// La más nueva primero (Miriam, 17-oct-2026): ordena /herramientas, el menú, el pie y la banda de
// la home. Orden por fecha de estreno de cada página (primer commit en main): célula a célula
// 16-oct · datos 24-sep 20:13 · reservorio 24-sep 19:20 · lesiones 19-sep · biopsia 5-sep · mapa 11-jun.
// Una herramienta nueva entra al PRINCIPIO de esta lista.
export const HERRAMIENTAS: EnlaceNav[] = [NAV.cellByCell, NAV.data, NAV.port, NAV.lesions, NAV.boneBiopsy, NAV.map]

// Icono de cada herramienta (decorativo, aria-hidden) para las tarjetas de /herramientas.
// Son los que la web ya usaba para cada una: el pin del teaser de la home y de /ciencia
// (mapa), el microscopio de /ciencia (biopsia), el cubo y la gráfica de /links (lesiones,
// datos). El reservorio no tenía ninguno: la jeringa es elección de este PR.
export const ICONO_HERRAMIENTA: Record<string, string> = {
  data: 'ph:chart-line-fill',
  lesions: 'ph:cube-fill',
  map: 'ph:map-pin-fill',
  // Un catéter que acaba en la cámara del port (diseno, 14-oct): una jeringa se leía como «inyección».
  port: 'ph:path-fill',
  bone_biopsy: 'ph:microscope-fill',
  // Tres círculos: tres células. Distinto del microscopio de la biopsia (corte de tejido): aquí no se mira un corte, se cuentan células.
  cell_by_cell: 'ph:circles-three-fill',
}

// Pie: tres columnas por intención (`heading` es la clave i18n de su título).
export const PIE: { id: string; heading: string; enlaces: EnlaceNav[] }[] = [
  { id: 'caso', heading: 'footer.group_case', enlaces: [NAV.science, NAV.evidence, NAV.story, NAV.videos, NAV.timeline, NAV.team] },
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
  tools: ['herramientas', 'datos', 'lesiones', 'mapa-metastasis', 'reservorio', 'biopsia-osea', 'celula-a-celula'],
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

// Copia LITERAL del H1 y de la meta-description de cada herramienta (el fichero va al
// lado). La usan el índice /herramientas y el teaser de la home. Si una de esas páginas
// cambia su título o su descripción, se cambia también aquí.
export const COPY_HERRAMIENTAS: Record<string, { es: [string, string]; en: [string, string] }> = {
  // app/pages/datos.vue
  data: {
    es: ['El caso en datos', 'El caso de Miriam para quien pueda moverlo: su evolución clínica de un vistazo, las analíticas desde 2021 y qué tejido existe y dónde. Cada cifra con su fuente.'],
    en: ['The case in data', 'Miriam’s case for whoever can move it forward: her clinical course at a glance, labs since 2021 and what tissue exists and where. Every number with its source.'],
  },
  // app/pages/lesiones.vue
  lesions: {
    es: ['Mama, hígado y hueso, de un vistazo', 'Una herramienta de apoyo, no un diagnóstico. La mama, el hígado y las lesiones óseas de Miriam, en una sola página.'],
    en: ['Breast, liver and bone, at a glance', 'A support tool, not a diagnosis. Miriam’s breast, liver and bone lesions, on a single page.'],
  },
  // app/pages/mapa-metastasis.vue
  map: {
    es: ['Mapa de metástasis', 'Una herramienta de apoyo, no un diagnóstico. Las lesiones óseas de Miriam vistas con PET doble trazador (Galio-68 DOTATOC y FDG) sobre sus propios informes, para ayudarle a decidir con su equipo médico.'],
    en: ['Metastasis map', 'A support tool, not a diagnosis. Miriam’s bone lesions seen with dual-tracer PET (Gallium-68 DOTATOC and FDG) over her own reports, to help her decide the next steps with her medical team.'],
  },
  // app/pages/reservorio.vue
  port: {
    es: ['El reservorio: qué es y qué le pasa', 'Qué es un port-a-cath, por qué el de Miriam (un PowerPort) está diseñado para admitir contraste inyectado a presión y por qué ahora deja meter medicación pero no sacar sangre. Con el trayecto del catéter en 3D.'],
    en: ['The port: what it is and what’s wrong with it', 'What a port-a-cath is, why Miriam’s (a PowerPort) is built to take contrast injected under pressure, and why it now lets medication in but no blood out. With the catheter path in 3D.'],
  },
  // app/pages/biopsia-osea.vue
  bone_biopsy: {
    es: ['Lo que se puede medir en mi biopsia ósea', 'Lo que un corte de histología puede decir y lo que no. La biopsia ósea de Miriam, calibrada con su propia barra de 100 µm, con los límites de la imagen dichos tan claro como las medidas.'],
    en: ['What can be measured in my bone biopsy', 'What a histology slide can and cannot tell you. Miriam’s own bone biopsy, calibrated against its 100 µm scale bar, with the limits of the image stated as plainly as the measurements.'],
  },
  // app/pages/celula-a-celula.vue
  cell_by_cell: {
    es: ['Célula a célula', 'Un análisis de célula única sobre dos muestras del tumor de Miriam: qué es, qué preguntas puede contestar, qué no puede decir y los primeros resultados.'],
    en: ['Cell by cell', 'A single-cell analysis of two of Miriam’s tumor samples: what it is, which questions it can answer, what it cannot say and the first results.'],
  },
}

/** [título, descripción] publicados de la herramienta `key`, en el idioma dado. */
export function copyHerramienta(key: string, locale: string): [string, string] {
  return COPY_HERRAMIENTAS[key]![locale === 'en' ? 'en' : 'es']
}
