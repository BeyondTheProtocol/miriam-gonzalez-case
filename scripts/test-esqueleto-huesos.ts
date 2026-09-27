// Test del esqueleto de fondo: todo foco tiene su hueso en `app/data/esqueleto.json`.
//
// EsqueletoFocos.vue NO dibuja un foco cuyo hueso falte (mejor ausente que en otro sitio), así
// que un JSON nuevo sin, p. ej., `scapula_right` borraría un foco en silencio. Esto lo impide,
// y además comprueba lo que no se ve mirando el dibujo: la columna en orden y sin espejo.
//
// Uso:  pnpm test:esqueleto-huesos
import { readFileSync } from 'node:fs'
import { HUESO_DE_FOCO } from '../app/data/focos-huesos.ts'

const ESQ = JSON.parse(readFileSync('app/data/esqueleto.json', 'utf-8'))
const H: Record<string, { u: number; v: number }> = ESQ.huesos
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

for (const [id, h] of Object.entries(HUESO_DE_FOCO))
  ok(!!H[h] && Number.isFinite(H[h].u) && Number.isFinite(H[h].v), `foco ${id} → ${h} está en el esqueleto`)

const col = [...Array.from({ length: 7 }, (_, i) => `vertebrae_C${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `vertebrae_T${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `vertebrae_L${i + 1}`), 'sacrum']
const vs = col.map((h) => H[h]?.v)
ok(vs.every((v, i) => v !== undefined && (i === 0 || v > vs[i - 1]!)), 'la columna baja en orden de C1 al sacro')
ok(H.femur_left?.u > 0.5 && H.femur_right?.u < 0.5, 'vista anterior sin espejo (fémur izquierdo a la derecha)')
ok(Array.isArray(ESQ.tamano) && ESQ.tamano.length === 2, 'trae el tamaño de la imagen')

if (fallos) { console.log(`\n❌ esqueleto: ${fallos} fallo(s)`); process.exit(1) }
console.log('\n✅ esqueleto en verde')
