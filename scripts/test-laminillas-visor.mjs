#!/usr/bin/env node
// Test de navegador del visor /laminillas sobre el build ESTÁTICO (.output/public), que es lo que
// sirve Netlify. Mismo arnés sin dependencias que test-ciencia-nivel: servidor estático propio +
// Chrome del sistema por CDP.
//
// Siempre (también en CI, sin teselas):
//   · la matriz se pinta sin JS: filas en orden, una miniatura por laminilla;
//   · en móvil (390 px) no hay scroll horizontal, ni en la tabla ni con el visor abierto;
//   · /biopsia-osea y /en/bone-biopsy salen en _redirects con 301 y no queda su .html;
//   · /laminillas y /en/slides están en el sitemap.
// Con teselas (LAMINILLAS_TESELAS_DIR=<carpeta que contiene v1/>, y el build hecho con
// NUXT_PUBLIC_LAMINILLAS_TESELAS=http://127.0.0.1:8090/v1/):
//   · las teselas cargan sin un solo fallo;
//   · el zoom va a la par en µm por píxel de pantalla en los tres paneles;
//   · el paneo se mueve junto entre las dos de mama y es libre con el hígado; sin enlace, libre;
//   · «HE de referencia» añade la HE de cada muestra; la cabecera de columna recorre la muestra.
//
// Contra un despliegue real (preview de Netlify con las teselas ya en el bucket), sin build local:
//   LAMINILLAS_ORIGEN=https://deploy-preview-NNN--<sitio>.netlify.app pnpm test:laminillas-visor
//
// Uso:  pnpm exec nuxt generate && pnpm test:laminillas-visor
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = join(import.meta.dirname, '..', '.output', 'public')
const REMOTO = (process.env.LAMINILLAS_ORIGEN || '').replace(/\/$/, '')
if (!REMOTO && !existsSync(join(ROOT, 'laminillas.html'))) {
  console.error(`No existe ${ROOT}/laminillas.html. Corre antes \`pnpm exec nuxt generate\`.`)
  process.exit(2)
}
const TESELAS = process.env.LAMINILLAS_TESELAS_DIR || ''
const CON_TESELAS = !!(TESELAS || REMOTO)
const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'app', 'data', 'laminillas.json'), 'utf8'))

let fallos = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// ── Estático (lo que no necesita navegador)
if (!REMOTO) {
console.log('Build estático')
// `_redirects` solo lo escribe el preset de Netlify (en su build lo detecta solo; en local, NETLIFY=1).
const fRed = [join(ROOT, '_redirects'), join(import.meta.dirname, '..', 'dist', '_redirects')].find(existsSync)
if (fRed) {
  const redirects = readFileSync(fRed, 'utf8')
  ok(/^\/biopsia-osea\s+\/laminillas\s+301\b/m.test(redirects), '_redirects: /biopsia-osea → /laminillas 301')
  ok(/^\/en\/bone-biopsy\s+\/en\/slides\s+301\b/m.test(redirects), '_redirects: /en/bone-biopsy → /en/slides 301')
} else {
  console.log('  (sin _redirects: build sin preset de Netlify; el 301 lo prueba test:laminillas en la config y curl en el preview)')
}
ok(['biopsia-osea.html', 'en/bone-biopsy.html', 'en/biopsia-osea.html'].every((f) => !existsSync(join(ROOT, f))), 'no queda un .html viejo que sombree el 301')
ok(existsSync(join(ROOT, 'en', 'slides.html')), 'existe /en/slides')
const sitemap = ['sitemap.xml', '__sitemap__/es-ES.xml', '__sitemap__/en-US.xml']
  .map((f) => join(ROOT, f)).filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n')
ok(/helpmiriam\.com\/laminillas</.test(sitemap) && /helpmiriam\.com\/en\/slides</.test(sitemap), 'el sitemap lleva /laminillas y /en/slides')
}

