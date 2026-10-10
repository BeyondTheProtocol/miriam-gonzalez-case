// Arnés de navegador sin dependencias para los tests sobre el build ESTÁTICO (.output/public):
// servidor estático con URLs limpias (como Netlify) + Chrome del sistema por CDP (WebSocket nativo
// de Node ≥ 22). Es el mismo arnés de scripts/test-ciencia-nivel.mjs, sacado a un módulo para el
// test de cifras de /datos (10-oct-2026); aquel conserva su copia para no tocar un test en verde.
//
// Uso:  const nav = await abrirNavegador(); await nav.cargar('/datos'); await nav.evaluate('…'); await nav.cerrar()
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

export const ROOT = join(import.meta.dirname, '..', '..', '.output', 'public')

// Hidratación terminada Y la URL real ya aplicada (la query llega después de hidratar).
const HYDRATED = `(() => {
  const n = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
  return !!n && !n.isHydrating && n.$router.currentRoute.value.fullPath === location.pathname + location.search + location.hash
})()`

export async function abrirNavegador({ ancho = 390, alto = 844 } = {}) {
  // ── Servidor estático con URLs limpias (como Netlify: /ciencia → ciencia.html)
  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  }
  function resolveFile(pathname) {
    const clean = normalize(decodeURIComponent(pathname)).replace(
      /^(\.\.[/\\])+/,
      ''
    )
    const base = join(ROOT, clean)
    for (const p of [base, `${base}.html`, join(base, 'index.html')]) {
      if (existsSync(p) && statSync(p).isFile()) return p
    }
    return null
  }
  const server = createServer((req, res) => {
    const file = resolveFile(new URL(req.url, 'http://x').pathname)
    if (!file) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    })
    res.end(readFileSync(file))
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const ORIGIN = `http://127.0.0.1:${server.address().port}`

  // ── Chrome headless + CDP
  const CHROME =
    process.env.CHROME_PATH ||
    [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
    ].find(existsSync)
  if (!CHROME) {
    throw new Error('No encuentro Chrome. Define CHROME_PATH.')
  }
  // Arrancar Chrome falla a veces en el runner, y siempre por lo mismo: tarda más de la cuenta en
  // escribir DevToolsActivePort (24-sep-2026: dos E2E rojos el mismo día, uno en main y otro en
  // rama, con el mismo commit pasando en el intento siguiente). Se le da más margen, se intenta dos
  // veces y, si aun así no arranca, se cuenta POR QUÉ: con stdio a 'ignore' el error de Chrome se
  // perdía y el log solo decía «no arrancó».
  const DEVTOOLS_MS = Number(process.env.CHROME_ESPERA_MS || 60000)
  let chrome
  let port
  let profile // fuera del bucle: la limpieza del final borra el perfil del intento que arrancó
  let ultimoRuido = ''
  for (let intento = 1; intento <= 2 && !port; intento++) {
    profile = mkdtempSync(join(tmpdir(), 'navegador-cdp-'))
    chrome = spawn(
      CHROME,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        // En los runners de Ubuntu 24.04 AppArmor corta el sandbox de Chrome.
        ...(process.env.CI ? ['--no-sandbox'] : []),
        ...(process.env.CI ? ['--disable-dev-shm-usage'] : []),
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    )
    chrome.stderr?.on('data', (b) => {
      ultimoRuido = (ultimoRuido + b.toString()).slice(-800)
    })
    let muerto = false
    chrome.on('error', (e) => {
      // Sin esto, un binario que no se puede ejecutar tira un 'error' sin manejar y la traza de
      // Node tapa el motivo real.
      muerto = true
      ultimoRuido += `\n[no pude ejecutar ${CHROME}: ${e.message}]`
    })
    chrome.on('exit', (code) => {
      muerto = true
      ultimoRuido += `\n[chrome salió con código ${code}]`
    })
    const f = join(profile, 'DevToolsActivePort')
    for (let i = 0; i < DEVTOOLS_MS / 100 && !port && !muerto; i++) {
      await sleep(100)
      if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0]
    }
    if (!port) {
      console.error(
        `Chrome no arrancó en el intento ${intento} (sin DevToolsActivePort en ${DEVTOOLS_MS / 1000} s).`
      )
      chrome.kill()
      limpiarPerfil()
    }
  }
  if (!port) {
    console.error('Chrome no arrancó tras 2 intentos. Lo que dijo Chrome:')
    console.error(ultimoRuido.trim() || '(nada por stderr)')
    server.close()
    throw new Error('Chrome no arrancó')
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const ws = new WebSocket(
    targets.find((t) => t.type === 'page').webSocketDebuggerUrl
  )
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let seq = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })
  function cdp(method, params = {}) {
    const id = ++seq
    ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) =>
      pending.set(id, (m) =>
        m.error ? reject(new Error(m.error.message)) : resolve(m.result)
      )
    )
  }
  async function evaluate(expression) {
    const r = await cdp('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
    return r.result.value
  }

  function limpiarPerfil() {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch (e) {
      console.warn(`aviso: no se pudo borrar el perfil temporal ${profile}: ${e.code || e.message}`)
    }
  }
  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 2, mobile: false })
  async function cargar(path) {
    await cdp('Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'all' })
    await evaluate('window.__paginaVieja = true').catch(() => {})
    await cdp('Page.navigate', { url: ORIGIN + path })
    let ok = false
    for (let i = 0; i < 200 && !ok; i++) {
      await sleep(100)
      ok = await evaluate(`!window.__paginaVieja && ${HYDRATED}`).catch(() => false)
    }
    if (!ok) throw new Error(`sin hidratar en 20 s: ${path}`)
    await sleep(600) // margen para watchers y el repintado tras la hidratación
  }
  async function cerrar() {
    ws.close()
    chrome.kill()
    server.close()
    await sleep(200)
    limpiarPerfil()
  }
  return { cargar, evaluate, cdp, cerrar, sleep, ORIGIN }
}
