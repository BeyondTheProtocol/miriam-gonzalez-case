#!/usr/bin/env node
// Test del explorador de /celula-a-celula/explorar sobre el build ESTÁTICO (lo que sirve Netlify).
//
// Qué coteja:
//   1. HTML generado (ES y EN): sin datos reales la página sale CERRADA (texto de «todavía no»), con las
//      etiquetas fijas, noindex y sin rótulo de ejemplo; ningún HTML precarga el chunk de Vitessce; la
//      tarjeta de «Próximos pasos» no está en /celula-a-celula; el sitemap no lista el explorador.
//   2. En Chrome, SIN ?demo: la página no pide ningún fichero de lesión (la puerta cerrada no carga datos).
//   3. En Chrome, CON ?demo=1 (host local): rótulo «DATOS DE EJEMPLO», aviso fijo del hígado, un violín
//      por grupo y en CADA violín el suelo ambiental y el n; hueso con CNV por célula; hígado sin CNV por
//      célula y con el aviso; móvil (375 px) sin el mapa y con el aviso de vista reducida.
//   4. /celula-a-celula?demo=1: la tarjeta aparece y lleva el demo al explorador.
// Uso:  pnpm exec nuxt generate && pnpm test:celula-explorador-html   (CI: e2e.yml)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

let fallos = 0, hechos = 0
const ok = (nombre, cond, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }
const html = (r) => { for (const p of [`${r}.html`, join(r, 'index.html')]) { const f = join(ROOT, p); if (existsSync(f)) return readFileSync(f, 'utf8') } return null }

/* ── 1 · HTML estático ── */
const vitessce = readdirSync(join(ROOT, '_nuxt')).filter((f) => f.endsWith('.js') && readFileSync(join(ROOT, '_nuxt', f), 'utf8').includes('Plot options and controls'))
ok('existe el chunk del motor (Vitessce)', vitessce.length > 0)

// pase de voz (18-oct): el eje del perfil iba en orden de texto (1, 10, 11…); un FDR 0 salía «0,0e+0»; y al elegir
// un gen el aviso decía «está en el mapa» con el mapa aún coloreado por grupo
const perfilEnOrden = `(() => { const n = [...document.querySelectorAll('.pf__eti')].map((e) => Number(e.textContent)); return n.length > 1 && n.every((x, k) => k === 0 || x > n[k - 1]) })()`
const perfilSinPisar = `(() => { const r = [...document.querySelectorAll('.pf__eti')].map((e) => e.getBoundingClientRect()); return r.length > 1 && r.every((a, i) => r.every((b, j) => j <= i || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)) })()`
const sinFdrCero = `![...document.querySelectorAll('.mk__tabla td')].some((t) => /^0[.,]0e\\+0$/.test(t.textContent.trim()))`
// diseño (18-oct, datos reales): el valor mitocondrial del QC desbordaba sobre la fila siguiente
const qcSinDesborde = `[...document.querySelectorAll('.qc__fila dd')].every((dd) => dd.scrollWidth <= dd.clientWidth + 1)`
// diseño (18-oct, pasada final): el resumen del perfil se recortaba a 375 y salía «885de» en el número de copias
const resumenCabe = `(() => { const e = document.querySelector('.pf__resumen'); return !!e && [...e.querySelectorAll('.nums')].every((s) => s.getBoundingClientRect().right <= e.getBoundingClientRect().right + 1) })()`
const nPegado = `[...document.querySelectorAll('.cnv__n')].some((e) => /\\d(de|of)\\b/.test(e.textContent))`
const mapaEnGen = `[...document.querySelectorAll('.exp__seg button')].some((b) => /Gen elegido|Selected gene/.test(b.textContent) && b.getAttribute('aria-pressed') === 'true')`

