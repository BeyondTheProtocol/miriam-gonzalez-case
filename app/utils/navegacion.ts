/**
 * Fuente única de la navegación del sitio (dictamen `diseno`, 14-oct-2026).
 *
 * La leen el menú (SiteNav), el pie (SiteFooter) y la franja de visores de /datos (#visores; el índice
 * /herramientas se fusionó ahí en el rediseño, F4). Cada enlace lleva:
 * · `key`  → la etiqueta (`nav.<key>` en i18n) y el valor `destino` del evento
 *            «Navegar» de Umami. Es la misma en ES y EN, así que suman juntos.
 * · `name` → el nombre BASE de la ruta (sin el sufijo `___es`/`___en` que añade
 *            i18n). Se navega por nombre, nunca por path escrito a mano, y así
 *            funciona igual en /lesiones y en /en/lesiones.
 * · `etiqueta` (opcional) → la clave i18n de la etiqueta cuando no es `nav.<key>`.
 *
 * Aquí viven también las redes (REDES) y los enlaces legales (LEGAL): el pie, el pie reducido de
 * /links y /gracias, los enlaces rápidos de /colabora y el schema.org del layout leen la misma lista.
 */

export interface EnlaceNav {
  key: string
  name: string
  // Clave i18n de la etiqueta cuando NO es `nav.<key>` (p. ej. el pie lleva «El caso en datos» donde el menú lleva «Datos»).
  // La key, y con ella la analítica y el icono, no cambian.
  etiqueta?: string
}

const e = (key: string, name: string): EnlaceNav => ({ key, name })

// Enlaces del sitio, una sola vez.
export const NAV = {
  home: e('home', 'index'),
  science: e('science', 'ciencia'),
  evidence: e('evidence', 'ciencia-evidencia'),
  data: e('data', 'datos'),
  lesions: e('lesions', 'lesiones'),
  map: e('map', 'mapa-metastasis'),
  slides: e('slides', 'laminillas'),
  cellByCell: e('cell_by_cell', 'celula-a-celula'),
  cellExplorer: e('cell_explorer', 'celula-a-celula-explorar'),
  timeline: e('timeline', 'timeline'),
  team: e('team', 'equipo'),
  collaborate: e('collaborate', 'colabora'),
  press: e('press', 'prensa'),
  brands: e('brands', 'marcas'),
  expenses: e('expenses', 'gastos'),
  contact: e('contact', 'contacto'),
} as const

// Menú principal (rediseño de arquitectura, F3, 23-oct-2026): cinco ítems, «Datos» donde estaba «Herramientas». /datos es
// la casa de las herramientas y de «Qué buscamos»; /herramientas se fusionó en /datos#visores en F4 (23-oct-2026). En
// escritorio no va «Inicio»: el logo ya lleva a la home. En móvil sí va, el primero.
export const MENU_ESCRITORIO: EnlaceNav[] = [NAV.science, NAV.data, NAV.timeline, NAV.team, NAV.collaborate]
export const MENU_MOVIL: EnlaceNav[] = [NAV.home, ...MENU_ESCRITORIO]

// Las herramientas, en el orden de la franja #visores de /datos y de la banda de la home (el pie lleva su propia lista,
// PIE, desde F3). El reservorio ya no es una herramienta: desde F4 es un bloque plegado de /datos (#reservorio), sin 3D.
// Orden con criterio (Miriam, 20-oct-2026: «hay que poner un orden en las herramientas»; antes iban por fecha de
// estreno): del cuerpo a la célula. Primero el caso en datos (la entrada), después la imagen (mama, hígado y hueso),
// luego el tejido (las laminillas) y la célula (célula a célula y, justo detrás, su explorador, que la página madre
// presenta).
// El mapa de metástasis (solo hueso) sale de la lista (Miriam, 21-oct-2026: «el del hueso solo lo eliminamos y
// laminillas lo dejamos»): «Mama, hígado y hueso» ya lo incluye. Desde F4 la página es un ARCHIVO («Histórico · junio
// 2026»): sigue en 200 y con noindex, sin enlaces internos, porque /lesiones lee sus focos de ella en cada build
// (#mapa-focos).
// Una herramienta nueva entra en su sitio de ese recorrido, no al principio. La que se destaca como «Lo último» en la
// home ya no es la primera de esta lista: es LO_ULTIMO (abajo). El explorador se oculta mientras su puerta no esté
// abierta (useHerramientas).
export const HERRAMIENTAS: EnlaceNav[] = [NAV.data, NAV.lesions, NAV.slides, NAV.cellByCell, NAV.cellExplorer]

// La herramienta que la home destaca en grande con la etiqueta «Lo último». Tiene que ser la misma que anuncia la
// barra global «LO ÚLTIMO» (la última entrada de la cronología): hoy, célula a célula. Cuando se anuncie otra, se
// cambia aquí y en la cronología a la vez.
export const LO_ULTIMO: EnlaceNav = NAV.cellByCell

