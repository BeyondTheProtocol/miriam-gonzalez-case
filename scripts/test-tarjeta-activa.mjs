// TarjetaEnlace responde al toque (sistema v3, segunda revisión de la fase P1), sobre el build ESTÁTICO.
//
// Por qué existe: al migrar /links a TarjetaEnlace se perdió el `.bio-link:active` (y las Puertas de la home nunca tuvieron uno). Con el
// hover filtrado a puntero fino, en un teléfono no quedaba NINGUNA respuesta al toque en la página más táctil del sitio. Ningún lint de
// CSS lo ve: hace falta forzar el estado :active en Chrome (CDP, CSS.forcePseudoState) y leer el estilo calculado.
//
// Qué exige, a 375 px de ancho, en las tres tonos que pinta la guía viva (suave, apoyo, destacada):
//   · movimiento normal   → el borde cambia, la tarjeta cede (escala < 1) y la flecha avanza.
//   · movimiento reducido → el borde SIGUE cambiando (el color vale siempre) y ni la tarjeta ni la flecha se mueven.
//
// Canario del autor: la misma medida sobre un enlace SIN reglas :active tiene que salir «sin respuesta». Si no, el detector es decorativo.
// Sin baseline: si falla, falla.
//
//   pnpm exec nuxt generate && pnpm test:tarjeta-activa
import { existsSync } from 'node:fs'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

if (!existsSync(ROOT)) {
  console.error('No existe .output/public: corre antes `pnpm exec nuxt generate`.')
  process.exit(2)
}

const TONOS = ['suave', 'apoyo', 'destacada']
const LEE = `(() => {
  const el = document.querySelector('[data-sonda]')
  const flecha = el.querySelector('.tarjeta-enlace__flecha')
  const c = getComputedStyle(el)
  const m = new DOMMatrix(c.transform === 'none' ? undefined : c.transform)
  const mf = flecha ? new DOMMatrix(getComputedStyle(flecha).transform === 'none' ? undefined : getComputedStyle(flecha).transform) : null
  return { borde: c.borderTopColor, escala: m.a, flechaX: mf ? mf.e : 0 }
})()`

/** Marca el elemento, lo fuerza a :active, espera a que acabe la transición (150 ms) y devuelve reposo y activo. */
async function medir(nav, selector) {
  await nav.evaluate(`(() => {
    document.querySelectorAll('[data-sonda]').forEach((e) => e.removeAttribute('data-sonda'))
    const e = document.querySelector(${JSON.stringify(selector)})
    if (!e) throw new Error('no hay ' + ${JSON.stringify(selector)})
    e.scrollIntoView({ block: 'center' })
    e.setAttribute('data-sonda', '1')
  })()`)
  await nav.sleep(400)
  const reposo = await nav.evaluate(LEE)
  const doc = await nav.cdp('DOM.getDocument', { depth: 0 })
  const q = await nav.cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '[data-sonda]' })
  await nav.cdp('CSS.enable')
  await nav.cdp('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: ['active'] })
  await nav.sleep(450)
  const activo = await nav.evaluate(LEE)
  await nav.cdp('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: [] })
  return {
    borde: reposo.borde !== activo.borde,
    escala: reposo.escala - activo.escala,
    flecha: activo.flechaX - reposo.flechaX,
  }
}

const fallos = []
const nav = await abrirNavegador({ ancho: 375, alto: 812, escala: 1 })
let canario
try {
  for (const movimiento of ['no-preference', 'reduce']) {
    await nav.cargar('/guia-de-estilo')
    await nav.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: movimiento }] })
    for (const tono of TONOS) {
      const r = await medir(nav, `a.tarjeta-enlace--${tono}`)
      const donde = `TarjetaEnlace «${tono}» con movimiento ${movimiento === 'reduce' ? 'reducido' : 'normal'}`
      // El borde de la destacada ya es --texto-1 en reposo (la sombra dura lo marca): su borde no cambia, y está bien.
      if (tono !== 'destacada' && !r.borde) fallos.push(`${donde}: el borde no cambia al pulsar (el color tiene que responder siempre)`)
      if (movimiento === 'no-preference') {
        if (!(r.escala > 0)) fallos.push(`${donde}: la tarjeta no cede al pulsar (escala ${r.escala})`)
        if (!(r.flecha > 0)) fallos.push(`${donde}: la flecha no avanza al pulsar (${r.flecha} px)`)
      } else {
        if (r.escala !== 0) fallos.push(`${donde}: la tarjeta se mueve con movimiento reducido (escala ${r.escala})`)
        if (r.flecha !== 0) fallos.push(`${donde}: la flecha se mueve con movimiento reducido (${r.flecha} px)`)
      }
    }
  }
  // Canario: un enlace del mismo tamaño y sin ninguna regla :active. Con movimiento normal tiene que salir «sin respuesta».
  await nav.cargar('/guia-de-estilo')
  await nav.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await nav.evaluate(`(() => {
    const a = document.createElement('a')
    a.id = 'canario-sin-active'; a.href = '#'
    a.style.cssText = 'display:block;padding:16px;border:1px solid #888;transition:transform 150ms'
    a.innerHTML = 'sin :active'
    document.body.prepend(a)
  })()`)
  canario = await medir(nav, '#canario-sin-active')
} finally {
  await nav.cerrar()
}

if (canario.borde || canario.escala !== 0 || canario.flecha !== 0) {
  console.log(`✘ El detector es decorativo: un enlace sin :active salió con respuesta (${JSON.stringify(canario)}).`)
  process.exit(1)
}
if (fallos.length) {
  console.log(fallos.map((f) => `✘ ${f}`).join('\n'))
  console.log(`\n${fallos.length} fallo(s).`)
  process.exit(1)
}
console.log(`✔ test:tarjeta-activa  ${TONOS.length} tonos × movimiento normal y reducido a 375 px · canario: un enlace sin :active sale sin respuesta`)
process.exit(0) // el servidor estático del arnés puede dejar el proceso vivo (conexiones abiertas)
