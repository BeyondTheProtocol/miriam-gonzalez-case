// Frenos de los accesos directos de «Elige tu camino» (plan del 20-oct-2026, Miriam: «en la home la
// gente sepa qué mirar… acceso directo a las diferentes herramientas porque /ciencia es muy largo»).
//
// La clase del fallo: la lista de accesos crece, apunta a una herramienta que no existe o con la puerta
// cerrada, se le cuela léxico que concluye («dianas», «mejor», «segunda opinión»), la rejilla deja una
// tarjeta fuera de su área o una clave queda sin traducir. Nada de eso se ve hasta que alguien entra.
//
// 1. De 1 a 3 accesos por camino; herramientas ∈ HERRAMIENTAS; roles ∈ VALID_ROLES de /contacto.
// 2. Puerta del explorador cerrada → su hueco lo ocupa Célula a célula (siempre visible), sin hueco.
// 3. En «research», /datos nunca va primero (con la puerta abierta y cerrada).
// 4. Claves `pathways` iguales en ES y EN; las etiquetas de los accesos existen en los dos.
// 5. Léxico prohibido en las tarjetas profesionales (comité médico, 20-oct), ES y EN.
// 6. La rejilla ≥ 1024 px: cada área es un rectángulo y sus nombres son los ids de las tarjetas.
// 7. Destinos: el botón clínico aterriza en «De un vistazo»; research y el h5ad, con rol de investigador.
//
// Uso:  pnpm test:caminos
import { readFileSync } from 'node:fs'
import { ACCESOS, accesosDe, type Acceso } from '../app/utils/caminos'
import { HERRAMIENTAS, NAV, type EnlaceNav } from '../app/utils/navegacion'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8'))
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8'))
const contacto = readFileSync('app/pages/contacto.vue', 'utf-8')
const caminosVue = readFileSync('app/components/VisitorPathways.vue', 'utf-8')
const css = readFileSync('app/assets/css/main.css', 'utf-8')
const explorador = readFileSync('app/pages/celula-a-celula-explorar.vue', 'utf-8')

const clavesHerr = new Set(HERRAMIENTAS.map((h) => h.key))
const roles = (contacto.match(/const VALID_ROLES = \[([^\]]*)\]/)?.[1] ?? '').match(/'([a-z]+)'/g)?.map((s) => s.slice(1, -1)) ?? []
const etiqueta = (a: Acceso) => (a.tipo === 'herramienta' ? `nav.${a.enlace.key}` : a.etiqueta)
const get = (o: Record<string, unknown>, ruta: string) => ruta.split('.').reduce<unknown>((x, k) => (x as Record<string, unknown> | undefined)?.[k], o)
const todas = (_e: EnlaceNav) => true
const sinExplorador = (e: EnlaceNav) => e.key !== 'cell_explorer'

console.log('1. Accesos por camino')
ok(roles.length > 0, `VALID_ROLES leído de contacto.vue (${roles.join(', ')})`)
for (const [camino, lista] of Object.entries(ACCESOS)) {
  ok(lista.length >= 1 && lista.length <= 3, `${camino}: entre 1 y 3 accesos (${lista.length})`)
  for (const a of lista) {
    if (a.tipo === 'herramienta') ok(clavesHerr.has(a.enlace.key), `${camino}: «${a.enlace.key}» es una herramienta`)
    else if (a.tipo === 'contacto') ok(roles.includes(a.rol), `${camino}: el rol «${a.rol}» existe en /contacto`)
    else ok(a.href.startsWith('https://'), `${camino}: el externo es https (${a.href})`)
  }
}

console.log('2. Puerta del explorador')
for (const camino of Object.keys(ACCESOS) as (keyof typeof ACCESOS)[]) {
  const abierta = accesosDe(camino, todas)
  const cerrada = accesosDe(camino, sinExplorador)
  ok(abierta.length === ACCESOS[camino].length && cerrada.length === ACCESOS[camino].length, `${camino}: mismo número de accesos con la puerta abierta y cerrada`)
  ok(cerrada.every((a) => a && !(a.tipo === 'herramienta' && a.enlace.key === 'cell_explorer')), `${camino}: con la puerta cerrada no hay explorador ni hueco`)
}
const researchCerrada = accesosDe('research', sinExplorador)
ok(researchCerrada[0]?.tipo === 'herramienta' && researchCerrada[0].enlace.key === NAV.cellByCell.key, 'research con la puerta cerrada empieza por Célula a célula')
ok(accesosDe('research', todas)[0]?.tipo === 'herramienta' && (accesosDe('research', todas)[0] as { enlace: EnlaceNav }).enlace.key === 'cell_explorer', 'research con la puerta abierta empieza por el explorador')

console.log('3. /datos nunca primero en research')
for (const [nombre, vis] of [['abierta', todas], ['cerrada', sinExplorador]] as const) {
  const p = accesosDe('research', vis)[0]
  ok(!(p?.tipo === 'herramienta' && p.enlace.key === 'data'), `puerta ${nombre}: el primero de research no es /datos`)
}

