// Si el script que usa scripts/lib/navegador-cdp.mjs muere a medias, no puede quedar ni Chrome ni
// su perfil temporal. Antes solo los limpiaba cerrar(): con un 'sin hidratar en 20 s' o un timeout,
// Chrome se quedaba huérfano al 100 % de CPU (37 casos del 20 al 26-oct-2026, deuda de Polaris
// `chrome_headless_huerfano`).
//
// Cada caso lanza un hijo `node` con un TMPDIR propio, así el perfil se encuentra sin pedirle nada al
// arnés. Muerto el hijo, se mira con `ps` que no quede ningún proceso con ese perfil (Chrome, pestañas
// y demás ayudantes) y en disco que la carpeta se haya ido. No hace falta build: no se carga ninguna
// página, solo se abre Chrome.
//
// Uso:  node scripts/test-navegador-cdp-limpieza.mjs
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

const ARNES = pathToFileURL(join(import.meta.dirname, 'lib', 'navegador-cdp.mjs')).href
const TOPE_ARRANQUE_MS = 90_000
const TOPE_SALIDA_MS = 15_000
const TOPE_LIMPIEZA_MS = 5_000

const HIJO = `
import { abrirNavegador } from ${JSON.stringify(ARNES)}
const modo = process.env.MODO
const nav = await abrirNavegador()
if (modo === 'dos') await abrirNavegador()
console.log('LISTO')
if (modo === 'throw') setTimeout(() => { throw new Error('fallo a propósito') }, 0)
else if (modo === 'rechazo') await Promise.reject(new Error('fallo a propósito'))
else if (modo === 'exit') process.exit(0)
else if (modo === 'cerrar') { await nav.cerrar(); await nav.cerrar() }
else setInterval(() => {}, 1000)
`

// señal: la que recibe el hijo. antesDeListo: se le manda en cuanto aparece el perfil, sin esperar a
// que Chrome conteste. codigos: salidas válidas (null = murió por la señal, sin atraparla).
const CASOS = [
  { nombre: 'SIGTERM', modo: 'espera', senal: 'SIGTERM', codigos: [143] },
  { nombre: 'SIGINT', modo: 'espera', senal: 'SIGINT', codigos: [130] },
  { nombre: 'SIGHUP', modo: 'espera', senal: 'SIGHUP', codigos: [129] },
  { nombre: 'SIGTERM con dos navegadores', modo: 'dos', senal: 'SIGTERM', codigos: [143], perfiles: 2 },
  { nombre: 'SIGTERM mientras Chrome arranca', modo: 'espera', senal: 'SIGTERM', antesDeListo: true, codigos: [143] },
  { nombre: 'excepción sin atrapar', modo: 'throw', codigos: [1], stderr: 'fallo a propósito' },
  { nombre: 'promesa rechazada', modo: 'rechazo', codigos: [1], stderr: 'fallo a propósito' },
  { nombre: 'process.exit sin cerrar()', modo: 'exit', codigos: [0] },
  { nombre: 'cerrar() dos veces', modo: 'cerrar', codigos: [0] },
]

function perfilesEn(dir) {
  return readdirSync(dir).filter((n) => n.startsWith('navegador-cdp-'))
}

// PIDs vivos cuyo comando nombra alguno de los perfiles (el nombre es aleatorio: no hay falsos positivos).
function procesosDe(perfiles) {
  const salida = execFileSync('ps', ['-e', '-ww', '-o', 'pid=,args='], { encoding: 'utf8', maxBuffer: 1 << 26 })
  return salida
    .split('\n')
    .filter((l) => perfiles.some((p) => l.includes(p)))
    .map((l) => Number(l.trim().split(/\s+/)[0]))
}

async function esperar(condicion, topeMs) {
  const fin = Date.now() + topeMs
  while (Date.now() < fin) {
    if (condicion()) return true
    await sleep(50)
  }
  return condicion()
}

async function correr(caso) {
  const dir = mkdtempSync(join(tmpdir(), 'ncdp-test-'))
  const hijo = spawn(process.execPath, ['--input-type=module', '-e', HIJO], {
    env: { ...process.env, TMPDIR: dir, MODO: caso.modo },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  hijo.stdout.on('data', (b) => (stdout += b))
  hijo.stderr.on('data', (b) => (stderr += b))
  let salida = null
  hijo.on('exit', (code, signal) => (salida = { code, signal }))

  const fallos = []
  const vistos = new Set() // se anotan al vuelo: un hijo que acaba solo borra el perfil antes de poder mirarlo
  const anotarPerfiles = () => {
    for (const p of perfilesEn(dir)) vistos.add(p)
  }
  try {
    const cuantos = caso.perfiles ?? 1
    const preparado = () => {
      anotarPerfiles()
      return caso.antesDeListo ? vistos.size >= 1 : stdout.includes('LISTO') || salida !== null
    }
    if (!(await esperar(preparado, TOPE_ARRANQUE_MS))) fallos.push('el hijo no arrancó a tiempo')
    if (vistos.size < cuantos) fallos.push(`esperaba ${cuantos} perfil(es) y hay ${vistos.size}`)
    if (caso.senal) hijo.kill(caso.senal)

    if (!(await esperar(() => salida !== null, TOPE_SALIDA_MS))) {
      fallos.push('el hijo no salió a tiempo')
      hijo.kill('SIGKILL')
      await esperar(() => salida !== null, TOPE_SALIDA_MS)
    }
    if (salida && !caso.codigos.includes(salida.code)) {
      fallos.push(`salida ${JSON.stringify(salida)}, esperaba código ${caso.codigos.join(' o ')}`)
    }
    if (caso.stderr && !stderr.includes(caso.stderr)) fallos.push(`stderr sin «${caso.stderr}»: ${stderr.slice(-300)}`)

    anotarPerfiles()
    const limpio = () => procesosDe([...vistos]).length === 0 && perfilesEn(dir).length === 0
    if (!(await esperar(limpio, TOPE_LIMPIEZA_MS))) {
      const vivos = procesosDe([...vistos])
      if (vivos.length) fallos.push(`procesos vivos: ${vivos.join(', ')}`)
      if (perfilesEn(dir).length) fallos.push(`perfil en disco: ${perfilesEn(dir).join(', ')}`)
    }
  } finally {
    // Un caso en rojo no puede fabricar los huérfanos que el test persigue.
    if (salida === null) hijo.kill('SIGKILL')
    for (const pid of procesosDe([...vistos])) {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {}
    }
    await sleep(200)
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    if (existsSync(dir)) console.warn(`aviso: no se pudo borrar ${dir}`)
  }
  return fallos
}

let rojos = 0
for (const caso of CASOS) {
  const fallos = await correr(caso)
  if (fallos.length) rojos++
  console.log(`${fallos.length ? 'FALLA' : 'ok   '} ${caso.nombre}${fallos.length ? `: ${fallos.join(' · ')}` : ''}`)
}
if (rojos) {
  console.error(`\n${rojos} de ${CASOS.length} casos en rojo`)
  process.exit(1)
}
console.log(`\n${CASOS.length} casos en verde: ni Chrome ni perfil sobreviven al script`)
