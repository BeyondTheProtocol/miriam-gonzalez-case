// Home, «Elige tu camino»: accesos directos de clínica y laboratorio/single-cell, sobre el build ESTÁTICO
// (.output/public) en Chrome (plan del 20-oct-2026; Miriam: «en la home la gente sepa qué mirar… acceso
// directo a las diferentes herramientas porque /ciencia es muy largo»).
//
// Lo que comprueba, en ES y EN:
// 1. 320 a 1280 px: 7 caminos en orden, sin scroll horizontal; los accesos (clínica, single-cell, prensa
//    y tech) con su href, ≥ 44 px y
//    (≥ 640 px) en ≤ 2 líneas: si a 1024 alguno pasa de 2, toca la rejilla de 4 filas del plan.
//    En móvil, plegados fuera del tabulador y, al abrir la tarjeta, dentro y con aria-expanded.
//    320 y 640 px cubren también el zoom al 400 % y al 200 % de una pantalla de 1280.
// 2. ≥ 1024 px: las tarjetas no se solapan; clínica y single-cell, lado a lado y con la misma altura.
// 3. El tabulador recorre la rejilla en el orden del DOM (a 1280 y a 375 px).
// 4. Sin JS: los href reales están en el HTML generado (el bug de iOS Chrome dejaba enlaces sin href).
// 5. /contacto preselecciona el rol (oncologist, researcher).
// 6. «Ver detalle clínico» deja «De un vistazo» (#snapshot-title) en pantalla y con el foco, con clic
//    desde la home y con carga directa; y el destino de /caso (#mapa-acceso), con carga directa.
// 7. Contraste alto y colores forzados: los accesos siguen visibles y de 44 px.
// 8. /colabora y el pie siguen con sus chips (no se tocan).
// 9. El acceso de tech es externo: pestaña nueva, rel="noopener noreferrer" y aviso para lector de pantalla.
//
// CAPTURAS=<carpeta> guarda capturas de la rejilla para la revisión de `diseno`.
// Uso: pnpm exec nuxt generate && pnpm test:home-caminos
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, abrirNavegador } from './lib/navegador-cdp.mjs'

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

const ORDEN = ['supporter', 'curious', 'clinician', 'research', 'press', 'tech', 'peer']
const CON_ACCESOS = ['clinician', 'research', 'press', 'tech']
const ESPERADO = {
  es: {
    home: '/',
    clinician: ['/datos', '/lesiones', '/contacto?role=oncologist'],
    clinicianCta: '/ciencia?nivel=pro#snapshot-title',
    research: ['/celula-a-celula/explorar', '/datos', '/biopsia-osea'],
    researchCta: '/contacto?role=researcher',
    press: ['/datos'],
    tech: ['https://github.com/beyondtheprotocol/miriam-gonzalez-case'],
    ciencia: '/ciencia',
  },
  en: {
    home: '/en',
    clinician: ['/en/data', '/en/lesiones', '/en/contact?role=oncologist'],
    clinicianCta: '/en/science?nivel=pro#snapshot-title',
    research: ['/en/cell-by-cell/explore', '/en/data', '/en/bone-biopsy'],
    researchCta: '/en/contact?role=researcher',
    press: ['/en/data'],
    tech: ['https://github.com/beyondtheprotocol/miriam-gonzalez-case'],
    ciencia: '/en/science',
  },
}
const ANCHOS = [320, 375, 639, 640, 768, 1023, 1024, 1280, 1440]

const LEER = `(() => {
  const id = (c) => [...c.classList].find((k) => k.startsWith('pathway-card--')).slice('pathway-card--'.length)
  const cards = [...document.querySelectorAll('.pathway-grid > .pathway-card')]
  const rect = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + scrollY, w: b.width, h: b.height } }
  return {
    vw: innerWidth,
    sw: document.documentElement.scrollWidth,
    alturaRejilla: document.querySelector('.pathway-grid').getBoundingClientRect().height,
    ids: cards.map(id),
    rects: Object.fromEntries(cards.map((c) => [id(c), rect(c)])),
    accesos: Object.fromEntries(cards.map((c) => [id(c), [...c.querySelectorAll('.pathway-acceso')].map((a) => {
      const lab = a.querySelector('.pathway-acceso__label')
      const lh = parseFloat(getComputedStyle(lab).lineHeight)
      return { href: a.getAttribute('href'), h: a.getBoundingClientRect().height, visible: a.offsetParent !== null,
        lineas: Math.round(lab.getBoundingClientRect().height / lh), texto: lab.textContent.trim(),
        borde: getComputedStyle(a).borderTopColor }
    })])),
    ctas: Object.fromEntries(cards.map((c) => [id(c), c.querySelector('.pathway-card__cta a')?.getAttribute('href') ?? null])),
    toggles: Object.fromEntries(cards.map((c) => [id(c), c.querySelector('.pathway-card__toggle')?.getAttribute('aria-expanded') ?? null])),
  }
})()`

