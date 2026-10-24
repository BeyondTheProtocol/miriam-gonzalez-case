// Frenos de «cómo ayudar» y del texto de la home tras el rediseño de arquitectura (F3 y F5, 23-oct-2026).
//
// Historia: hasta F5 este test vigilaba los accesos directos de las siete tarjetas de «Elige tu camino» (plan del 20-oct-2026:
// de 1 a 3 accesos por camino, puerta del explorador, rejilla de 12 columnas, pasos de prensa y tech). La decisión del rediseño
// quitó esas tarjetas y puso CUATRO PUERTAS (utils/caminos.ts → PUERTAS, pintadas por Puertas.vue; la tanda 2, T2a, 24-oct-2026, añadió la
// quinta, «Tecnología, IA y marcas»), así que esas comprobaciones
// ya no tienen nada que vigilar y se retiran con el código que cubrían (ACCESOS, accesosDe, PathwayAccesos, la rejilla CSS).
// Lo que protegían de fondo se conserva: el léxico de las tarjetas profesionales (aquí, sobre la copy nueva), las claves ES/EN
// sin desparejar y los destinos que existen.
//
// La clase del fallo: se le cuela a la home léxico que concluye («dianas», «mejor», «segunda opinión»), una frase del dinero
// que no se puede sostener («cada euro», «100 %»), una afirmación nueva en «El caso en 3 frases», un importe en el hero o una
// clave sin traducir. Nada de eso se ve hasta que alguien entra.
//
// 1. Las cinco puertas: la taxonomía única, un nombre y un destino, con destinos que existen.
// 2. Claves ES/EN iguales en lo que toca la home (hero, home, puertas, money, pathways) y arrays de la misma longitud.
// 3. Léxico prohibido (comité médico, 20-oct) sobre toda la copy nueva de la home y de las puertas, ES y EN.
// 4. Hero: H1 con la edad variable y la frase pedida, lede ≤ 35 palabras, sin «ultra-raro» y sin importes ni promesa de destino.
// 5. «El caso en 3 frases»: solo las tres frases que la home ya publicaba (fijadas aquí) y ninguna afirmación nueva.
// 6. El dinero: UNA frase de destino y UNA del recibo (F6), las canónicas de legal-burocracia (23-oct-2026), sin importes ni «cada euro».
// 7. La home ya no usa lo que se fue (componentes, claves del dinero retiradas, euros en el hero).
// 8. Ajustes de la home del 24-oct-2026: lede, cita (sube tras «El caso en 3 frases» y sin guiones largos), línea de apoyo entre
//    pacientes bajo las puertas y «después» en minúscula en «Qué buscamos».
//
// Uso:  pnpm test:caminos
import { existsSync, readFileSync } from 'node:fs'
import { PUERTAS } from '../app/utils/caminos'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8'))
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8'))
const get = (o: Record<string, unknown>, ruta: string) => ruta.split('.').reduce<unknown>((x, k) => (x as Record<string, unknown> | undefined)?.[k], o)
const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length
const lee = (f: string) => readFileSync(f, 'utf-8')