// Icono de cada herramienta (decorativo, aria-hidden) para las tarjetas de la franja #visores de /datos y de la home.
// Son los que la web ya usaba para cada una: el pin del teaser de la home y de /ciencia
// (mapa), el microscopio de /ciencia (biopsia), el cubo y la gráfica de /links (lesiones,
// datos).
export const ICONO_HERRAMIENTA: Record<string, string> = {
  data: 'ph:chart-line-fill',
  lesions: 'ph:cube-fill',
  map: 'ph:map-pin-fill',
  slides: 'ph:microscope-fill',
  // Tres círculos: tres células. Distinto del microscopio de la biopsia (corte de tejido): aquí no se mira un corte, se cuentan células.
  cell_by_cell: 'ph:circles-three-fill',
  // Una lupa: buscar un gen y mirarlo célula a célula. Distinta de los tres círculos de su página madre.
  cell_explorer: 'ph:magnifying-glass-fill',
}

// «El caso en datos» con su nombre largo: en el pie, bajo el título «Datos», un enlace que se llamase «Datos» no diría
// nada. Misma key y misma ruta que NAV.data (la analítica no cambia); solo cambia la etiqueta.
const DATOS_CASO: EnlaceNav = { ...NAV.data, etiqueta: 'nav.data_case' }

// Pie (rediseño de arquitectura, F3, 23-oct-2026): 13 enlaces de navegación en tres columnas (`heading` es la clave i18n de
// su título) y, a su lado, las otras dos del pie: REDES y LEGAL (abajo). Fuera del pie, que ya no tiene sitio para ellos:
// Historia, Vídeos, Marcas, Reservorio, «Todas las herramientas» y el selector «por perfil». El explorador de células
// solo sale con su puerta abierta (useHerramientas).
export const PIE: { id: string; heading: string; enlaces: EnlaceNav[] }[] = [
  { id: 'caso', heading: 'footer.group_case', enlaces: [NAV.science, NAV.evidence, NAV.timeline, NAV.team] },
  { id: 'datos', heading: 'footer.group_data', enlaces: [DATOS_CASO, NAV.lesions, NAV.slides, NAV.cellByCell, NAV.cellExplorer] },
  { id: 'participa', heading: 'footer.group_involved', enlaces: [NAV.collaborate, NAV.press, NAV.expenses, NAV.contact] },
]

// Redes de Miriam, UNA vez. Las leen el pie (y el pie reducido de /links y /gracias), los enlaces rápidos de /colabora y el
// schema.org del layout (`sameAs`). `nombre` es el de la red; `pie` solo cuando el pie la llama distinto.
export const REDES_USUARIO = '@miriamgonp'
export interface Red {
  id: string
  nombre: string
  pie?: string
  url: string
}
export const REDES: Red[] = [
  { id: 'x', nombre: 'X', pie: 'X / Twitter', url: 'https://x.com/miriamgonp' },
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/miriamgonp' },
  { id: 'linkedin', nombre: 'LinkedIn', url: 'https://www.linkedin.com/in/miriamgonp' },
  { id: 'tiktok', nombre: 'TikTok', url: 'https://tiktok.com/@miriamgonp' },
  { id: 'youtube', nombre: 'YouTube', url: 'https://youtube.com/@miriamgonp' },
]

// Legal: los tres textos viven en su propia página (no en i18n), así que aquí solo van el nombre de la ruta y el rótulo.
export const LEGAL: { name: string; etiqueta: string }[] = [
  { name: 'aviso-legal', etiqueta: 'footer.legal_notice' },
  { name: 'privacidad', etiqueta: 'footer.privacy' },
  { name: 'cookies', etiqueta: 'footer.cookies' },
]

// Estado activo del menú: qué rutas cuelgan de cada ítem. La primera de cada lista
// es la raíz de la sección (allí el ítem lleva aria-current="page"); en las demás,
// aria-current="true" y el mismo estilo activo. Por nombre de ruta y no por prefijo
// de path, porque las herramientas no cuelgan de la URL /datos.
// F3: «Herramientas» pasa a «Datos». F4 (23-oct-2026) borró /herramientas y /reservorio (fusionadas en /datos), /historia
// (a /timeline) y /videos (a /ciencia y /prensa); la ruta de artículos de ciencia se borró en F0. Ninguna está ya en la lista.
export const SECCIONES: Record<string, string[]> = {
  home: ['index'],
  science: ['ciencia', 'ciencia-evidencia'],
  data: ['datos', 'lesiones', 'laminillas', 'celula-a-celula', 'celula-a-celula-explorar', 'mapa-metastasis'],
  timeline: ['timeline'],
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
// lado). La usan la franja #visores de /datos y el teaser de la home. Si una de esas páginas
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
  // app/pages/laminillas.vue
  slides: {
    es: ['Las laminillas, al microscopio', '32 laminillas de anatomía patológica escaneadas de tres muestras de Miriam, lado a lado: zoom hasta la célula, una regla en micras ajustada a cada escáner y lo que dice cada informe. Herramienta de apoyo, no diagnóstico.'],
    en: ['The slides, under the microscope', '32 scanned pathology slides from three of Miriam’s samples, side by side: zoom down to the cell, a micron ruler set to each scanner and what each report says. A support tool, not a diagnosis.'],
  },

  // app/pages/celula-a-celula-explorar.vue (título y descripción de useSeoMeta)
  cell_explorer: {
    es: ['Explorar los datos célula a célula', 'El mapa de células de las dos biopsias de Miriam: busca un gen o elige un marcador y míralo célula a célula en el mapa y grupo a grupo, con su n y su suelo ambiental.'],
    en: ['Explore the cell-by-cell data', 'The cell map of Miriam’s two biopsies: search a gene or pick a marker and see it cell by cell on the map and group by group, with its n and its ambient floor.'],
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
