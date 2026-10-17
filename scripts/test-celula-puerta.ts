// Test de la puerta de /celula-a-celula: qué bloque de resultados se pinta y cuál no.
//
// Por qué existe (16-oct-2026): public/ se sirve tal cual (y la preview también es pública) y el
// JSON viaja en el JS de la web. «No se pinta» no es «no está publicado». Tres frenos:
//   1. el CONTRATO del fichero public/celula/resultados.json: solo bloques verificados y con el OK de
//      Miriam (con su fecha), nunca el censo R1, y SOLO las cifras del texto aprobado el 17-oct-2026
//      (R5 y R6 sin ningún número);
//   2. la PUERTA (función pura): verificado + OK de Miriam abre; falta uno, no; `demo` solo abre
//      ejemplo; un bloque mal formado se oculta. Se prueba con un FIXTURE escrito aquí, independiente
//      de lo que se publique;
//   3. el muro de léxico del texto aprobado no entra en el JSON (ni nombres de persona ni de centro).
// Uso: pnpm test:celula-puerta   (no necesita build)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bloquesVisibles, bloqueValido, hostPermiteDemo, puertaAbierta, ORDEN_BLOQUES, type Resultados } from '../app/utils/celulaResultados'

const RUTA = join(import.meta.dirname, '..', 'public', 'celula', 'resultados.json')
const crudo = readFileSync(RUTA, 'utf8')
const real = JSON.parse(crudo) as Resultados
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }
const clon = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const numeros = (x: unknown): number[] => typeof x === 'number' ? [x] : Array.isArray(x) ? x.flatMap(numeros) : x && typeof x === 'object' ? Object.values(x).flatMap(numeros) : []

/* ── 1 · el contrato del fichero publicado ── */
const bloques = Object.entries(real.bloques) as [string, NonNullable<Resultados['bloques'][keyof Resultados['bloques']]>][]
ok('hay al menos un bloque', bloques.length > 0)
ok('las claves de bloque son las conocidas', bloques.every(([k]) => (ORDEN_BLOQUES as string[]).includes(k)), bloques.map(([k]) => k).join(','))
ok('R1 (censo) no se publica: ni en el JSON ni en el orden de bloques', !('R1' in real.bloques) && !(ORDEN_BLOQUES as string[]).includes('R1'))
ok('los cinco bloques aprobados (R0, R3, R4, R5, R6) están', ['R0', 'R3', 'R4', 'R5', 'R6'].every((k) => k in real.bloques))
ok('el fichero publicado no es un ejemplo', real.ejemplo !== true)
for (const [k, b] of bloques) {
  ok(`${k}: lo publicado está verificado y con OK de Miriam (lo demás vive en Polaris, no aquí)`, puertaAbierta(b), `sello=${b.sello} ok_miriam=${b.ok_miriam}`)
  ok(`${k}: no es un bloque de ejemplo mezclado con datos reales`, b.ejemplo !== true)
  ok(`${k}: lleva la fecha del OK (AAAA-MM-DD)`, /^\d{4}-\d{2}-\d{2}$/.test(b.fecha_ok ?? ''), String(b.fecha_ok))
  ok(`${k}: bien formado`, bloqueValido(k as never, b, real.por_cada))
}
// Solo las cifras del texto aprobado: 20.600 / 2.500 (R0), 50 y 25 (R3), 0 (PRAME, MAGE-A4), 1 (R4: «menos de 1»), 100 (por cada).
const APROBADAS = new Set([20600, 2500, 50, 25, 0, 1, 100, real.version])
const ajenas = numeros(real.bloques).filter((n) => !APROBADAS.has(n))
ok('el JSON no lleva ninguna cifra fuera del texto aprobado (n, IC, medianas, usadas…)', ajenas.length === 0, `ajenas: ${JSON.stringify(ajenas)}`)
// Red-team de la fase 2 (17-oct-2026): la cifra del 5T4 del hígado es el techo de su rango según qué células se llamen tumor (detalle en Polaris).
const higR3 = (real.bloques.R3!.datos as any).muestras.higado.dianas as { gen: string; aprox?: boolean }[]
ok('R3: el 5T4 del hígado va con aprox (su cifra es el techo de un rango)', higR3.find((q) => q.gen === '5T4')?.aprox === true)
ok('R5 y R6 no llevan ningún número (visualizaciones sin cifras)', numeros(real.bloques.R5).length === 0 && numeros(real.bloques.R6).length === 0)
ok('R4 solo dice «menos de 1» y solo del hígado', JSON.stringify(Object.keys((real.bloques.R4!.datos as any))) === '["higado"]' && (real.bloques.R4!.datos as any).higado.menos_de === true)
ok('el JSON no lleva campos de recuento ni de IC', !/"(n|n_con|ic_inf|ic_sup|ic_nivel|genes_mediana|usadas|leidas)"/.test(crudo))
ok('el JSON no lleva ejemplo ni «Diana A»', !/ejemplo|Diana [A-D]|Pieza [A-C]/.test(crudo))

