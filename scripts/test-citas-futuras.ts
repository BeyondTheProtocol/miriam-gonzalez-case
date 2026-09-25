// Test de privacidad: nada publicado junta una fecha FUTURA con día y un lugar.
//
// Por qué: una cita futura con su sitio («pruebas la semana del 28-sep» junto a «VHIO»)
// dice dónde encontrar a Miriam, y hay acoso activo. El 25-sep-2026 el panel /datos estuvo
// a punto de publicarlo en la tarjeta, en el estado actual y en el caso.json descargable; lo
// paró una revisión a mano. Regla: una cita futura va como mucho con el MES («previsto en
// oct 2026»); el día se publica cuando ya ha pasado.
//
// Qué mira: los datos y textos fuente (app/data, public, i18n, content) y, si existe, lo
// generado por `nuxt generate` (.output/public), que es lo que de verdad se sirve.
// Una fecha con día, posterior a hoy, con un lugar a menos de VENTANA caracteres → fallo.
//
// Uso:  pnpm test:citas-futuras          (CITAS_HOY=2026-09-25 para fijar «hoy»)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const VENTANA = 160
const MAX_BYTES = 5 * 1024 * 1024
const EXT = /\.(json|html|md|txt|ts|vue)$/i

const MESES: Record<string, number> = {
  ene: 1, enero: 1, jan: 1, january: 1,
  feb: 2, febrero: 2, february: 2,
  mar: 3, marzo: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6, june: 6,
  jul: 7, julio: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, september: 9,
  oct: 10, octubre: 10, october: 10,
  nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
}
const M = Object.keys(MESES).sort((a, b) => b.length - a.length).join('|')

// Lugares donde se la puede encontrar. Nombres propios y genéricos de centro sanitario.
const LUGAR = new RegExp(
  [
    'VHIO', 'HUVH', "Vall d['’]Hebron", 'Vall d Hebron', 'CETIR', 'Morales Meseguer',
    'Quir[oó]n', 'hospital', 'cl[ií]nica', 'clinic', 'Barcelona', 'Murcia', 'Madrid',
  ].join('|'),
  'i',
)

type Fecha = { y: number, m: number, d: number, txt: string, idx: number }

function fechas(texto: string, hoy: Date): Fecha[] {
  const out: Fecha[] = []
  const add = (y: number | undefined, m: number, d: number, txt: string, idx: number) => {
    if (!m || d < 1 || d > 31) return
    out.push({ y: y ?? hoy.getUTCFullYear(), m, d, txt, idx })
  }
  // ISO con día: 2026-10-01
  for (const x of texto.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g))
    add(+x[1], +x[2], +x[3], x[0], x.index!)
  // 1-oct, 1 oct 2026, 1 de octubre (de 2026), semana del 28-sep
  for (const x of texto.matchAll(new RegExp(`\\b(\\d{1,2})(?:-| de | )(${M})\\b\\.?(?:(?:-| de | )(20\\d\\d))?`, 'gi')))
    add(x[3] ? +x[3] : undefined, MESES[x[2].toLowerCase()], +x[1], x[0], x.index!)
  // Oct 1, October 1(st), 2026
  for (const x of texto.matchAll(new RegExp(`\\b(${M})\\.? (\\d{1,2})(?:st|nd|rd|th)?\\b(?:,? (20\\d\\d))?`, 'gi')))
    add(x[3] ? +x[3] : undefined, MESES[x[1].toLowerCase()], +x[2], x[0], x.index!)
  // Sin año se asume el de hoy. Límite conocido: «semana del 28» sin mes no se detecta.
  return out
}

function esFutura(f: Fecha, hoy: Date): boolean {
  const t = Date.UTC(f.y, f.m - 1, f.d)
  const h = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())
  return t > h
}

export function hallazgos(texto: string, hoy: Date): string[] {
  const res: string[] = []
  for (const f of fechas(texto, hoy)) {
    if (!esFutura(f, hoy)) continue
    const ini = Math.max(0, f.idx - VENTANA)
    const trozo = texto.slice(ini, f.idx + f.txt.length + VENTANA)
    const lugar = trozo.match(LUGAR)
    if (lugar) res.push(`«${f.txt}» junto a «${lugar[0]}»: …${trozo.replace(/\s+/g, ' ').slice(0, 220)}…`)
  }
  return res
}

function* ficheros(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const n of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, n.name)
    if (n.isDirectory()) {
      if (n.name === 'node_modules' || n.name.startsWith('.git')) continue
      yield* ficheros(p)
    }
    else if (EXT.test(n.name) && statSync(p).size <= MAX_BYTES) yield p
  }
}

// ── autotest de la lógica (fecha fija, sin depender del repo) ──
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }
const H = new Date(Date.UTC(2026, 8, 25))
ok(hallazgos('Pruebas la semana del 28-sep en el VHIO.', H).length === 1, 'detecta «28-sep» + VHIO')
ok(hallazgos('Primera dosis el 1-oct (Vall d’Hebron).', H).length === 1, 'detecta «1-oct» + Vall d’Hebron')
ok(hallazgos('{"inicio":"2026-10-01","centro":"HUVH"}', H).length === 1, 'detecta ISO futura + HUVH en JSON')
ok(hallazgos('First dose on Oct 1 at the hospital.', H).length === 1, 'detecta «Oct 1» + hospital (EN)')
ok(hallazgos('Biopsia del 18-ago en el VHIO.', H).length === 0, 'una fecha PASADA con lugar no cuenta')
ok(hallazgos('Primera dosis prevista en oct 2026 (VHIO).', H).length === 0, 'solo el MES no cuenta')
ok(hallazgos('Revisión el 2-oct.', H).length === 0, 'fecha futura SIN lugar no cuenta')

// ── el repo ──
const hoy = process.env.CITAS_HOY ? new Date(`${process.env.CITAS_HOY}T00:00:00Z`) : new Date()
const raices = ['app/data', 'app/pages', 'app/components', 'public', 'i18n', 'content', '.output/public']
let vistos = 0
for (const r of raices) {
  for (const f of ficheros(r)) {
    vistos++
    for (const h of hallazgos(readFileSync(f, 'utf-8'), hoy)) ok(false, `${f}: ${h}`)
  }
}
ok(vistos > 0, `se revisaron ${vistos} ficheros (${raices.filter(existsSync).join(', ')})`)

console.log(fallos ? `\n❌ ${fallos} fallo(s): una cita futura con día va como mucho con el mes` : '\n✅ ninguna cita futura con día junto a un lugar')
process.exit(fallos ? 1 : 0)
