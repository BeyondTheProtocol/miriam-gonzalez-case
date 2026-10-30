// Test de navegador del bloque de AlphaFold en el explorador (Chrome headless por CDP, contra el build estático).
//
// Por qué existe (20-oct-2026): test:alphafold lee el código fuente y no vio dos fallos de comportamiento que encontró la
// revisión de `diseno`: (1) cada apertura dejaba vivo un contexto WebGL y a la 16.ª el mapa de células se quedaba en
// blanco; (2) «Volver» y reabrir el mismo gen montaba el visor con el bloque plegado. Aquí se prueban en un navegador:
//   1. plegado no pide nada a AlphaFold ni monta el visor; desplegado lo monta, a la vista, con su leyenda y los mandos
//      debajo del modelo (no encima); el aviso de la rueda sale en el primer gesto y no vuelve, y la rueda sin Ctrl
//      nunca llega al canvas;
//   2. 20 aperturas y cierres no matan el contexto WebGL del mapa, y el modelo se pide una sola vez (caché);
//   3. «Volver» y reabrir el mismo gen deja el bloque plegado y sin visor;
//   4. el tema oscuro repinta la rampa (la de claro se invertía sobre el fondo oscuro);
//   5. a 375 px no hay scroll horizontal; un gen fuera de las diez no tiene bloque;
//   6. la vista previa de «3D» (21-oct-2026), con ratón de verdad (Input.dispatchMouseEvent, no eventos sintéticos): no
//      pide nada sin intención (pasar de largo o barrer la lista), sale a los 400 ms junto al botón, se puede entrar en
//      ella, Esc la cierra, el clic la fija con el foco dentro y Esc lo devuelve al «3D»; no se abre al enfocar y Enter
//      la abre; el aviso fuerte sale con más de la mitad en confianza muy baja; hereda el tema; «Ver la forma completa»
//      despliega el bloque; diez aperturas no matan el mapa;
//   7. en el móvil (375 px, toque emulado): «3D» abre la hoja, sin scroll horizontal, y la ✕ devuelve el foco; «Forma 3D»
//      bajo el título del detalle despliega el bloque y lo pone a la vista.
// AlphaFold DB NO se toca: las peticiones a alphafold.ebi.ac.uk se interceptan y se responden con un modelo sintético
// (el test no depende de la red ni de su API, que además da 403 sin User-Agent).
// Uso: pnpm build && pnpm test:alphafold-visor
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { lanzarChrome } from './lib/navegador-cdp.mjs'

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
// MUC1 (P15941): un modelo con el 80 % en confianza muy baja, para el aviso fuerte de la vista previa
const PDB_BAJA = Array.from({ length: 120 }, (_, i) => atomo(i + 1, i + 1, 2.3 * Math.cos(i * 1.75), 2.3 * Math.sin(i * 1.75), 1.5 * i, i < 96 ? 30 : 92)).join('\n')
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
let port, profile, matarChrome
for (let intento = 1; intento <= 2 && !port; intento++) {
  ;({ profile, matar: matarChrome } = lanzarChrome('alphafold-', CHROME, ['--headless=new', '--remote-debugging-port=0', '--no-first-run',
    '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
    ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), 'about:blank'], { stdio: 'ignore' }))
  const f = join(profile, 'DevToolsActivePort')
  for (let i = 0; i < 600 && !port; i++) { await sleep(100); if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0] }
  if (!port) matarChrome()
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
    const cuerpo = /\/api\/prediction\//.test(u) ? api(acc) : acc === 'P15941' ? PDB_BAJA : PDB
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

