// Test de la puerta de /celula-a-celula: qué bloque de resultados se pinta y cuál no.
//
// Por qué existe (16-oct-2026): public/ se sirve tal cual (y la preview también es pública) y el
// JSON viaja en el JS de la web. «No se pinta» no es «no está publicado». Dos frenos:
//   1. el CONTRATO del fichero public/celula/resultados.json: solo bloques verificados y con el OK de
//      Miriam, o el ejemplo falso entero (`ejemplo: true`, sin sello verificado y sin OK). Nada
//      intermedio (un bloque «en revisión» con cifras reales) ni mezclado con ejemplo;
//   2. la PUERTA (función pura): verificado + OK de Miriam abre; falta uno, no; `demo` solo abre
//      ejemplo; un bloque mal formado (el censo no suma 100) se oculta.
// Uso: pnpm test:celula-puerta   (no necesita build)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bloquesVisibles, bloqueValido, hostPermiteDemo, puertaAbierta, ORDEN_BLOQUES, type Resultados } from '../app/utils/celulaResultados'

const RUTA = join(import.meta.dirname, '..', 'public', 'celula', 'resultados.json')
const real = JSON.parse(readFileSync(RUTA, 'utf8')) as Resultados
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }
const clon = <T>(x: T): T => JSON.parse(JSON.stringify(x))

/* ── 1 · el contrato del fichero publicado ── */
const bloques = Object.entries(real.bloques) as [keyof typeof real.bloques & string, NonNullable<Resultados['bloques'][keyof Resultados['bloques']]>][]
ok('hay al menos un bloque', bloques.length > 0)
ok('las claves de bloque son las conocidas', bloques.every(([k]) => (ORDEN_BLOQUES as string[]).includes(k)), bloques.map(([k]) => k).join(','))
if (real.ejemplo === true) {
  for (const [k, b] of bloques) {
    ok(`[ejemplo] ${k}: marcado ejemplo`, b.ejemplo === true)
    ok(`[ejemplo] ${k}: sin sello «verificado» (en producción no puede pintarse)`, b.sello !== 'verificado')
    ok(`[ejemplo] ${k}: ok_miriam false`, b.ok_miriam === false)
  }
  ok('[ejemplo] en producción no se pinta nada', bloquesVisibles(real).length === 0, bloquesVisibles(real).join(','))
} else {
  for (const [k, b] of bloques) {
    ok(`${k}: lo publicado está verificado y con OK de Miriam (lo demás vive en Polaris, no aquí)`, puertaAbierta(b), `sello=${b.sello} ok_miriam=${b.ok_miriam}`)
    ok(`${k}: no es un bloque de ejemplo mezclado con datos reales`, b.ejemplo !== true)
    ok(`${k}: bien formado`, bloqueValido(k as never, b, real.por_cada))
  }
}

/* ── 2 · la puerta, con el ejemplo del fichero como base ── */
const base = clon(real)
base.ejemplo = true
for (const k of ORDEN_BLOQUES) if (base.bloques[k]) { base.bloques[k]!.ejemplo = true; base.bloques[k]!.sello = 'sin_verificar'; base.bloques[k]!.ok_miriam = false }
const abre = (r: Resultados, demo = false) => bloquesVisibles(r, { demo })
ok('ejemplo sin demo: nada', abre(base).length === 0)
ok('ejemplo con demo: todos los del fichero', abre(base, true).length === bloques.length)
const v = (sello: string, okm: boolean, ejemplo?: boolean) => { const r = clon(base); const b = r.bloques.R1!; b.sello = sello; b.ok_miriam = okm; b.ejemplo = ejemplo; return r }
ok('verificado + OK: abre', abre(v('verificado', true, undefined)).includes('R1'))
ok('verificado sin OK: no abre', !abre(v('verificado', false, undefined)).includes('R1'))
ok('OK sin verificado (inferido): no abre', !abre(v('inferido', true, undefined)).includes('R1'))
ok('OK sin verificado (sin_verificar): no abre', !abre(v('sin_verificar', true, undefined)).includes('R1'))
ok('verificado con ok_miriam como texto «true»: no abre', !abre((() => { const r = v('verificado', true); (r.bloques.R1 as any).ok_miriam = 'true'; return r })()).includes('R1'))
ok('demo con bloque real (no ejemplo): no lo abre si falta la puerta', !abre(v('inferido', false, undefined), true).includes('R1'))
ok('demo con ejemplo:false: no abre', !abre(v('sin_verificar', false, false), true).includes('R1'))
ok('bloque ausente: no abre', !abre((() => { const r = clon(base); delete r.bloques.R3; return r })(), true).includes('R3'))
ok('sin JSON: nada', abre(null as never).length === 0 && abre(undefined as never).length === 0)
const suma = clon(v('verificado', true)); suma.bloques.R1!.datos = clon(suma.bloques.R1!.datos); (suma.bloques.R1!.datos as any).muestras.higado.categorias[0].por_100 += 1
ok('el censo que no suma 100 se oculta aunque esté verificado', !abre(suma).includes('R1'))
const ic = clon(v('verificado', true)); (ic.bloques.R3!.datos as any).muestras.hueso.dianas[0].ic_sup = 1; ic.bloques.R3!.sello = 'verificado'; ic.bloques.R3!.ok_miriam = true
ok('un IC que no contiene la cifra se oculta', !abre(ic).includes('R3'))
ok('demo en producción: no', !hostPermiteDemo('helpmiriam.com') && !hostPermiteDemo('www.helpmiriam.com'))
ok('demo en preview, rama y local: sí', hostPermiteDemo('deploy-preview-279--helpmiriam-web.netlify.app') && hostPermiteDemo('localhost') && hostPermiteDemo('127.0.0.1'))
ok('puertaAbierta(undefined) es false', puertaAbierta(undefined) === false)

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