// ── Servidores: estático (como Netlify: /x → x.html) y, si hay, teselas en 127.0.0.1:8090
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.dzi': 'application/xml' }
function sirve(raiz) {
  return createServer((req, res) => {
    const limpio = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
    const base = join(raiz, limpio)
    const f = [base, `${base}.html`, join(base, 'index.html')].find((p) => existsSync(p) && statSync(p).isFile())
    if (!f) { res.writeHead(404).end(); return }
    res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream', 'access-control-allow-origin': '*' })
    res.end(readFileSync(f))
  })
}
const web = sirve(ROOT)
await new Promise((r) => web.listen(0, '127.0.0.1', r))
const ORIGIN = REMOTO || `http://127.0.0.1:${web.address().port}`
let teselas = null
if (TESELAS) {
  teselas = sirve(TESELAS)
  await new Promise((r) => teselas.listen(8090, '127.0.0.1', r))
}

// ── Chrome headless + CDP
const CHROME = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync)
if (!CHROME) { console.error('No encuentro Chrome. Define CHROME_PATH.'); process.exit(2) }
let chrome, port, profile
for (let intento = 1; intento <= 2 && !port; intento++) {
  profile = mkdtempSync(join(tmpdir(), 'laminillas-'))
  chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
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
const red = { ok: 0, fallo: 0, urls: new Map() }
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
  if (m.method === 'Network.requestWillBeSent') red.urls.set(m.params.requestId, m.params.request.url)
  if (m.method === 'Network.responseReceived' && /_files\//.test(m.params.response.url)) {
    if (m.params.response.status === 200) red.ok++
    else red.fallo++
  }
  // Una petición que OpenSeadragon cancela al reencuadrar no es un fallo; un error de red, sí.
  if (m.method === 'Network.loadingFailed' && !m.params.canceled && /_files\//.test(red.urls.get(m.params.requestId) || '')) red.fallo++
})
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pend.set(id, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id, method, params })) })
const ev = async (expression) => {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}
async function espera(expr, ms = 20000) {
  for (let t = 0; t < ms; t += 250) { if (await ev(expr).catch(() => false)) return true; await sleep(250) }
  return false
}
const HIDRATADA = `(() => { const n = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
  return !!n && !n.isHydrating && n.$router.currentRoute.value.fullPath === location.pathname + location.search + location.hash })()`
async function carga(ruta, ancho = 1280, alto = 900) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 })
  await cdp('Page.navigate', { url: ORIGIN + ruta })
  await espera(HIDRATADA)
  await sleep(500)
}
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable')

// ── Matriz (sin teselas)
console.log('Matriz')
await carga('/laminillas')
const matriz = await ev(`(() => ({
  filas: [...document.querySelectorAll('.matriz__filacab button span:first-child')].map((s) => s.textContent.trim()),
  minis: document.querySelectorAll('.matriz__mini').length,
  cols: document.querySelectorAll('.matriz__colboton').length,
}))()`)
ok(matriz.minis === manifest.laminillas.length, `una miniatura por laminilla (${matriz.minis}/${manifest.laminillas.length})`)
ok(matriz.cols === manifest.muestras.length, `una columna por muestra (${matriz.cols})`)
ok(matriz.filas.length > 0 && matriz.filas[0].startsWith('HE'), `la primera fila es la HE (${matriz.filas.slice(0, 6).join(' · ')})`)
for (const [ruta, que] of [['/laminillas', 'la tabla'], ['/laminillas?fila=re&he=1', 'el visor con HE de referencia'], ['/laminillas?muestra=mama-2024&n=1', 'el recorrido']]) {
  await carga(ruta, 390, 844)
  await sleep(1500)
  const r = await ev(`({ sw: document.documentElement.scrollWidth, w: window.innerWidth })`)
  ok(r.sw <= r.w, `móvil 390 px, ${que}: sin scroll horizontal (${r.sw} ≤ ${r.w})`)
}

// ── Visor (con teselas)
const PANELES = `[...document.querySelectorAll('.visor-panel')].map((p) => ({ um: +p.dataset.umPx || 0, c: (p.dataset.centroUm || '0,0').split(',').map(Number), rot: p.querySelector('.visor-rotulo')?.textContent.trim() }))`
async function arrastra(i, dx, dy) {
  await ev(`document.querySelectorAll('.visor-lienzo')[${i}].scrollIntoView({ block: 'center' })`)
  await sleep(800)
  const r = await ev(`(() => { const b = document.querySelectorAll('.visor-lienzo')[${i}].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()`)
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  for (let k = 1; k <= 10; k++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x + (dx * k) / 10, y: r.y + (dy * k) / 10, button: 'left', buttons: 1 }); await sleep(30) }
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x + dx, y: r.y + dy, button: 'left', clickCount: 1 })
  await sleep(1500)
}
const delta = (a, b) => [b.c[0] - a.c[0], b.c[1] - a.c[1]]
const cerca = (d1, d2, tol) => Math.abs(d1[0] - d2[0]) <= tol && Math.abs(d1[1] - d2[1]) <= tol

