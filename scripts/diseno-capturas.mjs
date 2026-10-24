// Capturas de las 21 rutas del sitio a 390 y 1280 sobre el build ESTÁTICO (.output/public), para comprobar que un
// commit del sistema de diseño que promete «0 píxeles» no mueve ninguno (sistema v3, fase S0).
//
// Qué hace: abre cada ruta en Chrome (arnés scripts/lib/navegador-cdp.mjs), con movimiento reducido emulado y sin
// animaciones ni transiciones, recorre la página para que carguen las imágenes diferidas, y guarda el PNG en trozos
// de 4000 px (Chrome no pinta de una vez una página de 20 000 px). Al final escribe hashes.json con el SHA-256 de cada
// trozo y de la ruta entera.
//
// Qué NO hace: no pinta WebGL (el arnés arranca sin GPU: los visores 3D salen en su estado sin escena) ni fija el
// reloj. Las cifras vivas de la campaña no entran porque el servidor estático no responde a /fundraiser.json.
// Antes de fiarte de una comparación, pásalo DOS veces sobre el mismo build y compara las dos salidas: si no dan lo
// mismo, la ruta es no determinista y su «0 píxeles» no prueba nada (sale en la lista de «inestables»).
//
// Uso:
//   node scripts/diseno-capturas.mjs --salida /ruta/capturas            capturar las 21 rutas a 390 y 1280
//   node scripts/diseno-capturas.mjs --salida /ruta/capturas --rutas /,/datos --anchos 390
//   node scripts/diseno-capturas.mjs --comparar /ruta/A /ruta/B          lista las rutas cuyo hash cambia
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador } from './lib/navegador-cdp.mjs'

/** Las 21 rutas del sitio (las mismas que mide la auditoría de diseño). */
export const RUTAS = [
  '/', '/ciencia', '/ciencia/evidencia', '/colabora', '/contacto', '/datos', '/equipo', '/gastos', '/gracias',
  '/laminillas', '/lesiones', '/links', '/mapa-metastasis', '/marcas', '/prensa', '/timeline', '/celula-a-celula',
  '/celula-a-celula/explorar', '/aviso-legal', '/privacidad', '/cookies',
]
export const ANCHOS = [390, 1280]
const TROZO = 4000

const nombre = (ruta, ancho) => `${ruta === '/' ? 'inicio' : ruta.slice(1).replace(/\//g, '__')}-${ancho}`
const sha = (buf) => createHash('sha256').update(buf).digest('hex')

/** Estabiliza lo que se puede estabilizar sin tocar el diseño: nada se anima y el cursor de texto no parpadea. */
const ESTABILIZAR = `(() => {
  const s = document.createElement('style')
  s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'
  document.documentElement.appendChild(s)
})()`

async function capturarRuta(nav, ruta, ancho) {
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false })
  await nav.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await nav.cargar(ruta)
  await nav.evaluate(ESTABILIZAR)
  // Recorrido de arriba abajo: dispara los observadores de visibilidad y las imágenes con loading="lazy".
  const alto0 = await nav.evaluate('document.documentElement.scrollHeight')
  for (let y = 0; y < alto0; y += 700) {
    await nav.evaluate(`window.scrollTo(0, ${y})`)
    await nav.sleep(60)
  }
  await nav.evaluate('window.scrollTo(0, 0)')
  await nav.sleep(500)
  const alto = await nav.evaluate('document.documentElement.scrollHeight')
  const trozos = []
  for (let y = 0, i = 0; y < alto; y += TROZO, i++) {
    const r = await nav.cdp('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y, width: ancho, height: Math.min(TROZO, alto - y), scale: 1 },
    })
    trozos.push({ i, buf: Buffer.from(r.data, 'base64') })
  }
  return { alto, trozos }
}

/** Una ruta que no termina en este tiempo se da por colgada (Chrome se reinicia y se sigue con la siguiente). */
const TOPE_RUTA_MS = Number(process.env.CAPTURA_TOPE_MS || 120000)
const conTope = (promesa, ms, que) =>
  Promise.race([promesa, new Promise((_, rechazar) => setTimeout(() => rechazar(new Error(`colgada más de ${ms / 1000} s: ${que}`)), ms).unref())])

