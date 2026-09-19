// Test de #mapa-focos: /lesiones lee los datos del PROPIO mapa de metástasis, sin copia.
//
// 1. Con el mapa real, se extraen los 19 focos y la geometría del esqueleto.
// 2. Un cambio en el mapa aparece en lo que recibe /lesiones (no hay copia que se desfase).
// 3. Si el mapa deja de declarar un nombre, falla con un error que lo nombra (fail-closed).
//
// Uso:  pnpm test:mapa-focos
import { readFileSync } from 'node:fs'
import { extraeFocos } from '../modules/mapa-focos.ts'

const mapa = readFileSync('app/pages/mapa-metastasis.vue', 'utf-8')
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// 1
const gen = extraeFocos(mapa)
const nFocos = (gen.match(/^\s*\{\s*id:\s*\d+/gm) || []).length
ok(nFocos === 19, `el mapa real da 19 focos (salen ${nFocos})`)
for (const n of ['LES', 'PHENO', 'GROUPS', 'BONE3D_KEY', 'SK_VERTEBRAS', 'SK_COSTILLAS', 'SK_TICKS'])
  ok(new RegExp(`^export const ${n}\\b`, 'm').test(gen), `exporta ${n}`)

// 2
const marca = 'CAMBIO-DE-PRUEBA-EN-EL-MAPA'
const tocado = mapa.replace("{ y: 78, t: 'C1' }", `{ y: 78, t: '${marca}' }`)
ok(tocado !== mapa, 'el test sabe tocar el mapa (si falla, cambió la marca C1)')
ok(extraeFocos(tocado).includes(marca), 'un cambio en el mapa llega a /lesiones')

// 3
let err = ''
try { extraeFocos(mapa.replace('const ticks = [', 'const marcas = [')) } catch (e) { err = String(e) }
ok(/ya no declara: ticks/.test(err), 'si el mapa pierde una declaración, el build falla y la nombra')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ #mapa-focos en verde')
process.exit(fallos ? 1 : 0)
