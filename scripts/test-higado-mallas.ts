// Test del visor 3D del hígado: toda malla de lesión cae DENTRO del hígado.
//
// Nació el 27-sep-2026: lesion01.ply (la diana s.II) se regeneró sin restar el centro del
// hígado y se publicó 24 cm por debajo de él. En el visor se veía «una diana que se va», pero
// ningún test lo miraba: el render cargaba sin errores. Esto compara la caja de cada lesión con
// la del hígado (con 2 mm de margen para las que tocan la cápsula), así que cualquier malla
// exportada en otro marco (sin centrar, sin rotar a los ejes de three) falla aquí.
//
// Uso:  pnpm test:higado-mallas
import { readFileSync } from 'node:fs'

const DIR = 'public/lesiones/higado/'
const MARGEN = 2

function caja(fichero: string): { min: number[]; max: number[] } {
  const b = readFileSync(DIR + fichero)
  const fin = b.indexOf('end_header\n') + 'end_header\n'.length
  const cab = b.subarray(0, fin).toString('latin1')
  if (!cab.includes('binary_little_endian')) throw new Error(`${fichero}: formato PLY no esperado`)
  const nv = Number(/element vertex (\d+)/.exec(cab)![1])
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) {
    const v = b.readFloatLE(fin + (i * 3 + k) * 4)
    if (v < min[k]!) min[k] = v
    if (v > max[k]!) max[k] = v
  }
  return { min, max }
}

const esc = JSON.parse(readFileSync(DIR + 'escena.json', 'utf-8'))
const hig = caja('higado.ply')
let fallos = 0
for (const les of esc.lesiones as { malla: string; diana: string | null }[]) {
  const c = caja(les.malla)
  const dentro = [0, 1, 2].every((k) => c.min[k]! >= hig.min[k]! - MARGEN && c.max[k]! <= hig.max[k]! + MARGEN)
  if (!dentro) {
    fallos++
    console.log(`  ❌ ${les.malla}${les.diana ? ' (' + les.diana + ')' : ''} cae fuera del hígado: caja ${c.min.map((x) => x.toFixed(1))} → ${c.max.map((x) => x.toFixed(1))}`)
  }
}
console.log(`  ${fallos ? '❌' : '✅'} ${esc.lesiones.length - fallos} de ${esc.lesiones.length} lesiones dentro de la caja del hígado`)
if (fallos) process.exit(1)
