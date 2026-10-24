#!/usr/bin/env node
// Las dos copias de caso.json son la misma, y lo que dicen no vuelve a lo ya refutado.
//
// Por qué existe (24-oct-2026, revisión de T2c). caso.json vive en DOS sitios: `app/data/caso.json` (lo importa la página, se hornea en el
// HTML de /datos y /ciencia) y `public/datos/caso.json` (el enlace «descargar» de /datos y helpmiriam.com/datos/caso.json, lo que baja un
// laboratorio). `tools/caso_publico.py` las escribe idénticas, pero quien corrige un texto a mano suele tocar solo la de `app/`. Pasó: la
// comisión corrigió la sinaptofisina en la copia de `app/` («dicho», sin informe escrito) y el archivo descargable siguió afirmando, con
// sello «verificado», que la laminilla confirmaba la expresión. /datos decía una cosa y el JSON público la contraria, sin que nada avisara.
//
// 1. Las dos copias tienen el mismo contenido (comparación en profundidad: el formato, con o sin espacios, no cuenta).
// 2. En cada una, la sinaptofisina NO lleva el sello «verificado»: la revisión de la laminilla del 29-sep-2026 es lo DICHO en una reunión.
//    Se mira el JSON en crudo; los tests que pasan por `leerCasoCiencia` (test-ciencia-pro) no ven `detalle`, y un caso.json regenerado con el
//    texto refutado pasaría por ellos en verde.
// 3. (Las seis deudas del cotejo sobre `public/datos/` las mira scripts/test-afirmaciones-clinicas.mjs: su lista de carpetas incluye la copia
//    pública, que antes quedaba fuera.)
//
// Sin build, sin red: corre en lint.yml.   Uso:  pnpm test:caso-copias
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

const ROOT = join(import.meta.dirname, '..')
const RUTAS = { app: 'app/data/caso.json', publica: 'public/datos/caso.json' }
const fallos = []
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos.push(msg) }

const leer = (r) => JSON.parse(readFileSync(join(ROOT, r), 'utf8'))
const copias = { app: leer(RUTAS.app), publica: leer(RUTAS.publica) }

/** Primera ruta donde dos valores difieren (para que el fallo diga DÓNDE, no solo que difieren). */
function primeraDiferencia(a, b, ruta = '$') {
  if (isDeepStrictEqual(a, b)) return null
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = primeraDiferencia(a[k], b[k], Array.isArray(a) ? `${ruta}[${k}]` : `${ruta}.${k}`)
      if (d) return d
    }
  }
  const corto = (x) => JSON.stringify(x)?.slice(0, 70)
  return `${ruta}: «${corto(a)}» ≠ «${corto(b)}»`
}

console.log('\n1. Las dos copias de caso.json son la misma')
const dif = primeraDiferencia(copias.app, copias.publica)
ok(dif === null, `${RUTAS.app} y ${RUTAS.publica} tienen el mismo contenido${dif ? `; primera diferencia en ${dif}. Copia la de app/ sobre la pública (o regenera con tools/caso_publico.py)` : ''}`)

console.log('\n2. La sinaptofisina no es «verificado» (la revisión de la laminilla es lo dicho, sin informe escrito)')
for (const [nombre, ruta] of Object.entries(RUTAS)) {
  const sin = (copias[nombre].ficha?.receptores ?? []).filter((r) => r.marcador?.es === 'Sinaptofisina')
  ok(sin.length === 1, `${ruta}: hay una sola fila de Sinaptofisina (${sin.length})`)
  ok(sin.length === 1 && sin[0].sello !== 'verificado', `${ruta}: la sinaptofisina no lleva el sello «verificado» (lleva «${sin[0]?.sello}»)`)
}

// Canarios (el test tiene que ponerse en rojo con el dato malo). Si fallan, el test está mal escrito.
console.log('\n3. Canarios')
{
  const mala = structuredClone(copias.app)
  mala.ficha.receptores.find((r) => r.marcador?.es === 'Sinaptofisina').sello = 'verificado'
  ok(primeraDiferencia(copias.app, mala)?.includes('sello') === true, 'canario: una copia con la sinaptofisina «verificado» difiere de la buena, y la diferencia se localiza en el sello')
  ok(primeraDiferencia(copias.app, structuredClone(copias.app)) === null, 'canario: dos copias iguales no dan diferencia')
}

console.log(fallos.length ? `\n❌ ${fallos.length} fallo(s)` : '\n✅ caso.json: las dos copias coinciden y la sinaptofisina no se da por verificada')
process.exit(fallos.length ? 1 : 0)
