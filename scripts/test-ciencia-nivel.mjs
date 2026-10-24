#!/usr/bin/env node
// Test de navegador de /ciencia como UNA sola capa, la profesional (tanda 2 del rediseño, T2c, 24-oct-2026), sobre el build ESTÁTICO
// (`pnpm generate` → .output/public), que es lo que sirve Netlify.
//
// Antes de T2c este test comprobaba el conmutador «para mentes curiosas / para profesionales» y el deep-link `?nivel=pro`. El conmutador
// salió (la capa llana vive en la home) y el test se REESCRIBE en vez de borrarse, porque lo que protegía sigue importando:
//   · no hay conmutador (ningún .reading-level__btn) y todo el contenido profesional está visible, con o sin parámetro;
//   · `?nivel=pro`, `?nivel=simple` y lo que quedara guardado en localStorage (`hm_ciencia_nivel`) NO hacen nada: es el mismo resultado;
//   · los enlaces antiguos siguen llevando al lector a su sitio: el destino antiguo de /caso (…#mapa-acceso) y el botón de clínica de la
//     home (…#snapshot-title) aterrizan con la ancla A LA VISTA y con el FOCO en ella;
//   · la ficha (#snapshot-title), la franja de herramientas (#mapa-acceso), Imprimir y el botón de donar están ahí.
//
// Por qué contra el build y no con `nuxt dev`: el fallo del foco solo existe con la página prerenderizada. Nuxt la hidrata en la ruta del
// payload (sin query ni hash) y aplica la URL real después; en dev la página se renderiza con ella y el bug no aparece (así se coló el
// arreglo del 5-sep-2026).
//
// Sin dependencias: servidor estático propio + Chrome del sistema por CDP (WebSocket nativo de Node ≥ 22). Chrome: $CHROME_PATH, o la
// ruta de macOS, o `google-chrome` en Linux.
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
    limpiarPerfil()
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

// Lo que ve la persona, leído del DOM: sin conmutador, con los bloques visibles, y dónde está el foco.
const STATE = `(() => {
  const visible = (id) => { const e = document.getElementById(id); return !!e && e.offsetParent !== null && e.getBoundingClientRect().height > 0 }
  const ahora = document.querySelector('#ruta-title')?.closest('section')?.textContent ?? ''
  return {
    conmutador: document.querySelectorAll('.reading-level__btn').length,
    mapa: visible('mapa-acceso'),
    ficha: visible('snapshot-title'),
    porQue: visible('por-que-no-encaja'),
    molecular: visible('molecular-profile-title'),
    ruta: visible('ruta-title'),
    donar: !!document.querySelector('main a.btn-cta[href*="gofund.me"][rel~="noopener"]'),
    imprimir: [...document.querySelectorAll('main button')].some((b) => /Imprimir|Print/.test(b.textContent)),
    enCuartaLinea: /En cuarta línea desde el 7 de octubre de 2026|In fourth line since 7 October 2026/.test(ahora),
    foco: document.activeElement?.id ?? '',
    // la ancla pedida está a la vista: dentro de la ventana y por debajo de la cabecera fija
  }
})()`
// Hidratación terminada Y la URL real ya aplicada: sin esto, una lectura demasiado pronto daría el test por bueno.
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

const TODO_VISIBLE = {
  conmutador: 0,
  mapa: true,
  ficha: true,
  porQue: true,
  molecular: true,
  ruta: true,
  donar: true,
  imprimir: true,
  enCuartaLinea: true,
}
const EN_PANTALLA = (id) => `(() => { const e = document.getElementById('${id}'); if (!e) return false; const r = e.getBoundingClientRect(); const cab = document.querySelector('[data-cabecera-fija]')?.getBoundingClientRect().bottom ?? 0; return r.top >= cab - 2 && r.bottom <= innerHeight })()`
async function esperar(expresion, ms = 4000) {
  for (let i = 0; i < ms / 100; i++) {
    if (await evaluate(expresion).catch(() => false)) return true
    await sleep(100)
  }
  return false
}

