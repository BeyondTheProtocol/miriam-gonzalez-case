#!/usr/bin/env node
// Test de navegador del visor /laminillas sobre el build ESTÁTICO (.output/public), que es lo que
// sirve Netlify. Mismo arnés sin dependencias que test-ciencia-nivel: servidor estático propio +
// Chrome del sistema por CDP.
//
// Siempre (también en CI, sin teselas). Visor con galería (rediseño del 20-oct-2026):
//   · la galería se pinta sin JS: un enlace ?l= por laminilla, agrupadas por muestra;
//   · la herramienta llena la pantalla bajo la cabecera y NINGUNA interacción mueve la página
//     (clic de ratón real por CDP: miniatura, ‹ ›, teclado, comparar, HE, informe, atrás);
//   · comparar pone la misma tinción de cada muestra (apiladas en móvil); los enlaces de antes valen;
//   · en móvil (320–390 px) no hay scroll horizontal y la galería es una tira que se desliza;
//   · /biopsia-osea y /en/bone-biopsy salen en _redirects con 301 y no queda su .html;
//   · /laminillas y /en/slides están en el sitemap.
// Con teselas (LAMINILLAS_TESELAS_DIR=<carpeta que contiene v1/>, y el build hecho con
// NUXT_PUBLIC_LAMINILLAS_TESELAS=http://127.0.0.1:8090/v1/):
//   · las teselas cargan sin un solo fallo; con un panel hay minimapa;
//   · el zoom va a la par en µm por píxel de pantalla en los tres paneles;
//   · el paneo se mueve junto entre las dos de mama y es libre con el hígado; sin enlace, libre;
//   · «HE al lado» añade la HE de cada muestra.
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
  // En una preview de Netlify, su barra («Netlify Drawer», un iframe de 48 px abajo) tapa la tira de
  // la galería en móvil. En producción no existe: se quita para medir la página y no la barra.
  if (REMOTO) await ev(`(() => { for (let i = 0; i < 20; i++) document.querySelectorAll('iframe[title="Netlify Drawer"], netlify-drawer, #netlify-drawer').forEach((f) => f.remove()) })()`).catch(() => {})
}
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable')

// Clic de ratón de verdad (CDP), no el.click(): así cuenta lo que tapa el botón y dónde está.
async function clic(expr) {
  const r = await ev(`(() => { const b = (${expr}).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()`)
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await sleep(400)
}
async function tecla(key, code) {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : 27 })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : 27 })
  await sleep(400)
}
const L_ = () => `new URLSearchParams(location.search).get('l')`
const MINI = (id) => `document.querySelector('.gal__item[data-l="${id}"]')`
// Como haría alguien: desplazar la galería (por dentro, no la página) hasta ver la miniatura.
async function verEnGaleria(id) {
  await ev(`(() => { const a = ${MINI(id)}; const c = a.closest('.gal__lista'); c.scrollTop = a.offsetTop - c.clientHeight / 2; c.scrollLeft = a.offsetLeft - c.clientWidth / 2 })()`)
  await sleep(300)
}
const PANELES_N = `document.querySelectorAll('.visor-panel').length`
// La herramienta acaba en el borde de abajo de la ventana (±2 px): se usa sin desplazar la página.
const LLENA = `(() => { const b = document.querySelector('.lam').getBoundingClientRect().bottom; return Math.abs(b - innerHeight) <= 2 })()`

