// Regla R10 del lint de diseño (sistema v3, S6): lo que solo se ve con la página pintada, en Chrome, sobre el build ESTÁTICO.
// Mismo ratchet que scripts/test-diseno.ts: un recuento puede BAJAR, nunca subir (scripts/diseno-render-baseline.json).
//
// Mide en cada ruta, a 390 y a 1280 px:
//   desborde            1 si la página se sale del ancho (scroll horizontal).
//   h1_borde            1 si el borde izquierdo del H1 no cae bajo el del logo (±1 px).
//   texto_bajo_suelo    elementos con texto por debajo de 13 px (12 solo en mono y mayúsculas; por debajo de 12, nunca).
//   objetivos_pequenos  controles de menos de 44 px (salvo un enlace dentro de una frase, que la norma exime).
//   contraste           elementos de texto por debajo de 4,5:1 (3:1 si es grande) sobre su fondo aplanado.
//   foco_tapado         pasos de Tab cuyo foco queda debajo de la cabecera fija (WCAG 2.4.11).
//
// No mide el texto sobre degradados ni sobre imágenes (se salta cualquier nodo con un ANTEPASADO con background-image; el degradado del
// propio nodo, el marcador de los enlaces en línea, sí se mide sobre su color de fondo y los de sus antepasados),
// ni los visores 3D con WebGL (se miden sin él, para que el recuento no dependa de la GPU de cada máquina), ni dispositivo real: es emulación de Chrome, y hover pegado, zoom de iOS y safe-area quedan «sin verificar en teléfono».
//
//   pnpm exec nuxt generate && pnpm test:diseno-render
//   pnpm test:diseno-render --actualizar           graba la baseline (solo si nada sube)
//   pnpm test:diseno-render --rutas /,/datos       solo esas rutas (no compara la baseline)
//   pnpm test:diseno-render --detalle              imprime los primeros ejemplos de cada recuento
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

const RUTA_BASELINE = join(import.meta.dirname, 'diseno-render-baseline.json')
export const RUTAS = [
  '/', '/ciencia', '/ciencia/evidencia', '/colabora', '/contacto', '/datos', '/equipo', '/gastos', '/gracias',
  '/laminillas', '/lesiones', '/links', '/mapa-metastasis', '/marcas', '/prensa', '/timeline', '/celula-a-celula',
  '/celula-a-celula/explorar', '/aviso-legal', '/privacidad', '/cookies', '/guia-de-estilo',
]
const ANCHOS = [390, 1280]
const METRICAS = ['desborde', 'h1_borde', 'texto_bajo_suelo', 'objetivos_pequenos', 'contraste', 'foco_tapado']
const PASOS_TAB = 14