/* ── 2 · la puerta, con un fixture propio ── */
const base: Resultados = {
  version: 2, ejemplo: true, por_cada: 100,
  bloques: {
    R0: { sello: 'sin_verificar', ok_miriam: false, ejemplo: true, datos: { muestras: { higado: { celulas: 20600 }, hueso: { celulas: 2500 } } } },
    R3: { sello: 'sin_verificar', ok_miriam: false, ejemplo: true, datos: {
      muestras: {
        higado: { dianas: [{ gen: 'NY-BR-1', por_100: 50, aprox: true }, { gen: '5T4', por_100: 25 }] },
        hueso: { dianas: [{ gen: 'NY-BR-1', por_100: 50, aprox: true }, { gen: '5T4', por_100: 25 }] },
      },
      ausentes: [{ gen: 'PRAME', por_100: 0 }],
    } },
    R4: { sello: 'sin_verificar', ok_miriam: false, ejemplo: true, datos: { higado: { por_100: 1, menos_de: true } } },
    R5: { sello: 'sin_verificar', ok_miriam: false, ejemplo: true, datos: { gen: 'FGFR1', activo: { higado: true, hueso: true } } },
    R6: { sello: 'sin_verificar', ok_miriam: false, ejemplo: true, datos: { patron: 'dispersos' } },
  },
}
const abre = (r: Resultados, demo = false) => bloquesVisibles(r, { demo })
ok('ejemplo sin demo: nada', abre(base).length === 0)
ok('ejemplo con demo: todos', abre(base, true).length === 5)
const v = (sello: string, okm: boolean, ejemplo?: boolean) => { const r = clon(base); const b = r.bloques.R0!; b.sello = sello; b.ok_miriam = okm; b.ejemplo = ejemplo; return r }
ok('verificado + OK: abre', abre(v('verificado', true, undefined)).includes('R0'))
ok('verificado sin OK: no abre', !abre(v('verificado', false, undefined)).includes('R0'))
ok('OK sin verificado (inferido): no abre', !abre(v('inferido', true, undefined)).includes('R0'))
ok('OK sin verificado (sin_verificar): no abre', !abre(v('sin_verificar', true, undefined)).includes('R0'))
ok('verificado con ok_miriam como texto «true»: no abre', !abre((() => { const r = v('verificado', true); (r.bloques.R0 as any).ok_miriam = 'true'; return r })()).includes('R0'))
ok('demo con bloque real (no ejemplo): no lo abre si falta la puerta', !abre(v('inferido', false, undefined), true).includes('R0'))
ok('demo con ejemplo:false: no abre', !abre(v('sin_verificar', false, false), true).includes('R0'))
ok('bloque ausente: no abre', !abre((() => { const r = clon(base); delete r.bloques.R3; return r })(), true).includes('R3'))
ok('sin JSON: nada', abre(null as never).length === 0 && abre(undefined as never).length === 0)
const conR1 = clon(base); (conR1.bloques as any).R1 = { sello: 'verificado', ok_miriam: true, datos: {} }
ok('un R1 aunque venga verificado no se pinta (el censo no se publica)', !abre(conR1, true).includes('R1' as never) && !abre(conR1).includes('R1' as never))
const mal = (f: (r: Resultados) => void, k: 'R0' | 'R3' | 'R4' | 'R5' | 'R6') => { const r = v('verificado', true); for (const q of ['R0', 'R3', 'R4', 'R5', 'R6'] as const) { r.bloques[q]!.sello = 'verificado'; r.bloques[q]!.ok_miriam = true; r.bloques[q]!.ejemplo = undefined } f(r); return abre(r).includes(k) }
ok('R0 sin cifra del hueso: se oculta', !mal((r) => { delete (r.bloques.R0!.datos as any).muestras.hueso }, 'R0'))
ok('R3 sin 5T4 en el hueso: se oculta', !mal((r) => { (r.bloques.R3!.datos as any).muestras.hueso.dianas.pop() }, 'R3'))
ok('R3 con un gen «ausente» distinto de 0: se oculta', !mal((r) => { (r.bloques.R3!.datos as any).ausentes[0].por_100 = 3 }, 'R3'))
ok('R4 con un decimal: se oculta', !mal((r) => { (r.bloques.R4!.datos as any).higado.por_100 = 0.5 }, 'R4'))
ok('R5 con FGFR1 activo solo en una lesión: se oculta', !mal((r) => { (r.bloques.R5!.datos as any).activo.hueso = false }, 'R5'))
ok('bloques bien formados y verificados: abren los cinco', ['R0', 'R3', 'R4', 'R5', 'R6'].every((k) => mal(() => {}, k as never)))
ok('demo en producción: no', !hostPermiteDemo('helpmiriam.com') && !hostPermiteDemo('www.helpmiriam.com'))
ok('demo en preview, rama y local: sí', hostPermiteDemo('deploy-preview-279--helpmiriam-web.netlify.app') && hostPermiteDemo('localhost') && hostPermiteDemo('127.0.0.1'))
ok('puertaAbierta(undefined) es false', puertaAbierta(undefined) === false)

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
