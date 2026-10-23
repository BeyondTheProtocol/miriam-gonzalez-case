// Frenos de la sala de prensa (/prensa, /en/press), pedidos en el plan del 14-oct-2026.
//
// La clase del fallo: la sala se mantiene a mano y se desincroniza sin que nada avise
// (citas que no son las aprobadas, una traducción presentada como «verbatim», una fecha de
// «última actualización» que nadie toca, un contador de campaña donde no debe, una palabra
// vetada escrita en la propia guía pública).
//
// 1. Mismas claves `press.*` en ES y EN (ni una sin traducir).
// 2. Las 4 citas son exactamente el set aprobado por Miriam (27-jun-2026), en ES y EN.
// 3. En EN el título no dice «verbatim» (las citas 1 a 3 son traducciones).
// 4. La guía pública no nombra lo que nunca se dice en público («Olune») ni «científica» como SÍ.
// 5. /prensa no lleva el contador de campaña ni la fecha fija «junio de 2026».
// 6. `caseData.pressAsOf` es una fecha válida y no es futura.
// 7. La tira de medios de la home se LEE de content/<idioma>/press.yml (rediseño F5, 23-oct-2026): ni un medio ni una URL escritos
//    a mano en la página o en su componente; los medios únicos salen en el orden de la sala de prensa, con el enlace de su primera
//    pieza, en ES y en EN. Si hay build (.output/public), se comprueba además en el HTML generado de las dos home.
//
// Uso:  pnpm test:sala-prensa
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')).press as Record<string, string>
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')).press as Record<string, string>
const pagina = readFileSync('app/pages/prensa.vue', 'utf-8')
const caseData = readFileSync('app/utils/caseData.ts', 'utf-8')

// 1
const soloEs = Object.keys(es).filter((k) => !(k in en))
const soloEn = Object.keys(en).filter((k) => !(k in es))
ok(soloEs.length === 0, `todas las claves press.* de ES existen en EN${soloEs.length ? ` (faltan: ${soloEs.join(', ')})` : ''}`)
ok(soloEn.length === 0, `todas las claves press.* de EN existen en ES${soloEn.length ? ` (faltan: ${soloEn.join(', ')})` : ''}`)

// 2 · set aprobado (EPK §3, OK de Miriam 27-jun-2026). Cambiar una cita exige su OK, no este test.
const APROBADAS_ES = [
  'No pido garantías, pido oportunidades.',
  'Que los casos raros dejen de ser notas a pie de página y pasen a ser datos, estudios, opciones reales.',
  'Uso la IA para amplificar mi conocimiento.',
  "AI doesn't replace them — it helps me meet them halfway.",
]
const APROBADAS_EN = [
  "I'm not asking for guarantees — I'm asking for opportunities.",
  'That rare cases stop being footnotes and become data, studies, real options.',
  'I use AI to amplify my knowledge.',
  "AI doesn't replace them — it helps me meet them halfway.",
]
APROBADAS_ES.forEach((q, i) => ok(es[`quote_${i + 1}`] === q, `ES cita ${i + 1} = set aprobado`))
APROBADAS_EN.forEach((q, i) => ok(en[`quote_${i + 1}`] === q, `EN cita ${i + 1} = set aprobado`))

// 3
ok(!/verbatim/i.test(en.quotes_title ?? ''), 'EN: el título de las citas no dice «verbatim»')

// 4
for (const [lang, d] of [['ES', es], ['EN', en]] as const) {
  const guia = `${d.guide_yes} ${d.guide_no}`
  ok(!/olune/i.test(guia), `${lang}: la guía pública no escribe la palabra vetada`)
  ok(!/cient[ií]fica|scientist/i.test(d.guide_yes), `${lang}: «científica» solo aparece en el NO`)
}

// 5
ok(!pagina.includes('GoFundMeProgress'), '/prensa no lleva el contador de campaña (sin importes de recaudación)')
ok(!pagina.includes('month_updated'), '/prensa no usa la fecha fija «junio de»')

// 5b · un id de sección no se repite (un bloque duplicado por un mal pegado dejaba dos «texto listo para copiar»)
const ids = [...pagina.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1])
const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i)
ok(repetidos.length === 0, `/prensa no repite ningún id${repetidos.length ? ` (${[...new Set(repetidos)].join(', ')})` : ''}`)

// 6
const m = caseData.match(/pressAsOf:\s*'(\d{4}-\d{2}-\d{2})'/)
ok(!!m, 'caseData.pressAsOf existe (AAAA-MM-DD)')
if (m) {
  const f = new Date(`${m[1]}T00:00:00Z`)
  ok(!Number.isNaN(f.getTime()) && f.getTime() <= Date.now() + 86_400_000, `pressAsOf (${m[1]}) es una fecha válida y no futura`)
}