// ── Galería (sin teselas)
console.log('Galería')
await carga('/laminillas')
const gal = await ev(`(() => ({
  enlaces: [...document.querySelectorAll('a.gal__item')].map((a) => a.getAttribute('href')),
  grupos: document.querySelectorAll('.gal__grupo').length,
  minis: document.querySelectorAll('.gal__mini').length,
}))()`)
// La galería enseña la zona de la laminilla que se ve (al llegar, la mama); el resto, tras su pestaña.
const zonaDeM = (id) => { const m = manifest.muestras.find((x) => x.id === id); return m.zona ?? m.grupo_paneo }
const zona0 = zonaDeM(manifest.muestras[0].id)
const enZona0 = manifest.laminillas.filter((l) => zonaDeM(l.muestra) === zona0)
ok(gal.minis === enZona0.length, `una miniatura por laminilla de la zona (${gal.minis}/${enZona0.length})`)
ok(await ev(`[...document.querySelectorAll('a.gal__zona')].every((a) => /[?&]l=/.test(a.getAttribute('href') ?? ''))`), 'las pestañas de zona son enlaces (sin JS también se llega a cada zona)')
ok(gal.enlaces.every((h) => /[?&]l=/.test(h ?? '')), 'cada miniatura es un enlace ?l= (sirve sin JS y para compartir)')
ok(gal.grupos === manifest.muestras.filter((m) => zonaDeM(m.id) === zona0).length, `por muestra: un grupo por muestra de la zona (${gal.grupos})`)
ok(await ev(`document.querySelector('.gal__item[aria-current="true"]')?.dataset.l`) === manifest.laminillas.find((l) => l.muestra === manifest.muestras[0].id && l.marcador === 'he').id, 'sin query, se ve la HE de la primera muestra')

console.log('Sin desplazar la página')
for (const [w, h] of [[1440, 900], [1366, 768], [1024, 768], [390, 844], [375, 667]]) {
  await carga('/laminillas', w, h)
  await sleep(600)
  ok(await ev(LLENA), `${w}×${h}: la herramienta llena la pantalla bajo la cabecera`)
  const sw = await ev(`({ sw: document.documentElement.scrollWidth, w: innerWidth })`)
  ok(sw.sw <= sw.w, `${w}×${h}: sin scroll horizontal (${sw.sw} ≤ ${sw.w})`)
}
await carga('/laminillas', 1440, 900)
const destino = manifest.laminillas.find((l) => l.muestra === 'mama-reeval' && l.marcador === 'her2')
await verEnGaleria(destino.id)
await clic(MINI(destino.id))
ok(await espera(`${L_()} === '${destino.id}'`, 8000), 'clic en una miniatura: el visor pasa a esa laminilla')
ok(await ev(`document.querySelector('#lam-titulo').textContent.includes('revisión')`), 'y el título lo dice')
await clic(`document.querySelector('.lam__flecha--sig')`)
const tras = await ev(L_())
ok(tras && tras !== destino.id, `‹ › encima de la imagen: «siguiente» cambia de laminilla (${tras})`)
await ev(`document.activeElement?.blur(); document.body.focus()`)
await tecla('ArrowLeft', 'ArrowLeft')
ok(await espera(`${L_()} === '${destino.id}'`, 6000), '← del teclado vuelve a la anterior')
await ev(`history.back()`)
ok(await espera(`${L_()} === '${tras}'`, 6000), '«atrás» del navegador vuelve a la laminilla anterior')
const re = manifest.laminillas.find((l) => l.muestra === 'mama-2024' && l.marcador === 're')
await verEnGaleria(re.id)
await clic(MINI(re.id))
await espera(`${L_()} === '${re.id}'`, 6000)
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => /Comparar/.test(b.getAttribute('aria-label') ?? ''))`)
const nRe = new Set(manifest.laminillas.filter((l) => l.marcador === 're').map((l) => l.muestra)).size
ok(await espera(`${PANELES_N} === ${nRe} && new URLSearchParams(location.search).get('comparar') === '1'`, 8000), `«Comparar» pone RE en sus ${nRe} muestras, lado a lado`)
ok(await ev(`(() => { const p = [...document.querySelectorAll('.visor-panel')].map((x) => x.getBoundingClientRect()); return p.every((r) => Math.abs(r.top - p[0].top) < 2) })()`), 'en escritorio, en columnas')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => /HE al lado/.test(b.getAttribute('aria-label') ?? ''))`)
ok(await espera(`${PANELES_N} === ${nRe * 2}`, 8000), '«HE al lado» añade la HE de cada muestra')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => b.getAttribute('aria-controls') === 'lam-ficha')`)
ok(await espera(`getComputedStyle(document.querySelector('#lam-ficha')).display === 'none'`, 4000), '«Informe» pliega la ficha')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => b.getAttribute('aria-controls') === 'lam-ficha')`)
ok(await espera(`getComputedStyle(document.querySelector('#lam-ficha')).display !== 'none' && document.querySelectorAll('#lam-ficha .ficha').length >= ${nRe}`, 4000), 'y la vuelve a abrir con una ficha por panel')
ok(await ev(`scrollY === 0`), 'después de todo eso, la página no se ha movido (scrollY = 0)')
await clic(`[...document.querySelectorAll('.gal__por-boton')].find((b) => /tinción/.test(b.textContent))`)
ok(await espera(`document.querySelectorAll('.gal__grupo').length === ${new Set(enZona0.map((l) => l.marcador)).size}`, 4000), '«Por tinción»: un grupo por tinción de la zona')