/* ── con DATOS REALES publicados (manifiesto sin «ejemplo»): la página está abierta; se comprueba eso y se termina ── */
const manPub = JSON.parse(readFileSync(join(ROOT, 'celula', 'explorador', 'manifiesto.json'), 'utf8'))
if (manPub.ejemplo !== true) {
  for (const [lg, ruta, eti] of [
    ['es', 'celula-a-celula/explorar', ['n=1, FFPE, exploratorio', 'ARN ≠ proteína; manda la IHQ', 'IHQ de HER2: 0']],
    ['en', 'en/cell-by-cell/explore', ['n=1, FFPE, exploratory', 'RNA ≠ protein; IHC decides', 'HER2 IHC: 0']],
  ]) {
    const h = html(ruta)
    ok(`[real ${lg}] existe ${ruta}`, !!h)
    if (!h) continue
    for (const e of eti) ok(`[real ${lg}] etiqueta fija «${e}»`, h.includes(e))
    ok(`[real ${lg}] con datos reales la página se indexa`, !/<meta name="robots" content="noindex/.test(h))
    ok(`[real ${lg}] sin rótulo de ejemplo`, !/DATOS DE EJEMPLO|EXAMPLE DATA/.test(h))
    ok(`[real ${lg}] ningún HTML precarga el chunk de Vitessce`, !vitessce.some((f) => h.includes(f)))
  }
  const esperaR = async (nav, expr, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await nav.evaluate(expr).catch(() => false)) return true; await nav.sleep(250) } return false }
  const navR = await abrirNavegador({ ancho: 1440, alto: 1000, escala: 1 })
  try {
    await navR.cargar('/celula-a-celula/explorar')
    ok('real sin demo: se monta el explorador, sin rótulo de ejemplo', await esperaR(navR, `!!document.querySelector('.exp') && !document.querySelector('.exp__demo')`))
    ok('real: violines con n y suelo por grupo', await esperaR(navR, `[...document.querySelectorAll('.vio__fila')].filter((f) => /suelo \\d+\\s%/.test(f.textContent) && /n = \\d/.test(f.textContent)).length > 0`))
    ok('real: aviso fijo del hígado', await navR.evaluate(`/tumor frente a hepatocito no está resuelto célula a célula/.test(document.querySelector('.exp__banner')?.textContent ?? '')`))
    ok('real: marcadores, perfil, ADN por grupo y QC con datos', await esperaR(navR, `document.querySelectorAll('.mk__tabla tbody tr').length > 0 && !!document.querySelector('.pf__linea') && document.querySelectorAll('.adng__fila').length > 0 && document.querySelectorAll('.qc__fila').length >= 6`))
    ok('real: el eje del perfil va en el orden del genoma (1, 2, … 22)', await navR.evaluate(perfilEnOrden))
    ok('real: ningún FDR de marcadores sale como «0,0e+0»', await navR.evaluate(sinFdrCero))
    ok('real: las etiquetas del eje del perfil no se pisan (20, 21, 22)', await navR.evaluate(perfilSinPisar))
    ok('real: ningún valor del QC desborda su celda', await navR.evaluate(qcSinDesborde))
    ok('real hígado: en marcadores del grupo de interés, los genes de la selección llevan asterisco y la nota de circularidad', await navR.evaluate(`!!document.querySelector('.mk__circ') && document.querySelectorAll('.mk__ast').length > 0`))
    // verificacion (18-oct): SPDEF y AGR2 son del panel de identidad y no están en la lista de la web; antes salían sin asterisco
    ok('real hígado: SPDEF y AGR2, fuera de la lista de la web, llevan el asterisco de circularidad en marcadores', await navR.evaluate(`(() => { const f = [...document.querySelectorAll('.mk__tabla tbody th')].filter((th) => /^(SPDEF|AGR2)\\b/.test(th.textContent.trim())); return f.length === 2 && f.every((th) => !!th.querySelector('.mk__ast')) })()`))
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hueso\\s*$/.test(b.textContent))?.click()`)
    ok('real hueso: nota de circularidad del grupo (número de copias) en marcadores, genes de interés y perfil', await esperaR(navR, `/En el hueso, las células malignas se eligieron/.test(document.querySelector('.mk')?.textContent ?? '') && /En el hueso, las células malignas se eligieron/.test(document.querySelector('.gi__circh')?.textContent ?? '') && /En el hueso, el grupo de interés se eligió/.test(document.querySelector('.pf')?.textContent ?? '')`))
    ok('real hueso: «n = x de y» con su espacio (no «885de»)', !(await navR.evaluate(nPegado)))
    // verificacion (18-oct): Scrublet 1-2 no es un recuento de dobletes; «Otras» del hueso lleva células sin GEM limpio
    ok('real hueso: el QC matiza Scrublet y da las células que comparten gota con el hígado', await navR.evaluate(`/no es un recuento de dobletes/.test(document.querySelector('.qc__matiz')?.textContent ?? '') && /comparten gota con una célula del hígado/.test(document.querySelector('.qc__matiz')?.textContent ?? '')`))
    ok('real hueso: «Células por grupo» dice cuántas de «Otras» no tienen GEM limpio', await navR.evaluate(`[...document.querySelectorAll('.exp__nota')].some((p) => /«Otras» incluye [\\d.]+ células sin GEM limpio/.test(p.textContent))`))
    ok('real hueso: los violines del grupo de interés llevan la nota de circularidad de grupo', await navR.evaluate(`/En el hueso, las células malignas se eligieron/.test(document.querySelector('.vio__fila--interes .vio__circ--grupo')?.textContent ?? '')`))
    ok('real hueso: el número de copias da «n = x de y» y explica el GEM limpio cuando faltan células', await navR.evaluate(`(() => { const t = document.querySelector('.cnv')?.textContent ?? ''; return !/ de \\d/.test([...document.querySelectorAll('.cnv__n')].map((e) => e.textContent).join('|')) || /GEM limpio/.test(t) })()`))
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hígado\\s*$/.test(b.textContent))?.click()`)
    await esperaR(navR, `!!document.querySelector('.exp__banner')`)
    const todos = Array.isArray(manPub.zarr) && manPub.zarr.length > 0
    if (todos) {
      ok('real: buscador de todos los genes activo', await esperaR(navR, `!!document.querySelector('.exp__busca input:not([disabled])')`))
      await navR.evaluate(`(() => { const i = document.querySelector('.exp__busca input'); i.value = 'ACT'; i.dispatchEvent(new Event('input')) })()`)
      const gen = await esperaR(navR, `document.querySelectorAll('.exp__sug button').length > 0`) ? await navR.evaluate(`(() => { const b = document.querySelector('.exp__sug button'); b.click(); return b.textContent.trim() })()`) : ''
      ok(`real: un gen buscado (${gen || 'ninguno'}) se lee del Zarr y sale en los violines`, !!gen && await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('${gen}') && document.querySelectorAll('.vio__fila').length > 0`))
      ok('real: el gen buscado pasa a colorear el mapa («Gen elegido»)', await navR.evaluate(mapaEnGen))
      await navR.evaluate(`(() => { const i = document.querySelector('.exp__busca input'); i.value = 'HER2'; i.dispatchEvent(new Event('input')) })()`)
      ok('real: buscar por la proteína (HER2) sugiere el gen (ERBB2)', await esperaR(navR, `document.querySelector('.exp__sug button')?.dataset.gen === 'ERBB2'`))
    }
    else ok('real sin la decisión de la matriz completa: no hay buscador de todos los genes', !(await navR.evaluate(`!!document.querySelector('.exp__busca')`)))
    await navR.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
    await navR.cargar('/celula-a-celula/explorar')
    await esperaR(navR, `document.querySelectorAll('.vio__fila').length > 0`)
    const desb = `Math.round(Math.max(...[...document.querySelectorAll('.exp, .exp > *')].map((e) => e.getBoundingClientRect().right)) - window.innerWidth)`
    ok('real móvil: el explorador cabe en el ancho', (await navR.evaluate(desb)) <= 1)
    ok('real móvil 375: el resumen del perfil no se recorta (cada región dentro del bloque)', await navR.evaluate(resumenCabe))
  }
  finally { await navR.cerrar() }
  console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
  process.exit(fallos ? 1 : 0)
}
for (const [lg, ruta, cerrado, eti] of [
  ['es', 'celula-a-celula/explorar', 'Todavía no está abierto', ['n=1, FFPE, exploratorio', 'ARN ≠ proteína; manda la IHQ', 'IHQ de HER2: 0']],
  ['en', 'en/cell-by-cell/explore', 'Not open yet', ['n=1, FFPE, exploratory', 'RNA ≠ protein; IHC decides', 'HER2 IHC: 0']],
]) {
  const h = html(ruta)
  ok(`[${lg}] existe ${ruta}`, !!h)
  if (!h) continue
  ok(`[${lg}] el HTML es el explorador (no la página de /celula-a-celula)`, h.includes(cerrado))
  for (const e of eti) ok(`[${lg}] etiqueta fija «${e}»`, h.includes(e))
  ok(`[${lg}] noindex sin datos reales`, /<meta name="robots" content="noindex/.test(h))
  ok(`[${lg}] sin rótulo de ejemplo en el HTML`, !/DATOS DE EJEMPLO|EXAMPLE DATA/.test(h))
  ok(`[${lg}] sin datos reales no se ofrece la matriz a petición`, !/a petición|on request/.test(h))
  ok(`[${lg}] ningún HTML precarga el chunk de Vitessce`, !vitessce.some((f) => h.includes(f)))
}
for (const [lg, ruta, txt] of [['es', 'celula-a-celula', 'Abrir el explorador'], ['en', 'en/cell-by-cell', 'Open the explorer']]) {
  const h = html(ruta)
  ok(`[${lg}] /celula-a-celula sin la tarjeta (puerta cerrada)`, !!h && !h.includes(txt))
  ok(`[${lg}] /celula-a-celula no precarga Vitessce`, !!h && !vitessce.some((f) => h.includes(f)))
}
const sitemaps = readdirSync(ROOT).filter((f) => /^sitemap.*\.xml$/.test(f)).map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n')
ok('el sitemap no lista el explorador', !/celula-a-celula\/explorar|cell-by-cell\/explore/.test(sitemaps))

/* ── 2-4 · en Chrome ── */
const pedidos = `performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\\/celula\\/explorador\\/(higado|hueso)\\.json/.test(n))`
const espera = async (nav, expr, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await nav.evaluate(expr).catch(() => false)) return true; await nav.sleep(200) } return false }
const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
try {
  await nav.cargar('/celula-a-celula/explorar')
  await nav.sleep(1200)
  ok('sin demo: no se pide ningún fichero de lesión', (await nav.evaluate(pedidos)).length === 0)
  ok('sin demo: no se monta el explorador', !(await nav.evaluate(`!!document.querySelector('.exp')`)))

  await nav.cargar('/celula-a-celula/explorar?demo=1')
  ok('demo: aparecen los violines', await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`))
  const r = await nav.evaluate(`(() => ({
    rotulo: /DATOS DE EJEMPLO/.test(document.querySelector('.exp__demo')?.textContent ?? ''),
    banner: /tumor frente a hepatocito no está resuelto célula a célula/.test(document.querySelector('.exp__banner')?.textContent ?? ''),
    filas: document.querySelectorAll('.vio__fila').length,
    conSuelo: [...document.querySelectorAll('.vio__fila')].filter((f) => f.querySelector('.vio__suelo') && /suelo \\d+\\s%/.test(f.textContent) && /n = \\d/.test(f.textContent)).length,
    grupos: document.querySelectorAll('.exp__grupos li').length,
    cnvCelula: document.querySelectorAll('.cnv__svg').length,
    cnvHigado: !!document.querySelector('.cnv__higado'),
    mapa: !!document.querySelector('.exp-mapa'),
    adn: /hibridan con el ADN genómico/.test(document.querySelector('.vio__adn')?.textContent ?? '') && /Matriz estándar de Cell Ranger/.test(document.querySelector('.vio__adn')?.textContent ?? ''),
    circTabla: /Circular: FGFR1/.test(document.querySelector('.gi__circ')?.textContent ?? ''),
    sondasTabla: (document.querySelector('.gi__tabla thead')?.textContent ?? '').includes('unión / total'),
    lectura: (document.querySelector('.gi__tabla thead')?.textContent ?? '').includes('Lectura de Polaris (borrador)'),
  }))()`)
  ok('demo: aviso de ADN genómico con el rótulo de la matriz, en el bloque del suelo ambiental', r.adn)
  ok('demo hígado: la tabla rotula la cifra circular (FGFR1) y enseña las sondas y la lectura de Polaris', r.circTabla && r.sondasTabla && r.lectura)
  ok('demo: rótulo «DATOS DE EJEMPLO»', r.rotulo)
  ok('demo hígado: aviso fijo «tumor frente a hepatocito…»', r.banner)
  ok('demo: un violín por grupo', r.filas > 0 && r.filas === r.grupos, `${r.filas} violines / ${r.grupos} grupos`)
  ok('demo: el suelo ambiental y el n están en CADA violín', r.conSuelo === r.filas, `${r.conSuelo} de ${r.filas}`)
  ok('demo hígado: sin CNV por célula y con su aviso', r.cnvCelula === 0 && r.cnvHigado)
  ok('demo escritorio: hay mapa', r.mapa)
  ok('demo: el mapa (Vitessce) llega a dibujar su lienzo', await espera(nav, `!!document.querySelector('.exp-mapa canvas')`, 20000))
  await nav.evaluate(`(() => { const s = document.querySelector('.exp__ctl select'); s.value = 'ESR1'; s.dispatchEvent(new Event('change')) })()`)
  ok('demo hígado: ESR1 en los violines lleva primero la cifra sin circularidad y después «Cifra circular»', await espera(nav, `/Sin esa circularidad.*Cifra circular\\./s.test(document.querySelector('.vio__circ')?.textContent ?? '')`))
  ok('demo hígado: la nota de circularidad va ANTES de la figura y de la cifra circular de la fila', await nav.evaluate(`(() => { const c = document.querySelector('.vio__fila--interes .vio__circ'), t = document.querySelector('.vio__fila--interes .vio__txt'); return !!c && !!t && c.nextElementSibling?.classList.contains('vio__svg') && !!(c.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) && /^\\s*Circular · /.test(t.textContent) })()`))
  // paneles del 18-oct (marcadores, perfil, ADN por grupo, QC): se pintan con datos y con sus avisos
  const pn = await nav.evaluate(`(() => ({
    marcadores: document.querySelectorAll('.mk__tabla tbody tr').length,
    marcAviso: /Detectado no es positivo/.test(document.querySelector('.mk')?.textContent ?? '') && /selección hecha a mano/.test(document.querySelector('.mk')?.textContent ?? ''),
    perfil: !!document.querySelector('.pf__linea') && /Expresión, no ADN/.test(document.querySelector('.pf')?.textContent ?? ''),
    adnFilas: document.querySelectorAll('.adng__fila').length,
    adnAviso: /Solo por grupo/.test(document.querySelector('.adng')?.textContent ?? ''),
    qcFilas: document.querySelectorAll('.qc__fila').length,
  }))()`)
  ok('demo hígado: marcadores por grupo con filas y sus dos avisos', pn.marcadores > 0 && pn.marcAviso, JSON.stringify(pn))
  ok('demo hígado: perfil por regiones dibujado y con «Expresión, no ADN»', pn.perfil)
  ok('demo hígado: ADN por grupo, una fila por grupo con células y el aviso «solo por grupo»', pn.adnFilas > 0 && pn.adnAviso)
  ok('demo hígado: control de calidad con sus filas', pn.qcFilas >= 6)
  ok('demo hígado: el eje del perfil va en el orden del genoma (1, 2, … 22)', await nav.evaluate(perfilEnOrden))
  ok('demo hígado: ningún FDR de marcadores sale como «0,0e+0»', await nav.evaluate(sinFdrCero))
  ok('demo hígado: las etiquetas del eje del perfil no se pisan', await nav.evaluate(perfilSinPisar))
  ok('demo hígado: ningún valor del QC desborda su celda', await nav.evaluate(qcSinDesborde))
  // nivel «todos los genes» (Zarr, solo en la demo del ejemplo): buscar un gen fuera del panel y verlo en los violines
  const hayBusca = await espera(nav, `!!document.querySelector('.exp__busca input:not([disabled])')`)
  ok('demo hígado: buscador de todos los genes activo', hayBusca)
  if (hayBusca) {
    await nav.evaluate(`(() => { const i = document.querySelector('.exp__busca input'); i.value = 'EJ001'; i.dispatchEvent(new Event('input')) })()`)
    const haySug = await espera(nav, `document.querySelectorAll('.exp__sug button').length > 0`)
    ok('demo hígado: el buscador sugiere genes fuera del panel', haySug)
    if (haySug) {
      const elegido = await nav.evaluate(`(() => { const b = document.querySelector('.exp__sug button'); b.click(); return b.textContent.trim() })()`)
      ok(`demo hígado: ${elegido}, leído del Zarr, sale en los violines con n y suelo por grupo`,
        await espera(nav, `document.querySelector('#exp-violines h2')?.textContent.includes('${elegido}') && [...document.querySelectorAll('.vio__fila')].filter((f) => /suelo \\d+\\s%/.test(f.textContent) && /n = \\d/.test(f.textContent)).length > 0`))
      ok('demo escritorio: el gen buscado pasa a colorear el mapa («Gen elegido»)', await nav.evaluate(mapaEnGen))
      // un gen de la selección FUERA de la lista de la web (EJ0003 en el ejemplo) lleva su nota de circularidad en los violines
      await nav.evaluate(`(() => { const i = document.querySelector('.exp__busca input'); i.value = 'EJ0003'; i.dispatchEvent(new Event('input')) })()`)
      if (await espera(nav, `document.querySelector('.exp__sug button')?.dataset.gen === 'EJ0003'`)) await nav.evaluate(`document.querySelector('.exp__sug button').click()`)
      ok('demo hígado: EJ0003 (selección, fuera de la lista de la web) sale como cifra circular en los violines', await espera(nav, `document.querySelector('#exp-violines h2')?.textContent.includes('EJ0003') && !!document.querySelector('.vio__fila--interes .vio__circ')`))
    }
  }
  ok('escritorio 1280: toda tabla o figura que desborda avisa de que se desliza', await nav.evaluate(`[['.mk__tabla', '.mk__desliza'], ['.pf__marco', '.pf__desliza']].every(([m, a]) => { const e = document.querySelector(m), v = document.querySelector(a); if (!e || !v) return false; return e.scrollWidth <= e.clientWidth + 1 || getComputedStyle(v).display !== 'none' })`))
  // marcadores: pulsar un gen da respuesta visible junto a la tabla (fila marcada y enlace a los violines)
  const genMk = await nav.evaluate(`(() => { const b = document.querySelector('.mk__gen:not(.mk__gen--fijo)'); if (!b) return ''; b.click(); return b.textContent.trim() })()`)
  ok('demo hígado: pulsar un gen de marcadores lo marca y avisa junto a la tabla con enlace a los violines', !!genMk && await espera(nav,
    `!!document.querySelector('.mk__gen[aria-pressed="true"]') && /Ir a los violines/.test(document.querySelector('.mk__estado')?.textContent ?? '') && document.querySelector('#exp-violines h2')?.textContent.includes('${genMk}')`))
  await nav.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /Hueso/.test(b.textContent)).click()`)
  ok('demo hueso: CNV por célula', await espera(nav, `document.querySelectorAll('.cnv__svg').length > 0 && !document.querySelector('.cnv__higado')`))
  ok('demo hueso: el CNV dice que es inferido de la expresión y no lectura de ADN, y marca el 0', await nav.evaluate(`/no es lectura de ADN/.test(document.querySelector('.cnv')?.textContent ?? '') && document.querySelectorAll('.cnv__cero').length > 0`))
  ok('demo hueso: el CNV avisa de que el 0 no es «como la referencia»', await nav.evaluate(`/El 0 no es «como la referencia»/.test(document.querySelector('.cnv')?.textContent ?? '') && !/0 = como la referencia/.test(document.querySelector('.cnv')?.textContent ?? '')`))
  ok('demo hueso: sin el aviso del hígado', !(await nav.evaluate(`!!document.querySelector('.exp__banner')`)))

  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  ok('móvil: aparecen los violines', await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`))
  ok('móvil: sin mapa y con el aviso de vista reducida', await nav.evaluate(`!document.querySelector('.exp-mapa') && /versión reducida/.test(document.querySelector('.exp__movil')?.textContent ?? '')`))
  // la página tiene overflow-x: clip, así que un desborde no da scroll: se recortaría sin avisar. Se mide el bloque.
  const desborde = `Math.round(Math.max(...[...document.querySelectorAll('.exp, .exp > *')].map((e) => e.getBoundingClientRect().right)) - window.innerWidth)`
  ok('móvil: el explorador cabe en el ancho (nada recortado a la derecha)', (await nav.evaluate(desborde)) <= 1, `${await nav.evaluate(desborde)} px de más`)
  ok('móvil: marcadores y perfil avisan de que se deslizan (tablas y figura más anchas que la pantalla)', await nav.evaluate(
    `['.mk__desliza', '.pf__desliza'].every((q) => { const e = document.querySelector(q); return !!e && getComputedStyle(e).display !== 'none' })`))
  ok('móvil 375: el resumen del perfil no se recorta (cada región dentro del bloque)', await nav.evaluate(resumenCabe))
  ok('móvil: el texto del perfil se lee a su tamaño (la figura no se encoge)', await nav.evaluate(`(document.querySelector('.pf__svg')?.getBoundingClientRect().width ?? 0) >= 760`))
  // invariante de diseño: si una tabla o la figura desborda su marco, su aviso de deslizar está visible (375, 820, 1280)
  const avisoSiDesborda = `[['.mk__tabla', '.mk__desliza'], ['.pf__marco', '.pf__desliza']].every(([m, a]) => { const e = document.querySelector(m), v = document.querySelector(a); if (!e || !v) return false; return e.scrollWidth <= e.clientWidth + 1 || getComputedStyle(v).display !== 'none' })`
  ok('móvil 375: toda tabla o figura que desborda avisa de que se desliza', await nav.evaluate(avisoSiDesborda))
  // sin mapa en el móvil: el aviso tras pulsar un gen de marcadores no puede decir «en el mapa»
  const genMv = await nav.evaluate(`(() => { const b = document.querySelector('.mk__gen:not(.mk__gen--fijo)'); if (!b) return ''; b.click(); return b.textContent.trim() })()`)
  ok('móvil 375: el aviso tras pulsar un gen dice «en los violines» y no «en el mapa» (aquí no hay mapa)', !!genMv && await espera(nav,
    `/en los violines/.test(document.querySelector('.mk__estado')?.textContent ?? '') && !/mapa/.test(document.querySelector('.mk__estado')?.textContent ?? '')`))
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: true })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`)
  ok('tableta 820: toda tabla o figura que desborda avisa de que se desliza', await nav.evaluate(avisoSiDesborda))
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

  await nav.cargar('/celula-a-celula?demo=1')
  ok('demo: la tarjeta aparece en /celula-a-celula y lleva el demo', await espera(nav, `!!document.querySelector('a[href="/celula-a-celula/explorar?demo=1"]')`, 8000))
}
finally { await nav.cerrar() }

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