async function capturar({ salida, rutas, anchos }) {
  mkdirSync(salida, { recursive: true })
  let nav = await abrirNavegador({ ancho: anchos[0], alto: 900, escala: 1 })
  const hashes = {}
  try {
    for (const ruta of rutas) {
      for (const ancho of anchos) {
        const clave = nombre(ruta, ancho)
        // Chrome se cuelga al azar en alguna captura de página alta (otra ruta en cada pasada): un reintento con
        // un Chrome nuevo lo resuelve. Si falla dos veces, la ruta queda con error y se dice.
        for (let intento = 1; intento <= 2; intento++) {
          try {
            const { alto, trozos } = await conTope(capturarRuta(nav, ruta, ancho), TOPE_RUTA_MS, clave)
            for (const t of trozos) writeFileSync(join(salida, `${clave}.${t.i}.png`), t.buf)
            const porTrozo = trozos.map((t) => sha(t.buf))
            hashes[clave] = { ruta, ancho, alto, hash: sha(porTrozo.join('')), trozos: porTrozo }
            console.log(`✔ ${clave}  ${alto}px  ${hashes[clave].hash.slice(0, 12)}${intento > 1 ? '  (al 2.º intento)' : ''}`)
            break
          } catch (e) {
            hashes[clave] = { ruta, ancho, error: String(e.message || e) }
            console.log(`✘ ${clave}  ${e.message || e}${intento < 2 ? '  → reintento' : ''}`)
            // Chrome puede haber quedado en mal estado: se cierra y se abre otro para no arrastrar el fallo.
            await Promise.race([nav.cerrar().catch(() => {}), new Promise((r) => setTimeout(r, 5000).unref())])
            nav = await abrirNavegador({ ancho: anchos[0], alto: 900, escala: 1 })
          }
        }
      }
    }
  } finally {
    await Promise.race([nav.cerrar().catch(() => {}), new Promise((r) => setTimeout(r, 5000).unref())])
  }
  writeFileSync(join(salida, 'hashes.json'), JSON.stringify(hashes, null, 2))
  return hashes
}

function comparar(a, b) {
  const A = JSON.parse(readFileSync(join(a, 'hashes.json'), 'utf8'))
  const B = JSON.parse(readFileSync(join(b, 'hashes.json'), 'utf8'))
  const claves = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort()
  const cambian = []
  for (const k of claves) {
    const x = A[k], y = B[k]
    if (!x || !y || x.error || y.error) { cambian.push(`${k}  (falta o con error)`); continue }
    if (x.hash !== y.hash) {
      const trozosDistintos = x.trozos.map((h, i) => (h !== y.trozos[i] ? i : -1)).filter((i) => i >= 0)
      cambian.push(`${k}  alto ${x.alto}→${y.alto}  trozos distintos: ${trozosDistintos.join(',') || '(solo el alto)'}`)
    }
  }
  console.log(cambian.length ? `Cambian ${cambian.length} de ${claves.length}:\n  ${cambian.join('\n  ')}` : `Idénticas: ${claves.length} de ${claves.length}`)
  return cambian
}

const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined }
if (import.meta.url === `file://${process.argv[1]}`) {
  if (arg('--comparar')) {
    const cambian = comparar(arg('--comparar'), process.argv[process.argv.indexOf('--comparar') + 2])
    process.exit(cambian.length ? 1 : 0)
  } else {
    const salida = arg('--salida')
    if (!salida) { console.error('Falta --salida <dir>'); process.exit(2) }
    const rutas = arg('--rutas') ? arg('--rutas').split(',') : RUTAS
    const anchos = arg('--anchos') ? arg('--anchos').split(',').map(Number) : ANCHOS
    const h = await capturar({ salida, rutas, anchos })
    process.exit(Object.values(h).some((x) => x.error) ? 1 : 0)
  }
}
