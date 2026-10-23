// La home del rediseño (F5, 23-oct-2026) y sus enlaces, sobre el build ESTÁTICO (.output/public) en Chrome.
//
// Historia: hasta F5 este test vigilaba las siete tarjetas de «Elige tu camino» y sus accesos directos (plan del 20-oct-2026;
// Miriam: «en la home la gente sepa qué mirar… acceso directo a las diferentes herramientas porque /ciencia es muy largo»).
// La decisión del rediseño las quitó y puso CUATRO PUERTAS; lo que protegían (que la home se lea en cualquier ancho, que el
// tabulador siga el DOM, que los enlaces tengan href real y 44 px, contraste alto) se conserva sobre la home nueva.
//
// Lo que comprueba, en ES y EN:
// 1. 320 a 1440 px: sin scroll horizontal; los 7 bloques en orden de arriba abajo; un H1 que no se desborda; «Apoyar» y
//    «Entender el caso» de ≥ 44 px (apilados en móvil y en 768-1023 px, lado a lado en 640-767 y desde 1024); el enlace «¿Eres clínico o laboratorio?», la
//    tira de prensa y la fila de acciones de «Dónde estamos» con ≥ 44 px; las 4 puertas con su href, ≥ 56 px y en el orden del
//    DOM (1 columna en móvil, 2 en tableta, 4 desde 1024); y UN solo botón coral en la zona del dinero.
//    320 y 640 px cubren también el zoom al 400 % y al 200 % de una pantalla de 1280.
// 2. El tabulador recorre todo <main> en el orden del DOM (a 1280 y a 375 px) y el anillo de foco se ve.
// 3. «Entender el caso» baja a #caso (clic y teclado): el título queda a la vista y por debajo de la cabecera fija.
// 4. Los clics llevan a donde dicen: «Escribir al equipo» → /contacto con el rol de investigación ya marcado.
// 5. /contacto preselecciona el rol (oncologist, researcher).
// 6. Los destinos antiguos que siguen vivos: /ciencia?nivel=pro#snapshot-title («De un vistazo», con el foco) y el destino de
//    /caso (#que-buscamos, en /datos; leído de nuxt.config.ts), con carga directa: el título queda a la vista y por debajo de la
//    barra de secciones, el foco está en él (el primer Tab entra en las peticiones, no en los chips) y, con la barra ya pegada,
//    ningún chip queda tapado por la cabecera fija (a 375, 1024 y 1280 px).
// 7. Contraste alto y colores forzados: las puertas y los botones del hero siguen visibles, de 44 px y con borde.
// 8. /colabora conserva sus chips «por perfil»; el pie ya no los lleva (rediseño de arquitectura, F3; /colabora los cambia por
//    las cuatro puertas en F10).
// 9. Los enlaces que abren pestaña nueva (la puerta «Apoyar», el hero y la prensa): rel="noopener" y aviso para lector de pantalla.
// 10. Chrome mínimo (F3): /links y /gracias, en ES y EN a 320, 375 y 1280 px, sin menú, sin barra «lo último» y con un pie
//    reducido (las 5 redes y lo legal, sin logos ni columnas); /gracias además sin «Apoyar» en la cabecera ni en el pie.
//    /links conserva en la cabecera, a TODOS los anchos (también en móvil, donde ya no hay hamburguesa), un enlace a
//    GoFundMe visible y de 44 px, sin solaparse con el logo ni con el selector de idioma: es la puerta móvil de la bio.
//    Bajo 420 px el nombre del logo pasa a sr-only en /links (no en /gracias), y mientras se recorre /links a 375×568
//    nunca hay un segundo enlace a GoFundMe a la vista (la barra «Donar» del móvil no sale encima).
//    El chrome reaparece y desaparece al navegar sin recargar (logo → home → atrás; «Volver al inicio» → atrás).
//
// CAPTURAS=<carpeta> guarda capturas de la rejilla para la revisión de `diseno`.
// Uso: pnpm exec nuxt generate && pnpm test:home-caminos
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador } from './lib/navegador-cdp.mjs'

const TOPE_MIN = Number(process.env.TOPE_MIN || 12)
const tope = setTimeout(() => {
  console.error(`\n❌ TOPE: el test pasó de ${TOPE_MIN} min`)
  process.exit(2)
}, TOPE_MIN * 60_000)

let fallos = 0
const ok = (cond, msg) => {
  console.log(`  ${cond ? '✅' : '❌'} ${msg}`)
  if (!cond) fallos++
}
const CAPTURAS = process.env.CAPTURAS
if (CAPTURAS) mkdirSync(CAPTURAS, { recursive: true })

const ESPERADO = {
  es: {
    home: '/',
    puertas: ['https://gofund.me/3e25cae99', '/datos#que-buscamos', '/prensa', '/colabora'],
    escribir: '/contacto?role=researcher',
    todas: '/datos#que-buscamos',
    tresD: '/lesiones',
    nuevaPestana: /pestaña nueva/,
  },
  en: {
    home: '/en',
    puertas: ['https://gofund.me/3e25cae99', '/en/data#que-buscamos', '/en/press', '/en/collaborate'],
    escribir: '/en/contact?role=researcher',
    todas: '/en/data#que-buscamos',
    tresD: '/en/lesiones',
    nuevaPestana: /new tab/,
  },
}
const ANCHOS = [320, 375, 639, 640, 768, 1023, 1024, 1280, 1440]
const PUERTA_MIN = 56

