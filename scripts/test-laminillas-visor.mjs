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
// Navegación (20-oct-2026, «no es intuitiva»), siempre: el selector de arriba cambia el visor en su
// sitio y deja su título a la vista (sin el salto de 3.000 px de antes); la miniatura abre ESA
// laminilla; anterior/siguiente; «Todas las laminillas» vuelve a la matriz; los enlaces viejos.
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
// Clic de ratón de verdad (CDP), no el.click(): así cuenta lo que tapa el botón y dónde está.
async function quieto() {
  // Un scroll suave en curso (la página lleva el visor a la vista) movería el botón bajo el ratón.
  let y = -1
  for (let i = 0; i < 40; i++) { const ahora = await ev('scrollY'); if (ahora === y) return; y = ahora; await sleep(100) }
}
async function clic(expr, centra = true) {
  await quieto()
  if (centra) { await ev(`(${expr}).scrollIntoView({ block: 'center' })`); await quieto() }
  const r = await ev(`(() => { const b = (${expr}).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()`)
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await sleep(300)
}
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
// Que nada se salga de su celda (overflow-x-clip lo taparía al medir el scroll de la página).
for (const ancho of [320, 390]) {
  await carga('/laminillas', ancho, 900)
  const desb = await ev(`[...document.querySelectorAll('.matriz__colboton, .matriz__filaboton, .matriz__colboton > span:not(.sr-only), .matriz__filaboton > span:not(.sr-only)')]
    .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > e.closest('th, td').getBoundingClientRect().right + 1)
    .map((e) => e.textContent.trim().slice(0, 24))`)
  ok(desb.length === 0, `móvil ${ancho} px: ningún texto de cabecera se sale de su celda${desb.length ? ' (' + desb.join(' | ') + ')' : ''}`)
}
await carga('/laminillas?fila=re&he=1', 390, 844)
ok(await espera(`document.querySelectorAll('.visor-panel').length === 6`, 15000), 'móvil: los 6 paneles montados')
const VISIBLE = `[...document.querySelectorAll('.visor-panel')].filter((p) => getComputedStyle(p).visibility !== 'hidden').map((p) => p.querySelector('.visor-rotulo')?.textContent.trim())`
const movil = await ev(`(() => ({ ops: document.querySelectorAll('.visor-selector input').length, visibles: ${VISIBLE} }))()`)
ok(movil.ops === 2 && movil.visibles.length === 1, `móvil: un panel visible (${movil.visibles}) y solo alterna con su HE (${movil.ops} opciones)`)
// La muestra se elige arriba; cambiarla solo cambia el panel visible (los 6 siguen montados).
await clic(`[...document.querySelectorAll('.muestras-chips .lam-chip')].find((b) => /Hígado/.test(b.textContent))`)
ok(await espera(`/Hígado/.test(${VISIBLE}.join()) && document.querySelectorAll('.visor-panel').length === 6 && /muestra=higado-2026/.test(location.search)`, 8000),
  'móvil: elegir «Hígado 2026» arriba enseña su panel sin reabrir el visor')
ok(await ev(`![...document.querySelectorAll('.muestras-chips .lam-chip')].some((b) => /Comparar/.test(b.textContent))`), 'móvil: sin «Comparar» (se ve un panel cada vez)')
ok(await ev(`(() => { const m = document.querySelector('.visor-mas'); return !!m && getComputedStyle(m).display === 'none' && !!document.querySelector('.visor-mas-boton') })()`), 'móvil: flechas, mover a la par y pantalla completa plegados tras «Más»')
ok(await ev(`(() => { const b = [...document.querySelectorAll('.visor-barra button')].filter((x) => x.offsetParent); const tops = new Set(b.map((x) => Math.round(x.getBoundingClientRect().top))); return tops.size === 1 })()`), 'móvil: la barra del visor cabe en una fila')
await carga('/laminillas?fila=re', 375, 667)
await sleep(800)
ok(await ev(`document.querySelector('.visor-panel--activo').getBoundingClientRect().top < innerHeight * 0.6`), `móvil 375×667: la imagen empieza en la primera pantalla (y=${await ev(`Math.round(document.querySelector('.visor-panel--activo').getBoundingClientRect().top)`)})`)
for (const ancho of [320, 360]) {
  await carga('/laminillas?fila=re', ancho, 700)
  await sleep(800)
  const fuera = await ev(`[...document.querySelectorAll('.visor-cabecera button, .muestras-chips, .visor-barra button')].filter((b) => b.offsetParent && b.getBoundingClientRect().right > innerWidth + 0.5).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 20))`)
  ok(fuera.length === 0, `móvil ${ancho} px: ningún botón del visor se sale de la pantalla${fuera.length ? ' (' + fuera.join(' | ') + ')' : ''}`)
}