// Lo que el tabulador debería recorrer dentro de la rejilla: lo enfocable y visible, en el orden del DOM.
const TABULABLES = `[...document.querySelectorAll('.pathway-grid a[href], .pathway-grid button')]
  .filter((el) => el.offsetParent !== null).map((el) => el.getAttribute('href') || 'button:' + el.textContent.trim().slice(0, 24))`
const ACTIVO = `(() => { const el = document.activeElement; return el ? (el.getAttribute('href') || 'button:' + el.textContent.trim().slice(0, 24)) : null })()`

const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
const { cargar, evaluate, cdp, sleep } = nav

async function ancho(w, alto = 900) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: alto, deviceScaleFactor: 1, mobile: false })
}
async function tab() {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
}
async function capturar(nombre) {
  if (!CAPTURAS) return
  // La sección lleva v-reveal (opacidad 0 hasta entrar en pantalla): se lleva a la vista y se espera a que aparezca.
  await evaluate(`document.querySelector('.pathway-grid').closest('section').scrollIntoView({ block: 'start', behavior: 'instant' })`)
  await hasta(`(() => { const s = document.querySelector('.pathway-grid').closest('section'); return !s.classList.contains('reveal-init') || s.classList.contains('reveal-in') })()`, 4000)
  await sleep(700) // la transición de entrada
  const r = await evaluate(`(() => { const s = document.querySelector('.pathway-grid').closest('section'); const b = s.getBoundingClientRect(); return { x: 0, y: b.top + scrollY, width: innerWidth, height: b.height } })()`)
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...r, scale: 1 } })
  writeFileSync(join(CAPTURAS, `${nombre}.png`), Buffer.from(data, 'base64'))
}
async function abrir(id) {
  await evaluate(`document.querySelector('.pathway-card--${id} .pathway-card__toggle')?.click()`)
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
const EN_PANTALLA = (id) => `(() => { const el = document.getElementById('${id}'); if (!el || el.offsetParent === null) return false; const b = el.getBoundingClientRect(); return b.top >= 0 && b.top < innerHeight - 40 })()`

try {
  for (const loc of ['es', 'en']) {
    const E = ESPERADO[loc]
    console.log(`\n1-2. Caminos por ancho (${loc.toUpperCase()})`)
    for (const w of ANCHOS) {
      await ancho(w)
      await cargar(E.home)
      let s = await evaluate(LEER)
      ok(s.sw <= s.vw, `${w}px: sin scroll horizontal (${s.sw} ≤ ${s.vw})`)
      ok(JSON.stringify(s.ids) === JSON.stringify(ORDEN), `${w}px: 7 caminos en orden (${s.ids.join(', ')})`)
      if (w < 640) {
        const ocultos = CON_ACCESOS.every((id) => s.accesos[id].length === E[id].length && s.accesos[id].every((a) => !a.visible))
        ok(ocultos && CON_ACCESOS.every((id) => s.toggles[id] === 'false'), `${w}px: plegadas, los accesos no se ven ni se tabulan`)
        console.log(`     (alto de la rejilla plegada a ${w}px: ${Math.round(s.alturaRejilla)} px)`)
        for (const id of CON_ACCESOS) await abrir(id)
        await sleep(250)
        s = await evaluate(LEER)
        ok(CON_ACCESOS.every((id) => s.toggles[id] === 'true'), `${w}px: al abrir, aria-expanded="true"`)
      }
      for (const id of CON_ACCESOS) {
        const a = s.accesos[id]
        ok(JSON.stringify(a.map((x) => x.href)) === JSON.stringify(E[id]), `${w}px ${id}: accesos ${a.map((x) => x.href).join(' · ')}`)
        ok(a.every((x) => x.visible && x.h >= 44), `${w}px ${id}: visibles y ≥ 44 px (${a.map((x) => Math.round(x.h)).join(', ')})`)
        if (w >= 640) ok(a.every((x) => x.lineas <= 2), `${w}px ${id}: ninguno pasa de 2 líneas (${a.map((x) => `${x.texto}=${x.lineas}`).join(', ')})`)
      }
      ok(s.ctas.clinician === E.clinicianCta, `${w}px: «Ver detalle clínico» → ${s.ctas.clinician}`)
      ok(s.ctas.research === E.researchCta, `${w}px: botón de research → ${s.ctas.research}`)
      if (w >= 1024) {
        const R = s.rects
        const pares = ORDEN.flatMap((a, i) => ORDEN.slice(i + 1).map((b) => [a, b]))
        const solapes = pares.filter(([a, b]) => {
          const p = R[a], q = R[b]
          const ix = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)
          const iy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)
          return ix > 1 && iy > 1
        })
        ok(solapes.length === 0, `${w}px: ninguna tarjeta se solapa${solapes.length ? ` (${solapes.map((p) => p.join('/')).join(', ')})` : ''}`)
        ok(Math.abs(R.clinician.y - R.research.y) <= 1 && R.research.x > R.clinician.x, `${w}px: clínica y single-cell, lado a lado`)
        ok(Math.abs(R.clinician.h - R.research.h) <= 1, `${w}px: clínica y single-cell, misma altura (${Math.round(R.clinician.h)} / ${Math.round(R.research.h)})`)
        ok(R.supporter.h > R.clinician.h, `${w}px: «Quiero ayudar ya» sigue ocupando dos filas`)
      } else if (w >= 640) {
        const R = s.rects
        const resto = ORDEN.filter((id) => id !== 'supporter')
        ok(resto.every((id) => Math.abs(R[id].w - R.curious.w) <= 1) && R.supporter.w > R.curious.w * 1.9, `${w}px: «Quiero ayudar ya» a lo ancho y el resto en pares`)
      }
      console.log(`     (alto de la rejilla a ${w}px: ${Math.round(s.alturaRejilla)} px)`)
      if ([375, 768, 1024, 1280, 1440].includes(w)) await capturar(`${loc}-${w}`)
    }
  }

  console.log('\n3. Tabulador')
  for (const w of [1280, 375]) {
    await ancho(w)
    await cargar('/')
    const esperado = await evaluate(TABULABLES)
    await evaluate(`document.querySelector('.pathway-grid a[href], .pathway-grid button').focus()`)
    const visto = [await evaluate(ACTIVO)]
    for (let i = 1; i < esperado.length; i++) {
      await tab()
      visto.push(await evaluate(ACTIVO))
    }
    ok(JSON.stringify(visto) === JSON.stringify(esperado), `${w}px: el tabulador sigue el DOM (${esperado.length} paradas)${JSON.stringify(visto) === JSON.stringify(esperado) ? '' : `\n       visto:    ${visto.join(' | ')}\n       esperado: ${esperado.join(' | ')}`}`)
    if (w === 1280) {
      // Anillo de foco visible en un acceso al llegar con el tabulador (regla global de :focus-visible).
      // se enfoca el enlace anterior y se llega al primer acceso de clínica con Tab (teclado = :focus-visible)
      await evaluate(`(() => { const a = [...document.querySelectorAll('.pathway-grid a[href]')]; a[a.indexOf(document.querySelector('.pathway-card--clinician .pathway-acceso')) - 1].focus() })()`)
      await tab()
      const anillo = await evaluate(`(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { acceso: el.classList.contains('pathway-acceso'), fv: el.matches(':focus-visible'), estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth) } })()`)
      ok(anillo.acceso && anillo.fv && anillo.estilo !== 'none' && anillo.ancho >= 2, `1280px: el acceso enfocado con el tabulador lleva anillo (${anillo.estilo} ${anillo.ancho}px)`)
      await capturar('foco-1280')
    }
    if (w === 375) ok(!esperado.some((h) => /\/datos|\/lesiones|explorar|biopsia/.test(h)), '375px: con las tarjetas plegadas, los accesos no están en el tabulador')
  }

  console.log('\n4. Sin JS: href reales en el HTML generado')
  for (const loc of ['es', 'en']) {
    const E = ESPERADO[loc]
    const f = loc === 'es' ? join(ROOT, 'index.html') : [join(ROOT, 'en.html'), join(ROOT, 'en', 'index.html')].find(existsSync)
    const html = readFileSync(f, 'utf8')
    const n = (html.match(/class="pathway-acceso"/g) || []).length
    ok(n === 8, `${loc}: 8 accesos en el HTML (${n})`)
    for (const href of [...E.clinician, ...E.research, ...E.press, ...E.tech, E.clinicianCta, E.researchCta]) {
      ok(html.includes(`href="${href}"`), `${loc}: href="${href}" está en el HTML`)
    }
  }

  console.log('\n5. /contacto preselecciona el rol')
  for (const [ruta, rol] of [['/contacto?role=oncologist', 'oncologist'], ['/contacto?role=researcher', 'researcher'], ['/en/contact?role=researcher', 'researcher']]) {
    await cargar(ruta)
    const v = await evaluate(`document.querySelector('select option[value="${rol}"]')?.parentElement.value ?? null`)
    ok(v === rol, `${ruta}: el selector llega con «${rol}» (${v})`)
  }

  console.log('\n6. «Ver detalle clínico» aterriza en «De un vistazo»')
  for (const w of [1280, 375]) {
    await ancho(w, 800)
    await cargar('/')
    if (w < 640) {
      await abrir('clinician')
      await sleep(250)
    }
    await evaluate(`document.querySelector('.pathway-card--clinician .pathway-card__cta a').click()`)
    const llego = await hasta(`location.pathname === '/ciencia' && ${EN_PANTALLA('snapshot-title')}`)
    const donde = llego ? '' : ` (${JSON.stringify(await evaluate(DONDE('snapshot-title')))})`
    ok(llego, `${w}px, clic desde la home: #snapshot-title en pantalla${donde}`)
    ok(await evaluate(`document.activeElement?.id === 'snapshot-title'`), `${w}px, clic desde la home: el foco está en «De un vistazo»`)
    // Otra página antes: navegar a la MISMA URL con #ancla es un salto dentro del documento, no una carga.
    await cargar('/')
    for (const ruta of ['/ciencia?nivel=pro#snapshot-title', '/en/science?nivel=pro#snapshot-title']) {
      await cargar(ruta)
      ok(await hasta(EN_PANTALLA('snapshot-title')), `${w}px, carga directa de ${ruta}: #snapshot-title en pantalla`)
      ok(await hasta(`document.activeElement?.id === 'snapshot-title'`, 3000), `${w}px, carga directa de ${ruta}: el foco está en «De un vistazo»`)
    }
    await cargar('/ciencia?nivel=pro&utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#mapa-acceso')
    ok(await hasta(EN_PANTALLA('mapa-acceso')), `${w}px, carga directa del destino de /caso: #mapa-acceso en pantalla`)
    ok(await hasta(`document.activeElement?.id === 'mapa-acceso'`, 3000), `${w}px, carga directa del destino de /caso: el foco está en el acceso para el equipo médico`)
  }

  console.log('\n7. Contraste alto y colores forzados')
  for (const [nombre, features] of [['contraste', [{ name: 'prefers-contrast', value: 'more' }]], ['forzados', [{ name: 'forced-colors', value: 'active' }]]]) {
    await cdp('Emulation.setEmulatedMedia', { features })
    for (const w of [1280, 375]) {
      await ancho(w)
      await cargar('/')
      if (w < 640) {
        for (const id of CON_ACCESOS) await abrir(id)
        await sleep(250)
      }
      const s = await evaluate(LEER)
      const todos = CON_ACCESOS.flatMap((id) => s.accesos[id])
      ok(todos.length === 8 && todos.every((a) => a.visible && a.h >= 44 && !/rgba\(0, 0, 0, 0\)|transparent/.test(a.borde)), `${nombre} ${w}px: los 8 accesos visibles, ≥ 44 px y con borde`)
      await capturar(`${nombre}-${w}`)
    }
    await cdp('Emulation.setEmulatedMedia', { features: [] })
  }

  console.log('\n8. /colabora y el pie, sin cambios')
  await ancho(1280)
  await cargar('/colabora')
  const colabora = await evaluate(`({ chips: document.querySelectorAll('main .pathway-chip').length, accesos: document.querySelectorAll('.pathway-acceso').length })`)
  ok(colabora.chips > 0 && colabora.accesos === 0, `/colabora: sus chips (${colabora.chips}) y ningún acceso de la home`)
  await cargar('/')
  const pie = await evaluate(`({ chips: document.querySelectorAll('footer .pathway-chip').length, accesos: document.querySelectorAll('footer .pathway-acceso').length })`)
  ok(pie.chips > 0 && pie.accesos === 0, `pie: sus chips (${pie.chips}) y ningún acceso de la home`)

  console.log('\n9. El acceso de tech es externo')
  await ancho(1280)
  await cargar('/')
  const ext = await evaluate(`(() => { const a = document.querySelector('.pathway-card--tech .pathway-acceso'); return a ? { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), aviso: a.querySelector('.sr-only')?.textContent.trim() ?? '' } : null })()`)
  ok(!!ext && ext.target === '_blank' && ext.rel === 'noopener noreferrer', `tech: abre en pestaña nueva con rel="noopener noreferrer" (${JSON.stringify(ext)})`)
  ok(!!ext && /pestaña nueva/.test(ext.aviso), 'tech: avisa al lector de pantalla de la pestaña nueva')
} finally {
  await nav.cerrar()
  clearTimeout(tope)
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ caminos de la home en Chrome')
process.exit(fallos ? 1 : 0)