console.log('Zonas')
await carga('/laminillas', 1440, 900)
const zonasEsperadas = [...new Set(manifest.muestras.map((m) => m.grupo_paneo))]
ok(await ev(`document.querySelectorAll('.gal__zona').length`) === zonasEsperadas.length, `una pestaña por zona (${zonasEsperadas.length})`)
await clic(`[...document.querySelectorAll('.gal__zona')].find((b) => /Hígado/.test(b.textContent))`)
const higado = manifest.laminillas.filter((l) => l.muestra === 'higado-2026')
ok(await espera(`/^higado-2026\\//.test(${L_()} ?? '') && document.querySelectorAll('.gal__item').length === ${higado.length}`, 8000), `«Hígado»: la galería trae solo sus ${higado.length} laminillas y el visor salta a la primera`)
ok(await ev(`document.querySelector('.lam__pos').textContent.trim().endsWith('1 de ${higado.length}')`), `el contador cuenta dentro de la zona («1 de ${higado.length}»)`)
await clic(`document.querySelector('.lam__flecha--ant')`)
ok(await espera(`/^higado-2026\\//.test(${L_()} ?? '')`, 6000), '‹ desde la primera vuelve a la última del hígado, sin salir de la zona')
await clic(`[...document.querySelectorAll('.gal__zona')].find((b) => /Mama/.test(b.textContent))`)
ok(await espera(`/^mama-2024\\//.test(${L_()} ?? '')`, 6000) && await ev(`scrollY === 0`), '«Mama» vuelve a la mama, sin mover la página')
await carga('/laminillas', 390, 844)
ok(await ev(`[...document.querySelectorAll('.gal__zona')].every((b) => b.offsetParent && b.getBoundingClientRect().height >= 44)`), 'móvil: las pestañas de zona se ven y miden 44 px')

console.log('Ficha y orden')
await carga('/laminillas?l=higado-2026/re', 1440, 900)
ok(await ev(`!document.querySelector('.lam__discordancia')`), 'la RE del hígado no lleva el párrafo de las cifras del bloque de mama')
await carga(`/laminillas?l=${re.id}`, 1440, 900)
ok(await ev(`!!document.querySelector('.lam__discordancia')`), 'la RE de mama sí')
ok(await ev(`!!document.querySelector('#lam-ficha .ficha__datos > div')?.classList.contains('ficha__resultado')`), 'en la ficha, lo que dice el informe va primero')
ok(await ev(`!!(document.querySelector('.lam__visor').compareDocumentPosition(document.querySelector('.gal')) & Node.DOCUMENT_POSITION_FOLLOWING)`), 'en el DOM, el visor va antes que la galería (2.4.3)')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => /Comparar/.test(b.getAttribute('aria-label') ?? ''))`)
await espera(`${PANELES_N} === ${nRe}`, 8000)
ok(await ev(`!document.querySelector('.lam__flecha')`), 'al comparar no hay ‹ › encima de los paneles (tapaban rótulos y reglas)')
ok(await ev(`/underline/.test(getComputedStyle([...document.querySelectorAll('.lam__accion')].find((b) => b.getAttribute('aria-pressed') === 'true').querySelector('.lam__accion-texto')).textDecorationLine)`), 'pulsado no solo por color: el rótulo se subraya (1.4.1)')

console.log('Tableta: el informe es un diálogo')
await carga('/laminillas', 768, 1024)
ok(await ev(`getComputedStyle(document.querySelector('#lam-ficha')).display === 'none'`), '768 px: el informe empieza cerrado')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => b.getAttribute('aria-controls') === 'lam-ficha')`)
ok(await espera(`document.activeElement?.id === 'lam-ficha-titulo'`, 4000), 'al abrirlo, el foco va a su título')
ok(await ev(`document.querySelector('.lam__visor').inert && document.querySelector('.gal').inert && !!document.querySelector('.lam__velo')`), 'lo de debajo queda inerte, con velo')
await tecla('Escape', 'Escape')
ok(await espera(`getComputedStyle(document.querySelector('#lam-ficha')).display === 'none' && document.activeElement?.getAttribute('aria-controls') === 'lam-ficha'`, 4000), 'Esc lo cierra y el foco vuelve al botón')
ok(await ev(`!document.querySelector('.lam__visor').inert`), 'y lo de debajo vuelve a funcionar')