console.log('1. Las cinco puertas')
ok(JSON.stringify(PUERTAS.map((p) => p.id)) === JSON.stringify(['apoyar', 'clinico', 'tecnologia', 'prensa', 'otras']), 'cinco puertas, en este orden: Apoyar, Clínico o laboratorio, Tecnología IA y marcas, Prensa, Otras formas')
ok(PUERTAS.every((p) => JSON.stringify(Object.keys(p).sort()) === JSON.stringify(['destino', 'etiqueta', 'id'])), 'una puerta es un nombre y un destino: sin minutos, pasos ni subtítulos')
const pu = (es.puertas ?? {}) as Record<string, string>
const puEn = (en.puertas ?? {}) as Record<string, string>
ok(PUERTAS.every((p) => typeof get(es, p.etiqueta) === 'string' && typeof get(en, p.etiqueta) === 'string' && get(es, p.etiqueta) !== ''), 'cada puerta tiene su rótulo en ES y EN')
ok(JSON.stringify(Object.keys(pu).sort()) === JSON.stringify(Object.keys(puEn).sort()) && Object.keys(pu).length === PUERTAS.length, 'puertas.*: mismas claves en ES y EN, y ninguna de sobra')
const rutas = PUERTAS.flatMap((p) => (p.destino.tipo === 'ruta' ? [p.destino] : []))
ok(PUERTAS.filter((p) => p.destino.tipo === 'apoyo').map((p) => p.id).join() === 'apoyar', 'solo «Apoyar» va a la campaña; el resto, a rutas del sitio')
ok(rutas.every((r) => existsSync(`app/pages/${r.name}.vue`)), `cada destino es una página que existe (${rutas.map((r) => r.name).join(', ')})`)
const datosVue = lee('app/pages/datos.vue') + lee('app/components/QueBuscamos.vue')
const clinico = PUERTAS.find((p) => p.id === 'clinico')!
ok(clinico.destino.tipo === 'ruta' && clinico.destino.name === 'datos' && clinico.destino.hash === '#que-buscamos' && datosVue.includes('que-buscamos'), '«Clínico o laboratorio» aterriza en «Qué buscamos» (/datos#que-buscamos), que existe')
// T2a (24-oct-2026): «Tecnología, IA y marcas» (tech fue el 40 % de «Pathway» y el 57 % de los contactos en los 60 días medidos) aterriza en la
// tarjeta «Tech & IA» de /colabora, donde ya iban esos contactos (repo, pipeline abierto y el rol tech ya marcado). El ancla existe.
const tecnologia = PUERTAS.find((p) => p.id === 'tecnologia')!
ok(tecnologia.destino.tipo === 'ruta' && tecnologia.destino.name === 'colabora' && tecnologia.destino.hash === '#tech-ia' && /id="tech-ia"/.test(lee('app/pages/colabora.vue')), '«Tecnología, IA y marcas» aterriza en /colabora#tech-ia, que existe')
ok(get(es, 'puertas.tecnologia') === 'Tecnología, IA y marcas' && get(en, 'puertas.tecnologia') === 'Tech, AI and brands', 'y su rótulo es el pedido, en ES y EN')
ok(/<Puertas\b/.test(lee('app/pages/index.vue')), 'la home pinta las puertas con Puertas.vue')
ok(get(es, 'nav.data_case') === 'El caso en datos' && get(en, 'nav.data_case') === 'The case in data' && get(es, 'nav.data') === 'Datos' && get(en, 'nav.data') === 'Data', 'nav.data sigue siendo «Datos»/«Data» y nav.data_case, «El caso en datos»/«The case in data» (la etiqueta larga del pie y de las tarjetas)')
ok(get(es, 'nav.tools') === 'Herramientas' && get(en, 'nav.tools') === 'Tools' && get(es, 'nav.all_tools') === 'Todas las herramientas', 'nav.tools es «Herramientas»/«Tools» (el menú, desde T2a) y nav.all_tools, «Todas las herramientas» (el pie)')

