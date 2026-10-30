// test-ciencia-nivel, test-laminillas-visor y test-alphafold-visor tienen su propia copia del arnés y
// solo mataban Chrome en el camino feliz: si morían a medias, Chrome se quedaba huérfano y el perfil en
// disco (deuda de Polaris `chrome_headless_huerfano`). test-navegador-cdp-limpieza prueba la limpieza
// del módulo; este prueba que cada copia la usa de verdad, y por eso lanza los scripts reales.
//
// Cada caso lanza el script con un TMPDIR propio, espera a que su Chrome esté arriba y lo mata de una de
// las maneras posibles. Un --import añadido desde aquí (el script no se toca) hace que SIGUSR2 provoque
// la excepción sin atrapar o el process.exit a mitad de script. Muerto, se mira con `ps` que no quede
// ningún proceso con ese perfil y en disco que la carpeta se haya ido.
//
// Uso:  pnpm exec nuxt generate && pnpm test:chrome-copias-limpieza
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const TOPE_ARRANQUE_MS = 90_000
const TOPE_SALIDA_MS = 15_000
const TOPE_LIMPIEZA_MS = 5_000

const RAIZ = join(import.meta.dirname, '..')
const COPIAS = [
  { script: 'test-ciencia-nivel.mjs', prefijo: 'ciencia-nivel-' },
  { script: 'test-laminillas-visor.mjs', prefijo: 'laminillas-' },
  { script: 'test-alphafold-visor.mjs', prefijo: 'alphafold-' },
]

// Sin build no hay nada que probar: los scripts saldrían con 2 antes de lanzar Chrome.
if (!existsSync(join(RAIZ, '.output', 'public', 'ciencia.html'))) {
  console.error(`No existe ${join(RAIZ, '.output', 'public')}. Corre antes \`pnpm exec nuxt generate\`.`)
  process.exit(2)
}

const PRELOAD = `process.on('SIGUSR2', () => {
  if (process.env.MODO === 'exit') process.exit(0)
  throw new Error('fallo a propósito')
})`

// antesDeListo: la señal sale en cuanto aparece el perfil, sin esperar a que Chrome conteste.
const MANERAS = [
  { nombre: 'SIGTERM', senal: 'SIGTERM', codigo: 143 },
  { nombre: 'SIGINT', senal: 'SIGINT', codigo: 130 },
  { nombre: 'SIGHUP', senal: 'SIGHUP', codigo: 129 },
  { nombre: 'SIGTERM mientras Chrome arranca', senal: 'SIGTERM', antesDeListo: true, codigo: 143 },
  { nombre: 'excepción sin atrapar', senal: 'SIGUSR2', modo: 'throw', codigo: 1, stderr: 'fallo a propósito' },
  { nombre: 'process.exit a medias', senal: 'SIGUSR2', modo: 'exit', codigo: 0 },
]

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

async function correr({ script, prefijo }, manera) {
  const dir = mkdtempSync(join(tmpdir(), 'ccopias-test-'))
  const perfilesEnDisco = () => readdirSync(dir).filter((n) => n.startsWith(prefijo))
  const env = { ...process.env, TMPDIR: dir, MODO: manera.modo ?? '' }
  // Fuera lo que apunte estos scripts a otro sitio que el build o abra el puerto 8090.
  delete env.LAMINILLAS_ORIGEN
  delete env.LAMINILLAS_TESELAS_DIR
  const hijo = spawn(
    process.execPath,
    ['--import', `data:text/javascript,${encodeURIComponent(PRELOAD)}`, join(import.meta.dirname, script)],
    { env, stdio: ['ignore', 'ignore', 'pipe'] }
  )
  let stderr = ''
  hijo.stderr.on('data', (b) => (stderr += b))
  let salida = null
  hijo.on('exit', (code, signal) => (salida = { code, signal }))

  const fallos = []
  const vistos = new Set()
  const anotarPerfiles = () => {
    for (const p of perfilesEnDisco()) vistos.add(p)
  }
  try {
    const preparado = () => {
      anotarPerfiles()
      if (salida !== null) return true
      return manera.antesDeListo ? vistos.size > 0 : [...vistos].some((p) => existsSync(join(dir, p, 'DevToolsActivePort')))
    }
    if (!(await esperar(preparado, TOPE_ARRANQUE_MS))) fallos.push('Chrome no arrancó a tiempo')
    if (salida !== null) fallos.push(`el script salió antes de tiempo: ${JSON.stringify(salida)} ${stderr.slice(-300)}`)
    if (vistos.size === 0) fallos.push('el script no creó ningún perfil')
    hijo.kill(manera.senal)

    if (!(await esperar(() => salida !== null, TOPE_SALIDA_MS))) {
      fallos.push('el script no salió a tiempo')
      hijo.kill('SIGKILL')
      await esperar(() => salida !== null, TOPE_SALIDA_MS)
    }
    if (salida && salida.code !== manera.codigo) {
      fallos.push(`salida ${JSON.stringify(salida)}, esperaba código ${manera.codigo}`)
    }
    if (manera.stderr && !stderr.includes(manera.stderr)) {
      fallos.push(`stderr sin «${manera.stderr}»: ${stderr.slice(-300)}`)
    }

    anotarPerfiles()
    const limpio = () => procesosDe([...vistos]).length === 0 && perfilesEnDisco().length === 0
    if (!(await esperar(limpio, TOPE_LIMPIEZA_MS))) {
      const vivos = procesosDe([...vistos])
      if (vivos.length) fallos.push(`${vivos.length} proceso(s) vivo(s)`)
      if (perfilesEnDisco().length) fallos.push('perfil en disco')
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
let total = 0
for (const copia of COPIAS) {
  console.log(copia.script)
  for (const manera of MANERAS) {
    total++
    const fallos = await correr(copia, manera)
    if (fallos.length) rojos++
    console.log(`  ${fallos.length ? 'FALLA' : 'ok   '} ${manera.nombre}${fallos.length ? `: ${fallos.join(' · ')}` : ''}`)
  }
}
if (rojos) {
  console.error(`\n${rojos} de ${total} casos en rojo`)
  process.exit(1)
}
console.log(`\n${total} casos en verde: ni Chrome ni perfil sobreviven a ninguna de las tres copias`)
