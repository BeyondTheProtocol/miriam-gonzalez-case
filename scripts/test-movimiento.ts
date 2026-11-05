// Movimiento reducido en los desplazamientos de JS (R20 del repaso de guardados, 21-oct-2026) y relleno de foco bajo la
// barra de apoyo fija (R50).
//
// Qué mira:
//   1. smoothOrAuto() (composables/useMovimiento.ts): 'auto' con prefers-reduced-motion: reduce, 'smooth' sin ella y
//      'smooth' fuera del navegador (prerender, sin window ni matchMedia).
//   2. Ningún fichero de app/ escribe `behavior: 'smooth'` a pelo: un comportamiento explícito pisa el
//      `scroll-behavior` del CSS, así que un 'smooth' literal ignora a quien pide menos movimiento. Red parcial: no caza
//      un behavior pasado por variable ni animaciones de desplazamiento hechas a mano (rAF).
//   3. main.css deja `scroll-padding-bottom` con `--barra-apoyo-alto` junto al `scroll-padding-top` de la cabecera,
//      y MobileSupportBar.vue publica esa variable.
//
// Uso:  pnpm test:movimiento   (no necesita build)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { prefiereMenosMovimiento, smoothOrAuto } from '../app/composables/useMovimiento'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }
const g = globalThis as { window?: unknown }

// 1
console.log('1. smoothOrAuto()')
delete g.window
ok(smoothOrAuto() === 'smooth' && !prefiereMenosMovimiento(), 'sin window (prerender): smooth')
g.window = {}
ok(smoothOrAuto() === 'smooth', 'window sin matchMedia: smooth')
const ventana = (reduce: boolean) => ({
  matchMedia: (q: string) => ({ matches: reduce && q === '(prefers-reduced-motion: reduce)', media: q }),
})
g.window = ventana(true)
ok(smoothOrAuto() === 'auto' && prefiereMenosMovimiento(), 'prefers-reduced-motion: reduce → auto')
g.window = ventana(false)
ok(smoothOrAuto() === 'smooth' && !prefiereMenosMovimiento(), 'sin preferencia → smooth')
delete g.window

// 2
console.log("2. Ningún behavior: 'smooth' literal en app/")
const raiz = join(import.meta.dirname, '..')
const ficheros: string[] = []
const recorre = (dir: string) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) recorre(p)
    else if (/\.(vue|ts|js|mjs)$/.test(n)) ficheros.push(p)
  }
}
recorre(join(raiz, 'app'))
const literal = /behavior\s*:\s*['"]smooth['"]/
const culpables = ficheros.filter((f) => readFileSync(f, 'utf8').split('\n').some((l) => literal.test(l)))
ok(culpables.length === 0, culpables.length ? `con 'smooth' a pelo: ${culpables.map((f) => relative(raiz, f)).join(', ')}` : `${ficheros.length} ficheros revisados`)

// 3
console.log('3. Foco no tapado por la barra de apoyo')
const css = readFileSync(join(raiz, 'app/assets/css/main.css'), 'utf8')
const bloque = css.match(/html:has\(:focus-visible\)\s*\{[^}]*\}/)?.[0] ?? ''
ok(/scroll-padding-top:\s*calc\(var\(--cabecera-alto\)/.test(bloque), 'scroll-padding-top con --cabecera-alto')
ok(/scroll-padding-bottom:\s*calc\(var\(--barra-apoyo-alto,\s*0px\)/.test(bloque), 'scroll-padding-bottom con --barra-apoyo-alto (0 sin barra)')
const barra = readFileSync(join(raiz, 'app/components/MobileSupportBar.vue'), 'utf8')
ok(barra.includes("setProperty('--barra-apoyo-alto'") && barra.includes("removeProperty('--barra-apoyo-alto')"), 'MobileSupportBar publica y retira --barra-apoyo-alto')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ todo bien')
process.exit(fallos ? 1 : 0)