/** Corre dentro de la página. Devuelve recuentos y los primeros ejemplos de cada uno. */
const MEDIR = `(() => {
  const ej = { texto_bajo_suelo: [], objetivos_pequenos: [], contraste: [] }
  const cuenta = { desborde: 0, h1_borde: 0, texto_bajo_suelo: 0, objetivos_pequenos: 0, contraste: 0 }
  const lienzo = document.createElement('canvas'); lienzo.width = lienzo.height = 1
  const cx = lienzo.getContext('2d', { willReadFrequently: true })
  const rgba = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const nombre = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + ' «' + (e.textContent || '').trim().slice(0, 24) + '»'
  const visible = (e, r) => r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'
  const srOnly = (r, cs) => cs.position === 'absolute' && (r.width <= 2 || r.height <= 2)
  const enSvg = (e) => !!e.closest('svg')

  // desborde
  if (document.documentElement.scrollWidth > innerWidth + 1) cuenta.desborde = 1

  // H1 bajo el logo
  const logo = document.querySelector('header a[href="/"], header a[href="/en"], header a')
  const h1 = document.querySelector('main h1, h1')
  if (logo && h1) {
    const rh = h1.getBoundingClientRect()
    if (rh.width > 2 && Math.abs(rh.left - logo.getBoundingClientRect().left) > 1) cuenta.h1_borde = 1
  }

  // fondo aplanado de un elemento. Se salta (null) lo que tenga una imagen o un degradado en un ANTEPASADO, porque detrás del texto
  // hay algo que no se puede aplanar a un color. El degradado del PROPIO nodo no lo salta: es el marcador de .link-inline y
  // .prose a (background-size 0 % en reposo), y saltárselo dejaba sin medir justo la clase de elemento que más contraste pierde
  // (revisión de la fase DS: un enlace a 2,88:1 en /guia-de-estilo salía con contraste 0 y el CI en verde).
  const fondoDe = (e) => {
    let capas = []
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (n !== e && n !== document.body && n !== document.documentElement && cs.backgroundImage !== 'none') return null
      const c = rgba(cs.backgroundColor)
      if (c[3] > 0) capas.push(c)
      if (c[3] >= 1) break
    }
    let base = rgba(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = capas.length - 1; i >= 0; i--) { const c = capas[i]; base = [0, 1, 2].map((k) => c[k] * c[3] + base[k] * (1 - c[3])).concat([1]) }
    return base
  }
  const opacidad = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o }

  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let n
  while ((n = w.nextNode())) {
    if (enSvg(n) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.tagName)) continue
    const cs = getComputedStyle(n)
    const r = n.getBoundingClientRect()
    if (!visible(n, r) || srOnly(r, cs)) continue
    if (n.disabled || n.getAttribute('aria-disabled') === 'true') continue // un control deshabilitado está exento de contraste y de tamaño
    const propio = [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 0)

    if (propio) {
      // texto bajo el suelo
      const fs = parseFloat(cs.fontSize)
      const mono = /mono|jetbrains/i.test(cs.fontFamily) && cs.textTransform === 'uppercase'
      if (fs < 12 || (fs < 13 && !mono)) { cuenta.texto_bajo_suelo++; if (ej.texto_bajo_suelo.length < 6) ej.texto_bajo_suelo.push(fs + 'px ' + nombre(n)) }
      // contraste
      const fondo = fondoDe(n)
      if (fondo && opacidad(n) > 0.05) {
        const fg = rgba(cs.color)
        const o = opacidad(n)
        const a = fg[3] * o
        const color = [0, 1, 2].map((k) => fg[k] * a + fondo[k] * (1 - a))
        const grande = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700)
        const rr = ratio(color, fondo)
        if (rr < (grande ? 3 : 4.5)) { cuenta.contraste++; if (ej.contraste.length < 6) ej.contraste.push(rr.toFixed(2) + ' ' + nombre(n)) }
      }
    }

    // objetivos táctiles
    const interactivo = n.matches('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=radio], [role=checkbox], [role=switch]')
    if (interactivo && r.right > 0 && r.left < innerWidth + 1 && !n.closest('.skip-link, .sr-only') && !n.classList.contains('skip-link')) {
      let enFrase = false
      if (n.tagName === 'A' && cs.display === 'inline') {
        const pariente = n.parentElement
        const otro = [...pariente.childNodes].filter((c) => c !== n && (c.nodeType === 3 ? c.textContent.trim().length > 2 : (c.nodeType === 1 && getComputedStyle(c).display === 'inline'))).length
        enFrase = otro > 0
      }
      if (!enFrase && (r.height < 43.5 || r.width < 43.5)) { cuenta.objetivos_pequenos++; if (ej.objetivos_pequenos.length < 6) ej.objetivos_pequenos.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + nombre(n)) }
    }
  }
  return { cuenta, ej }
})()`

async function pulsarTab(nav) {
  for (const type of ['keyDown', 'keyUp']) {
    await nav.cdp('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  }
  await nav.sleep(60)
}

/** Foco por teclado: ¿queda tapado por la cabecera fija? */
async function focoTapado(nav) {
  await nav.evaluate('window.scrollTo(0, 0); document.activeElement && document.activeElement.blur()')
  let tapados = 0
  const ej = []
  for (let i = 0; i < PASOS_TAB; i++) {
    await pulsarTab(nav)
    const d = await nav.evaluate(`(() => {
      const a = document.activeElement
      if (!a || a === document.body) return null
      if (a.closest('header, [data-cabecera-fija], .skip-link') || a.classList.contains('skip-link')) return { dentro: true }
      const cab = document.querySelector('[data-cabecera-fija]') || document.querySelector('header')
      const hb = cab ? cab.getBoundingClientRect().bottom : 0
      const r = a.getBoundingClientRect()
      return { dentro: false, top: r.top, bottom: r.bottom, alto: r.height, hb, nombre: a.tagName.toLowerCase() + ' «' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 20) + '»' }
    })()`)
    if (!d || d.dentro) continue
    // tapado = más de la mitad del control queda bajo la cabecera
    if (d.top < d.hb && d.bottom - d.hb < d.alto / 2) { tapados++; if (ej.length < 4) ej.push(`top ${Math.round(d.top)} < cabecera ${Math.round(d.hb)}: ${d.nombre}`) }
  }
  return { tapados, ej }
}

// Los visores 3D (/lesiones, /mapa-metastasis, el explorador) pintan un DOM distinto según si el Chrome tiene WebGL: el del Mac
// y el del runner de Linux no coinciden (lo midió el primer run de diseno.yml, 24-oct-2026: solo esas dos rutas daban otro recuento).
// Se mide SIEMPRE sin WebGL, que es el estado que ve quien no puede usarlo, y así el número es el mismo en cualquier máquina.
const SIN_WEBGL = `(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
    return /webgl/i.test(String(tipo)) ? null : original.call(this, tipo, ...resto)
  }
})()`

async function medir(rutas) {
  const nav = await abrirNavegador({ ancho: ANCHOS[0], alto: 900, escala: 1 })
  await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source: SIN_WEBGL })
  const res = {}
  const ejemplos = {}
  try {
    for (const ruta of rutas) {
      for (const ancho of ANCHOS) {
        const clave = `${ruta}:${ancho}`
        try {
          await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false })
          await nav.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
          await nav.cargar(ruta)
          await nav.evaluate("(() => { const s = document.createElement('style'); s.textContent = '*{animation:none!important;transition:none!important}'; document.documentElement.appendChild(s) })()")
          await nav.sleep(300)
          const { cuenta, ej } = await nav.evaluate(MEDIR)
          const f = await focoTapado(nav)
          res[clave] = { ...cuenta, foco_tapado: f.tapados }
          ejemplos[clave] = { ...ej, foco_tapado: f.ej }
          console.log(`  ${clave.padEnd(34)} ${METRICAS.map((m) => `${m.slice(0, 8)} ${res[clave][m]}`).join('  ')}`)
        } catch (e) {
          res[clave] = { error: String(e.message || e) }
          console.log(`✘ ${clave}  ${e.message || e}`)
        }
      }
    }
  } finally {
    await nav.cerrar()
  }
  return { res, ejemplos }
}