// Lo que mide la home de un vistazo: bloques, hero, prensa, acciones de «Dónde estamos», dinero y puertas.
const LEER = `(() => {
  const rect = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height) } }
  const main = document.querySelector('main')
  const q = (sel, raiz = main) => { const el = raiz.querySelector(sel); return el ? { ...rect(el), href: el.getAttribute('href'), visible: el.offsetParent !== null } : null }
  const secciones = [...main.querySelectorAll(':scope > div > section')]
  const donde = main.querySelector('section[aria-labelledby="h-donde"]')
  const dinero = main.querySelector('#campaign')
  const h1 = main.querySelector('h1')
  const lh = parseFloat(getComputedStyle(h1).lineHeight)
  return {
    vw: innerWidth,
    sw: document.documentElement.scrollWidth,
    secciones: secciones.map((s) => ({ ...rect(s), nombre: s.id || s.getAttribute('aria-labelledby') || s.className.split(' ')[0] })),
    h1: { ...rect(h1), lineas: Math.round(h1.getBoundingClientRect().height / lh), n: main.querySelectorAll('h1').length },
    cta: q('.hero__cta a.btn-cta'), entender: q('.hero__cta a.btn-secondary'), pro: q('.hero__pro'),
    prensa: [...main.querySelectorAll('.prensa-tira__medio')].map((a) => ({ ...rect(a), visible: a.offsetParent !== null })),
    sala: q('.prensa-tira__sala'),
    escribir: q('a.btn-secondary[href*="role=researcher"]', donde), todas: q('a[href$="#que-buscamos"]', donde), tresD: q('a[href$="/lesiones"]', donde),
    peticiones: donde.querySelectorAll('.qb__lista li').length,
    corales: [...dinero.querySelectorAll('a.btn-cta')].map((a) => a.getAttribute('href')),
    puertas: [...main.querySelectorAll('.puertas a')].map((a) => {
      const cs = getComputedStyle(a)
      return { href: a.getAttribute('href'), ...rect(a), visible: a.offsetParent !== null, target: a.getAttribute('target'), rel: a.getAttribute('rel'),
        aviso: a.querySelector('.sr-only')?.textContent.trim() ?? '', borde: cs.borderTopColor, bordeAncho: parseFloat(cs.borderTopWidth), texto: a.textContent.replace(a.querySelector('.sr-only')?.textContent ?? '', '').trim() }
    }),
  }
})()`

// Lo que el tabulador debería recorrer en <main>: lo enfocable y visible, en el orden del DOM.
const TABULABLES = `[...document.querySelectorAll('main a[href], main button')]
  .filter((el) => el.offsetParent !== null).map((el) => el.getAttribute('href') || 'button:' + el.textContent.trim().slice(0, 24))`
const ACTIVO = `(() => { const el = document.activeElement; return el ? (el.getAttribute('href') || 'button:' + el.textContent.trim().slice(0, 24)) : null })()`

const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
const { cargar, evaluate, cdp, sleep } = nav

