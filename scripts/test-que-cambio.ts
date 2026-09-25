// Test de la hoja «qué cambió» de /datos (cambiosEntre, dosUltimas en app/utils/datosCaso.ts).
//
// 1. Con el caso.json real: compara las dos últimas analíticas, solo pruebas con valor en ambas.
// 2. Orden por tamaño del cambio en proporción; el ×LSN usa el límite de CADA informe.
// 3. Fail-closed: sin valor en una de las dos fechas, la prueba no sale; con 0, sin porcentaje.
//
// Uso:  pnpm test:que-cambio
import { readFileSync } from 'node:fs'
import { cambiosEntre, dosUltimas, rcvComparable, RCV, unidadTxt, type Analito } from '../app/utils/datosCaso.ts'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// 1
const caso = JSON.parse(readFileSync('app/data/caso.json', 'utf-8'))
const grupos = caso.analiticas.grupos as Record<string, { analitos: Analito[] }>
const par = dosUltimas(grupos)
ok(!!par && par[0] < par[1], `dos fechas en orden (${par?.join(' → ')})`)
const cs = cambiosEntre(grupos, par![0], par![1])
ok(cs.length > 0, `hay pruebas comunes (${cs.length})`)
ok(cs.every((c) => c.antes.f === par![0] && c.ahora.f === par![1]), 'cada cambio es entre esas dos fechas exactas')

// 2
const pesos = cs.map((c) => (c.razon == null ? -1 : Math.abs(Math.log(c.razon))))
ok(pesos.every((p, i) => i === 0 || pesos[i - 1]! >= p), 'ordenados de mayor a menor cambio')
const P = (f: string, v: number, hi: number | null) => ({ f, v, lo: 0, hi, ref_de: 'informe' as const, fuera: null })
const g2 = { g: { analitos: [
  { key: 'x', nombre: 'X', unidad: 'U/L', ref: null, puntos: [P('2026-01-01', 90, 30), P('2026-01-09', 45, 45)] },
  { key: 'y', nombre: 'Y', unidad: 'U/L', ref: null, puntos: [P('2026-01-01', 10, 10), P('2026-01-09', 11, 10)] },
  { key: 'z', nombre: 'Z', unidad: 'U/L', ref: null, puntos: [P('2026-01-09', 5, 10)] },
  { key: 'w', nombre: 'W', unidad: 'U/L', ref: null, puntos: [P('2026-01-01', 0, 10), P('2026-01-09', 3, 10)] },
] } }
const c2 = cambiosEntre(g2, '2026-01-01', '2026-01-09')
ok(c2[0]?.a.key === 'x' && c2[1]?.a.key === 'y', 'el mayor cambio en proporción va primero')
ok(c2[0]?.lsn?.[0] === 3 && c2[0]?.lsn?.[1] === 1, '×LSN con el límite de cada informe (90/30 = 3×, 45/45 = 1×)')

// 3
ok(!c2.some((c) => c.a.key === 'z'), 'sin valor en una fecha, la prueba no sale')
ok(c2[c2.length - 1]?.a.key === 'w' && c2[c2.length - 1]?.razon === null, 'con valor 0, sin porcentaje y al final')
ok(dosUltimas({ g: { analitos: [g2.g.analitos[2]!] } }) === null, 'con una sola fecha no hay comparación')

// 4 · RCV: los valores del consenso y la comparabilidad fail-closed
ok(RCV.ca153?.min === 19 && RCV.ca153?.max === 34 && RCV.cea?.min === 30 && RCV.cea?.max === 40, 'RCV del consenso SEQC/SEOM 2021 (CA 15-3 19-34 %, CEA 30-40 %)')
const Q = (hi: number | null, ref: 'informe' | 'banda' = 'informe') => ({ f: '2026-01-01', v: 1, lo: 0, hi, ref_de: ref, fuera: null })
ok(rcvComparable(Q(35), Q(35)), 'mismo rango impreso en los dos informes: comparable')
ok(!rcvComparable(Q(5, 'banda'), Q(3.5)), 'un informe sin rango (banda) o rangos distintos: no comparable')
ok(!rcvComparable(Q(35), Q(23.5)), 'rangos distintos (otro laboratorio o método): no comparable')
ok(!rcvComparable(Q(null), Q(null)), 'sin rango: no comparable')
const ca = cs.find((c) => c.a.key === 'ca153'), cea = cs.find((c) => c.a.key === 'cea')
ok(!!ca && rcvComparable(ca.antes, ca.ahora), 'con el caso real, el CA 15-3 del 8 al 16-sep es comparable (mismo rango 0-35)')
ok(!!cea && !rcvComparable(cea.antes, cea.ahora), 'con el caso real, el CEA no (5 frente a 3,5): no se pinta la banda')

// 5 · unidad mostrada con «×», no con la letra x
ok(unidadTxt('x10³/µL') === '×10³/µL' && unidadTxt('mg/dL') === 'mg/dL' && unidadTxt('xyz') === 'xyz', 'unidadTxt: «x10³» → «×10³» y nada más')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ todo bien')
process.exit(fallos ? 1 : 0)
