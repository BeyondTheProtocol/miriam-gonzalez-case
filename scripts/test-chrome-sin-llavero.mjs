// Chrome headless carga páginas reales sin depender del Llavero de macOS (14-nov-2026, deuda de
// Polaris `chrome-headless-no-carga-paginas`). Ver SIN_LLAVERO en scripts/lib/navegador-cdp.mjs.
//
//  A. Estático: lanzarChrome() mete SIN_LLAVERO en el spawn, y todo script de scripts/ que pase
//     --headless a Chrome o va por lanzarChrome() o lleva SIN_LLAVERO.
//  B. Vivo (solo si hay Chrome): lanzarChrome() + --dump-dom contra un servidor de 127.0.0.1 devuelve el
//     título, y el stderr de Chrome no menciona el Llavero.
//
// Uso:  node scripts/test-chrome-sin-llavero.mjs
import { createServer } from 'node:http'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { lanzarChrome, SIN_LLAVERO } from './lib/navegador-cdp.mjs'

const SCRIPTS = import.meta.dirname
const CHROME = process.env.CHROME_PATH ||
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync)
const LLAVERO = /Keychain lookup failed|Encryption is not available|keychain_password_mac/i
let fallos = 0
const check = (ok, desc) => { console.log(`  ${ok ? '✅' : '❌'} ${desc}`); if (!ok) fallos++ }

console.log('A · estático')
check(SIN_LLAVERO.includes('--use-mock-keychain') && SIN_LLAVERO.includes('--password-store=basic'),
  'SIN_LLAVERO lleva los dos flags')
const arnes = readFileSync(join(SCRIPTS, 'lib', 'navegador-cdp.mjs'), 'utf8')
const spawnArnes = /export function lanzarChrome[\s\S]*?spawn\(binario, \[([^\]]*)\]/.exec(arnes)
check(!!spawnArnes && spawnArnes[1].includes('...SIN_LLAVERO'), 'el spawn de lanzarChrome() mete SIN_LLAVERO')

function ficheros(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' ? [] : e.isDirectory() ? ficheros(join(dir, e.name))
      : /\.(mjs|js|ts)$/.test(e.name) ? [join(dir, e.name)] : [])
}
const sueltos = []
for (const f of ficheros(SCRIPTS)) {
  if (f.endsWith(join('lib', 'navegador-cdp.mjs')) || f.endsWith('test-chrome-sin-llavero.mjs')) continue
  const src = readFileSync(f, 'utf8')
  if (!/['"`]--headless/.test(src)) continue
  if (!src.includes('lanzarChrome(') && !src.includes('...SIN_LLAVERO')) sueltos.push(f.slice(SCRIPTS.length + 1))
}
check(sueltos.length === 0, `todo lanzador de Chrome pasa por lanzarChrome() o lleva SIN_LLAVERO${sueltos.length ? ': ' + sueltos.join(', ') : ''}`)

if (!CHROME) {
  console.log('B · vivo: sin Google Chrome en esta máquina, se salta')
} else {
  console.log('B · vivo')
  const titulo = `SIN-LLAVERO-${Math.random().toString(16).slice(2, 10)}`
  const srv = createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`<html><head><title>${titulo}</title></head><body>ok</body></html>`)
  })
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${srv.address().port}/`
  const { chrome, matar } = lanzarChrome('sin-llavero-', CHROME,
    ['--headless=new', '--no-first-run', '--dump-dom', url], { stdio: ['ignore', 'pipe', 'pipe'] })
  let out = '', err = ''
  chrome.stdout.on('data', (d) => { out += d })
  chrome.stderr.on('data', (d) => { err += d })
  const rc = await Promise.race([
    new Promise((r) => chrome.on('exit', r)),
    new Promise((r) => setTimeout(() => r('TOPE'), 45000)),
  ])
  matar()
  srv.close()
  check(rc !== 'TOPE' && out.includes(titulo), `Chrome headless carga ${url} (rc=${rc})`)
  check(!LLAVERO.test(err), 'el stderr de Chrome no menciona el Llavero')
}

if (fallos) { console.log(`\n${fallos} FALLO(S)`); process.exit(1) }
console.log('\nOK test-chrome-sin-llavero')
process.exit(0)