console.log('4. Claves ES/EN')
const pes = es.pathways as Record<string, unknown>
const pen = en.pathways as Record<string, unknown>
const soloEs = Object.keys(pes).filter((k) => !(k in pen))
const soloEn = Object.keys(pen).filter((k) => !(k in pes))
ok(soloEs.length === 0 && soloEn.length === 0, `mismas claves pathways.* en ES y EN${soloEs.length + soloEn.length ? ` (solo ES: ${soloEs.join(', ')}; solo EN: ${soloEn.join(', ')})` : ''}`)
for (const k of Object.keys(pes)) {
  if (Array.isArray(pes[k])) ok(Array.isArray(pen[k]) && (pen[k] as unknown[]).length === (pes[k] as unknown[]).length, `pathways.${k}: misma longitud en ES y EN`)
}
const usadas = new Set<string>(['pathways.accesos_aria', 'a11y.new_tab'])
for (const lista of Object.values(ACCESOS)) for (const a of lista) usadas.add(etiqueta(a))
usadas.add(`nav.${NAV.cellByCell.key}`) // el sustituto con la puerta cerrada
for (const k of ['research_title', 'research_desc', 'research_cta', 'research_caption']) usadas.add(`pathways.${k}`)
for (const clave of usadas) {
  ok(typeof get(es, clave) === 'string' && typeof get(en, clave) === 'string', `«${clave}» existe en ES y EN`)
}
ok(!('clinician_steps' in pes) && !/clinician_steps/.test(caminosVue), 'los pasos clínicos publicados ya no existen (se borran con el plan)')

console.log('5. Léxico de las tarjetas profesionales')
const PROHIBIDO: [RegExp, string][] = [
  [/\bdianas?\b|\btargets?\b/i, 'dianas/targets'],
  [/perfil molecular|molecular profile/i, 'perfil molecular'],
  [/\bmejor(es)?\b|\bbest\b/i, 'mejor/best'],
  [/candidat/i, 'candidato/a'],
  [/\btu caso\b|\byour case\b/i, 'tu caso'],
  [/segunda opini[oó]n|second opinion/i, 'segunda opinión (el formulario no es ese proceso)'],
  [/recomend|recommend/i, 'recomendar'],
]
for (const [loc, d] of [['ES', pes], ['EN', pen]] as const) {
  const textos = Object.entries(d).filter(([k]) => /^(clinician|research)_/.test(k)).map(([k, v]) => [k, JSON.stringify(v)] as const)
  ok(textos.length >= 8, `${loc}: hay ${textos.length} textos clinician_/research_ que revisar`)
  for (const [re, nombre] of PROHIBIDO) {
    const malos = textos.filter(([, v]) => re.test(v)).map(([k]) => k)
    ok(malos.length === 0, `${loc}: sin «${nombre}»${malos.length ? ` (en ${malos.join(', ')})` : ''}`)
  }
}

console.log('6. Rejilla ≥ 1024 px')
const bloque = css.match(/@media \(min-width: 1024px\) \{\s*\.pathway-grid \{[^}]*grid-template-areas:([^;]*);/)
ok(!!bloque, 'encuentro grid-template-areas de .pathway-grid a ≥ 1024 px')
const filas = (bloque?.[1] ?? '').match(/'([^']*)'/g)?.map((f) => f.slice(1, -1).trim().split(/\s+/)) ?? []
ok(filas.length > 0 && filas.every((f) => f.length === 4), `todas las filas tienen 4 columnas (${filas.length} filas)`)
const nombres = [...new Set(filas.flat())]
ok(!nombres.includes('.'), 'sin celdas vacías')
for (const n of nombres) {
  const celdas = filas.flatMap((f, r) => f.map((x, c) => [x, r, c] as const)).filter(([x]) => x === n)
  const r0 = Math.min(...celdas.map(([, r]) => r)), r1 = Math.max(...celdas.map(([, r]) => r))
  const c0 = Math.min(...celdas.map(([, , c]) => c)), c1 = Math.max(...celdas.map(([, , c]) => c))
  ok(celdas.length === (r1 - r0 + 1) * (c1 - c0 + 1), `el área «${n}» es un rectángulo`)
  ok(new RegExp(`\\.pathway-card--${n}\\s*\\{\\s*grid-area:\\s*${n};`).test(css), `.pathway-card--${n} tiene su grid-area`)
}
const homePaths = caminosVue.slice(caminosVue.indexOf('const homePaths'))
const ids = [...homePaths.matchAll(/\n {4}id: '([a-z]+)'/g)].map((m) => m[1])
ok(ids.length === 7, `7 caminos en la home (${ids.join(', ')})`)
ok(JSON.stringify([...nombres].sort()) === JSON.stringify([...ids].sort()), 'las áreas de la rejilla son exactamente los ids de las tarjetas')
// El orden visual (fila a fila, de izquierda a derecha, por primera aparición) es el del DOM = el del tabulador.
ok(JSON.stringify(filas.flat().filter((x, i, a) => a.indexOf(x) === i)) === JSON.stringify(ids), 'el orden visual de la rejilla es el del DOM')

console.log('7. Destinos')
ok(/linkProps: \{ to: localePath\(\{ name: 'ciencia' \}\) \+ '\?nivel=pro#snapshot-title' \}/.test(caminosVue), 'el botón clínico va a /ciencia?nivel=pro#snapshot-title («De un vistazo»)')
ok(/id: 'research'[\s\S]*?linkProps: \{ to: localePath\(\{ name: 'contacto', query: \{ role: 'researcher' \} \}\) \}/.test(caminosVue), 'el botón de research va a /contacto con rol de investigador')
ok(/aria-labelledby="xp-pide-t"[\s\S]*?localePath\(\{ name: 'contacto', query: \{ role: 'researcher' \} \}\)/.test(explorador), 'el h5ad del explorador va a /contacto con rol de investigador')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ caminos de la home en orden')
process.exit(fallos ? 1 : 0)
