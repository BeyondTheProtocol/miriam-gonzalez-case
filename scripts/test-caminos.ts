// Frenos de «cómo ayudar» y del texto de la home tras el rediseño de arquitectura (F3 y F5, 23-oct-2026).
//
// Historia: hasta F5 este test vigilaba los accesos directos de las siete tarjetas de «Elige tu camino» (plan del 20-oct-2026:
// de 1 a 3 accesos por camino, puerta del explorador, rejilla de 12 columnas, pasos de prensa y tech). La decisión del rediseño
// quitó esas tarjetas y puso CUATRO PUERTAS (utils/caminos.ts → PUERTAS, pintadas por Puertas.vue), así que esas comprobaciones
// ya no tienen nada que vigilar y se retiran con el código que cubrían (ACCESOS, accesosDe, PathwayAccesos, la rejilla CSS).
// Lo que protegían de fondo se conserva: el léxico de las tarjetas profesionales (aquí, sobre la copy nueva), las claves ES/EN
// sin desparejar y los destinos que existen.
//
// La clase del fallo: se le cuela a la home léxico que concluye («dianas», «mejor», «segunda opinión»), una frase del dinero
// que no se puede sostener («cada euro», «100 %»), una afirmación nueva en «El caso en 3 frases», un importe en el hero o una
// clave sin traducir. Nada de eso se ve hasta que alguien entra.
//
// 1. Las cuatro puertas: la taxonomía única, un nombre y un destino, con destinos que existen.
// 2. Claves ES/EN iguales en lo que toca la home (hero, home, puertas, money, pathways) y arrays de la misma longitud.
// 3. Léxico prohibido (comité médico, 20-oct) sobre toda la copy nueva de la home y de las puertas, ES y EN.
// 4. Hero: H1 con la edad variable y la frase pedida, lede ≤ 35 palabras, sin «ultra-raro» y sin importes ni promesa de destino.
// 5. «El caso en 3 frases»: solo las tres frases que la home ya publicaba (fijadas aquí) y ninguna afirmación nueva.
// 6. El dinero: UNA frase de destino, la canónica de legal-burocracia (23-oct-2026), sin importes ni «cada euro».
// 7. La home ya no usa lo que se fue (componentes, claves del dinero retiradas, euros en el hero).
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

console.log('1. Las cuatro puertas')
ok(JSON.stringify(PUERTAS.map((p) => p.id)) === JSON.stringify(['apoyar', 'clinico', 'prensa', 'otras']), 'cuatro puertas, en este orden: Apoyar, Clínico o laboratorio, Prensa, Otras formas')
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
ok(/<Puertas\b/.test(lee('app/pages/index.vue')), 'la home pinta las puertas con Puertas.vue')
ok(get(es, 'nav.data_case') === 'El caso en datos' && get(en, 'nav.data_case') === 'The case in data' && get(es, 'nav.data') === 'Datos' && get(en, 'nav.data') === 'Data', 'nav.data es «Datos»/«Data» (menú) y nav.data_case, «El caso en datos»/«The case in data» (pie)')

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
  'home.s9_strip_label', 'home.s9_press_contact', 'home.caso_heading', 'home.caso_1', 'home.caso_2', 'home.caso_3',
  'home.donde_heading', 'home.ahora', 'home.pasos_intro', 'home.pasos_nota_barra', 'home.pasos_progreso', 'home.pasos_progreso_curso', 'home.pasos_cta_ruta',
  'home.buscamos_heading', 'home.buscamos_escribir', 'home.buscamos_todas', 'home.donde_3d',
  'home.dinero_eyebrow', 'home.dinero_heading', 'home.dinero_informe', 'home.s4_cta_button', 'money.destino',
  'home.s6_eyebrow', 'home.s6_quote', 'home.s6_signature', 'home.puertas_heading',
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
  'home.buscamos_todas', 'home.donde_3d', 'home.dinero_eyebrow', 'home.dinero_heading', 'home.dinero_informe', 'home.puertas_heading', 'money.destino']
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
ok(!('recibo' in es.money) || es.money.recibo === 'Puedes solicitar un recibo escribiéndonos.', 'money.recibo, si existe, es la frase canónica (la home no la usa: el proceso del recibo está pendiente, G2d)')

console.log('7. La home ya no usa lo que se fue')
const home = lee('app/pages/index.vue')
const hero = lee('app/components/SectionHero.vue')
const SE_FUERON = ['VisitorPathways', 'SectionHerramientasTeaser', 'PathwayAccesos', 'ProfileChips']
ok(SE_FUERON.every((c) => !home.includes(c)), `index.vue ya no usa ${SE_FUERON.join(', ')}`)
ok(!existsSync('app/components/SectionHerramientasTeaser.vue') && !existsSync('app/components/PathwayAccesos.vue'), 'SectionHerramientasTeaser.vue y PathwayAccesos.vue se borraron (código muerto)')
ok(!/export const ACCESOS|function accesosDe|function trackPathwayCurious|trackPathwayCurious,/.test(lee('app/utils/caminos.ts') + lee('app/composables/useSupport.ts') + lee('app/components/VisitorPathways.vue')), 'ACCESOS, accesosDe y trackPathwayCurious ya no existen (ni como código)')
// claves retiradas por el criterio del dinero (siguen en los JSON hasta la limpieza con el OK de Miriam, pero la home no las pinta)
const RETIRADAS = ['hero_cta_donate_caption', 'hero_cta_science_caption', 's4_p2', 's4_buckets', 's4_buckets_title', 's4_full_breakdown', 's5_heading', 's4_cta_caption', 's4_list', 's4_list_intro', 'story_p1', 'story_p1_tail', 'hero_social_proof', 's4_heading', 's4_p1']
const pintan = RETIRADAS.filter((k) => new RegExp(`home\\.${k}\\b`).test(home + hero + lee('app/components/HomeProximosPasos.vue') + lee('app/components/PrensaTira.vue') + lee('app/components/Puertas.vue')))
ok(pintan.length === 0, `la home no pinta ninguna clave de las retiradas${pintan.length ? ` (${pintan.join(', ')})` : ''}`)
const heroTexto = hero.replace(/<style[\s\S]*?<\/style>/, '')
ok(!/raised|stat_raised|formatCurrency|currentAmount|goalAmount|celulasLeidas|resultados\.json|specialists/.test(heroTexto), 'el hero no calcula ni pinta recaudación, especialistas ni células (sin importes: euros solo en el bloque de la campaña)')
ok(!/\$t\('hero\.(stat_|title|subtitle)|pathways\.hero_sr_summary|aria-describedby/.test(heroTexto), 'el hero no usa el título/subtítulo viejos ni el resumen para lectores de pantalla (decía «ultra-raro» y «dos biologías»)')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ puertas y copy de la home en orden')
process.exit(fallos ? 1 : 0)
