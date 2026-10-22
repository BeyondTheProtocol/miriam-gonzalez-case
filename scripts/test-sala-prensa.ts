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
// 7. La tira de medios de la home = content/es/press.yml (mismos medios únicos, mismo orden, y el enlace de la primera pieza de cada medio).
//
// Uso:  pnpm test:sala-prensa
import { readFileSync } from 'node:fs'

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

// 7 · la tira de medios de la home es copia a mano de content/es/press.yml: mismos medios y
// mismo orden curado (una pieza añadida solo a la sala dejaba la home atrás sin aviso).
const yml = readFileSync('content/es/press.yml', 'utf-8')
// La tira lista medios; la sala, piezas: un medio con varias piezas sale una vez (primera aparición) y la home enlaza su primera pieza.
const piezas: { medio: string; url: string }[] = []
for (const linea of yml.split('\n')) {
  const o = linea.match(/^\s*- outlet:\s*(.+?)\s*$/)
  if (o) { piezas.push({ medio: o[1].replace(/^['"]|['"]$/g, ''), url: '' }); continue }
  const u = linea.match(/^\s*url:\s*(\S+)\s*$/)
  if (u && piezas.length) piezas[piezas.length - 1].url = u[1]
}
const primeras = piezas.filter((p, i) => piezas.findIndex((q) => q.medio === p.medio) === i)
const medios = primeras.map((p) => p.medio)
const home = readFileSync('app/pages/index.vue', 'utf-8')
const tira = [...home.matchAll(/trackPress\('([^']+)'\)/g)].map((x) => x[1])
ok(medios.length > 0, `content/es/press.yml lista medios (${medios.length})`)
ok(
  JSON.stringify(tira) === JSON.stringify(medios),
  `la tira de la home = press.yml, en el mismo orden${JSON.stringify(tira) === JSON.stringify(medios) ? '' : ` (home: ${tira.join(', ')} · yml: ${medios.join(', ')})`}`,
)
const sinEnlace = primeras.map((p) => p.url).filter((u) => !u || !home.includes(u))
ok(sinEnlace.length === 0, `el enlace de la primera pieza de cada medio de press.yml está en la home${sinEnlace.length ? ` (faltan: ${sinEnlace.join(', ')})` : ''}`)

if (fallos) {
  console.error(`\n❌ ${fallos} fallo(s) en la sala de prensa`)
  process.exit(1)
}
console.log('\n✅ sala de prensa en verde')