console.log('Enlaces de antes')
for (const [ruta, que, cond] of [
  ['/laminillas?fila=re&he=1', '?fila=re&he=1', `${PANELES_N} === ${nRe * 2}`],
  ['/laminillas?muestra=mama-2024&n=3', '?muestra=mama-2024&n=3', `${PANELES_N} === 1 && document.querySelectorAll('.gal__grupo')[0].querySelectorAll('.gal__item')[2].getAttribute('aria-current') === 'true'`],
  ['/laminillas?fila=ki67#visor', '?fila=ki67#visor', `${PANELES_N} === 2`],
]) {
  await carga(ruta, 1440, 900)
  ok(await espera(cond, 8000), `${que} sigue abriendo lo mismo`)
  ok(await ev(`scrollY === 0`), `${que}: la página arriba, con la herramienta a la vista`)
}

console.log('Móvil')
for (const ancho of [320, 390]) {
  await carga(`/laminillas?l=${re.id}&comparar=1`, ancho, 844)
  await sleep(800)
  const m = await ev(`(() => { const p = [...document.querySelectorAll('.visor-panel')].map((x) => x.getBoundingClientRect()); const g = document.querySelector('.gal__lista');
    return { apiladas: p.every((r) => Math.abs(r.left - p[0].left) < 2) && p.length > 1, tira: g.scrollWidth > g.clientWidth, sw: document.documentElement.scrollWidth, w: innerWidth,
      fuera: [...document.querySelectorAll('.lam__cab button, .visor-barra button')].filter((b) => b.offsetParent && b.getBoundingClientRect().right > innerWidth + 0.5).length } })()`)
  ok(m.apiladas, `móvil ${ancho} px: comparar apila los paneles`)
  ok(m.tira, `móvil ${ancho} px: la galería es una tira que se desliza`)
  ok(m.sw <= m.w && m.fuera === 0, `móvil ${ancho} px: sin scroll horizontal y ningún botón fuera de la pantalla`)
}
await carga('/laminillas', 390, 844)
ok(await ev(`getComputedStyle(document.querySelector('#lam-ficha')).display === 'none'`), 'móvil: la ficha empieza plegada (cajón)')
ok(await ev(`(() => { const b = [...document.querySelectorAll('.lam__accion')]; return b.length >= 2 && b.every((x) => { const c = x.querySelector('.lam__accion-corto'); return !!c && !!c.offsetParent && c.getBoundingClientRect().width > 10 && c.textContent.trim().length >= 2 }) })()`), 'móvil: CADA acción lleva su rótulo visible, no solo el icono')
ok(await ev(`[...document.querySelectorAll('.lam__accion, .lam__flecha, .lam__volver')].every((b) => b.getBoundingClientRect().width >= 44 && b.getBoundingClientRect().height >= 44)`), 'móvil: acciones, ‹ › y volver de 44 px como mínimo')
ok(await ev(`[...document.querySelectorAll('.gal__item .gal__corto')].filter((s) => /^HE/.test(s.textContent.trim())).map((s) => s.textContent.trim()).slice(0, 2).join() === 'HE 1,HE 2'`), 'móvil: los dos cortes de HE se distinguen en la tira («HE 1», «HE 2»)')
await clic(`[...document.querySelectorAll('.lam__accion')].find((b) => b.getAttribute('aria-controls') === 'lam-ficha')`)
ok(await espera(`getComputedStyle(document.querySelector('#lam-ficha')).display !== 'none' && document.activeElement?.id === 'lam-ficha-titulo'`, 4000), 'móvil: «Informe» abre el cajón con el foco en su título')
await tecla('Escape', 'Escape')
ok(await espera(`getComputedStyle(document.querySelector('#lam-ficha')).display === 'none'`, 4000), 'móvil: Esc cierra el cajón')
await verEnGaleria(re.id)
await clic(MINI(re.id))
ok(await espera(`${L_()} === '${re.id}'`, 6000) && await ev(`scrollY === 0`), 'móvil: tocar en la tira cambia la imagen sin mover la página')