const args = process.argv.slice(2)
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)

if (!existsSync(ROOT)) {
  console.error('No existe .output/public: corre antes `pnpm exec nuxt generate`.')
  process.exit(2)
}
const rutas = arg('--rutas') ? arg('--rutas').split(',') : RUTAS
const { res, ejemplos } = await medir(rutas)
const errores = Object.entries(res).filter(([, v]) => v.error)
if (errores.length) {
  console.log(`\n✘ ${errores.length} medición(es) con error: ${errores.map(([k]) => k).join(', ')}`)
  process.exit(1)
}
if (args.includes('--detalle')) {
  for (const [clave, por] of Object.entries(ejemplos)) for (const [m, lista] of Object.entries(por)) if (lista.length) console.log(`\n${clave} ${m}:\n   ${lista.join('\n   ')}`)
}
if (arg('--rutas')) process.exit(0)

const previa = existsSync(RUTA_BASELINE) ? JSON.parse(readFileSync(RUTA_BASELINE, 'utf8')) : null
const total = (m) => Object.values(res).reduce((a, v) => a + v[m], 0)
const resumen = METRICAS.map((m) => `${m} ${total(m)}`).join(' · ')

if (args.includes('--actualizar')) {
  if (previa) {
    const sube = []
    for (const [k, v] of Object.entries(res)) for (const m of METRICAS) if (v[m] > (previa.rutas[k]?.[m] ?? 0)) sube.push(`${k} ${m}: ${previa.rutas[k]?.[m] ?? 0} → ${v[m]}`)
    if (sube.length) {
      console.log(`✘ La baseline no se actualiza: solo puede bajar.\n   ${sube.join('\n   ')}`)
      process.exit(1)
    }
  }
  const nota = 'Generado por scripts/test-diseno-render.mjs (pnpm test:diseno-render --actualizar). Un recuento puede bajar, nunca subir. No se edita a mano.'
  writeFileSync(RUTA_BASELINE, JSON.stringify({ version: 1, nota, rutas: res }, null, 2) + '\n')
  console.log(`Baseline de render actualizada. ${resumen}`)
  process.exit(0)
}

if (!previa) {
  console.log('✘ No existe scripts/diseno-render-baseline.json. Créala con: pnpm test:diseno-render --actualizar')
  process.exit(1)
}
const fallos = []
for (const k of new Set([...Object.keys(res), ...Object.keys(previa.rutas)])) {
  for (const m of METRICAS) {
    const a = res[k]?.[m] ?? 0, b = previa.rutas[k]?.[m] ?? 0
    if (a > b) fallos.push(`${k} ${m}: ${b} → ${a} (SUBE)`)
    else if (a < b) fallos.push(`${k} ${m}: ${b} → ${a} (BAJA: bien; regenera con pnpm test:diseno-render --actualizar)`)
  }
}
if (fallos.length) {
  console.log(fallos.map((f) => `✘ ${f}`).join('\n'))
  console.log(`\n${fallos.length} fallo(s). ${resumen}`)
  process.exit(1)
}
console.log(`✔ test:diseno-render  ${resumen}`)
