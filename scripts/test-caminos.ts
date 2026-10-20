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
// 6. La rejilla ≥ 1024 px (12 columnas): tesela sin huecos ni solapes, una celda por tarjeta, en el orden del DOM.
// 7. Destinos: el botón clínico aterriza en «De un vistazo»; research y el h5ad, con rol de investigador.
// 8. Prensa y tech (PR 2): el paso que pasa a acceso conserva su texto publicado, sale de la lista de
//    pasos (no se repite) y la lista se queda con sus pasos de acción.
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
const etiqueta = (a: Acceso) => (a.tipo === 'herramienta' ? a.etiqueta ?? `nav.${a.enlace.key}` : a.etiqueta)
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

console.log('6. Rejilla ≥ 1024 px (12 columnas)')
const bloque = css.match(/@media \(min-width: 1024px\) \{\s*\.pathway-grid \{ grid-template-columns: repeat\((\d+), minmax\(0, 1fr\)\); \}([\s\S]*?)\n {2}\}/)
ok(!!bloque, 'encuentro la rejilla de .pathway-grid a ≥ 1024 px')
const COLS = Number(bloque?.[1] ?? 0)
ok(COLS === 12, `12 columnas (${COLS})`)
const pos = [...(bloque?.[2] ?? '').matchAll(/\.pathway-card--([a-z]+)\s*\{\s*grid-column:\s*(\d+)\s*\/\s*span\s*(\d+);\s*grid-row:\s*(\d+)(?:\s*\/\s*span\s*(\d+))?;\s*\}/g)]
  .map((m) => ({ id: m[1]!, c: Number(m[2]), cs: Number(m[3]), r: Number(m[4]), rs: Number(m[5] ?? 1) }))
const filasN = Math.max(0, ...pos.map((x) => x.r + x.rs - 1))
const celdas: string[][] = Array.from({ length: filasN }, () => Array(COLS).fill(''))
let solapes = 0
for (const x of pos) for (let r = x.r; r < x.r + x.rs; r++) for (let c = x.c; c < x.c + x.cs; c++) {
  if (c > COLS || r > filasN) { solapes++; continue }
  if (celdas[r - 1]![c - 1]) solapes++
  celdas[r - 1]![c - 1] = x.id
}
ok(solapes === 0, `ninguna tarjeta se sale ni se solapa (${solapes})`)
ok(celdas.every((f) => f.every(Boolean)), `sin celdas vacías (${filasN} filas × ${COLS})`)
const homePaths = caminosVue.slice(caminosVue.indexOf('const homePaths'))
const ids = [...homePaths.matchAll(/\n {4}id: '([a-z]+)'/g)].map((m) => m[1])
ok(ids.length === 7, `7 caminos en la home (${ids.join(', ')})`)
ok(JSON.stringify(pos.map((x) => x.id).sort()) === JSON.stringify([...ids].sort()), 'cada tarjeta tiene su sitio en la rejilla, y solo ellas')
// El orden visual (fila a fila, de izquierda a derecha, por primera aparición) es el del DOM = el del tabulador.
ok(JSON.stringify(celdas.flat().filter((x, i, a) => a.indexOf(x) === i)) === JSON.stringify(ids), 'el orden visual de la rejilla es el del DOM')
const fila2 = celdas[1] ?? []
ok(fila2.indexOf('research') === fila2.lastIndexOf('clinician') + 1, 'clínica y single-cell, lado a lado en la fila 2')

console.log('7. Destinos')
ok(/linkProps: \{ to: localePath\(\{ name: 'ciencia' \}\) \+ '\?nivel=pro#snapshot-title' \}/.test(caminosVue), 'el botón clínico va a /ciencia?nivel=pro#snapshot-title («De un vistazo»)')
ok(/id: 'research'[\s\S]*?linkProps: \{ to: localePath\(\{ name: 'contacto', query: \{ role: 'researcher' \} \}\) \}/.test(caminosVue), 'el botón de research va a /contacto con rol de investigador')
ok(/aria-labelledby="xp-pide-t"[\s\S]*?localePath\(\{ name: 'contacto', query: \{ role: 'researcher' \} \}\)/.test(explorador), 'el h5ad del explorador va a /contacto con rol de investigador')

console.log('8. Prensa y tech: el paso reubicado no cambia de texto')
// Textos publicados antes del PR 2 (main, 20-oct-2026): pasan de la lista de pasos a su acceso, igual.
const REUBICADOS = {
  press_acceso: { es: 'Datos del caso listos para citar', en: 'Case data ready to cite', lista: 'press_steps' },
  tech_acceso: { es: 'Repo público y documentación', en: 'Public repo and documentation', lista: 'tech_steps' },
} as const
for (const [clave, r] of Object.entries(REUBICADOS)) {
  for (const [loc, d] of [['es', pes], ['en', pen]] as const) {
    ok(d[clave] === r[loc], `${loc}: ${clave} es el texto publicado («${r[loc]}»)`)
    const lista = d[r.lista] as string[]
    ok(Array.isArray(lista) && lista.length === 2 && !lista.includes(r[loc]), `${loc}: ${r.lista} se queda con 2 pasos y sin repetir el acceso`)
  }
}
ok(ACCESOS.tech.length === 1 && ACCESOS.tech[0]?.tipo === 'externo', 'tech: un acceso, externo (el repo)')
ok(ACCESOS.press.length === 1 && ACCESOS.press[0]?.tipo === 'herramienta' && ACCESOS.press[0].enlace.key === 'data', 'prensa: un acceso, a /datos')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ caminos de la home en orden')
process.exit(fallos ? 1 : 0)
