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
//    desde la home y con carga directa; y el destino de /caso (#que-buscamos, en /datos; leído de
//    nuxt.config.ts), con carga directa: el título queda a la vista y por debajo de la barra de secciones,
//    el foco está en él (el primer Tab entra en las peticiones, no en los chips) y, con la barra ya pegada,
//    ningún chip queda tapado por la cabecera fija (a 375, 1024 y 1280 px).
// 7. Contraste alto y colores forzados: los accesos siguen visibles y de 44 px.
// 8. /colabora conserva sus chips «por perfil»; el pie ya no los lleva (rediseño de arquitectura, F3: los sustituyen las
//    cuatro puertas de utils/caminos.ts, que pintarán la home y /colabora en F5 y F10).
// 9. El acceso de tech es externo: pestaña nueva, rel="noopener noreferrer" y aviso para lector de pantalla.
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
    research: ['/celula-a-celula/explorar', '/datos', '/laminillas'],
    researchCta: '/contacto?role=researcher',
    press: ['/datos'],
    tech: ['https://github.com/beyondtheprotocol/miriam-gonzalez-case'],
    ciencia: '/ciencia',
  },
  en: {
    home: '/en',
    clinician: ['/en/data', '/en/lesiones', '/en/contact?role=oncologist'],
    clinicianCta: '/en/science?nivel=pro#snapshot-title',
    research: ['/en/cell-by-cell/explore', '/en/data', '/en/slides'],
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

  console.log('\n8. /colabora conserva sus chips; el pie ya no los lleva')
  await ancho(1280)
  await cargar('/colabora')
  const colabora = await evaluate(`({ chips: document.querySelectorAll('main .pathway-chip').length, accesos: document.querySelectorAll('.pathway-acceso').length })`)
  ok(colabora.chips > 0 && colabora.accesos === 0, `/colabora: sus chips (${colabora.chips}) y ningún acceso de la home`)
  await cargar('/')
  const pie = await evaluate(`({ chips: document.querySelectorAll('footer .pathway-chip').length, accesos: document.querySelectorAll('footer .pathway-acceso').length })`)
  ok(pie.chips === 0 && pie.accesos === 0, `pie: ningún chip «por perfil» (${pie.chips}) ni acceso de la home (${pie.accesos})`)

  console.log('\n9. El acceso de tech es externo')
  await ancho(1280)
  await cargar('/')
  const ext = await evaluate(`(() => { const a = document.querySelector('.pathway-card--tech .pathway-acceso'); return a ? { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), aviso: a.querySelector('.sr-only')?.textContent.trim() ?? '' } : null })()`)
  ok(!!ext && ext.target === '_blank' && ext.rel === 'noopener noreferrer', `tech: abre en pestaña nueva con rel="noopener noreferrer" (${JSON.stringify(ext)})`)
  ok(!!ext && /pestaña nueva/.test(ext.aviso), 'tech: avisa al lector de pantalla de la pestaña nueva')

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