console.log('2. Claves ES/EN')
for (const ns of ['hero', 'home', 'puertas', 'money', 'pathways']) {
  const a = (es[ns] ?? {}) as Record<string, unknown>
  const b = (en[ns] ?? {}) as Record<string, unknown>
  const soloEs = Object.keys(a).filter((k) => !(k in b))
  const soloEn = Object.keys(b).filter((k) => !(k in a))
  ok(soloEs.length === 0 && soloEn.length === 0, `mismas claves ${ns}.* en ES y EN${soloEs.length + soloEn.length ? ` (solo ES: ${soloEs.join(', ')}; solo EN: ${soloEn.join(', ')})` : ''}`)
  for (const k of Object.keys(a)) {
    if (Array.isArray(a[k])) ok(Array.isArray(b[k]) && (b[k] as unknown[]).length === (a[k] as unknown[]).length, `${ns}.${k}: misma longitud en ES y EN`)
  }
}
// Las claves que la home pinta ahora existen, traducidas y no vacías (una clave que falta se pinta como la propia clave).
const USADAS = [
  'home.hero_eyebrow', 'hero.h1', 'hero.h1_emphasis', 'hero.lede', 'hero.cta_donate', 'hero.cta_understand', 'hero.pro_link', 'hero.proof_support',
  'hero.latest_label', 'hero.photo_tag', 'hero.section_label', 'hero.cta_science',
  'home.s9_strip_label', 'home.prensa_tira_etiqueta', 'home.s9_press_contact', 'home.puertas_pares', 'home.puertas_pares_cta', 'home.caso_heading', 'home.caso_1', 'home.caso_2', 'home.caso_3',
  'home.donde_heading', 'home.ahora', 'home.pasos_intro', 'home.pasos_nota_barra', 'home.pasos_progreso', 'home.pasos_progreso_curso', 'home.pasos_cta_ruta',
  'home.buscamos_heading', 'home.buscamos_escribir', 'home.buscamos_todas', 'home.donde_3d',
  'home.dinero_eyebrow', 'home.dinero_heading', 'home.dinero_informe', 'home.s4_cta_button', 'money.destino', 'money.recibo',
  'home.s6_eyebrow', 'home.s6_quote', 'home.s6_signature', 'home.puertas_heading',
  // la banda de herramientas (T2a) y el índice
  'herramientas.title', 'herramientas.intro', 'herramientas.eyebrow', 'herramientas.apertura', 'herramientas.apertura_cada_una', 'herramientas.grupo_ahora', 'herramientas.grupo_pasadas',
  'herramientas.para_labs', 'herramientas.para_clinicos', 'herramientas.para_todos', 'herramientas.historico_mapa', 'herramientas.historico_port', 'herramientas.pasada_titulo',
  'herramientas.linea_mapa', 'herramientas.linea_port', 'herramientas.abrir', 'herramientas.salida', 'herramientas.salida_inicio', 'home.tools_new', 'nav.all_tools', 'nav.tools',
  'links.herramientas_title', 'links.herramientas_sub', 'puertas.tecnologia',
]
for (const clave of USADAS) {
  ok(typeof get(es, clave) === 'string' && typeof get(en, clave) === 'string' && get(es, clave) !== '' && get(en, clave) !== '', `«${clave}» existe en ES y EN`)
}

console.log('3. Léxico de la copy nueva')
const PROHIBIDO: [RegExp, string][] = [
  [/\bdianas?\b|\btargets?\b/i, 'dianas/targets'],
  [/perfil molecular|molecular profile/i, 'perfil molecular'],
  [/\bmejor(es)?\b|\bbest\b/i, 'mejor/best'],
  [/candidat/i, 'candidato/a'],
  [/\btu caso\b|\byour case\b/i, 'tu caso'],
  [/segunda opini[oó]n|second opinion/i, 'segunda opinión (el formulario no es ese proceso)'],
  [/recomend|recommend/i, 'recomendar'],
]
// Lo nuevo de la home. Excluidas a propósito las frases ya publicadas de otras páginas que la home reutiliza tal cual
// (pasos_intro, s6_quote, las peticiones de caso.json): se revisan donde nacieron y su léxico no es el de esta copy.
const NUEVAS = ['hero.h1', 'hero.h1_emphasis', 'hero.lede', 'hero.cta_understand', 'hero.pro_link', 'hero.proof_support',
  'home.caso_heading', 'home.caso_1', 'home.caso_2', 'home.caso_3', 'home.donde_heading', 'home.ahora', 'home.buscamos_heading', 'home.buscamos_escribir',
  'home.buscamos_todas', 'home.dinero_eyebrow', 'home.dinero_heading', 'home.dinero_informe', 'home.puertas_heading', 'home.prensa_tira_etiqueta', 'home.puertas_pares', 'home.puertas_pares_cta', 'money.destino', 'money.recibo',
  // T2a: la copy nueva de la banda y del índice. NO entran herramientas.linea_mapa ni linea_port: son las líneas de Miriam, literales («una pregunta
  // mejor…»), y las firma ella; ni los títulos/descripciones de las herramientas, que son los ya publicados de cada página.
  'herramientas.eyebrow', 'herramientas.apertura', 'herramientas.apertura_cada_una', 'herramientas.grupo_ahora', 'herramientas.grupo_pasadas', 'herramientas.para_labs', 'herramientas.para_clinicos',
  'herramientas.para_todos', 'herramientas.historico_mapa', 'herramientas.historico_port', 'herramientas.pasada_titulo', 'herramientas.abrir', 'herramientas.salida', 'herramientas.salida_inicio',
  'links.herramientas_title', 'links.herramientas_sub']