// ── Navegación (sin teselas: lo que se mide es dónde queda cada cosa, no la imagen)
console.log('Navegación')
const FIJO = `document.querySelector('[data-cabecera-fija]').getBoundingClientRect().height`
// La fila del título entera (con sus botones), no solo el h2: los botones asoman por encima.
const TITULO_A_LA_VISTA = `(() => { const t = document.querySelector('.visor-cabecera'); if (!t) return false; const y = Math.min(t.getBoundingClientRect().top, ...[...t.querySelectorAll('button')].map((b) => b.getBoundingClientRect().top)); return y >= ${FIJO} - 2 && y < innerHeight * 0.45 })()`
await carga('/laminillas', 1440, 900)
ok(await ev(`getComputedStyle(document.querySelector('.selector')).position !== 'sticky'`), 'escritorio: el selector va en flujo (pegado tapaba el foco y un tercio de la pantalla)')
ok(await ev(`document.querySelector('#matriz .nota, #matriz [class*=nota]')?.getBoundingClientRect().top < document.querySelector('.matriz').getBoundingClientRect().top`), 'la instrucción va encima de la tabla, no debajo')
await clic(`[...document.querySelectorAll('.selector .lam-chip')].find((b) => b.textContent.trim() === 'RP')`)
ok(await espera(`/fila=rp/.test(location.search) && !!document.querySelector('#visor-titulo')`, 8000), 'el chip «RP» abre RP en todas sus muestras')
await sleep(1200)
ok(await ev(TITULO_A_LA_VISTA), `tras elegir en el selector, el título del visor queda a la vista bajo el selector (y=${await ev(`Math.round(document.querySelector('.visor-cabecera').getBoundingClientRect().top)`)})`)
ok(await ev(`!document.querySelector('.matriz')`), 'el visor ocupa el sitio de la matriz')
ok(await ev(`getComputedStyle(document.querySelector('.visor-cabecera')).position === 'sticky'`), 'escritorio: la fila del título (anterior/siguiente, volver) se pega bajo la cabecera')
ok(await ev(`parseFloat(document.documentElement.style.scrollPaddingTop) >= ${FIJO} + document.querySelector('.visor-cabecera').getBoundingClientRect().height`), 'scroll-padding-top cubre cabecera + fila pegada: el foco no queda tapado (2.4.11)')
const y0 = await ev(`scrollY`)
await clic(`[...document.querySelectorAll('.visor-acciones button')].find((b) => /siguiente$/i.test(b.getAttribute('aria-label') ?? ''))`, false)
ok(await espera(`/fila=her2/.test(location.search)`, 8000), '«Siguiente» pasa de RP a HER2 (orden de la tabla)')
await sleep(1200)
ok(Math.abs((await ev(`scrollY`)) - y0) < 4, 'y la página no se mueve (antes cada paso subía al principio)')
ok(/(^|\s)4 de \d+$/.test(await ev(`document.querySelector('.visor-posicion').textContent.trim()`)), 'la posición dice «4 de N»')
// Desde abajo del visor, el botón de volver de la fila pegada (el selector ya quedó arriba).
await ev(`window.scrollBy(0, 700)`); await quieto()
await clic(`document.querySelector('.visor-volver')`, false)
ok(await espera(`!location.search && !!document.querySelector('.matriz')`, 8000), '«Todas las laminillas» de la fila pegada vuelve a la matriz')
ok(await espera(`document.activeElement?.dataset.origen === 'chip:rp'`, 4000), 'y devuelve el foco al chip desde el que se abrió')
// Una fila de abajo de la tabla: el visor sale arriba, a la vista, no 3.000 px más abajo.
await clic(`[...document.querySelectorAll('.matriz__filaboton')].find((b) => b.textContent.includes('INSM1'))`)
ok(await espera(`/fila=insm1/.test(location.search)`, 8000), 'la fila INSM1 abre su visor')
await sleep(1200)
ok(await ev(TITULO_A_LA_VISTA), 'abrir desde una fila de abajo deja el título del visor a la vista')
ok(await ev(`document.activeElement?.id === 'visor-titulo'`), 'y el foco va al título')
await carga('/laminillas', 1440, 900)
await clic(`[...document.querySelectorAll('.matriz__miniboton')].find((b) => /Hígado/.test(b.getAttribute('aria-label')) && /HER2/.test(b.getAttribute('aria-label')))`)
ok(await espera(`/muestra=higado-2026/.test(location.search) && document.querySelectorAll('.visor-panel').length === 1`, 8000), 'la miniatura de HER2 · Hígado abre esa laminilla sola')
ok(await ev(`[...document.querySelectorAll('.muestras-chips .lam-chip')].find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent.includes('Hígado')`), 'y el selector marca «Hígado 2026»')
await clic(`[...document.querySelectorAll('.muestras-chips .lam-chip')].find((b) => b.textContent.trim() === 'Comparar')`)
ok(await espera(`/fila=her2/.test(location.search) && !/muestra=/.test(location.search) && document.querySelectorAll('.visor-panel').length === 3`, 8000), '«Comparar» la compara en las 3 muestras')
// Volver: «atrás» devuelve a la miniatura de origen, a la vista y con el foco.
await carga('/laminillas', 1440, 900)
await clic(`document.querySelector('[data-origen="mini:mama-2024/ttf1"]')`)
ok(await espera(`/muestra=mama-2024/.test(location.search)`, 8000), 'la miniatura de TTF-1 (fila de abajo) abre su laminilla')
await sleep(800)
await ev(`history.back()`)
ok(await espera(`!!document.querySelector('.matriz') && document.activeElement?.dataset.origen === 'mini:mama-2024/ttf1'`, 8000), '«atrás» vuelve a la matriz con el foco en esa miniatura')
await quieto()
ok(await ev(`(() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= ${FIJO} && r.bottom <= innerHeight })()`), 'y la miniatura queda a la vista, no arriba de la tabla')
// Títulos (pase de voz): una muestra se nombra; dos, en inglés, «both».
await carga('/laminillas?fila=cd56', 1440, 900)
ok(await espera(`document.querySelector('#visor-titulo')?.textContent.trim() === 'CD56 · Mama 2024'`, 8000), 'una tinción en una sola muestra la nombra («CD56 · Mama 2024»)')
await carga('/en/slides?fila=ki67', 1440, 900)
ok(await espera(`/in both samples$/.test(document.querySelector('#visor-titulo')?.textContent.trim() ?? '')`, 8000), 'en inglés, dos muestras son «both samples», no «all 2 samples»')
for (const [ruta, que, cond] of [
  ['/laminillas?fila=re&he=1', '?fila=re&he=1', `document.querySelectorAll('.visor-panel').length === 6`],
  ['/laminillas?muestra=mama-2024&n=1', '?muestra=mama-2024&n=1', `document.querySelectorAll('.visor-panel').length === 1 && /(^|\\s)1 de \\d+/.test(document.querySelector('.visor-posicion')?.textContent.trim() ?? '')`],
]) {
  await carga(ruta, 1440, 900)
  ok(await espera(cond, 8000), `enlace de antes ${que} abre lo mismo que antes`)
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
  ok(await espera(`${PANELES}.length === 3 && ${PANELES}.every((p) => p.um > 0)`, 30000), 'RE: tres paneles abiertos (Mama 2024, Mama revisión, Hígado)')
  await sleep(3000)
  ok(await ev(`document.querySelectorAll('.visor-regla').length`) === 3, 'una regla en µm por panel')
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
  await ev(`[...document.querySelectorAll('.visor-barra button')].find((b) => b.hasAttribute('aria-pressed') && /Mover a la par|Move together/.test(b.textContent)).click()`)
  await sleep(500)
  await arrastra(0, 120, 80)
  const p3 = await ev(PANELES)
  ok(Math.hypot(...delta(p2[1], p3[1])) < 1 && Math.hypot(...delta(p2[0], p3[0])) > 10, 'sin enlace, la otra mama se queda quieta')
  await ev(`[...document.querySelectorAll('.visor-acciones button')].find((b) => /HE de referencia|Reference/.test(b.textContent)).click()`)
  ok(await espera(`${PANELES}.length === 6`, 15000), '«HE de referencia» pone la HE de cada muestra (6 paneles)')
  await carga('/laminillas', 1280, 900)
  await ev(`[...document.querySelectorAll('.matriz__filaboton')].find((b) => b.textContent.includes('Ki-67')).click()`)
  ok(await espera(`document.querySelectorAll('.visor-panel').length === 2`, 15000), 'la fila de Ki-67 abre sus 2 paneles')
  await carga('/laminillas?muestra=mama-2024&n=1', 1280, 900)
  ok(await espera(`${PANELES}.length === 1 && /(^|\\s)1 de \\d+/.test(document.querySelector('.visor-posicion')?.textContent.trim() ?? '')`, 15000), 'una muestra sola, en «1 de N»')
  await espera(`${PANELES}.every((p) => p.um > 0)`, 15000)
  await ev(`document.querySelector('.visor-barra button').click()`); await sleep(1500)
  const antes = (await ev(PANELES))[0].um
  await ev(`[...document.querySelectorAll('.visor-acciones button')].find((b) => /siguiente$/i.test(b.getAttribute('aria-label') ?? '')).click()`)
  ok(await espera(`/(^|\\s)2 de \\d+/.test(document.querySelector('.visor-posicion')?.textContent.trim() ?? '')`, 8000), '«Siguiente» pasa a «2 de N»')
  await espera(`${PANELES}.every((p) => p.um > 0)`, 15000); await sleep(1500)
  const despues = (await ev(PANELES))[0].um
  ok(Math.abs(despues / antes - 1) < 0.01, `al pasar de laminilla se conserva la escala (${antes.toFixed(3)} → ${despues.toFixed(3)} µm/px)`)
  await sleep(2500)
  ok(red.ok > 20 && red.fallo === 0, `teselas: ${red.ok} cargadas, ${red.fallo} fallidas`)
} else {
  console.log('  (sin LAMINILLAS_TESELAS_DIR ni LAMINILLAS_ORIGEN: no se prueban teselas ni sincronía)')
}
// Sin teselas, cada panel tiene que decirlo (no quedarse en blanco). Opt-in: en CI las teselas apuntan
// al bucket real y, una vez subidas, cargan; esto solo tiene sentido cuando se sabe que faltan.
if (process.env.LAMINILLAS_ESPERA_FALLO === '1') {
  await carga('/laminillas?fila=re', 1280, 900)
  ok(await espera(`document.querySelectorAll('.visor-panel').length === 3 && document.querySelectorAll('.visor-fallo').length === 3`, 20000),
    'sin teselas, cada panel avisa de que no se han podido cargar')
}

ws.close(); chrome.kill(); web.close(); teselas?.close()
try { rmSync(profile, { recursive: true, force: true }) } catch {}
console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ visor de laminillas en verde')
process.exit(fallos ? 1 : 0)
