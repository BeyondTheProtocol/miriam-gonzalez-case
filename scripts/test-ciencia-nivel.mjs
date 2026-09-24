#!/usr/bin/env node
// Test de navegador para el deep-link `?nivel=pro` de /ciencia, sobre el build
// ESTÁTICO (`pnpm generate` → .output/public), que es lo que sirve Netlify.
//
// Por qué contra el build y no con `nuxt dev`: el fallo solo existe con la
// página prerenderizada. Nuxt la hidrata en la ruta del payload (sin query) y
// aplica la query después; en dev la página se renderiza con la query y el bug
// no aparece. Así se coló el arreglo del 5-sep-2026.
//
// Sin dependencias: servidor estático propio + Chrome del sistema por CDP
// (WebSocket nativo de Node ≥ 22). Chrome: $CHROME_PATH, o la ruta de macOS,
// o `google-chrome` en Linux.
//
// Uso:  pnpm exec nuxt generate && pnpm test:ciencia-nivel   (CI: .github/workflows/e2e.yml)
import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = join(import.meta.dirname, '..', '.output', 'public')
if (!existsSync(join(ROOT, 'ciencia.html'))) {
  console.error(
    `No existe ${ROOT}/ciencia.html. Corre antes \`pnpm generate\`.`
  )
  process.exit(2)
}

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
  console.error('No encuentro Chrome. Define CHROME_PATH.')
  process.exit(2)
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
  profile = mkdtempSync(join(tmpdir(), 'ciencia-nivel-'))
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
    rmSync(profile, { recursive: true, force: true })
  }
}
if (!port) {
  console.error('Chrome no arrancó tras 2 intentos. Lo que dijo Chrome:')
  console.error(ultimoRuido.trim() || '(nada por stderr)')
  server.close()
  process.exit(2)
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

// Estado del conmutador y del bloque clínico, leído del DOM (lo que ve la persona).
const STATE = `(() => {
  const btns = [...document.querySelectorAll('.reading-level__btn')]
  const pressed = btns.find((b) => b.getAttribute('aria-pressed') === 'true')
  const mapa = document.getElementById('mapa-acceso')
  return {
    level: pressed ? (pressed === btns[1] ? 'pro' : 'simple') : null,
    mapaVisible: !!mapa && mapa.offsetParent !== null,
  }
})()`
// Hidratación terminada Y la URL real ya aplicada: sin esto, un «simple» leído
// demasiado pronto daría el test por bueno.
const HYDRATED = `(() => {
  const n = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
  return !!n && !n.isHydrating && n.$router.currentRoute.value.fullPath === location.pathname + location.search + location.hash
})()`

async function load(path, { keepStorage = false } = {}) {
  if (!keepStorage) {
    await cdp('Storage.clearDataForOrigin', {
      origin: ORIGIN,
      storageTypes: 'all',
    })
  }
  // Marca en la página actual: mientras siga, estamos leyendo la ANTERIOR.
  await evaluate('window.__paginaVieja = true').catch(() => {})
  await cdp('Page.navigate', { url: ORIGIN + path })
  let hydrated = false
  for (let i = 0; i < 200 && !hydrated; i++) {
    await sleep(100)
    hydrated = await evaluate(`!window.__paginaVieja && ${HYDRATED}`).catch(
      () => false
    )
  }
  if (!hydrated) return { error: `sin hidratar en 20 s: ${path}` }
  await sleep(600) // margen para watchers y el repintado tras la hidratación
  return evaluate(STATE)
}

const results = []
function check(name, got, want) {
  const ok = Object.entries(want).every(([k, v]) => got?.[k] === v)
  results.push(ok)
  console.log(
    `${ok ? '✔' : '✘'} ${name}${ok ? '' : `\n    esperado ${JSON.stringify(want)}\n    obtenido ${JSON.stringify(got)}`}`
  )
}

try {
  await cdp('Page.enable')
  await cdp('Runtime.enable')

  check(
    '/ciencia sin parámetro entra en el resumen llano',
    await load('/ciencia'),
    {
      level: 'simple',
      mapaVisible: false,
    }
  )
  check(
    '/ciencia?nivel=pro abre el modo clínico',
    await load('/ciencia?nivel=pro'),
    {
      level: 'pro',
      mapaVisible: true,
    }
  )
  check(
    'destino de /caso (?nivel=pro + UTM + #mapa-acceso) abre mapa y biopsia',
    await load(
      '/ciencia?nivel=pro&utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#mapa-acceso'
    ),
    { level: 'pro', mapaVisible: true }
  )
  check(
    '/en/science?nivel=pro abre el modo clínico',
    await load('/en/science?nivel=pro'),
    {
      level: 'pro',
      mapaVisible: true,
    }
  )
  check(
    '?nivel=simple manda sobre la elección guardada',
    await (async () => {
      await load('/ciencia')
      await evaluate(`localStorage.setItem('hm_ciencia_nivel', 'pro')`)
      return load('/ciencia?nivel=simple', { keepStorage: true })
    })(),
    { level: 'simple', mapaVisible: false }
  )

  // El conmutador funciona a mano en los dos sentidos, también tras un deep-link.
  await load('/ciencia?nivel=pro')
  await evaluate(`document.querySelectorAll('.reading-level__btn')[0].click()`)
  await sleep(300)
  check(
    'clic en «para todos» tras el deep-link vuelve al llano',
    await evaluate(STATE),
    {
      level: 'simple',
      mapaVisible: false,
    }
  )
  await evaluate(`document.querySelectorAll('.reading-level__btn')[1].click()`)
  await sleep(300)
  check(
    'clic en «para profesionales» abre el modo clínico',
    await evaluate(STATE),
    {
      level: 'pro',
      mapaVisible: true,
    }
  )
} finally {
  ws.close()
  chrome.kill()
  server.close()
  await sleep(200)
  rmSync(profile, { recursive: true, force: true })
}

const failed = results.filter((r) => !r).length
console.log(
  failed
    ? `\n${failed} de ${results.length} fallan`
    : `\n${results.length} de ${results.length} en verde`
)
process.exit(failed ? 1 : 0)