for (const [loc, d] of [['ES', es], ['EN', en]] as const) {
  const textos = [...NUEVAS.map((k) => [k, String(get(d, k))] as const), ...Object.entries(d.puertas as Record<string, string>).map(([k, v]) => [`puertas.${k}`, v] as const)]
  for (const [re, nombre] of PROHIBIDO) {
    const malos = textos.filter(([, v]) => re.test(v)).map(([k]) => k)
    ok(malos.length === 0, `${loc}: sin «${nombre}»${malos.length ? ` (en ${malos.join(', ')})` : ''}`)
  }
}

console.log('4. Hero')
const H1 = { es: 'Miriam, {age} años, busca un tratamiento hecho a partir de {op}.', en: 'Miriam, {age}, is looking for a treatment made from {op}.' }
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(d.hero.h1 === H1[loc], `${loc}: el H1 es la frase pedida, con la edad como variable y «su propio tumor» como énfasis (${d.hero.h1})`)
  ok(String(d.hero.h1).includes('{age}'), `${loc}: la edad va como {age} (sube sola cada 1 de enero): ninguna edad escrita a mano`)
  ok(palabras(d.hero.lede) <= 35, `${loc}: el lede no pasa de 35 palabras (${palabras(d.hero.lede)})`)
  const hero = [d.home.hero_eyebrow, d.hero.h1, d.hero.h1_emphasis, d.hero.lede, d.hero.cta_understand, d.hero.pro_link, d.hero.proof_support, d.hero.cta_donate].join(' ¶ ')
  ok(!/ultra/i.test(hero), `${loc}: el hero no dice «ultra-raro» (contradecía la cifra de rareza de la propia web)`)
  ok(!/[€$£]|\beuros?\b|\d[\d.,]*\s?%/i.test(hero), `${loc}: el hero no lleva importes, euros ni porcentajes`)
  ok(!/financia|funds?\b|cada euro|every euro|sin intermediarios|100\s?%/i.test(d.hero.lede), `${loc}: el lede no promete a qué va el dinero (eso, en su bloque y con la frase canónica)`)
}
ok(es.home.hero_eyebrow === 'Cáncer de mama metastásico · diferenciación neuroendocrina' && en.home.hero_eyebrow === 'Metastatic breast cancer · neuroendocrine differentiation', 'el eyebrow es el pedido, en ES y EN')
ok(es.hero.cta_understand === 'Entender el caso' && es.hero.cta_donate === 'Apoyar a Miriam', 'los dos botones del hero: «Apoyar a Miriam» y «Entender el caso»')
ok(/\{n\}/.test(es.hero.proof_support) && /\{n\}/.test(en.hero.proof_support) && !/[€$£]/.test(es.hero.proof_support + en.hero.proof_support), 'la prueba lleva el número de personas ({n}) y ningún importe')

