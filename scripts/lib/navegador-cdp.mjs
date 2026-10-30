// Arnés de navegador sin dependencias para los tests sobre el build ESTÁTICO (.output/public):
// servidor estático con URLs limpias (como Netlify) + Chrome del sistema por CDP (WebSocket nativo
// de Node ≥ 22). Es el mismo arnés de scripts/test-ciencia-nivel.mjs, sacado a un módulo para el
// test de cifras de /datos (10-oct-2026). test-ciencia-nivel, test-laminillas-visor y
// test-alphafold-visor conservan su copia del resto, pero lanzan Chrome con lanzarChrome().
//
// Uso:  const nav = await abrirNavegador(); await nav.cargar('/datos'); await nav.evaluate('…'); await nav.cerrar()
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeSync } from 'node:fs'
import { createServer } from 'node:http'
import { constants, tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

export const ROOT = join(import.meta.dirname, '..', '..', '.output', 'public')

// Hidratación terminada Y la URL real ya aplicada (la query llega después de hidratar).
const HYDRATED = `(() => {
  const n = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
  return !!n && !n.isHydrating && n.$router.currentRoute.value.fullPath === location.pathname + location.search + location.hash
})()`

// Chrome y perfil de cada navegador sin cerrar. Con solo cerrar(), un script que moría a medias (un
// 'sin hidratar en 20 s', un timeout) dejaba Chrome huérfano al 100 % de CPU y el perfil en disco: 37
// veces del 20 al 26-oct-2026 (deuda de Polaris `chrome_headless_huerfano`). Un SIGKILL al script
// sigue sin poder atraparse; para eso está la red de Polaris, tools/bucles_colgados.py.
const vivos = new Set()
const PAUSA = new Int32Array(new SharedArrayBuffer(4)) // para esperar en síncrono (Atomics.wait)

// Síncrono a propósito: en 'exit' no corre nada asíncrono. Y repetible: lo llaman cerrar() y la salida.
function matarChrome(vivo) {
  if (!vivos.delete(vivo)) return
  const { chrome, profile } = vivo
  // Chrome encabeza su grupo de procesos (detached): matar el grupo se lleva también sus pestañas.
  try {
    process.kill(-chrome.pid, 'SIGKILL')
  } catch {}
  try {
    chrome.kill('SIGKILL')
  } catch {}
  // El SIGKILL no es instantáneo: un proceso que aún no ha muerto puede escribir en el perfil DESPUÉS
  // del rmSync. Se reintenta hasta que la carpeta lleve 300 ms sin reaparecer, con tope de 5 s.
  const fin = Date.now() + 5000
  let ausenteDesde = 0
  while (Date.now() < fin) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
    } catch {}
    if (existsSync(profile)) ausenteDesde = 0
    else if (!ausenteDesde) ausenteDesde = Date.now()
    else if (Date.now() - ausenteDesde >= 300) return
    Atomics.wait(PAUSA, 0, 0, 100)
  }
  if (existsSync(profile)) {
    // writeSync y no console: en una tubería, process.exit puede cortar lo que escribe console.
    try {
      writeSync(2, `aviso: no se pudo borrar el perfil temporal ${profile}\n`)
    } catch {}
  }
}

function matarTodos() {
  for (const vivo of vivos) matarChrome(vivo)
}

// Una sola vez por proceso aunque se abran varios navegadores. 'uncaughtExceptionMonitor' y no
// 'uncaughtException': este último haría que Node dejara de imprimir el error y de salir con 1, que
// es lo que se lee en el log de CI. Las señales salen con su 128+n, como sin handler.
let vigilando = false
function vigilarSalida() {
  if (vigilando) return
  vigilando = true
  process.on('exit', matarTodos)
  process.on('uncaughtExceptionMonitor', matarTodos)
  for (const senal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(senal, () => {
      matarTodos()
      process.exit(128 + constants.signals[senal])
    })
  }
}

/** Crea un perfil temporal (`prefijo`), lanza Chrome con él y deja ambos a cargo de la limpieza de salida.
 *  Devuelve `{ chrome, profile, matar }`; `matar()` los elimina ya (síncrona y repetible). Todo junto a
 *  propósito: la vigilancia va antes que el perfil para que un SIGTERM en pleno arranque no deje nada, y
 *  `detached` hace a Chrome jefe de su grupo, sin lo cual sus procesos ayudantes sobreviven. */
export function lanzarChrome(prefijo, binario, args, opciones) {
  vigilarSalida()
  const profile = mkdtempSync(join(tmpdir(), prefijo))
  const chrome = spawn(binario, [`--user-data-dir=${profile}`, ...args], { ...opciones, detached: true })
  const vivo = { chrome, profile }
  vivos.add(vivo)
  return { chrome, profile, matar: () => matarChrome(vivo) }
}

/** `gl: true` da WebGL por software (SwiftShader) para probar el mapa del explorador; por defecto, sin GPU ni WebGL.
 *  `chromeArgs`: flags de Chrome extra, solo para el test que los pida (por defecto ninguno: el resto de tests no cambia). */
export async function abrirNavegador({ ancho = 390, alto = 844, escala = 2, gl = false, chromeArgs = [] } = {}) {
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
    // como Netlify: un fichero o carpeta que empieza por punto NO se sirve (verificado en la vista previa del PR #290,
    // 18-oct-2026: .zarray/.zgroup daban 404). Si el test los sirviera, daría por bueno lo que en producción falla.
    if (clean.split(/[/\\]/).some((seg) => seg.startsWith('.') && seg !== '.' && seg !== '..')) return null
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
  let profile
  let matar // fuera del bucle: la limpieza del final mata el Chrome y borra el perfil del intento que arrancó
  let ultimoRuido = ''
  for (let intento = 1; intento <= 2 && !port; intento++) {
    ;({ chrome, profile, matar } = lanzarChrome(
      'navegador-cdp-',
      CHROME,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        '--no-first-run',
        '--no-default-browser-check',
        ...(gl ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--disable-gpu']),
        // En los runners de Ubuntu 24.04 AppArmor corta el sandbox de Chrome.
        ...(process.env.CI ? ['--no-sandbox'] : []),
        ...(process.env.CI ? ['--disable-dev-shm-usage'] : []),
        ...chromeArgs,
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    ))
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
      matar()
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

  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: escala, mobile: false })
  // conservar: no borra el almacenamiento (para probar una SEGUNDA visita de la misma sesión)
  async function cargar(path, { conservar = false } = {}) {
    if (!conservar) await cdp('Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'all' })
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
    server.close()
    matar()
  }
  return { cargar, evaluate, cdp, cerrar, sleep, ORIGIN }
}