if (CON_TESELAS) {
  console.log(`Visor (con teselas${REMOTO ? ', contra ' + REMOTO : ''})`)
  await cdp('Page.navigate', { url: 'about:blank' })
  await carga('/laminillas?fila=re', 1440, 1000)
  ok(await espera(`${PANELES}.length === 3 && ${PANELES}.every((p) => p.um > 0)`, 30000), 'RE: tres paneles abiertos (Mama 2024, Mama reevaluación, Hígado)')
  await sleep(3000)
  let p0 = await ev(PANELES)
  const igual = (ps) => ps.every((p) => Math.abs(p.um / ps[0].um - 1) < 0.005)
  ok(igual(p0), `zoom a la par en µm/px de pantalla (${p0.map((p) => p.um.toFixed(3)).join(' · ')})`)
  await ev(`document.querySelector('.visor-barra button').click()`); await sleep(1200)
  await ev(`document.querySelector('.visor-barra button').click()`); await sleep(1500)
  const p1 = await ev(PANELES)
  ok(igual(p1) && p1[0].um < p0[0].um * 0.6, `tras «Acercar» ×2, los tres se acercan igual (${p1.map((p) => p.um.toFixed(3)).join(' · ')})`)
  await arrastra(0, -160, -110)
  const p2 = await ev(PANELES)
  const d0 = delta(p1[0], p2[0]), d1 = delta(p1[1], p2[1]), d2 = delta(p1[2], p2[2])
  const tol = Math.max(2, Math.hypot(...d0) * 0.03)
  ok(Math.hypot(...d0) > 10, `arrastrar mueve el panel (${d0.map((x) => x.toFixed(1)).join(', ')} µm)`)
  ok(cerca(d0, d1, tol), `la otra mama se mueve lo mismo en µm (${d1.map((x) => x.toFixed(1)).join(', ')})`)
  ok(Math.hypot(...d2) < 1, `el hígado no se mueve: paneo libre (${d2.map((x) => x.toFixed(1)).join(', ')})`)
  await ev(`[...document.querySelectorAll('.visor-barra button')].find((b) => b.hasAttribute('aria-pressed') && /Paneo|panning/.test(b.textContent)).click()`)
  await sleep(500)
  await arrastra(0, 120, 80)
  const p3 = await ev(PANELES)
  ok(Math.hypot(...delta(p2[1], p3[1])) < 1 && Math.hypot(...delta(p2[0], p3[0])) > 10, 'sin enlace, la otra mama se queda quieta')
  await ev(`[...document.querySelectorAll('.visor-acciones button')].find((b) => /HE de referencia|Reference/.test(b.textContent)).click()`)
  ok(await espera(`${PANELES}.length === 6`, 15000), '«HE de referencia» pone la HE de cada muestra (6 paneles)')
  await carga('/laminillas?muestra=mama-2024&n=1', 1280, 900)
  ok(await espera(`${PANELES}.length === 1 && /^1 de \\d+/.test(document.querySelector('.recorrido__estado')?.textContent.trim() ?? '')`, 15000), 'la cabecera de columna abre el recorrido en «1 de N»')
  await ev(`[...document.querySelectorAll('.recorrido button')].at(-1).click()`)
  ok(await espera(`/^2 de \\d+/.test(document.querySelector('.recorrido__estado')?.textContent.trim() ?? '')`, 8000), '«Siguiente» pasa a «2 de N»')
  await sleep(2500)
  ok(red.ok > 20 && red.fallo === 0, `teselas: ${red.ok} cargadas, ${red.fallo} fallidas`)
} else {
  console.log('  (sin LAMINILLAS_TESELAS_DIR ni LAMINILLAS_ORIGEN: no se prueban teselas ni sincronía)')
}

ws.close(); chrome.kill(); web.close(); teselas?.close()
try { rmSync(profile, { recursive: true, force: true }) } catch {}
console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ visor de laminillas en verde')
process.exit(fallos ? 1 : 0)
