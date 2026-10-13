// Test de que la cronología no tiene dos versiones: `content/es/timeline.yml` (lo que pinta
// /timeline) y `eventos` de `app/data/caso.json` (lo que pinta /datos) son la misma lista.
//
// La clase del fallo: caso.json lleva una COPIA de la cronología. Quien añade un hito solo al
// YAML deja /datos contando una historia más corta que /timeline, sin que nada avise.
//
// 1. Mismo número de entradas.
// 2. Mismas entradas y en el mismo orden, por fecha de texto y título en español.
// 3. Ninguna entrada repetida (fecha + título es también la clave del v-for de /timeline).
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
process.exit(fallos ? 1 : 0)
