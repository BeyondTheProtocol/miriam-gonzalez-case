// Test de navegador del bloque de AlphaFold en el explorador (Chrome headless por CDP, contra el build estático).
//
// Por qué existe (20-oct-2026): test:alphafold lee el código fuente y no vio dos fallos de comportamiento que encontró la
// revisión de `diseno`: (1) cada apertura dejaba vivo un contexto WebGL y a la 16.ª el mapa de células se quedaba en
// blanco; (2) «Volver» y reabrir el mismo gen montaba el visor con el bloque plegado. Aquí se prueban en un navegador:
//   1. plegado no pide nada a AlphaFold ni monta el visor; desplegado lo monta, a la vista, con su leyenda y los mandos
//      debajo del modelo (no encima);
//   2. 20 aperturas y cierres no matan el contexto WebGL del mapa, y el modelo se pide una sola vez (caché);
//   3. «Volver» y reabrir el mismo gen deja el bloque plegado y sin visor;
//   4. el tema oscuro repinta la rampa (la de claro se invertía sobre el fondo oscuro);
//   5. a 375 px no hay scroll horizontal; un gen fuera de las diez no tiene bloque.
// AlphaFold DB NO se toca: las peticiones a alphafold.ebi.ac.uk se interceptan y se responden con un modelo sintético
// (el test no depende de la red ni de su API, que además da 403 sin User-Agent).
// Uso: pnpm build && pnpm test:alphafold-visor
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = join(import.meta.dirname, '..', '.output', 'public')
if (!existsSync(join(ROOT, 'celula-a-celula', 'explorar.html')) && !existsSync(join(ROOT, 'celula-a-celula', 'explorar', 'index.html'))) {
  console.error(`No existe el explorador en ${ROOT}. Corre antes \`pnpm build\`.`)
  process.exit(2)
}
let fallos = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// ── el modelo sintético: una hélice de 120 residuos con el pLDDT en las cuatro bandas
const atomo = (n, res, x, y, z, b) =>
  `ATOM  ${String(n).padStart(5)}  CA  ALA A${String(res).padStart(4)}    ${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}  1.00${b.toFixed(2).padStart(6)}           C`
const PDB = Array.from({ length: 120 }, (_, i) => atomo(i + 1, i + 1, 2.3 * Math.cos(i * 1.75), 2.3 * Math.sin(i * 1.75), 1.5 * i, [95, 80, 60, 30][Math.floor(i / 30)])).join('\n')
const api = (acc) => JSON.stringify([{ uniprotAccession: acc, pdbUrl: `https://alphafold.ebi.ac.uk/files/AF-${acc}-F1-model_v6.pdb`, latestVersion: 6 }])

