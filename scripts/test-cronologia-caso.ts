// Test de que la cronología no tiene dos versiones: `content/es/timeline.yml` (lo que pinta
// /timeline) y `eventos` de `app/data/caso.json` (lo que pinta /datos) son la misma lista.
//
// La clase del fallo: caso.json lleva una COPIA de la cronología. Quien añade un hito solo al
// YAML deja /datos contando una historia más corta que /timeline, sin que nada avise.
//
// 1. Mismo número de entradas.
// 2. Mismas entradas y en el mismo orden, por fecha de texto y título en español.
// 3. Ninguna entrada repetida (fecha + título es también la clave del v-for de /timeline).
// 4. Una sola voz: tercera persona fuera de comillas, en ES y EN.
//
// Uso:  pnpm test:cronologia-caso
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

type Entrada = { date: string; title: string }
type Evento = { fecha_texto: string; titulo: { es: string } }

const yml = parse(readFileSync('content/es/timeline.yml', 'utf-8')) as { entries: Entrada[] }
const caso = JSON.parse(readFileSync('app/data/caso.json', 'utf-8')) as { eventos: Evento[] }

const clave = (fecha: string, titulo: string) => `${String(fecha).trim()} · ${String(titulo).trim()}`
const deYaml = yml.entries.map((e) => clave(e.date, e.title))
const deCaso = caso.eventos.map((e) => clave(e.fecha_texto, e.titulo.es))

// 1
ok(deYaml.length > 0, `timeline.yml tiene entradas (${deYaml.length})`)
ok(deYaml.length === deCaso.length, `mismo número de entradas (timeline.yml ${deYaml.length} · caso.json ${deCaso.length})`)

// 2
const soloYaml = deYaml.filter((c) => !deCaso.includes(c))
const soloCaso = deCaso.filter((c) => !deYaml.includes(c))
ok(soloYaml.length === 0, `todo lo de timeline.yml está en caso.json${soloYaml.length ? `; faltan: ${soloYaml.join(' | ')}` : ''}`)
ok(soloCaso.length === 0, `todo lo de caso.json está en timeline.yml${soloCaso.length ? `; sobran: ${soloCaso.join(' | ')}` : ''}`)
const primeraDistinta = deYaml.findIndex((c, i) => c !== deCaso[i])
ok(primeraDistinta === -1, `mismo orden${primeraDistinta === -1 ? '' : ` (difieren desde la nº ${primeraDistinta + 1}: «${deYaml[primeraDistinta]}» ≠ «${deCaso[primeraDistinta]}»)`}`)

// 3
const repetidas = deYaml.filter((c, i) => deYaml.indexOf(c) !== i)
ok(repetidas.length === 0, `ninguna entrada repetida${repetidas.length ? `: ${repetidas.join(' | ')}` : ''}`)

console.log(fallos ? `\n❌ ${fallos} fallo(s): si has tocado la cronología, sincroniza \`eventos\` de app/data/caso.json` : '\n✅ cronología y caso.json coinciden')
// 4. Una sola voz (Miriam, 24-oct-2026: «a veces habla de mí en tercera persona y luego "hemos
//    intentado"»). La cronología se narra en tercera persona; lo que ella dijo en primera va entre
//    comillas («…» o “…”). Fuera de comillas no puede quedar ninguna forma de primera persona.
const sinCitas = (t: string) => String(t ?? '').replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, '')
const PRIMERA: Record<string, RegExp> = {
  es: /\b(hemos|he|mi|mis|me|nos|nuestr[oa]s?|tengo|estoy|empiezo|cuento|yo)\b/i,
  en: /\b(I|I've|I'm|my|we|we've|our|us)\b/,
}
for (const lang of ['es', 'en'] as const) {
  const d = parse(readFileSync(`content/${lang}/timeline.yml`, 'utf-8')) as { entries: (Entrada & { description?: string })[] }
  const malas = d.entries.filter((e) => PRIMERA[lang]!.test(sinCitas(e.title)) || PRIMERA[lang]!.test(sinCitas(e.description ?? '')))
  ok(malas.length === 0, `${lang}: todo en tercera persona fuera de comillas${malas.length ? `; en primera: ${malas.map((e) => e.date).join(' | ')}` : ''}`)
}

process.exit(fallos ? 1 : 0)
