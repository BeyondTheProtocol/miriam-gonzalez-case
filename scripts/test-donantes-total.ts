// Test de #gracias-total: la frase de la constelación usa el nº REAL de donantes, no la
// longitud de la lista pública (que /donations.json recorta a 500).
//
// 1. Con >500 donaciones y la lista truncada a 500, el total sale del oficial.
// 2. Sin dato oficial, o con uno menor que la lista, cae a la lista (nunca baja).
// 3. StarMap usa resolveDonorCount para el {n} de la frase y DonationsWall le pasa el oficial.
// 4. La lista pública mantiene su tope de 500.
//
// Uso:  pnpm test:donantes-total
import { readFileSync } from 'node:fs'
import { resolveDonorCount } from '../utils/donorCount.ts'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// 1
const lista = Array.from({ length: 500 }, (_, i) => ({ id: String(i), amount: 10 }))
ok(resolveDonorCount(2268, lista.length) === 2268, 'oficial 2268 con lista truncada a 500 → 2268')
// 2
ok(resolveDonorCount(undefined, 500) === 500, 'sin oficial → longitud de la lista')
ok(resolveDonorCount(null, 500) === 500, 'oficial null → longitud de la lista')
ok(resolveDonorCount(NaN, 500) === 500, 'oficial NaN → longitud de la lista')
ok(resolveDonorCount(120, 500) === 500, 'oficial menor que la lista → no baja')

// 3
const star = readFileSync('app/components/StarMap.vue', 'utf-8')
const wall = readFileSync('app/components/DonationsWall.vue', 'utf-8')
ok(/resolveDonorCount\(/.test(star), 'StarMap calcula el total con resolveDonorCount')
ok(!/donationCount\s*=\s*computed\(\(\)\s*=>\s*props\.donations\.length\)/.test(star), 'StarMap ya no usa donations.length como total')
ok(/<StarMap[^>]*:count=/s.test(wall), 'DonationsWall pasa el total oficial a StarMap')

// 4
const fn = readFileSync('netlify/functions/donations.mts', 'utf-8')
ok(/MAX_PUBLIC_ITEMS\s*=\s*500/.test(fn), 'la lista pública sigue topada a 500')

if (fallos) { console.log(`\n❌ ${fallos} fallo(s)`); process.exit(1) }
console.log('\n✅ todo en verde')