// ── servidor estático (como Netlify: /x → x.html)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const web = createServer((req, res) => {
  const limpio = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
  const base = join(ROOT, limpio)
  const f = [base, `${base}.html`, join(base, 'index.html')].find((p) => existsSync(p) && statSync(p).isFile())
  if (!f) { res.writeHead(404).end(); return }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => web.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${web.address().port}`

// ── Chrome headless con WebGL por software (el mapa y el visor lo necesitan)
const CHROME = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync)
if (!CHROME) { console.error('No encuentro Chrome. Define CHROME_PATH.'); process.exit(2) }
let chrome, port, profile
for (let intento = 1; intento <= 2 && !port; intento++) {
  profile = mkdtempSync(join(tmpdir(), 'alphafold-'))
  chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
    ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), 'about:blank'], { stdio: 'ignore' })
  const f = join(profile, 'DevToolsActivePort')
  for (let i = 0; i < 600 && !port; i++) { await sleep(100); if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0] }
  if (!port) { chrome.kill(); rmSync(profile, { recursive: true, force: true }) }
}
if (!port) { console.error('Chrome no arrancó.'); process.exit(2) }
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pend = new Map()
let peticionesAF = 0
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pend.set(id, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id, method, params })) })
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') {
    const u = m.params.request.url
    peticionesAF++
    const acc = u.match(/prediction\/([A-Z0-9]+)/)?.[1] ?? u.match(/AF-([A-Z0-9]+)-F1/)?.[1] ?? 'X'
    const cuerpo = /\/api\/prediction\//.test(u) ? api(acc) : PDB
    void cdp('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200,
      responseHeaders: [{ name: 'content-type', value: /\/api\//.test(u) ? 'application/json' : 'chemical/x-pdb' }, { name: 'access-control-allow-origin', value: '*' }],
      body: Buffer.from(cuerpo).toString('base64') })
  }
})
await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Fetch.enable', { patterns: [{ urlPattern: '*alphafold.ebi.ac.uk*', requestStage: 'Request' }] })
const ev = async (expression) => {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}
async function espera(expr, ms = 20000) {
  for (let t = 0; t < ms; t += 200) { if (await ev(expr).catch(() => false)) return true; await sleep(200) }
  return false
}
async function carga(gen, ancho = 1280, alto = 900) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 })
  await cdp('Page.navigate', { url: `${ORIGIN}/celula-a-celula/explorar?gen=${gen}` })
  await espera(`!!document.querySelector('#exp-violines')`, 40000)
  await sleep(800)
}
const VISOR = `!!document.querySelector('.fo .de__host canvas') && !!document.querySelector('.fo .de__leyenda li')`
const abre = async () => { await ev(`document.querySelector('.fo > summary').click()`); return espera(VISOR) }
const cierra = async () => { await ev(`document.querySelector('.fo > summary').click()`); return espera(`!document.querySelector('.fo .de')`) }
const mapaVivo = `[...document.querySelectorAll('.exp__mapacol canvas')].map((c) => { for (const t of ['webgl2', 'webgl']) { try { const gl = c.getContext(t); if (gl) return !gl.isContextLost() } catch {} } return null }).filter((x) => x !== null)`
const muestras = `[...document.querySelectorAll('.fo .de__muestra')].map((m) => getComputedStyle(m).backgroundColor)`

try {
  console.log('Plegado y desplegado (escritorio)')
  await carga('ERBB2')
  ok(await ev(`!!document.querySelector('details.fo') && !document.querySelector('details.fo').open`), 'HER2 tiene el bloque, plegado')
  ok(peticionesAF === 0 && await ev(`!document.querySelector('.fo .de')`), 'plegado: ninguna petición a AlphaFold y sin visor')
  const vivoAntes = await ev(mapaVivo)
  ok(vivoAntes.length > 0 && vivoAntes.every(Boolean), `el mapa tiene su contexto WebGL (${vivoAntes.length})`)
  ok(await abre(), 'desplegado: visor montado con su leyenda')
  ok(peticionesAF === 2, `dos peticiones: la ficha y el modelo (${peticionesAF})`)
  ok(await ev(`(() => { const l = document.querySelector('.fo .de__lienzo').getBoundingClientRect(), m = document.querySelector('.fo .de__mandos').getBoundingClientRect(); return m.top >= l.bottom - 1 })()`), 'los mandos van debajo del modelo, no encima')
  await sleep(300)
  ok(await ev(`(() => { const r = document.querySelector('.fo .de__lienzo').getBoundingClientRect(), m = document.querySelector('.fo .de__mandos').getBoundingClientRect(); return r.top >= 0 && m.bottom <= innerHeight + 1 })()`), 'al desplegar, el modelo y sus mandos quedan a la vista')
  ok((await ev(`document.querySelectorAll('.fo .de__leyenda li').length`)) === 4, 'leyenda de cuatro bandas')

  console.log('Tema oscuro')
  const claro = await ev(muestras)
  await ev(`document.querySelector('.exp__tema').click()`)
  await espera(`!!document.querySelector('.exp[data-tema="oscuro"]')`)
  await sleep(300)
  const oscuro = await ev(muestras)
  ok(JSON.stringify(claro) !== JSON.stringify(oscuro), 'el tema oscuro repinta la rampa')
  ok(oscuro[0] === 'rgb(199, 125, 210)', `en oscuro, «muy alta» es el violeta claro (${oscuro[0]})`)
  await ev(`document.querySelector('.exp__tema').click()`)

  console.log('Aperturas y cierres')
  // cada ciclo cuenta solo si de verdad se plegó y se volvió a montar (Copilot, #314: si el visor dejara de montarse, el
  // bucle terminaría sin probar nada y las comprobaciones de abajo pasarían igual)
  let ciclos = 0
  for (let i = 0; i < 20; i++) { if (await cierra() && await abre()) ciclos++; else break }
  ok(ciclos === 20, `20 ciclos completos de plegar y desplegar (${ciclos})`)
  const vivoDespues = await ev(mapaVivo)
  ok(vivoDespues.length > 0 && vivoDespues.every(Boolean), '20 aperturas y cierres: el mapa conserva su contexto WebGL')
  ok(peticionesAF === 2, `el modelo se pidió una sola vez (caché): ${peticionesAF} peticiones`)

  console.log('Volver y reabrir el mismo gen')
  await ev(`document.querySelector('.exp__volver').click()`)
  await espera(`!document.querySelector('#exp-violines')`)
  await ev(`document.querySelector('.gin__gen[data-gen="ERBB2"]')?.click()`)
  await espera(`!!document.querySelector('details.fo')`)
  await sleep(1500)
  ok(await ev(`!document.querySelector('details.fo').open && !document.querySelector('.fo .de')`), 'el bloque vuelve plegado y sin visor montado')

  console.log('Móvil y genes sin bloque')
  await carga('MUC1', 375, 812)
  ok(await abre(), 'MUC1 a 375 px: visor montado')
  ok((await ev(`document.documentElement.scrollWidth`)) === 375, 'sin scroll horizontal a 375 px')
  await carga('ESR1')
  ok(await ev(`!document.querySelector('details.fo')`), 'ESR1 (fuera de las diez): sin bloque')
}
catch (e) { console.error(e); fallos++ }
finally {
  ws.close(); chrome.kill(); web.close()
  await sleep(300); rmSync(profile, { recursive: true, force: true })
}
console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ AlphaFold en el explorador, en verde')
process.exit(fallos ? 1 : 0)