// ── Visor (con teselas)
const PANELES = `[...document.querySelectorAll('.visor-panel')].map((p) => ({ um: +p.dataset.umPx || 0, c: (p.dataset.centroUm || '0,0').split(',').map(Number), rot: p.querySelector('.visor-rotulo')?.textContent.trim() }))`
async function arrastra(i, dx, dy) {
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
  await carga(`/laminillas?l=${re.id}`, 1440, 1000)
  ok(await espera(`${PANELES}.length === 1 && ${PANELES}.every((p) => p.um > 0)`, 30000), 'una laminilla abierta')
  ok(await ev(`!!document.querySelector('.navigator, .openseadragon-container .navigator')`), 'con un panel hay minimapa')
  await carga(`/laminillas?l=${re.id}&comparar=1`, 1440, 1000)
  ok(await espera(`${PANELES}.length === 3 && ${PANELES}.every((p) => p.um > 0)`, 30000), 'RE comparada: tres paneles abiertos (Mama 2024, Mama revisión, Hígado)')
  await sleep(3000)
  ok(await ev(`document.querySelectorAll('.visor-regla').length`) === 3, 'una regla en µm por panel')
  const p0 = await ev(PANELES)
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
  // 2.5.7: las flechas de «Más» mueven TODOS los paneles, también el hígado (con el ratón va suelto).
  await ev(`[...document.querySelectorAll('.visor-barra button')].find((b) => b.getAttribute('aria-controls')).click()`); await sleep(300)
  const p4 = await ev(PANELES)
  await ev(`[...document.querySelectorAll('.visor-barra button')].find((b) => /Mover a la derecha|Move right/.test(b.getAttribute('aria-label') ?? '')).click()`); await sleep(800)
  const p5 = await ev(PANELES)
  ok([0, 1, 2].every((i) => Math.hypot(...delta(p4[i], p5[i])) > 1), `«Mover a la derecha» mueve los tres, también el hígado (${[0, 1, 2].map((i) => delta(p4[i], p5[i])[0].toFixed(0)).join(' · ')} µm)`)
  await sleep(2500)
  ok(red.ok > 20 && red.fallo === 0, `teselas: ${red.ok} cargadas, ${red.fallo} fallidas`)
} else {
  console.log('  (sin LAMINILLAS_TESELAS_DIR ni LAMINILLAS_ORIGEN: no se prueban teselas ni sincronía)')
}
// Sin teselas, cada panel tiene que decirlo (no quedarse en blanco). Opt-in: en CI las teselas apuntan
// al bucket real y, una vez subidas, cargan; esto solo tiene sentido cuando se sabe que faltan.
if (process.env.LAMINILLAS_ESPERA_FALLO === '1') {
  await carga(`/laminillas?l=${re.id}&comparar=1`, 1280, 900)
  ok(await espera(`document.querySelectorAll('.visor-panel').length === 3 && document.querySelectorAll('.visor-fallo').length === 3`, 20000),
    'sin teselas, cada panel avisa de que no se han podido cargar')
}

ws.close(); chrome.kill(); web.close(); teselas?.close()
try { rmSync(profile, { recursive: true, force: true }) } catch {}
console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ visor de laminillas en verde')
process.exit(fallos ? 1 : 0)