try {
  await cdp('Page.enable')
  await cdp('Runtime.enable')

  check('/ciencia: sin conmutador y con todo el contenido profesional a la vista', await load('/ciencia'), TODO_VISIBLE)
  check('/ciencia?nivel=pro: es lo mismo (el parámetro no hace nada)', await load('/ciencia?nivel=pro'), TODO_VISIBLE)
  check('/ciencia?nivel=simple: también lo mismo (ya no hay capa llana aquí)', await load('/ciencia?nivel=simple'), TODO_VISIBLE)
  check('/en/science: lo mismo en inglés, con la frase de la cuarta línea', await load('/en/science'), TODO_VISIBLE)
  check('/en/science?nivel=pro: lo mismo', await load('/en/science?nivel=pro'), TODO_VISIBLE)

  check(
    'lo que quedara guardado de la elección antigua (hm_ciencia_nivel=simple) no esconde nada',
    await (async () => {
      await load('/ciencia')
      await evaluate(`localStorage.setItem('hm_ciencia_nivel', 'simple')`)
      return load('/ciencia', { keepStorage: true })
    })(),
    TODO_VISIBLE
  )

  // Los enlaces antiguos: la ancla A LA VISTA y con el FOCO en ella (quien navega con teclado o con lector de pantalla empieza ahí)
  for (const [nombre, ruta, ancla] of [
    ['destino antiguo de /caso', '/ciencia?nivel=pro&utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#mapa-acceso', 'mapa-acceso'],
    ['botón de clínica de la home', '/ciencia?nivel=pro#snapshot-title', 'snapshot-title'],
    ['ancla sin parámetro', '/ciencia#mapa-acceso', 'mapa-acceso'],
    ['destino antiguo de /caso, en inglés', '/en/science?nivel=pro&utm_source=referral#mapa-acceso', 'mapa-acceso'],
  ]) {
    await load('/')
    await load(ruta)
    const aVista = await esperar(EN_PANTALLA(ancla), 6000)
    const conFoco = await esperar(`document.activeElement?.id === '${ancla}'`, 3000)
    check(`${nombre} (${ruta.split('#')[0].split('?')[0]}): #${ancla} queda a la vista y con el foco`, { aVista, conFoco }, { aVista: true, conFoco: true })
  }

  // Imprimir y donar son botones de verdad (teclado) y el de donar abre GoFundMe en pestaña nueva con aviso para el lector de pantalla
  await load('/ciencia')
  check(
    'el botón de donar: enlace a GoFundMe, rel="noopener noreferrer", aviso de pestaña nueva y 44 px de alto',
    await evaluate(`(() => { const a = document.querySelector('main a.btn-cta[href*="gofund.me"]'); if (!a) return {}; return { rel: a.getAttribute('rel'), blank: a.target === '_blank', aviso: !!a.querySelector('.sr-only'), alto44: a.getBoundingClientRect().height >= 44 } })()`),
    { rel: 'noopener noreferrer', blank: true, aviso: true, alto44: true }
  )
} finally {
  ws.close()
  chrome.kill()
  server.close()
  await sleep(200)
  limpiarPerfil()
}

// Chrome puede seguir escribiendo en el perfil unos ms tras kill(): en CI el
// borrado fallaba con ENOTEMPTY y ponía el check en rojo con los tests en verde.
// La limpieza reintenta y, si aun así no puede, avisa sin tumbar el resultado.
function limpiarPerfil() {
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  } catch (e) {
    console.warn(`aviso: no se pudo borrar el perfil temporal ${profile}: ${e.code || e.message}`)
  }
}

const failed = results.filter((r) => !r).length
console.log(
  failed
    ? `\n${failed} de ${results.length} fallan`
    : `\n${results.length} de ${results.length} en verde`
)
process.exit(failed ? 1 : 0)
