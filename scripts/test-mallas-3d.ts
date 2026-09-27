// Test de los visores 3D: cada malla cae DENTRO de su contenedor.
//
// Nació el 27-sep-2026: lesion01.ply (la diana s.II) se regeneró sin restar el centro del
// hígado y se publicó 24 cm por debajo de él. En el visor se veía «una diana que se va», pero
// ningún test lo miraba: el render cargaba sin errores. Aquí se compara la caja de cada pieza
// con la de su contenedor (2 mm de margen para lo que toca la cápsula o la piel), así que una
// malla exportada en otro marco (sin centrar, sin rotar a los ejes de three) falla.
//
//   hígado      → las lesiones de escena.json, dentro de higado.ply
//   mama        → tumor, tejido fibroglandular y vasos, dentro de mama.ply. El tejido se
//                 recortó al plano de la pared torácica de la envoltura el 27-sep (sobresalía 22 mm).
//   reservorio  → portal, catéter medido e interpolado y tráquea, dentro del hueso de su fecha
//
// Uso:  pnpm test:mallas-3d
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const MARGEN = 2
type Caja = { min: number[]; max: number[] }

function caja(ruta: string): Caja {
  const b = readFileSync(ruta)
  const fin = b.indexOf('end_header\n') + 'end_header\n'.length
  const cab = b.subarray(0, fin).toString('latin1')
  if (!cab.includes('binary_little_endian')) throw new Error(`${ruta}: formato PLY no esperado`)
  const nv = Number(/element vertex (\d+)/.exec(cab)![1])
  const nprop = cab.split('element face')[0]!.match(/property float \w+/g)!.length
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) {
    const v = b.readFloatLE(fin + (i * nprop + k) * 4)
    if (v < min[k]!) min[k] = v
    if (v > max[k]!) max[k] = v
  }
  return { min, max }
}

let fallos = 0, total = 0
function dentro(pieza: string, contenedor: string) {
  total++
  const p = caja(pieza), c = caja(contenedor)
  const ok = [0, 1, 2].every((k) => p.min[k]! >= c.min[k]! - MARGEN && p.max[k]! <= c.max[k]! + MARGEN)
  if (!ok) {
    fallos++
    console.log(`  ❌ ${pieza} cae fuera de ${contenedor}: ${p.min.map((x) => x.toFixed(1))} → ${p.max.map((x) => x.toFixed(1))}`)
  }
}

const H = 'public/lesiones/higado/'
for (const les of JSON.parse(readFileSync(H + 'escena.json', 'utf-8')).lesiones as { malla: string }[])
  dentro(H + les.malla, H + 'higado.ply')

const M = 'public/lesiones/mama/'
for (const f of ['tumor.ply', 'fgt.ply', 'vasos.ply']) if (existsSync(M + f)) dentro(M + f, M + 'mama.ply')

const R = 'public/reservorio/'
for (const fecha of readdirSync(R).filter((d) => existsSync(R + d + '/hueso.ply')))
  for (const f of readdirSync(R + fecha).filter((f) => f.endsWith('.ply') && f !== 'hueso.ply'))
    dentro(R + fecha + '/' + f, R + fecha + '/hueso.ply')

console.log(`  ${fallos ? '❌' : '✅'} ${total - fallos} de ${total} mallas dentro de su contenedor`)
if (fallos) process.exit(1)
