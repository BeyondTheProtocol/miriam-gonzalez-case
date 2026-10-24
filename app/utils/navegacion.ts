/**
 * Fuente única de la navegación del sitio (dictamen `diseno`, 14-oct-2026).
 *
 * La leen el menú (SiteNav), el pie (SiteFooter), la banda de herramientas de la home y el índice /herramientas (que
 * volvió a ser una página viva en la tanda 2 del rediseño, T2a, 24-oct-2026). Cada enlace lleva:
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
  // Clave i18n de la etiqueta cuando NO es `nav.<key>` (p. ej. el pie lleva «El caso en datos» donde `nav.data` dice «Datos»).
  // La key, y con ella la analítica y el icono, no cambian.
  etiqueta?: string
}

const e = (key: string, name: string): EnlaceNav => ({ key, name })

// Enlaces del sitio, una sola vez.
export const NAV = {
  home: e('home', 'index'),
  science: e('science', 'ciencia'),
  evidence: e('evidence', 'ciencia-evidencia'),
  // El índice de herramientas. La key `tools` es la que usó el evento «Navegar» de Umami durante los diez días de datos
  // previos al rediseño: se conserva para que la serie siga siendo comparable.
  tools: e('tools', 'herramientas'),
  data: e('data', 'datos'),
  lesions: e('lesions', 'lesiones'),
  map: e('map', 'mapa-metastasis'),
  port: e('port', 'reservorio'),
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

// Menú principal (tanda 2 del rediseño, T2a, 24-oct-2026): La ciencia · Herramientas · Cronología · Equipo · Cómo ayudar.
// «Herramientas» vuelve al hueco de «Datos» (que había ocupado en F3, 23-oct): en los diez días medidos fue el 24 % de los clics
// del menú (empatada en cabeza con Cronología), y /datos pasa a ser una de sus tarjetas. La key sigue siendo `tools`.
// En escritorio no va «Inicio»: el logo ya lleva a la home. En móvil sí va, el primero.
export const MENU_ESCRITORIO: EnlaceNav[] = [NAV.science, NAV.tools, NAV.timeline, NAV.team, NAV.collaborate]
export const MENU_MOVIL: EnlaceNav[] = [NAV.home, ...MENU_ESCRITORIO]

// Las herramientas, en DOS grupos (Miriam, 24-oct-2026). Lo que sale en la home, en el índice /herramientas y en el pie sale de
// aquí: una sola lista, para que las tres superficies digan lo mismo y en el mismo orden.
//
// «Las de ahora» (HERRAMIENTAS): célula a célula, su explorador, mama-hígado-hueso, el caso en datos y las laminillas. Es el
// orden en que la decisión de Miriam del 24-oct las nombra, y manda sobre el del 20-oct («del cuerpo a la célula»: datos,
// lesiones, laminillas, célula, explorador), que era el de la franja #visores de /datos y de la banda de la home. Una herramienta
// nueva entra en su sitio de este recorrido, no al principio. La que se destaca como «Lo último» en la home ya no es la primera de
// esta lista: es LO_ULTIMO (abajo). El explorador se oculta mientras su puerta no esté abierta (useHerramientas).
export const HERRAMIENTAS: EnlaceNav[] = [NAV.cellByCell, NAV.cellExplorer, NAV.lesions, NAV.data, NAV.slides]

// «Sirvieron en un momento concreto» (HERRAMIENTAS_PASADAS): el mapa de metástasis (junio de 2026) y el reservorio (septiembre de
// 2026). Siguen vivas e indexables, con una línea arriba que dice cuándo y para qué se hicieron, pero no se actualizan: lo actual
// está en «Mama, hígado y hueso». Van en el índice y en la página de cada una; no en la banda de la home ni en el pie.
export const HERRAMIENTAS_PASADAS: EnlaceNav[] = [NAV.map, NAV.port]

// La herramienta que la home destaca en grande con la etiqueta «Lo último». Tiene que ser la misma que anuncia la
// barra global «LO ÚLTIMO» (la última entrada de la cronología): hoy, célula a célula. Cuando se anuncie otra, se
// cambia aquí y en la cronología a la vez.
export const LO_ULTIMO: EnlaceNav = NAV.cellByCell

// Icono de cada herramienta (decorativo, aria-hidden) para las tarjetas del índice /herramientas y de la banda de la home.
// Son los que la web ya usaba para cada una: el pin del teaser de la home y de /ciencia
// (mapa), el microscopio de /ciencia (biopsia), el cubo y la gráfica de /links (lesiones,
// datos).
export const ICONO_HERRAMIENTA: Record<string, string> = {
  data: 'ph:chart-line-fill',
  lesions: 'ph:cube-fill',
  map: 'ph:map-pin-fill',
  // Un catéter que acaba en la cámara del port (diseno, 14-oct): una jeringa se leía como «inyección».
  port: 'ph:path-fill',
  slides: 'ph:microscope-fill',
  // Tres círculos: tres células. Distinto del microscopio de la biopsia (corte de tejido): aquí no se mira un corte, se cuentan células.
  cell_by_cell: 'ph:circles-three-fill',
  // Una lupa: buscar un gen y mirarlo célula a célula. Distinta de los tres círculos de su página madre.
  cell_explorer: 'ph:magnifying-glass-fill',
}

// Para quién es cada herramienta (clave i18n de su etiqueta «Para…») y a qué rol de /contacto lleva su «Escribir al equipo». Los
// roles son los que /contacto ya acepta: crear uno obligaría a tocar /privacidad §2. Las laminillas y el explorador llevan la
// etiqueta ya publicada de /ciencia («Para profesionales»). Las dos pasadas no llevan «Para…»: su etiqueta es «Histórico».
export const PARA_HERRAMIENTA: Record<string, string> = {
  cell_by_cell: 'herramientas.para_labs',
  cell_explorer: 'ciencia.level_pro',
  lesions: 'herramientas.para_todos',
  data: 'herramientas.para_clinicos',
  slides: 'ciencia.level_pro',
}
export const ROL_HERRAMIENTA: Record<string, 'oncologist' | 'researcher'> = {
  cell_by_cell: 'researcher',
  cell_explorer: 'researcher',
  lesions: 'oncologist',
  data: 'oncologist',
  slides: 'researcher',
}

// «El caso en datos» con su nombre largo: en el pie, bajo el título «Herramientas», un enlace que se llamase «Datos» no diría
// nada. Misma key y misma ruta que NAV.data (la analítica no cambia); solo cambia la etiqueta.
const DATOS_CASO: EnlaceNav = { ...NAV.data, etiqueta: 'nav.data_case' }
// «Todas las herramientas»: el índice, con su rótulo largo. Misma key y misma ruta que el ítem del menú.
const TODAS_HERRAMIENTAS: EnlaceNav = { ...NAV.tools, etiqueta: 'nav.all_tools' }

// Pie (tanda 2 del rediseño, T2a, 24-oct-2026): 14 enlaces de navegación en tres columnas (`heading` es la clave i18n de su
// título) y, a su lado, las otras dos del pie: REDES y LEGAL (abajo). La columna «Herramientas» abre con «Todas las
// herramientas» y sigue con las de HERRAMIENTAS, en su orden. Fuera del pie, que no tiene sitio para ellos: Historia, Vídeos,
// Marcas, el mapa y el reservorio (van en el índice) y el selector «por perfil». El explorador de células solo sale con su
// puerta abierta (useHerramientas).
export const PIE: { id: string; heading: string; enlaces: EnlaceNav[] }[] = [
  { id: 'caso', heading: 'footer.group_case', enlaces: [NAV.science, NAV.evidence, NAV.timeline, NAV.team] },
  { id: 'herramientas', heading: 'footer.group_tools', enlaces: [TODAS_HERRAMIENTAS, ...HERRAMIENTAS.map((h) => (h.key === 'data' ? DATOS_CASO : h))] },
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
// de path, porque las herramientas no cuelgan de la URL /herramientas.
// T2a (24-oct-2026): «Herramientas» vuelve y recoge las siete herramientas más el índice; `data` desaparece. Entre F3 y T2a las
// herramientas colgaron de «Datos». /historia cuelga de la cronología (es su misma intención: la historia de Miriam).
// La ruta de artículos de ciencia se borró en F0.
export const SECCIONES: Record<string, string[]> = {
  home: ['index'],
  science: ['ciencia', 'ciencia-evidencia'],
  tools: ['herramientas', 'datos', 'lesiones', 'laminillas', 'celula-a-celula', 'celula-a-celula-explorar', 'mapa-metastasis', 'reservorio'],
  timeline: ['timeline', 'historia'],
  team: ['equipo'],
  collaborate: ['colabora', 'prensa', 'marcas', 'gastos', 'contacto'],
}

// Las herramientas que cierran con la salida común (SalidaHerramienta: «Apoyar a Miriam» y «Volver al inicio»), por nombre de ruta.
// Son las de la sección «Herramientas» menos el índice (sus tres puertas ya son esa salida) y /lesiones (F6 le puso su propio cierre de
// apoyo, con «Apoyar» y «Entender el caso»: dos botones coral en el mismo cierre serían uno de más).
export const SALIDA_HERRAMIENTA: string[] = SECCIONES.tools!.filter((n) => n !== 'herramientas' && n !== 'lesiones')

/** aria-current del ítem `key` estando en la ruta de nombre base `actual`. */
export function ariaCurrentSeccion(key: string, actual: string | undefined): 'page' | 'true' | undefined {
  const rutas = SECCIONES[key]
  if (!rutas || !actual) return undefined
  if (actual === rutas[0]) return 'page'
  return rutas.includes(actual) ? 'true' : undefined
}

// Copia LITERAL del H1 y de la meta-description de cada herramienta (el fichero va al
// lado). La usan el índice /herramientas y la banda de la home. Si una de esas páginas
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
    es: ['El reservorio: qué es y por qué se cambió', 'Qué es un port-a-cath, cuál llevaba Miriam (un PowerPort, diseñado para admitir contraste inyectado a presión), por qué dejó de dar sangre y cómo se cambió por otro en octubre de 2026. Con el trayecto del catéter anterior en 3D.'],
    en: ['The port: what it is and why it was replaced', 'What a port-a-cath is, which one Miriam had (a PowerPort, built to take contrast injected under pressure), why it stopped giving blood back and how it was replaced in October 2026. With the old catheter’s path in 3D.'],
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