// ── ratón, teclado y dedo de verdad (CDP Input), para la vista previa
const centro = async (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })()`)
const raton = (x, y) => cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, pointerType: 'mouse' })
const clic = async (x, y) => { await raton(x, y); await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }) }
const TECLAS = { Escape: { code: 'Escape', windowsVirtualKeyCode: 27 }, Enter: { code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' } }
const tecla = async (key) => { await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, ...TECLAS[key] }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code: TECLAS[key].code, windowsVirtualKeyCode: TECLAS[key].windowsVirtualKeyCode }) }
const toca = async (x, y) => { await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
const FLOTA = `!!document.querySelector('.pv__flota:popover-open .de__host canvas') && !!document.querySelector('.pv__flota .de__leyenda li')`
const flotaAbierta = `!!document.querySelector('.pv__flota:popover-open')`
async function cargaLista(ancho = 1280, alto = 900) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 })
  await cdp('Page.navigate', { url: `${ORIGIN}/celula-a-celula/explorar` })
  await espera(`!!document.querySelector('.gin__3d[data-gen3d="ERBB2"]')`, 40000)
  await sleep(800)
}

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

  console.log('Rueda sobre el visor')
  // diseno, 20-oct: dentro del panel con scroll, «Ctrl o ⌘ + rueda para acercar» reaparecía en cada gesto. Sale en el primero
  // y no más; y la rueda sin modificador nunca llega al canvas (si llegara, OrbitControls acercaría sin Ctrl)
  await ev(`(() => { window.__ruedaCanvas = 0; document.querySelector('.fo .de__host canvas').addEventListener('wheel', () => window.__ruedaCanvas++) })()`)
  const gesto = (ctrl = false) => ev(`(() => { const c = document.querySelector('.fo .de__host canvas'); for (let i = 0; i < 3; i++) c.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true, ctrlKey: ${ctrl} })) })()`)
  const avisoRueda = `[...document.querySelectorAll('.fo .de__host > div[aria-hidden="true"]')].filter((d) => d.textContent.includes('para acercar') && d.style.opacity === '1').length`
  await gesto()
  ok((await ev(avisoRueda)) === 1, 'primer gesto de rueda: sale el aviso')
  await sleep(1700)
  await gesto()
  ok((await ev(avisoRueda)) === 0, 'segundo gesto: el aviso no vuelve')
  ok((await ev(`window.__ruedaCanvas`)) === 0, 'la rueda sin Ctrl no llega al canvas en ningún gesto (no acerca)')
  await gesto(true)
  ok((await ev(`window.__ruedaCanvas`)) === 3, 'Ctrl + rueda sí llega al canvas (acerca)')

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

  console.log('Vista previa con ratón (escritorio)')
  await cargaLista()
  let base = peticionesAF
  ok(await ev(`document.querySelectorAll('.gin__3d').length === document.querySelectorAll('.gin__fila').length`), '«3D» en cada proteína de la lista')
  // pasar de largo y barrer: en el runner del CI (WebGL por software) el hilo va lento y el ratón puede «quedarse» de
  // verdad más de 400 ms. Se mide EN LA PÁGINA cuánto estuvo sobre cada «3D»: es fallo que se abra uno sobre el que estuvo
  // menos de 400 ms; abrir con ≥ 400 ms es lo correcto aunque el test quisiera pasar rápido (se dice, no cuenta)
  await ev(`(() => { window.__pasos = []; for (const b of document.querySelectorAll('.gin__3d')) { b.addEventListener('pointerenter', () => window.__pasos.push(['entra', b.dataset.gen3d, performance.now()])); b.addEventListener('pointerleave', () => window.__pasos.push(['sale', b.dataset.gen3d, performance.now()])) } new MutationObserver((m) => m.forEach((x) => { if (x.attributeName === 'aria-expanded' && x.target.getAttribute('aria-expanded') === 'true') window.__pasos.push(['abre', x.target.dataset.gen3d, performance.now()]) })).observe(document.querySelector('.gin'), { subtree: true, attributes: true }) })()`)
  const juzga = async (que) => {
    const pasos = await ev('window.__pasos.splice(0)')
    const ultimaEntrada = {}, cortos = new Set(), malos = [], buenos = []
    for (const [t, g, ms] of pasos) {
      if (t === 'entra') ultimaEntrada[g] = ms
      else if (t === 'sale' && ultimaEntrada[g] !== undefined && ms - ultimaEntrada[g] < 400) cortos.add(`${g}@${ultimaEntrada[g]}`)
      else if (t === 'abre') {
        const e = ultimaEntrada[g], salio = pasos.find(([t2, g2, ms2]) => t2 === 'sale' && g2 === g && ms2 > e && ms2 < ms)
        if (e === undefined || (salio && salio[2] - e < 400)) malos.push(g); else buenos.push(`${g} (${Math.round(ms - e)} ms encima)`)
      }
    }
    // sin ninguna pasada corta medida no hay nada que juzgar: verde sobre nada no es verde
    if (malos.length || cortos.size) ok(malos.length === 0, `${que}: no se abre ningún «3D» sobre el que el ratón estuvo menos de 400 ms (${cortos.size} pasadas cortas${malos.length ? `; abiertos mal: ${malos.join(', ')}` : ''})`)
    else console.log(`  ⚠️  ${que}: no concluyente, el entorno no registró ninguna pasada de menos de 400 ms`)
    if (buenos.length) console.log(`  ⚠️  ${que}: el entorno dejó el ratón ≥ 400 ms sobre ${buenos.join(', ')} y se abrió (lo correcto); esa parte no es concluyente`)
    return cortos.size
  }
  const [hx, hy] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  { const a = raton(hx, hy); await sleep(150); const b = raton(5, 5); await Promise.all([a, b]) }
  await sleep(900)
  await juzga('pasar de largo (150 ms)')
  // barrer: el ratón cruza los «3D» que se ven, 60 ms en cada uno, sin desplazar nada entre medias
  await ev(`document.querySelector('.gin__3d').scrollIntoView({ block: 'start', behavior: 'instant' })`); await sleep(300)
  const puntos = await ev(`[...document.querySelectorAll('.gin__3d')].map((b) => { const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] }).filter(([, y]) => y > 0 && y < innerHeight)`)
  const acuses = []
  for (const [x, y] of puntos) { acuses.push(raton(x, y)); await sleep(60) }
  acuses.push(raton(5, 5)); await Promise.all(acuses); await sleep(900)
  const cortas = await juzga(`barrer ${puntos.length} filas`)
  ok(cortas >= 2, `el barrido cruzó «3D» deprisa de verdad (${cortas} pasadas de menos de 400 ms medidas en la página)`)
  // lo de arriba pudo abrir y cachear modelos si el entorno iba lento: página nueva para lo que sigue
  await cargaLista()
  base = peticionesAF
  let [ex, ey] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  await raton(ex, ey)
  ok(await espera(FLOTA, 8000), 'ratón quieto sobre «3D»: sale la vista previa con el modelo y su leyenda')
  ok(peticionesAF === base + 2, `al abrirla, dos peticiones (${peticionesAF - base})`)
  ok(await ev(`document.querySelector('.gin__3d[data-gen3d="ERBB2"]').getAttribute('aria-expanded') === 'true'`), '«3D» dice que está abierta (aria-expanded)')
  ok(await ev(`(() => { const f = document.querySelector('.pv__flota').getBoundingClientRect(), b = document.querySelector('.gin__3d[data-gen3d="ERBB2"]').getBoundingClientRect(); return f.left >= 0 && f.top >= 0 && f.right <= innerWidth && f.bottom <= innerHeight && f.right <= document.querySelector('.exp__panel').getBoundingClientRect().left && f.top >= document.querySelector('.exp__panel').getBoundingClientRect().top - 1 })()`), 'dentro de la ventana, a la izquierda del panel y bajo el aviso fijo: no tapa el botón, los nombres ni el aviso')
  ok(await ev(`(() => { const t = document.querySelector('.pv__flota').textContent; return t.includes('Predicción a partir de la secuencia de referencia') && t.includes('sin datos de la biopsia') && t.includes('Confianza muy baja (pLDDT < 50) en el 25') && t.includes('CC BY 4.0') })()`), 'lleva sello, contexto, la línea con su % y el crédito')
  ok(await ev(`!document.querySelector('.pv__flota .de__alerta')`), 'HER2 (25 % muy baja): sin aviso fuerte')
  ok(await ev(`!document.querySelector('.pv__flota .de__mandos') && document.querySelector('.pv__flota .de__host').getAttribute('role') === 'img' && !document.querySelector('.pv__flota .de__host').hasAttribute('tabindex')`), 'compacta: sin mandos, un dibujo (role img) que no recibe el foco')
  const [fx, fy] = await ev(`(() => { const r = document.querySelector('.pv__flota').getBoundingClientRect(); return [r.x + r.width / 2, r.y + 20] })()`)
  // del botón a la flotante. Con WebGL por software el hilo se satura (un temporizador de 400 ms llegó a dispararse a los
  // 18 s) y el tiempo de aquí no es el de un ratón real: se mide EN LA PÁGINA el hueco entre salir del «3D» y entrar en
  // la flotante. Cerrada con un hueco menor que la espera de cierre = fallo de verdad; con un hueco mayor, el entorno no
  // deja concluir (se dice, no se aprueba). La velocidad real la midió diseno con el hilo libre (143 px; 600 ms aguantan
  // desde ~240 px/s)
  await ev(`(() => { const f = document.querySelector('.pv__flota'); window.__hueco = {}; document.querySelector('.gin__3d[data-gen3d="ERBB2"]').addEventListener('pointerleave', () => { window.__hueco.sale = performance.now() }, { once: true }); f.addEventListener('pointerenter', () => { window.__hueco.entra = performance.now(); window.__hueco.abierta = f.matches(':popover-open') }, { once: true }); f.addEventListener('toggle', (e) => { if (e.newState === 'closed' && window.__hueco.cierra === undefined) window.__hueco.cierra = performance.now() }) })()`)
  await Promise.all([raton((ex + fx) / 2, ey), raton(fx, fy)])
  await espera(`window.__hueco.entra !== undefined || window.__hueco.cierra !== undefined`, 20000); await sleep(1200)
  const h = await ev(`({ ...window.__hueco, ahora: document.querySelector('.pv__flota').matches(':popover-open') })`)
  if (h.entra !== undefined && (h.abierta || h.entra - h.sale < 600)) ok(h.abierta && h.ahora, `el ratón puede entrar en ella sin que se cierre y se queda abierta (1.4.13; ${Math.round(h.entra - h.sale)} ms del botón a la flotante)`)
  // se cerró antes de que el ratón entrara: fallo si fue antes de la espera de cierre; si no, el entorno no dejó llegar a tiempo
  else if (h.cierra !== undefined && h.sale !== undefined && h.cierra - h.sale < 590) ok(false, `se cerró a los ${Math.round(h.cierra - h.sale)} ms de salir del «3D», antes de la espera de cierre (1.4.13)`)
  else console.log(`  ⚠️  no concluyente (1.4.13): el entorno no llevó el ratón del «3D» a la flotante en menos de 600 ms (${JSON.stringify(h)})`)
  await raton(5, 5); await sleep(1500)
  ok(!(await ev(flotaAbierta)), 'al salir, se cierra')
  await raton(ex, ey); await espera(FLOTA, 8000)
  await tecla('Escape'); await sleep(200)
  ok(!(await ev(flotaAbierta)), 'Esc la cierra sin mover el ratón (1.4.13)')
  ok(peticionesAF === base + 2, `reabrir la misma no vuelve a pedir el modelo (caché): ${peticionesAF - base}`)
  await raton(5, 5); await sleep(300)

  // con la página arriba, la flotante queda bajo la cabecera (el aviso fijo del hígado se quitó el 22-oct-2026)
  await ev(`scrollTo({ top: 0, behavior: 'instant' })`); await sleep(400)
  const arriba = await ev(`(() => { const r = document.querySelector('.gin__3d').getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight ? [r.x + r.width / 2, r.y + r.height / 2] : null })()`)
  if (arriba) {
    await raton(arriba[0], arriba[1])
    ok(await espera(FLOTA, 8000) && await ev(`document.querySelector('.pv__flota').getBoundingClientRect().top >= document.querySelector('[data-cabecera-fija]').getBoundingClientRect().bottom`), 'con la página arriba, la flotante queda bajo la cabecera')
    ok(await ev(`(() => { const b = document.querySelector('.pv__flota .pv__completa').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight })()`), '«Ver la forma completa», siempre a la vista en la flotante')
    await raton(5, 5); await sleep(1500)
  }
  else ok(false, 'con la página arriba el primer «3D» no se ve: no se puede probar la flotante bajo la cabecera')

  console.log('Vista previa fija: clic y teclado')
  ;[ex, ey] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  await clic(ex, ey)
  ok(await espera(FLOTA, 8000) && await ev(`document.querySelector('.pv__flota').contains(document.activeElement)`), 'clic en «3D»: se queda, con el foco dentro')
  await raton(5, 5); await sleep(500)
  ok(await ev(flotaAbierta), 'fija: no se cierra al sacar el ratón')
  await tecla('Escape'); await sleep(200)
  ok(!(await ev(flotaAbierta)) && await ev(`document.activeElement === document.querySelector('.gin__3d[data-gen3d="ERBB2"]')`), 'Esc la cierra y el foco vuelve al «3D»')
  await ev(`document.querySelector('.gin__3d[data-gen3d="TACSTD2"]').focus()`); await sleep(700)
  ok(!(await ev(flotaAbierta)), 'enfocar «3D» no la abre (diez filas con Tab serían diez vistas)')
  await tecla('Enter')
  ok(await espera(FLOTA, 8000) && await ev(`document.querySelector('.pv__flota').contains(document.activeElement)`), 'Enter en «3D»: se abre, con el foco dentro')
  await tecla('Escape'); await sleep(200)
  ok(await ev(`document.activeElement === document.querySelector('.gin__3d[data-gen3d="TACSTD2"]')`), 'y Esc devuelve el foco a ese «3D»')
  await tecla('Enter'); await espera(FLOTA, 8000)
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 })
  await sleep(300)
  ok(!(await ev(flotaAbierta)) && await ev(`document.activeElement === document.querySelector('.gin__3d[data-gen3d="TACSTD2"]')`), 'Mayús+Tab fuera de la fija: se cierra y el foco vuelve a su «3D», no al final del explorador (2.4.3)')
  const [mx, my] = await centro('.gin__3d[data-gen3d="MUC1"]')
  await raton(mx, my)
  ok(await espera(`${FLOTA} && !!document.querySelector('.pv__flota .de__alerta')`, 8000), 'MUC1 (80 % muy baja en el modelo de prueba): aviso fuerte')
  ok(await ev(`document.querySelector('.pv__flota .de__alerta').textContent.includes('más de la mitad') && !document.querySelector('.pv__flota .de__linea')`), 'el aviso dice «más de la mitad» y lleva dentro la línea del %')
  await raton(5, 5); await sleep(1500)

  console.log('Vista previa: tema, recursos y «Ver la forma completa»')
  await ev(`document.querySelector('.exp__tema').click()`)
  await espera(`!!document.querySelector('.exp[data-tema="oscuro"]')`)
  ;[ex, ey] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  await raton(ex, ey); await espera(FLOTA, 8000); await sleep(300)
  const oscuroPv = await ev(`[...document.querySelectorAll('.pv__flota .de__muestra')].map((m) => getComputedStyle(m).backgroundColor)`)
  ok(oscuroPv[0] === 'rgb(199, 125, 210)', `hereda el tema oscuro de .exp (muy alta en violeta claro: ${oscuroPv[0]})`)
  await tecla('Escape'); await ev(`document.querySelector('.exp__tema').click()`); await raton(5, 5); await sleep(300)
  let ciclosPv = 0
  ;[ex, ey] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  for (let i = 0; i < 10; i++) {
    await clic(ex, ey)
    if (!(await espera(FLOTA, 8000))) break
    await tecla('Escape')
    if (!(await espera(`!document.querySelector('.pv__flota:popover-open')`, 3000))) break
    ciclosPv++
  }
  const vivoPv = await ev(mapaVivo)
  ok(ciclosPv === 10 && vivoPv.length > 0 && vivoPv.every(Boolean), `10 aperturas de la vista previa: el mapa conserva su contexto WebGL (${ciclosPv} ciclos)`)
  ;[ex, ey] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  await clic(ex, ey); await espera(FLOTA, 8000)
  await ev(`document.querySelector('.pv__completa').click()`)
  ok(await espera(`!!document.querySelector('#exp-violines') && document.querySelector('details.fo')?.open && !!document.querySelector('.fo .de__host canvas')`, 10000), '«Ver la forma completa»: abre HER2 y despliega su bloque')
  ok(!(await ev(flotaAbierta)), 'y la vista previa se cierra')
  await sleep(600)
  ok(await ev(`(() => { const r = document.querySelector('.fo .de__lienzo').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight })()`), 'el bloque queda a la vista')
  ok(await ev(`document.activeElement === document.querySelector('.fo > summary')`), 'con el foco en su título')

  console.log('Móvil: hoja inferior y «Forma 3D» en el detalle')
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await cargaLista(375, 812)
  const [tx, ty] = await centro('.gin__3d[data-gen3d="ERBB2"]')
  await toca(tx, ty)
  ok(await espera(`!!document.querySelector('dialog.pv__hoja[open] .de__host canvas')`, 8000), 'tocar «3D» abre la hoja con el modelo')
  // con el modelo sintético el lienzo llega antes de que acabe la entrada de la hoja: se mide ya quieta
  await espera(`document.querySelector('dialog.pv__hoja').getAnimations().every((a) => a.playState === 'finished')`, 5000); await sleep(200)
  ok(!(await ev(flotaAbierta)), 'y no la flotante')
  ok(await ev(`(() => { const r = document.querySelector('dialog.pv__hoja').getBoundingClientRect(); return Math.abs(r.bottom - innerHeight) < 2 && r.left >= 0 && r.right <= innerWidth + 1 })()`), 'pegada abajo y dentro del ancho')
  ok((await ev(`document.documentElement.scrollWidth`)) === 375, 'sin scroll horizontal a 375 px con la hoja abierta')
  ok(await ev(`document.activeElement === document.querySelector('dialog.pv__hoja .pv__x')`), 'el foco, en «Cerrar»')
  ok(await ev(`(() => { const b = document.querySelector('dialog.pv__hoja .pv__completa').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight })()`), '«Ver la forma completa», a la vista sin desplazar la hoja')
  const [cx, cy] = await centro('dialog.pv__hoja .pv__x')
  await toca(cx, cy); await sleep(300)
  ok(await ev(`!document.querySelector('dialog.pv__hoja[open]') && document.activeElement === document.querySelector('.gin__3d[data-gen3d="ERBB2"]')`), 'la ✕ la cierra y el foco vuelve al «3D»')
  await cargaLista(320, 640)
  ok(await ev(`(() => { const g = document.querySelector('.gin'), t = document.querySelector('.gin__tabla'); return t.getBoundingClientRect().right <= g.getBoundingClientRect().right + 1 })()`), 'a 320 px la tabla con «3D» cabe en su tarjeta')
  await carga('MUC1', 375, 812)
  ok(await ev(`(() => { const b = document.querySelector('.exp__dforma'); if (!b) return false; const r = b.getBoundingClientRect(), h = document.querySelector('#exp-dh2').getBoundingClientRect(); return r.top >= h.bottom - 1 && r.top - h.bottom < 40 })()`), '«Forma 3D» va justo bajo el título del detalle')
  const [dx, dy] = await centro('.exp__dforma')
  await toca(dx, dy)
  ok(await espera(`document.querySelector('details.fo')?.open && !!document.querySelector('.fo .de__host canvas')`, 10000), '«Forma 3D» despliega el bloque')
  await sleep(800)
  ok(await ev(`(() => { const r = document.querySelector('.fo .de__lienzo').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight })()`), 'y lo pone a la vista')
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: false })

  console.log('Móvil y genes sin bloque')
  await carga('MUC1', 375, 812)
  ok(await abre(), 'MUC1 a 375 px: visor montado')
  ok((await ev(`document.documentElement.scrollWidth`)) === 375, 'sin scroll horizontal a 375 px')
  await carga('ESR1')
  ok(await ev(`!document.querySelector('details.fo')`), 'ESR1 (fuera de las diez): sin bloque')
}
catch (e) { console.error(e); fallos++ }
finally {
  ws.close(); web.close()
  matarChrome()
}
console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ AlphaFold en el explorador, en verde')
process.exit(fallos ? 1 : 0)