console.log('5. «El caso en 3 frases»')
// Las tres frases que la home YA publicaba (la home publicada el 23-oct-2026, antes del rediseño): cambiar una exige el OK de Miriam y del comité
// médico, no este test. Verbatim o recortadas de: hero/«Resumen de 2 min» (punto 1), la historia (título y cierre del párrafo).
const PUBLICADAS = {
  es: ['Miriam tiene un cáncer de mama metastásico.', 'Un diagnóstico que no cabía en ningún protocolo.', 'El tratamiento estándar no basta: hay que diseñarlo a medida de su tumor.'],
  en: ['Miriam has metastatic breast cancer.', 'A diagnosis that fit no protocol.', "The standard treatment isn't enough: it has to be designed around her specific tumor."],
}
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  const frases = [d.home.caso_1, d.home.caso_2, d.home.caso_3]
  ok(JSON.stringify(frases) === JSON.stringify(PUBLICADAS[loc]), `${loc}: las tres frases son las ya publicadas${JSON.stringify(frases) === JSON.stringify(PUBLICADAS[loc]) ? '' : ` — salen: ${JSON.stringify(frases)}`}`)
  const todo = frases.join(' ')
  ok(palabras(todo) <= 80, `${loc}: el bloque entero cabe en 80 palabras (${palabras(todo)})`)
  ok(!/dos biolog|two biolog|dos caras|two sides|two faces|vacuna|vaccine|v[ií]a principal|main route|\d/i.test(todo), `${loc}: ni «dos biologías/caras» como hecho, ni «vacuna / vía principal», ni cifras`)
}
ok(!/caso_[123]/.test(lee('app/pages/ciencia/index.vue')), 'las frases son de la home: /ciencia no las reutiliza')

console.log('6. El dinero')
// Criterio de legal-burocracia (23-oct-2026): UNA frase de destino. Sin importes, «cada euro», «100 %», «mensual» ni «sin intermediarios».
const DESTINO = {
  es: 'El dinero recibido se destina a los gastos del caso; el informe de gastos detalla las partidas, impuesto de donaciones incluido, con su fecha.',
  en: 'The money received goes to the costs of the case; the expense report lists the line items, gift tax included, with its date.',
}
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(d.money.destino === DESTINO[loc], `${loc}: money.destino es la frase canónica (${d.money.destino})`)
  ok(!/[€$£]|\d|\beuros?\b|cada |every |100|mensual|monthly|intermediari|íntegr|integral|direct/i.test(d.money.destino), `${loc}: money.destino sin importes, «cada euro», «100 %», «mensual», «intermediarios» ni «directamente»`)
  // una sola clave con esa frase (test-una-fuente completo llega con F2)
  const repetida = (function buscar(o: unknown, ruta: string): string[] {
    if (typeof o === 'string') return o === d.money.destino ? [ruta] : []
    if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => buscar(v, ruta ? `${ruta}.${k}` : k))
    return []
  })(d, '')
  ok(repetida.length === 1 && repetida[0] === 'money.destino', `${loc}: la frase canónica vive en UNA sola clave (${repetida.join(', ')})`)
}
// El recibo (F6, 23-oct-2026): la segunda frase canónica del criterio de legal-burocracia. Es la de /gastos (expenses.faq_a3, hasta que F10 la
// retire de ahí y la concatene desde money.recibo), sin «por email», sin plazo y sin importes. La home no la usa (el proceso del recibo está
// pendiente, G2d); la usa /gracias, y su presencia ahí la vigila test-salud-estatica §12.
const RECIBO = {
  es: 'Puedes solicitar un recibo escribiéndonos.',
  en: 'You can request a receipt by getting in touch.',
}
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(d.money.recibo === RECIBO[loc], `${loc}: money.recibo es la frase canónica (${d.money.recibo})`)
  ok(!/[€$£]|\d|\beuros?\b|cada |every |100|mensual|monthly|intermediari|middlem|email|e-mail|correo|plazo|horas|días|hours|days|certificad|desgrav|tax relief/i.test(d.money.recibo), `${loc}: money.recibo sin importes, «por email», plazos ni promesas fiscales`)
  const repetida = (function buscar(o: unknown, ruta: string): string[] {
    if (typeof o === 'string') return o === d.money.recibo ? [ruta] : []
    if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => buscar(v, ruta ? `${ruta}.${k}` : k))
    return []
  })(d, '')
  ok(repetida.length === 1 && repetida[0] === 'money.recibo', `${loc}: la frase del recibo vive en UNA sola clave (${repetida.join(', ')})`)
}