async function ancho(w, alto = 900) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: alto, deviceScaleFactor: 1, mobile: false })
}
async function tecla(key, code, vk) {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, ...(key === 'Enter' ? { text: '\r' } : {}) })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk })
}
const tab = () => tecla('Tab', 'Tab', 9)
// Captura de la home entera (las secciones llevan v-reveal: se recorre la página para destaparlas antes).
async function capturar(nombre) {
  if (!CAPTURAS) return
  const alto = await evaluate('document.documentElement.scrollHeight')
  for (let y = 0; y <= alto; y += 400) { await evaluate(`window.scrollTo(0, ${y})`); await sleep(100) }
  await evaluate('window.scrollTo(0, 0)')
  await sleep(700) // la transición de entrada
  const h = await evaluate('document.documentElement.scrollHeight')
  const w = await evaluate('innerWidth')
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } })
  writeFileSync(join(CAPTURAS, `${nombre}.png`), Buffer.from(data, 'base64'))
}
// Espera a que `cond` (expresión JS) sea cierta, hasta `ms`.
async function hasta(cond, ms = 6000) {
  for (let t = 0; t < ms; t += 150) {
    if (await evaluate(cond).catch(() => false)) return true
    await sleep(150)
  }
  return false
}
// Para el mensaje de un fallo: dónde se quedó la página (en el CI no hay capturas).
const DONDE = (id) => `(() => { const el = document.getElementById('${id}'); const b = el?.getBoundingClientRect(); return { ruta: location.pathname + location.search + location.hash, scrollY: Math.round(scrollY), top: b ? Math.round(b.top) : null, visible: !!el && el.offsetParent !== null, alto: innerHeight } })()`
// Destino real de /caso: se lee de nuxt.config.ts, no se copia aquí, para que el test siga al enlace que se reenvía a médicos.
const DESTINO_CASO = readFileSync(join(import.meta.dirname, '..', 'nuxt.config.ts'), 'utf8').match(/'\/caso':\s*\{\s*redirect:\s*\{\s*to:\s*'([^']+)'/)?.[1] ?? ''
// ¿El título está a la vista Y por debajo de la barra fija de /datos (.dt-barra)? Con el router a solas (top: 80) quedaba tapado.
// Se mide el título (h2) y no la sección: la sección empieza a 124 px y su relleno de arriba (32 px) deja el título libre; en
// escritorio la barra baja hasta 132 px, así que el borde de la sección pasa por debajo de ella sin tapar nada.
const BAJO_LA_BARRA = (id) => `(() => { const el = document.getElementById('${id}'); const barra = document.querySelector('.dt-barra'); if (!el || !barra || el.offsetParent === null) return false; const t = el.getBoundingClientRect().top; return t >= barra.getBoundingClientRect().bottom - 2 && t < innerHeight - 40 })()`
const EN_PANTALLA = (id) => `(() => { const el = document.getElementById('${id}'); if (!el || el.offsetParent === null) return false; const b = el.getBoundingClientRect(); return b.top >= 0 && b.top < innerHeight - 40 })()`
// Los chips de /datos (.dt-barra), con la barra ya pegada bajo la cabecera fija: ¿alguno queda tapado? Se mide con
// elementFromPoint en el centro de cada chip (lo que de verdad recibe el toque) y con el borde: el chip entero, por debajo
// de la cabecera. A 375 px la barra tiene scroll horizontal; se mueve su scrollLeft (no scrollIntoView: movería la página).
const CHIPS_LIBRES = `(() => {
  const cab = document.querySelector('[data-cabecera-fija]'); const barra = document.querySelector('.dt-barra')
  if (!cab || !barra) return null
  const suelo = cab.getBoundingClientRect().bottom
  return { suelo: Math.round(suelo), pegada: Math.abs(barra.getBoundingClientRect().top - suelo) <= 1, barraTop: Math.round(barra.getBoundingClientRect().top),
    chips: [...barra.querySelectorAll('.dt-chip')].map((chip) => {
      barra.scrollLeft = Math.max(0, chip.offsetLeft - 16)
      const r = chip.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return { texto: chip.textContent.trim(), top: Math.round(r.top), h: Math.round(r.height), libre: r.top >= suelo - 1 && !!el && chip.contains(el) }
    }) }
})()`

try {
  for (const loc of ['es', 'en']) {
    const E = ESPERADO[loc]
    console.log(`\n1. La home por ancho (${loc.toUpperCase()})`)
    for (const w of ANCHOS) {
      await ancho(w)
      await cargar(E.home)
      const s = await evaluate(LEER)
      ok(s.sw <= s.vw, `${w}px: sin scroll horizontal (${s.sw} ≤ ${s.vw})`)
      ok(s.secciones.length === 7 && s.secciones.every((x, i) => i === 0 || x.y > s.secciones[i - 1].y), `${w}px: 7 bloques, cada uno debajo del anterior (${s.secciones.map((x) => x.nombre).join(' › ')})`)
      ok(s.h1.n === 1 && s.h1.w <= s.vw && s.h1.lineas <= 6, `${w}px: un solo H1, dentro de la pantalla y en ${s.h1.lineas} líneas (≤ 6)`)
      // lado a lado de 640 a 767 px (hero a todo el ancho) y desde 1024; apilados en móvil y en 768-1023 (la foto estrecha el texto)
      const apilados = w < 640 || (w >= 768 && w < 1024)
      ok(s.cta.h >= 44 && s.entender.h >= 44, `${w}px: «Apoyar» y «Entender el caso» de ≥ 44 px (${s.cta.h}, ${s.entender.h})`)
      ok(apilados ? s.entender.y >= s.cta.y + s.cta.h - 1 && s.entender.x === s.cta.x : s.entender.y === s.cta.y && s.entender.x > s.cta.x, `${w}px: los dos botones del hero ${apilados ? 'se apilan' : 'van lado a lado'}`)
      ok(s.pro.h >= 44 && s.pro.visible, `${w}px: el enlace «¿Eres clínico o laboratorio?» de ≥ 44 px (${s.pro.h})`)
      ok(s.prensa.length === 7 && s.prensa.every((m) => m.visible && m.h >= 44) && s.sala.h >= 44, `${w}px: los 7 medios y «Sala de prensa» de ≥ 44 px (${s.prensa.map((m) => m.h).join(', ')}, ${s.sala.h})`)
      ok(s.peticiones === 3, `${w}px: «Qué buscamos» enseña 3 peticiones (${s.peticiones})`)
      ok(s.escribir?.href === E.escribir && s.todas?.href === E.todas && s.tresD?.href === E.tresD && [s.escribir, s.todas, s.tresD].every((x) => x.h >= 44), `${w}px: «Escribir al equipo», «Ver todo lo que buscamos» y «Míralo en 3D» con su href y ≥ 44 px (${[s.escribir, s.todas, s.tresD].map((x) => x?.h).join(', ')})`)
      ok(s.corales.length === 1 && s.corales[0] === 'https://gofund.me/3e25cae99', `${w}px: un solo botón coral en la zona del dinero (${s.corales.length})`)
      const P = s.puertas
      ok(JSON.stringify(P.map((x) => x.href)) === JSON.stringify(E.puertas), `${w}px: las 4 puertas, con sus destinos (${P.map((x) => x.href).join(' · ')})`)
      ok(P.every((x) => x.visible && x.h >= PUERTA_MIN && x.w >= 44), `${w}px: las puertas se ven y miden ≥ ${PUERTA_MIN} px (${P.map((x) => x.h).join(', ')})`)
      const filas = new Set(P.map((x) => x.y)).size
      const esperadas = w >= 1024 ? 1 : w >= 640 ? 2 : 4
      ok(filas === esperadas, `${w}px: las puertas en ${esperadas} fila(s) (${filas})`)
      const lectura = [...P].sort((a, b) => a.y - b.y || a.x - b.x).map((x) => x.href)
      ok(JSON.stringify(lectura) === JSON.stringify(E.puertas), `${w}px: orden visual de las puertas = orden del DOM`)
      const solapa = P.some((p, i) => P.slice(i + 1).some((q) => Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x) > 1 && Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y) > 1))
      ok(!solapa, `${w}px: ninguna puerta se solapa con otra`)
      if ([375, 768, 1024, 1280, 1440].includes(w)) await capturar(`${loc}-${w}`)
    }
  }

  console.log('\n2. Tabulador y foco')
  for (const w of [1280, 375]) {
    await ancho(w)
    await cargar('/')
    const esperado = await evaluate(TABULABLES)
    await evaluate(`document.querySelector('main a[href], main button').focus()`)
    const visto = [await evaluate(ACTIVO)]
    for (let i = 1; i < esperado.length; i++) {
      await tab()
      visto.push(await evaluate(ACTIVO))
    }
    ok(esperado.length >= 20 && JSON.stringify(visto) === JSON.stringify(esperado), `${w}px: el tabulador sigue el DOM de <main> (${esperado.length} paradas)${JSON.stringify(visto) === JSON.stringify(esperado) ? '' : `\n       visto:    ${visto.join(' | ')}\n       esperado: ${esperado.join(' | ')}`}`)
    // Anillo de foco visible (regla global de :focus-visible) en el primer botón y en una puerta, al llegar con el tabulador.
    await evaluate(`document.querySelector('.hero__cta a.btn-cta').focus()`)
    await tab() // → «Entender el caso» (teclado: :focus-visible)
    const anilloHero = await evaluate(`(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { esEntender: el.getAttribute('href') === '#caso', fv: el.matches(':focus-visible'), estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth) } })()`)
    ok(anilloHero.esEntender && anilloHero.fv && anilloHero.estilo !== 'none' && anilloHero.ancho >= 2, `${w}px: «Entender el caso» enfocado con el tabulador lleva anillo (${anilloHero.estilo} ${anilloHero.ancho}px)`)
    await evaluate(`document.querySelector('.puertas a').focus()`)
    await tab()
    const anilloPuerta = await evaluate(`(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { puerta: el.classList.contains('puerta'), fv: el.matches(':focus-visible'), estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth) } })()`)
    ok(anilloPuerta.puerta && anilloPuerta.fv && anilloPuerta.estilo !== 'none' && anilloPuerta.ancho >= 2, `${w}px: una puerta enfocada con el tabulador lleva anillo (${anilloPuerta.estilo} ${anilloPuerta.ancho}px)`)
  }

  console.log('\n3. «Entender el caso» baja a #caso (clic y teclado), ES y EN')
  for (const w of [1280, 375]) {
    for (const loc of ['es', 'en']) {
      const E = ESPERADO[loc]
      await ancho(w, 800)
      // el título a la vista Y por debajo de la cabecera fija (si no, queda tapado)
      const BAJO_CABECERA = `(() => { const t = document.getElementById('h-caso')?.getBoundingClientRect().top; const cab = document.querySelector('[data-cabecera-fija]').getBoundingClientRect().bottom; return t !== undefined && t >= cab - 2 && t < innerHeight - 40 })()`
      await cargar(E.home)
      const hayEnlace = await evaluate(`!!document.querySelector('.hero__cta a[href="#caso"]') && !!document.getElementById('caso')`)
      ok(hayEnlace, `${w}px ${loc}: el hero tiene «Entender el caso» → #caso y la página tiene #caso`)
      if (!hayEnlace) continue
      // Sin JS el salto lo hace el navegador y no el router (que sí mide la cabecera): el hueco tiene que venir del propio #caso.
      const margen = await evaluate(`parseFloat(getComputedStyle(document.getElementById('caso')).scrollMarginTop)`)
      ok(margen >= 72, `${w}px ${loc}: #caso lleva scroll-margin-top ≥ 72 px (sin JS, el salto nativo no lo deja bajo la cabecera fija): ${margen}`)
      await evaluate(`document.querySelector('.hero__cta a[href="#caso"]').click()`)
      const clic = await hasta(BAJO_CABECERA)
      ok(clic && (await evaluate('location.hash')) === '#caso', `${w}px ${loc}, clic: «El caso en 3 frases» a la vista y bajo la cabecera, con #caso en la URL${clic ? '' : ` (${JSON.stringify(await evaluate(DONDE('h-caso')))})`}`)
      await cargar(E.home)
      await evaluate(`document.querySelector('.hero__cta a[href="#caso"]').focus()`)
      await tecla('Enter', 'Enter', 13)
      const teclado = await hasta(BAJO_CABECERA)
      ok(teclado, `${w}px ${loc}, teclado (Enter): lo mismo${teclado ? '' : ` (${JSON.stringify(await evaluate(DONDE('h-caso')))})`}`)
      // y el siguiente Tab sigue DESDE ahí (el destino de un ancla se vuelve el punto de partida del foco): no vuelve al principio
      await tab()
      const siguiente = await evaluate(`(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); return { dentro: !!el.closest('main'), abajo: r.top + scrollY > document.getElementById('caso').getBoundingClientRect().top + scrollY - 5 } })()`)
      ok(siguiente.dentro && siguiente.abajo, `${w}px ${loc}: tras el salto, el siguiente Tab sigue desde «El caso en 3 frases», no desde arriba`)
    }
  }

  console.log('\n4. «Escribir al equipo» lleva a /contacto con el rol de investigación')
  for (const loc of ['es', 'en']) {
    const E = ESPERADO[loc]
    await ancho(1280)
    await cargar(E.home)
    await evaluate(`document.querySelector('section[aria-labelledby="h-donde"] a.btn-secondary[href*="role=researcher"]').click()`)
    const llego = await hasta(`location.pathname + location.search === '${E.escribir}' && document.querySelector('select option[value="researcher"]')?.parentElement.value === 'researcher'`, 8000)
    ok(llego, `${loc}: el clic llega a ${E.escribir} con el rol «researcher» ya marcado${llego ? '' : ` (${await evaluate('location.pathname + location.search')})`}`)
  }

  console.log('\n5. /contacto preselecciona el rol')
  for (const [ruta, rol] of [['/contacto?role=oncologist', 'oncologist'], ['/contacto?role=researcher', 'researcher'], ['/en/contact?role=researcher', 'researcher']]) {
    await cargar(ruta)
    const v = await evaluate(`document.querySelector('select option[value="${rol}"]')?.parentElement.value ?? null`)
    ok(v === rol, `${ruta}: el selector llega con «${rol}» (${v})`)
  }

  console.log('\n6. Destinos que siguen vivos: «De un vistazo» (/ciencia) y el de /caso (Qué buscamos)')
  for (const w of [1280, 375]) {
    await ancho(w, 800)
    await cargar('/')
    // Otra página antes: navegar a la MISMA URL con #ancla es un salto dentro del documento, no una carga.
    await cargar('/')
    for (const ruta of ['/ciencia?nivel=pro#snapshot-title', '/en/science?nivel=pro#snapshot-title']) {
      await cargar(ruta)
      ok(await hasta(EN_PANTALLA('snapshot-title')), `${w}px, carga directa de ${ruta}: #snapshot-title en pantalla`)
      ok(await hasta(`document.activeElement?.id === 'snapshot-title'`, 3000), `${w}px, carga directa de ${ruta}: el foco está en «De un vistazo»`)
    }
    // /caso (el enlace que se reenvía a médicos) → «Qué buscamos» de /datos, en ES y EN (rediseño F1, 23-oct-2026).
    // Carga directa: en la página prerenderizada el hash llega después de hidratar y el router a solas deja el
    // título bajo la barra; la página lo recoloca cuando el scroll se queda quieto (~200 ms), así que se espera
    // a que la posición correcta aguante medio segundo.
    ok(/^\/datos\?.*#que-buscamos$/.test(DESTINO_CASO), `/caso aterriza en /datos#que-buscamos (${DESTINO_CASO || 'sin regla en nuxt.config.ts'})`)
    for (const ruta of [DESTINO_CASO, DESTINO_CASO.replace(/^\/datos/, '/en/data')]) {
      await cargar('/')
      await cargar(ruta)
      const llego = await hasta(BAJO_LA_BARRA('h-busca'), 6000)
      await sleep(500)
      const sigue = llego && (await evaluate(BAJO_LA_BARRA('h-busca')))
      const donde = sigue ? '' : ` (${JSON.stringify(await evaluate(DONDE('h-busca')))})`
      ok(sigue, `${w}px, carga directa de ${ruta}: el título «Qué buscamos» a la vista y bajo la barra de secciones${donde}`)
      // El destino antiguo (/ciencia#mapa-acceso) llevaba el foco al ancla; este también: quien navega con teclado o con
      // lector de pantalla empieza en «Qué buscamos» y el primer Tab entra en las peticiones, no en los chips ni en «Hoy».
      ok(await hasta(`document.activeElement?.id === 'h-busca'`, 3000), `${w}px, carga directa de ${ruta}: el foco está en «Qué buscamos» (${await evaluate(`document.activeElement?.tagName + '#' + (document.activeElement?.id || '')`)})`)
      await tab()
      const tras = await evaluate(`(() => { const el = document.activeElement; return { dentro: !!el?.closest('#que-buscamos'), que: (el?.tagName ?? '') + ' ' + (el?.getAttribute('href') ?? el?.textContent?.trim().slice(0, 24) ?? '') } })()`)
      ok(tras.dentro, `${w}px, carga directa de ${ruta}: el primer Tab entra en las peticiones (${tras.que})`)
    }
    // el enlace antiguo de /caso sigue funcionando: hay quien lo tiene guardado o reenviado
    await cargar('/ciencia?nivel=pro&utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#mapa-acceso')
    ok(await hasta(EN_PANTALLA('mapa-acceso')), `${w}px, carga directa del destino ANTIGUO de /caso: #mapa-acceso en pantalla`)
    ok(await hasta(`document.activeElement?.id === 'mapa-acceso'`, 3000), `${w}px, carga directa del destino ANTIGUO de /caso: el foco está en el acceso para el equipo médico`)
  }

  console.log('\n6b. Los chips de /datos no los tapa la cabecera fija')
  // Preexistente (la barra «lo último» se montó sobre la cabecera el 26-sep y la barra de secciones seguía a top: 64/72 px),
  // pero /caso aterriza aquí: es la primera pantalla del médico. Medido en el build: la cabecera cubría los 6 chips a 375,
  // 1024 y 1280 px y quedaban ~13 de 44 px tocables.
  for (const ruta of [DESTINO_CASO, DESTINO_CASO.replace(/^\/datos/, '/en/data')]) {
    for (const w of [375, 1024, 1280]) {
      await ancho(w, 800)
      await cargar('/')
      await cargar(ruta)
      await hasta(BAJO_LA_BARRA('h-busca'), 6000)
      await sleep(500)
      const b = await evaluate(CHIPS_LIBRES)
      // F4 (23-oct-2026): +1 chip, «Herramientas» (#visores): la franja que sustituye al índice /herramientas. Antes eran 6.
      ok(!!b && b.chips.length === 7, `${w}px ${ruta}: la barra tiene sus 7 chips (${b?.chips.length})`)
      ok(!!b && b.pegada, `${w}px ${ruta}: la barra queda pegada justo bajo la cabecera (barra a ${b?.barraTop} px, cabecera hasta ${b?.suelo} px)`)
      const tapados = (b?.chips ?? []).filter((c) => !c.libre)
      ok(tapados.length === 0, `${w}px ${ruta}: ningún chip tapado por la cabecera${tapados.length ? ` (tapados: ${tapados.map((c) => `${c.texto} a ${c.top} px`).join(', ')})` : ''}`)
      ok(!!b && b.chips.every((c) => c.h >= 44), `${w}px ${ruta}: los chips conservan 44 px de alto (${b?.chips.map((c) => c.h).join(', ')})`)
    }
  }

  console.log('\n7. Contraste alto y colores forzados')
  for (const [nombre, features] of [['contraste', [{ name: 'prefers-contrast', value: 'more' }]], ['forzados', [{ name: 'forced-colors', value: 'active' }]]]) {
    await cdp('Emulation.setEmulatedMedia', { features })
    for (const w of [1280, 375]) {
      await ancho(w)
      await cargar('/')
      const s = await evaluate(LEER)
      ok(s.puertas.length === 4 && s.puertas.every((a) => a.visible && a.h >= PUERTA_MIN && a.bordeAncho >= 1 && !/rgba\(0, 0, 0, 0\)|transparent/.test(a.borde)), `${nombre} ${w}px: las 4 puertas visibles, ≥ ${PUERTA_MIN} px y con borde`)
      ok(s.cta.h >= 44 && s.entender.h >= 44 && s.pro.visible, `${nombre} ${w}px: los dos botones del hero y el enlace profesional siguen a la vista y de 44 px`)
      await capturar(`${nombre}-${w}`)
    }
    await cdp('Emulation.setEmulatedMedia', { features: [] })
  }

  console.log('\n8. /colabora conserva sus chips; el pie ya no los lleva')
  await ancho(1280)
  await cargar('/colabora')
  const colabora = await evaluate(`({ chips: document.querySelectorAll('main .pathway-chip').length, accesos: document.querySelectorAll('.pathway-acceso').length })`)
  ok(colabora.chips > 0 && colabora.accesos === 0, `/colabora: sus chips (${colabora.chips}) y ningún acceso de la home`)
  await cargar('/')
  const pie = await evaluate(`({ chips: document.querySelectorAll('footer .pathway-chip').length, accesos: document.querySelectorAll('footer .pathway-acceso').length })`)
  ok(pie.chips === 0 && pie.accesos === 0, `pie: ningún chip «por perfil» (${pie.chips}) ni acceso de la home (${pie.accesos})`)

  console.log('\n9. Los enlaces que abren pestaña nueva avisan y llevan rel="noopener"')
  for (const loc of ['es', 'en']) {
    const E = ESPERADO[loc]
    await ancho(1280)
    await cargar(E.home)
    // Se exceptúa el botón de la propia tarjeta de la campaña (GoFundMeProgress, que esta fase no toca): lleva `mt-3`, el de
    // reserva del bloque del dinero no, y no trae el aviso de pestaña nueva (hallazgo para el comité).
    const ext = await evaluate(`[...document.querySelectorAll('main a[target="_blank"]')].filter((a) => !a.classList.contains('mt-3')).map((a) => ({ href: a.getAttribute('href'), rel: a.getAttribute('rel') || '', aviso: a.querySelector('.sr-only')?.textContent.trim() ?? '', donde: a.closest('.puertas') ? 'puertas' : a.closest('.prensa-tira') ? 'prensa' : a.closest('.hero') ? 'hero' : a.closest('#campaign') ? 'dinero' : 'otro' }))`)
    ok(ext.length >= 9 && ext.every((a) => /noopener/.test(a.rel) && E.nuevaPestana.test(a.aviso)), `${loc}: los ${ext.length} enlaces de pestaña nueva (sin el de la tarjeta de la campaña) llevan rel="noopener" y aviso (${[...new Set(ext.map((a) => a.donde))].join(', ')})`)
    const apoyar = ext.find((a) => a.donde === 'puertas')
    ok(!!apoyar && apoyar.href === 'https://gofund.me/3e25cae99' && apoyar.rel === 'noopener noreferrer', `${loc}: la puerta «Apoyar» abre GoFundMe con rel="noopener noreferrer"`)
    ok(ext.some((a) => a.donde === 'hero' && a.href === 'https://gofund.me/3e25cae99') && ext.filter((a) => a.donde === 'prensa').length === 7, `${loc}: el botón del hero y los 7 medios también avisan`)
  }

  console.log('\n10. Chrome mínimo en /links y /gracias')
  // Qué hay en la cabecera y el pie de la página cargada.
  const CHROME = `(() => {
    const cab = document.querySelector('[data-cabecera-fija]')
    const visible = (el) => !!el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
    const idioma = cab ? cab.querySelector('[role=group]') : null
    const redes = ['x.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'youtube.com']
    return {
      barra: !!document.querySelector('.latest-bar'),
      menu: !!(cab && cab.querySelector('nav')),
      hamburguesa: !!(cab && cab.querySelector('button[aria-controls=mobile-nav]')),
      idiomaVisible: visible(idioma),
      botonesIdioma: idioma ? [...idioma.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().height)) : [],
      apoyoCabecera: [...(cab ? cab.querySelectorAll('a[href*="gofund.me"]') : [])].some(visible),
      apoyoAlto: (() => { const a = cab && [...cab.querySelectorAll('a[href*="gofund.me"]')].find(visible); return a ? Math.round(a.getBoundingClientRect().height) : 0 })(),
      // cabecera sin solapes: logo, selector de idioma y «Apoyar» uno tras otro, y dentro del ancho de la pantalla
      cabeceraOrdenada: (() => {
        if (!cab) return false
        const cajas = [cab.querySelector('a'), idioma, cab.querySelector('a[href*="gofund.me"]')].filter(Boolean).map((el) => el.getBoundingClientRect())
        return cajas.every((b, i) => b.right <= innerWidth && (i === 0 || b.left >= cajas[i - 1].right - 0.5))
      })(),
      logoNombre: !!(cab && /Miriam/.test(cab.querySelector('a').textContent)),
      // el nombre del logo, ¿a la vista? (sr-only mide 1 px: sigue en el árbol de accesibilidad, no en pantalla)
      logoTexto: !!cab && cab.querySelector('a span span').getBoundingClientRect().width > 20,
      apoyoPie: !!document.querySelector('footer a[href*="gofund.me"]'),
      columnasPie: document.querySelectorAll('footer [id^=pie-]').length,
      logos: !!document.querySelector('footer .logo-wall__mark'),
      redesPie: [...document.querySelectorAll('footer a[href]')].filter((a) => redes.some((r) => a.getAttribute('href').includes(r))).length,
      legalPie: document.querySelectorAll('footer a[href*="aviso-legal"], footer a[href*="legal-notice"], footer a[href*="privacidad"], footer a[href*="privacy"], footer a[href*="cookies"]').length,
      sw: document.documentElement.scrollWidth, vw: innerWidth,
    }
  })()`
  const CASOS = [
    { loc: 'es', ruta: '/links', home: '/', gracias: false },
    { loc: 'es', ruta: '/gracias', home: '/', gracias: true },
    { loc: 'en', ruta: '/en/links', home: '/en', gracias: false },
    { loc: 'en', ruta: '/en/thank-you', home: '/en', gracias: true },
  ]
  for (const w of [320, 375, 420, 1280]) {
    await ancho(w)
    for (const c of CASOS) {
      await cargar(c.ruta)
      const m = await evaluate(CHROME)
      const t = `${c.ruta} a ${w}px`
      ok(!m.menu && !m.hamburguesa && !m.barra, `${t}: sin menú, sin botón de menú y sin la barra «lo último»`)
      ok(m.idiomaVisible && m.botonesIdioma.length === 2 && m.botonesIdioma.every((h) => h >= 44), `${t}: el selector de idioma se queda a la vista, con 44 px (${m.botonesIdioma.join(', ')})`)
      ok(m.columnasPie === 0 && !m.logos && m.redesPie === 5 && m.legalPie === 3, `${t}: pie reducido: sin columnas (${m.columnasPie}) ni logos, con las 5 redes (${m.redesPie}) y lo legal (${m.legalPie})`)
      ok(!m.apoyoPie, `${t}: el pie no lleva «Apoyar»`)
      ok(m.cabeceraOrdenada && m.logoNombre, `${t}: cabecera sin solapes y con el nombre del logo accesible (${m.cabeceraOrdenada}, ${m.logoNombre})`)
      // El nombre se retira a la vista solo en /links bajo 420 px (donde «Apoyar» no deja sitio); /gracias lo conserva siempre.
      const nombreVisible = c.gracias || w >= 420
      ok(m.logoTexto === nombreVisible, `${t}: el nombre del logo ${nombreVisible ? 'sigue a la vista' : 'queda solo para el lector de pantalla'} (${m.logoTexto})`)
      if (c.gracias) ok(!m.apoyoCabecera, `${t}: /gracias no lleva «Apoyar» en la cabecera`)
      else ok(m.apoyoCabecera && m.apoyoAlto >= 44, `${t}: /links lleva «Apoyar» (GoFundMe) a la vista en la cabecera, también en móvil, con ${m.apoyoAlto} px de alto`)
      ok(m.sw <= m.vw, `${t}: sin scroll horizontal (${m.sw} ≤ ${m.vw})`)
    }
  }
  // /links en móvil: con «Apoyar» fijo en la cabecera, a ninguna altura de scroll puede haber un segundo enlace a GoFundMe
  // a la vista (la barra «Donar» del móvil no debe salir encima: dos botones coral iguales a la vez). Se mide a 375×568 (un
  // iPhone SE): sin `data-support-cta` en el botón de la cabecera, la barra sale ahí hacia los 500 px de scroll con dos a la vez.
  await ancho(375, 568)
  for (const ruta of ['/links', '/en/links']) {
    await cargar(ruta)
    const alto = await evaluate('document.documentElement.scrollHeight')
    const cuentas = []
    for (let y = 0; y <= alto; y += 50) {
      await evaluate(`window.scrollTo(0, ${y})`)
      await sleep(300)
      cuentas.push(await evaluate(`[...document.querySelectorAll('a[href*="gofund.me"]')].filter((a) => { const r = a.getBoundingClientRect(); return a.offsetParent !== null && r.bottom > 0 && r.top < innerHeight }).length`))
    }
    ok(cuentas.every((n) => n === 1), `${ruta} a 375×568: un solo enlace a GoFundMe a la vista en ${cuentas.length} alturas de scroll (${cuentas.join('')})`)
  }
  // el control: una página normal conserva todo
  await ancho(1280)
  for (const ruta of ['/datos', '/en/data']) {
    await cargar(ruta)
    const m = await evaluate(CHROME)
    ok(m.menu && m.barra && m.columnasPie === 5 && m.logos && m.apoyoPie, `${ruta}: chrome completo (menú ${m.menu}, barra ${m.barra}, ${m.columnasPie} columnas de pie, logos ${m.logos}, GoFundMe en el pie ${m.apoyoPie})`)
  }
  // Navegar sin recargar: el chrome entra y sale con la ruta (una marca en `window` prueba que no hubo recarga).
  const enRuta = (ruta) => hasta(`location.pathname === '${ruta}'`, 8000)
  for (const c of CASOS) {
    await ancho(1280)
    await cargar(c.ruta)
    await evaluate(`window.__sinRecarga = true`)
    await evaluate(`document.querySelector('[data-cabecera-fija] a[href="${c.home}"]').click()`)
    ok(await enRuta(c.home), `${c.ruta} → logo → ${c.home}`)
    await sleep(400)
    let m = await evaluate(CHROME)
    ok(m.menu && m.columnasPie === 5 && m.logos, `${c.ruta} → inicio sin recargar: reaparecen el menú (${m.menu}) y el pie completo (${m.columnasPie} columnas)`)
    await evaluate(`history.back()`)
    ok(await enRuta(c.ruta), `atrás → ${c.ruta}`)
    await sleep(400)
    m = await evaluate(CHROME)
    ok(!m.menu && m.columnasPie === 0 && !m.barra && (c.gracias ? !m.apoyoCabecera : true), `${c.ruta} al volver: chrome mínimo otra vez (menú ${m.menu}, columnas ${m.columnasPie}, barra ${m.barra})`)
    ok(await evaluate(`window.__sinRecarga === true`), `${c.ruta}: todo el recorrido fue navegación del cliente, sin recargar`)
  }
  // /gracias: «Volver al inicio» (el botón de la página) hace lo mismo.
  for (const c of CASOS.filter((x) => x.gracias)) {
    await cargar(c.ruta)
    await evaluate(`window.__sinRecarga = true`)
    await evaluate(`[...document.querySelectorAll('main a')].find((a) => a.getAttribute('href') === '${c.home}').click()`)
    ok(await enRuta(c.home), `${c.ruta} → «Volver al inicio» → ${c.home}`)
    await sleep(400)
    const m = await evaluate(CHROME)
    ok(m.menu && m.apoyoCabecera, `${c.ruta} → inicio: vuelven el menú y «Apoyar» (${m.menu}, ${m.apoyoCabecera})`)
    ok(await evaluate(`window.__sinRecarga === true`), `${c.ruta} → inicio: sin recargar`)
  }
} finally {
  await nav.cerrar()
  clearTimeout(tope)
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ caminos de la home en Chrome')
process.exit(fallos ? 1 : 0)