// 7 · la tira de medios de la home sale de press.yml (rediseño F5): antes eran 7 enlaces a mano en index.vue y se desincronizaban.
// Se reproduce AQUÍ la regla de usePrensaMedios (un medio una vez, con la primera pieza; sin paréntesis) y se compara con el código y,
// si hay build, con el HTML generado.
function leerPrensa(loc: 'es' | 'en') {
  const yml = readFileSync(`content/${loc}/press.yml`, 'utf-8')
  const piezas: { medio: string; url: string }[] = []
  for (const linea of yml.split('\n')) {
    const o = linea.match(/^\s*- outlet:\s*(.+?)\s*$/)
    if (o) { piezas.push({ medio: o[1].replace(/^['"]|['"]$/g, ''), url: '' }); continue }
    const u = linea.match(/^\s*url:\s*(\S+)\s*$/)
    if (u && piezas.length) piezas[piezas.length - 1].url = u[1]
  }
  const limpio = piezas.map((p) => ({ medio: p.medio.replace(/\s*\([^)]*\)\s*$/, '').trim(), url: p.url }))
  return limpio.filter((p, i) => limpio.findIndex((q) => q.medio === p.medio) === i)
}
const home = readFileSync('app/pages/index.vue', 'utf-8')
const tira = readFileSync('app/components/PrensaTira.vue', 'utf-8')
const compo = readFileSync('app/composables/usePrensaMedios.ts', 'utf-8')
const ymls = { es: leerPrensa('es'), en: leerPrensa('en') }
ok(ymls.es.length > 0 && ymls.en.length > 0, `content/{es,en}/press.yml listan medios (${ymls.es.length} y ${ymls.en.length})`)
ok(JSON.stringify(ymls.es.map((m) => m.medio)) === JSON.stringify(ymls.en.map((m) => m.medio)), `ES y EN tienen los mismos medios y en el mismo orden${JSON.stringify(ymls.es.map((m) => m.medio)) === JSON.stringify(ymls.en.map((m) => m.medio)) ? '' : ` (es: ${ymls.es.map((m) => m.medio).join(', ')} · en: ${ymls.en.map((m) => m.medio).join(', ')})`}`)
ok(/<PrensaTira\b/.test(home) && /queryCollection\(/.test(compo) && /press_es/.test(compo) && /press_en/.test(compo) && /usePrensaMedios\(\)/.test(tira), 'la home pinta PrensaTira, que lee press_es / press_en con queryCollection (usePrensaMedios)')
const escritos = [...ymls.es, ...ymls.en].flatMap((m) => [m.medio, m.url]).filter((x) => x && (home.includes(x) || tira.includes(x)))
ok(escritos.length === 0, `ni index.vue ni PrensaTira.vue llevan un medio o una URL de press.yml escritos a mano${escritos.length ? ` (${[...new Set(escritos)].join(', ')})` : ''}`)
ok(!/trackPress\('/.test(home), 'la home ya no llama a trackPress con un medio literal (lo hace la tira con el nombre leído)')

// 7b · en el HTML generado (si hay build): mismos medios, mismo orden y el enlace de la primera pieza de cada uno
const pub = '.output/public'
for (const [loc, fichero] of [['es', 'index.html'], ['en', 'en.html']] as const) {
  if (!existsSync(join(pub, fichero))) { console.log(`  ⚠️  sin ${pub}/${fichero}: se omite la comprobación del HTML (ejecuta antes \`pnpm exec nuxt generate\`)`); continue }
  const h = readFileSync(join(pub, fichero), 'utf-8').replace(/<script\b[\s\S]*?<\/script>/g, '')
  const franja = h.match(/<section[^>]*class="[^"]*prensa-tira[^"]*"[\s\S]*?<\/section>/)?.[0] ?? ''
  ok(franja.length > 0, `${fichero}: la tira de prensa está en el HTML`)
  const enlaces = [...franja.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*class="[^"]*prensa-tira__medio[^"]*"[^>]*>([^<]*)</g)].map((m) => ({ medio: m[2].trim(), url: m[1].replace(/&amp;/g, '&') }))
  ok(JSON.stringify(enlaces) === JSON.stringify(ymls[loc]), `${fichero}: la tira = press.yml (${ymls[loc].map((m) => m.medio).join(', ')})${JSON.stringify(enlaces) === JSON.stringify(ymls[loc]) ? '' : ` — sale: ${JSON.stringify(enlaces)}`}`)
}

if (fallos) {
  console.error(`\n❌ ${fallos} fallo(s) en la sala de prensa`)
  process.exit(1)
}
console.log('\n✅ sala de prensa en verde')