console.log('7. La home ya no usa lo que se fue')
const home = lee('app/pages/index.vue')
const hero = lee('app/components/SectionHero.vue')
const SE_FUERON = ['VisitorPathways', 'PathwayAccesos', 'ProfileChips']
ok(SE_FUERON.every((c) => !home.includes(c)), `index.vue ya no usa ${SE_FUERON.join(', ')}`)
ok(!existsSync('app/components/PathwayAccesos.vue'), 'PathwayAccesos.vue se borró (código muerto)')
// T2a (24-oct-2026): la banda de herramientas VUELVE (F5 la había borrado; Umami la midió: 8,7 % de los visitantes de la home). Con las piezas v3.
ok(/<SectionHerramientasTeaser\s*\/>/.test(home) && existsSync('app/components/SectionHerramientasTeaser.vue'), 'index.vue pinta la banda de herramientas (SectionHerramientasTeaser) y el componente existe')
ok(/<Banda\b[\s\S]*<CabeceraSeccion\b[\s\S]*<TarjetaEnlace\b/.test(lee('app/components/SectionHerramientasTeaser.vue')), 'la banda está hecha con las piezas del sistema v3: Banda, CabeceraSeccion y TarjetaEnlace')
ok(!home.includes('donde_3d'), 'index.vue ya no enlaza «Míralo en 3D» (ahora sería un segundo enlace a /lesiones seguido de la banda)')
ok(!/export const ACCESOS|function accesosDe|function trackPathwayCurious|trackPathwayCurious,/.test(lee('app/utils/caminos.ts') + lee('app/composables/useSupport.ts') + lee('app/components/VisitorPathways.vue')), 'ACCESOS, accesosDe y trackPathwayCurious ya no existen (ni como código)')
// claves retiradas por el criterio del dinero (siguen en los JSON hasta la limpieza con el OK de Miriam, pero la home no las pinta)
const RETIRADAS = ['hero_cta_donate_caption', 'hero_cta_science_caption', 's4_p2', 's4_buckets', 's4_buckets_title', 's4_full_breakdown', 's5_heading', 's4_cta_caption', 's4_list', 's4_list_intro', 'story_p1', 'story_p1_tail', 'hero_social_proof', 's4_heading', 's4_p1']
const pintan = RETIRADAS.filter((k) => new RegExp(`home\\.${k}\\b`).test(home + hero + lee('app/components/HomeProximosPasos.vue') + lee('app/components/PrensaTira.vue') + lee('app/components/Puertas.vue')))
ok(pintan.length === 0, `la home no pinta ninguna clave de las retiradas${pintan.length ? ` (${pintan.join(', ')})` : ''}`)
const heroTexto = hero.replace(/<style[\s\S]*?<\/style>/, '')
ok(!/raised|stat_raised|formatCurrency|currentAmount|goalAmount|celulasLeidas|resultados\.json|specialists/.test(heroTexto), 'el hero no calcula ni pinta recaudación, especialistas ni células (sin importes: euros solo en el bloque de la campaña)')
ok(!/\$t\('hero\.(stat_|title|subtitle)|pathways\.hero_sr_summary|aria-describedby/.test(heroTexto), 'el hero no usa el título/subtítulo viejos ni el resumen para lectores de pantalla (decía «ultra-raro» y «dos biologías»)')

console.log('8. Ajustes de la home del 24-oct-2026')
// Lede: la frase decidida (ES), con «se ha puesto a investigarlo»; en EN el mismo sentido y la ortografía del resto del hero (tumor, no tumour).
ok(es.hero.lede === 'Es ingeniera de software. Su tumor no encaja en los protocolos habituales y ella se ha puesto a investigarlo en abierto, con médicos y laboratorios de varios países.', 'es: el lede es el decidido')
ok(en.hero.lede === "She's a software engineer. Her tumor doesn't fit the usual protocols, and she has set out to investigate it in the open, with doctors and labs in several countries.", 'en: el lede es el decidido (con «tumor», como el H1 de justo encima)')
// Cita: comas en vez de guiones largos (ni —, ni –, ni « - ») y la frase decidida.
ok(es.home.s6_quote === 'Mi tumor tiene dos caras, la de mama y la neuroendocrina, y la clave es tratar las dos a la vez, no solo una.', 'es: la cita es la decidida (con comas)')
ok(en.home.s6_quote === 'My tumor has two sides, the breast side and the neuroendocrine one, and the key is to treat both at once, not just one.', 'en: la cita es la decidida (con comas)')
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  const nuevo = [d.hero.lede, d.home.s6_quote, d.home.prensa_tira_etiqueta, d.home.puertas_pares, d.home.puertas_pares_cta].join(' ¶ ')
  ok(!/[—–]|\s-\s/.test(nuevo), `${loc}: la copy nueva de estos ajustes no lleva guion largo`)
}
// Orden de la home: la cita va justo después de «El caso en 3 frases» y antes de «Dónde estamos» (el DOM manda el orden visual).
const idx = (re: RegExp) => home.search(re)
const iPrensa = idx(/<PrensaTira\b/), iHerr = idx(/<SectionHerramientasTeaser\b/)
ok(iPrensa > 0 && iPrensa < iHerr && iHerr < idx(/id="caso"/), 'index.vue: la banda de herramientas va justo después de la prensa y antes de «El caso en 3 frases»')
const iCaso = idx(/id="caso"/), iCita = idx(/aria-labelledby="h-cita"/), iDonde = idx(/aria-labelledby="h-donde"/), iDinero = idx(/id="campaign"/), iPuertas = idx(/aria-labelledby="h-puertas"/)
ok(iCaso > 0 && iCaso < iCita && iCita < iDonde && iDonde < iDinero && iDinero < iPuertas, 'index.vue: caso › cita › dónde estamos › dinero › puertas (la cita sube tras «El caso en 3 frases»)')
// Línea de apoyo entre pacientes: fuera de la lista de puertas (son cinco), enlazada a la tarjeta de /colabora que existe.
ok(/class="puertas-pares"[\s\S]*?name: 'colabora', hash: '#apoyo-mutuo'/.test(home), 'index.vue: la línea de apoyo entre pacientes enlaza a /colabora#apoyo-mutuo')
ok(/id="apoyo-mutuo"/.test(lee('app/pages/colabora.vue')), '/colabora tiene la tarjeta #apoyo-mutuo a la que enlaza la home')
ok(es.home.puertas_pares === '¿Vives algo parecido? No tienes que aportar nada.' && es.home.puertas_pares_cta === es.collaborate.profile5_cta_label, 'es: la línea es la decidida y su enlace es el rótulo ya publicado en /colabora («Escribir a Miriam»)')
ok(en.home.puertas_pares_cta === en.collaborate.profile5_cta_label && /something similar/i.test(en.home.puertas_pares) && /don't have to contribute anything/i.test(en.home.puertas_pares), 'en: la línea sale de las frases ya publicadas en /colabora (peer_desc, profile5_text, profile5_cta_label)')
// «después»: en minúscula en las peticiones de «Qué buscamos» (caso.json de la web, las dos copias; ES y EN). Solo esa palabra.
for (const fich of ['app/data/caso.json', 'public/datos/caso.json']) {
  const caso = lee(fich)
  ok(!caso.includes('DESPUÉS') && !/for AFTER TROPION/.test(caso), `${fich}: «para DESPUÉS de» / «for AFTER» ya no van en mayúsculas`)
  ok(caso.includes('para después de TROPION-Breast06, que admitan') && caso.includes('for after TROPION-Breast06 that accept'), `${fich}: la petición dice «para después de TROPION-Breast06» / «for after TROPION-Breast06»`)
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ puertas y copy de la home en orden')
process.exit(fallos ? 1 : 0)
