// Test de «Próximos pasos» de /celula-a-celula (public/celula/pasos.json + app/utils/celulaPasos.ts).
//
// Por qué existe (17-oct-2026): public/ se sirve tal cual y la preview también es pública, y Polaris
// cambiará el `estado` de los pasos solo. Tres frenos:
//   1. el CONTRATO del JSON: solo los campos permitidos (ninguna fuente ni ruta interna), estados del
//      enum, ES y EN no vacíos, ids únicos, `termino` existente en el glosario;
//   2. privacidad y tono: ninguna fecha con día (salvo `actualizado`, que no es futura), ningún lugar,
//      nombre de persona o centro, el muro de léxico (científica/scientist, Olune) y ninguna promesa
//      de curación ni de plazo;
//   3. la función pura: la barra cuenta SOLO los `hecho`; `en_curso` no suma; el texto «3 de 8 pasos dados».
// No exige que haya un «en curso» ni que los pasos vayan en un orden. Uso: pnpm test:celula-pasos
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ESTADOS_PASO, fechaActualizado, resumenPasos, textoProgreso, type PasosJson } from '../app/utils/celulaPasos'
import { GLOSARIO_CELULA } from '../app/utils/celulaGlosario'

const RUTA = join(import.meta.dirname, '..', 'public', 'celula', 'pasos.json')
const crudo = readFileSync(RUTA, 'utf8')
const real = JSON.parse(crudo) as PasosJson
let fallos = 0
let hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => {
  hechos++
  if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) }
}

/* ── 1 · contrato ── */
ok('campos de primer nivel: version, actualizado, pasos', JSON.stringify(Object.keys(real)) === '["version","actualizado","pasos"]', Object.keys(real).join(','))
ok('`actualizado` es AAAA-MM-DD y no es futura', /^\d{4}-\d{2}-\d{2}$/.test(real.actualizado) && real.actualizado <= new Date().toISOString().slice(0, 10), real.actualizado)
ok('hay pasos', Array.isArray(real.pasos) && real.pasos.length >= 2)
const PERMITIDOS = new Set(['id', 'estado', 'titulo', 'detalle', 'termino'])
const ids = new Set<string>()
for (const p of real.pasos) {
  ok(`${p.id}: solo campos permitidos (sin fuente ni rutas)`, Object.keys(p).every((k) => PERMITIDOS.has(k)), Object.keys(p).join(','))
  ok(`${p.id}: id único y en minúsculas`, /^[a-z0-9_]+$/.test(p.id) && !ids.has(p.id))
  ids.add(p.id)
  ok(`${p.id}: estado del enum`, (ESTADOS_PASO as string[]).includes(p.estado), p.estado)
  for (const campo of ['titulo', 'detalle'] as const) {
    ok(`${p.id}.${campo}: ES y EN no vacíos`, (['es', 'en'] as const).every((l) => typeof p[campo][l] === 'string' && p[campo][l].trim().length > 3))
  }
  if (p.termino) ok(`${p.id}: el término «${p.termino}» existe en el glosario`, p.termino in GLOSARIO_CELULA)
}

/* ── 2 · privacidad, léxico y tono (sobre todo el texto publicado) ── */
const MES = 'ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|oct|octubre|nov|noviembre|dic|diciembre|jan|january|february|march|april|june|july|august|september|october|november|december|dec'
const sinActualizado = crudo.replace(/"actualizado":\s*"[^"]*"/, '')
ok('ninguna fecha con día (ISO, «21 oct», «Oct 21») salvo `actualizado`',
  !new RegExp(`\\b20\\d\\d-\\d\\d-\\d\\d\\b|\\b\\d{1,2}(-| de | )(${MES})\\b|\\b(${MES})\\.? \\d{1,2}\\b`, 'i').test(sinActualizado))
ok('ningún lugar ni centro (VHIO, Vall d’Hebron, Dana-Farber, Boston, Zúrich, hospital…)',
  !/VHIO|Vall d['’]Hebron|Dana|Farber|Boston|Z[uú]rich|CHUV|Murcia|Barcelona|Madrid|hospital|cl[ií]nica\b/i.test(crudo))
ok('ningún nombre de persona del equipo médico o de laboratorio', !/Paloma|Cejas|Esmeralda|Borrell|Kernis|Victor|Alby|Dr\.|Dra\./i.test(crudo))
ok('muro de léxico: nada de científica/scientist/Olune', !/cient[ií]fica|scientist|olune/i.test(crudo))
ok('sin promesas: ni curación, ni plazos («pronto», «en unas semanas»), ni garantías',
  !/\bcura(ci[oó]n)?\b|\bcure\b|\bcured\b|pronto|\bsoon\b|en (unas|pocas) semanas|within weeks|garantiz|guarantee/i.test(crudo))
ok('sin rutas internas ni ficheros ni códigos de ensayo', !/\.md\b|\/Users|Polaris|claudecode|NCT\d/i.test(crudo))
ok('sin guion largo (tell de IA en español)', !/—/.test(crudo))

/* ── 3 · la función pura ── */
const mk = (...e: string[]) => e.map((estado, i) => ({ id: `p${i}`, estado })) as never[]
ok('cuenta solo los hecho', resumenPasos(mk('hecho', 'hecho', 'hecho', 'pendiente', 'pendiente', 'pendiente', 'pendiente', 'pendiente')).hechos === 3)
ok('en_curso se cuenta aparte y NO suma a la barra', (() => {
  const r = resumenPasos(mk('hecho', 'en_curso', 'pendiente'))
  return r.hechos === 1 && r.enCurso === 1 && r.pendientes === 1 && r.total === 3
})())
ok('lista vacía no rompe', resumenPasos([]).total === 0 && resumenPasos([]).hechos === 0)
ok('texto ES «3 de 8 pasos dados»', textoProgreso({ hechos: 3, total: 8 }, 'es') === '3 de 8 pasos dados')
ok('texto EN «3 of 8 steps taken»', textoProgreso({ hechos: 3, total: 8 }, 'en') === '3 of 8 steps taken')
ok('singular ES y EN', textoProgreso({ hechos: 1, total: 1 }, 'es') === '1 de 1 paso dado' && textoProgreso({ hechos: 1, total: 1 }, 'en') === '1 of 1 step taken')
ok('fecha en lenguaje llano ES y EN', fechaActualizado('2026-10-17', 'es') === '17 de octubre de 2026' && fechaActualizado('2026-10-17', 'en') === '17 October 2026')
const r = resumenPasos(real.pasos)
ok('el JSON publicado: hechos + en curso + pendientes = total', r.hechos + r.enCurso + r.pendientes === r.total, JSON.stringify(r))

console.log(fallos ? `\n❌ ${fallos} fallo(s) de ${hechos}` : `✅ ${hechos} comprobaciones: ${textoProgreso(r, 'es')} (${r.enCurso} en curso)`)
process.exit(fallos ? 1 : 0)
