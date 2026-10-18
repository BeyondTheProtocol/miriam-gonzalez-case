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
//      célula y con el aviso; móvil (375 px) CON el mapa (simulador, 18-oct), quieto hasta «Mover el mapa».
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
// consola limpia: Vitessce tiraba «TypeError: n is not a function» (getTermMapping sin implementar). Se registra
// console.error y los errores antes de cargar la página. Se ignora solo «Failed to create WebGL context»: el Chrome de
// las pruebas arranca con --disable-gpu y deck.gl lo avisa; es del entorno, no de la página.
const ESPIA = `window.__errores = []; addEventListener('error', (e) => __errores.push(String(e.message))); addEventListener('unhandledrejection', (e) => __errores.push(String(e.reason))); const __ce = console.error; console.error = (...a) => { __errores.push(a.map(String).join(' ').slice(0, 200)); __ce(...a) }`
// simulador (18-oct, panel de expertos): «Más análisis» (tabla completa, dos genes) y «Calidad de los datos» (número de
// copias, perfil, ADN, QC) van plegados; «Marcadores» es una pestaña del panel y enseña 15 filas. Lo que se MIDE
// (desbordes, recortes) se mide con todo abierto y visible: medido plegado u oculto, pasaría sin probar nada.
const ABRE_TODO = `(() => { document.querySelectorAll('details.exp__tecnico').forEach((t) => { t.open = true }); [...document.querySelectorAll('.exp__pestanas button')].find((b) => /Marcadores|Markers/.test(b.textContent))?.click(); return true })()`
const MARCADORES_TODOS = `(() => { const b = document.querySelector('.mk__todos'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); return true })()`
const PLEGADOS = `(() => { const a = document.querySelector('details.exp__masan'), c = document.querySelector('details.exp__calidad'); return !!a && !!c && !a.open && !c.open && !!a.querySelector('.gi__tabla') && !!c.querySelector('.qc') && !!c.querySelector('.cnv') && !!c.querySelector('.pf') && !!c.querySelector('.adng') })()`
// llegada: mapa por grupo, la lista corta de genes de interés y ningún gen abierto («Gen» desactivado hasta elegir uno)
const LLEGADA = `(() => { const s = document.querySelector('.exp__mapabar select'); return s?.value === 'grupo' && !!s.querySelector('option[value="gen"]')?.disabled && document.querySelectorAll('.gin__tabla tbody tr').length > 0 && !document.querySelector('#exp-violines') && !document.querySelector('.exp__chip') })()`
const eligeDeLista = (g) => `(() => { const b = document.querySelector(${g ? `'.gin__gen[data-gen="${g}"]'` : `'.gin__gen'`}); if (!b) return ''; b.click(); return b.dataset.gen })()`
const violinesDe = (g) => `document.querySelector('#exp-violines h2')?.textContent.includes('${g}') && [...document.querySelectorAll('.vio__fila')].filter((f) => /suelo \\d+\\s%/.test(f.textContent) && /n = \\d/.test(f.textContent)).length > 0`
const mapaVisible = `(() => { const m = document.querySelector('.exp-mapa')?.getBoundingClientRect(); return m ? Math.round(Math.min(m.bottom, innerHeight) - Math.max(m.top, 0)) : 0 })()`
const ponModo = (m) => `(() => { const s = document.querySelector('.exp__mapabar select'); s.value = '${m}'; s.dispatchEvent(new Event('change')); return true })()`
// comité médico (18-oct): detectado y suelo que redondean igual salían «10 % · suelo 10 %» (10,3 frente a 9,6), y una fila
// por debajo del suelo no lo decía. Invariante: por debajo → «no supera el suelo»; por encima → sin la marca; dos cifras
// iguales solo con decimal o con la marca.
const marcaSuelo = `(() => { const fs = [...document.querySelectorAll('.vio__fila')]; return fs.length > 0 && fs.every((f) => { const t = f.querySelector('.vio__txt')?.textContent ?? ''; const m = t.match(/Detectado ([\\d,]+)\\s%.*?suelo ([\\d,]+)\\s%/s); if (!m) return false; const a = parseFloat(m[1].replace(',', '.')), b = parseFloat(m[2].replace(',', '.')), marca = /no supera el suelo|en casi todas las células/.test(t); return (a < b ? marca : true) && (a > b ? !marca : true) && (m[1] !== m[2] || m[1].includes(',') || marca) }) })()`
// diseño (18-oct): con tres tonos fijos, Hepatocitos y Endotelio salían iguales (y sin rótulos en el móvil)
const colorUnico = `(() => { const m = [...document.querySelectorAll('.exp__leyenda .exp__muestra')].map((e) => getComputedStyle(e).backgroundColor); return m.length > 2 && new Set(m).size === m.length })()`
// revisión final (18-oct): en el hueso la línea de cifras sin cortes ensanchaba la columna; el texto y la barra salían del
// panel y el violín quedaba descuadrado frente a su eje (medianas leídas falsas). Todo dentro del panel y cada violín
// del mismo ancho que su eje.
const sinDesborde = `(() => { const pan = document.querySelector('#exp-panel').getBoundingClientRect(); const dentro = [...document.querySelectorAll('#exp-violines .vio__fila, #exp-violines .vio__txt, #exp-violines .vio__ref, #exp-violines .vio__circ')].every((e) => e.getBoundingClientRect().right <= pan.right + 1); const eje = document.querySelector('#exp-violines .vio__eje')?.getBoundingClientRect(); const svgs = [...document.querySelectorAll('#exp-violines .vio__svg')]; return dentro && !!eje && svgs.length > 0 && svgs.every((v) => Math.abs(v.getBoundingClientRect().width - eje.width) <= 2) })()`
const verMapaEnDetalle = `(() => { const b = document.querySelector('.exp__dcab .exp__vermapa'); return !!b && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height >= 44 && !!document.querySelector('.exp__volver') })()`
// gen elegido: lo no detectado aparte y lo detectado por tramos, con su n; el título nombra el gen
const leyendaGen = (g) => `(() => { const li = [...document.querySelectorAll('.exp__leyenda li')].map((e) => e.textContent); return li.length >= 2 && /No detectado|Not detected/.test(li[0]) && li.slice(1).every((t) => /CP10k/.test(t)) && (document.querySelector('.exp__leyt')?.textContent ?? '').includes('${g}') })()`
const mapaEnGen = `document.querySelector('.exp__mapabar select')?.value === 'gen'`

const busca = (g) => `(() => { const i = document.querySelector('.exp__busca input'); i.value = '${g}'; i.dispatchEvent(new Event('input')); return true })()`

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
  const navR = await abrirNavegador({ ancho: 1440, alto: 900, escala: 1, gl: true })
  try {
    await navR.cdp('Page.addScriptToEvaluateOnNewDocument', { source: ESPIA })
    await navR.cargar('/celula-a-celula/explorar')
    ok('real sin demo: se monta el explorador, sin rótulo de ejemplo', await esperaR(navR, `!!document.querySelector('.exp') && !document.querySelector('.exp__demo')`))
    // panel de expertos (18-oct): al llegar, mapa por grupo y la lista corta de genes de interés
    ok('real llegada: mapa por grupo, lista de genes de interés y ningún gen abierto', await esperaR(navR, LLEGADA))
    ok('real llegada 1440×900: sin desplazar se ven al menos 400 px de mapa', await esperaR(navR, `window.scrollY === 0 && ${mapaVisible} >= 400`, 20000), `${await navR.evaluate(mapaVisible)} px`)
    ok('real llegada: por grupo, ninguna fila de la leyenda repite color', await esperaR(navR, colorUnico))
    // diseño (18-oct): «Tipo celular» repetía cada tono hasta cuatro veces y sin rótulos no se leía; fuera hasta tenerlos
    ok('real llegada: «Colorear por» no ofrece «Tipo celular»', await navR.evaluate(`![...document.querySelectorAll('.exp__mapabar select option')].some((o) => /Tipo celular/.test(o.textContent))`))
    ok('real llegada: las pestañas del panel son pestañas (tablist, una seleccionada) y las flechas cambian de pestaña', await navR.evaluate(`(() => { const t = [...document.querySelectorAll('.exp__pestanas [role="tab"]')]; if (t.length !== 2 || t.filter((b) => b.getAttribute('aria-selected') === 'true').length !== 1) return false; t[0].focus(); t[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return true })()`) && await esperaR(navR, `document.querySelector('.exp__pestanas [role="tab"][aria-selected="true"]')?.textContent.includes('Marcadores') && document.activeElement?.textContent.includes('Marcadores')`) && await navR.evaluate(`(() => { document.querySelector('.exp__pestanas [role="tab"]').click(); return true })()`))
    // diseño (18-oct): «Recentrar» a 44 px con el fondo del tema (un selector partido lo dejó a 32 px y blanco en oscuro)
    ok('real: «Recentrar el mapa» mide 44 px y lleva el fondo del tema', await esperaR(navR, `(() => { const b = document.querySelector('button[title="Recentrar el mapa"]'); if (!b) return false; const r = b.getBoundingClientRect(), c = getComputedStyle(b); return Math.round(r.width) === 44 && Math.round(r.height) === 44 && c.backgroundColor !== 'rgb(255, 255, 255)' })()`, 20000))
    ok('real llegada: cinco grupos de controles como mucho antes del mapa', await navR.evaluate(`document.querySelectorAll('.exp__ctl > .exp__campo, .exp__mapabar > *').length <= 5`))
    ok('real llegada: la lista da grupo de interés, referencia y suelo, y su pie define el suelo', await navR.evaluate(`(() => { const h = [...document.querySelectorAll('.gin__tabla thead th')].map((t) => t.textContent); return h.length === 4 && /Referencia/.test(h[2]) && /Suelo/.test(h[3]) && /Suelo ambiental/.test(document.querySelector('.gin__pie')?.textContent ?? '') })()`))
    ok('real llegada: ERBB2 lleva «IHQ de HER2: 0» en la lista', await navR.evaluate(`/IHQ de HER2: 0/.test(document.querySelector('.gin__lecfila[data-gen="ERBB2"]')?.textContent ?? '')`))
    // comité médico (18-oct): sin la lectura al lado, TROP2 o B7-H3 «sobre el suelo y la referencia» se leían como positivos
    ok('real llegada: cada gen de la lista lleva su lectura (borrador), la misma que la tabla completa; TROP2 dice «No se sostiene»', await navR.evaluate(`(() => { const filas = [...document.querySelectorAll('.gin__tabla tbody tr.gin__fila')], gi = [...document.querySelectorAll('.gi__tabla tbody tr')]; return filas.length > 0 && filas.every((r) => { const g = r.querySelector('.gin__gen').dataset.gen, lec = (r.nextElementSibling?.querySelector('.gin__lec')?.textContent ?? '').replace(/^[^:]*:\\s*/, '').trim(); const fila = gi.find((x) => x.querySelector('th')?.textContent.includes(g)); return !!lec && !!fila && fila.textContent.includes(lec) }) && /Lectura \\(borrador\\): No se sostiene/.test(document.querySelector('.gin__lecfila[data-gen="TACSTD2"]')?.textContent ?? '') })()`))
    // la fila de la lectura ocupa todo el ancho de la tabla (con una clase repetida quedó metida en la primera columna)
    ok('real llegada: la lectura de cada gen va a todo el ancho de la lista', await navR.evaluate(`(() => { const t = document.querySelector('.gin__tabla').getBoundingClientRect().width, c = [...document.querySelectorAll('.gin__lecfila td')]; return c.length > 0 && c.every((td) => td.getBoundingClientRect().width >= 0.95 * t) })()`))
    ok('real llegada: una cifra circular de la lista lleva asterisco y su nota', await navR.evaluate(`!document.querySelector('.gin__ast') || /Circular\\./.test(document.querySelector('.gin__circ')?.textContent ?? '')`))
    ok('real: aviso fijo del hígado', await navR.evaluate(`/tumor frente a hepatocito no está resuelto célula a célula/.test(document.querySelector('.exp__banner')?.textContent ?? '')`))
    // verificacion (18-oct, simulador): lo que corrigió un «falso por omisión» va en el titular, no plegado
    // verificacion (18-oct, simulador): con la lista de llegada, la cifra del grupo de interés es lo primero que se lee
    ok('real hígado: el titular fijo dice que «Luminal de alta confianza» es un subconjunto, no el tumor entero', await navR.evaluate(`/«Luminal de alta confianza» es un subconjunto, no el tumor entero/.test(document.querySelector('.exp__banner')?.textContent ?? '')`))
    ok('real: el «no se interpreta» de las distancias del UMAP está a la vista, no plegado', await navR.evaluate(`[...document.querySelectorAll('.exp__mapacol .exp__nota')].some((p) => /la distancia entre grupos alejados no se interpreta/.test(p.textContent) && !p.closest('details'))`))
    ok('real hígado: el titular fijo dice que «Hepatocitos» y «Otras» pueden incluir tumorales', await navR.evaluate(`/«Hepatocitos» y «Otras» también pueden incluir células tumorales/.test(document.querySelector('.exp__banner')?.textContent ?? '')`))
    const g1 = await navR.evaluate(eligeDeLista('ERBB2'))
    ok(`real: un toque en la lista (${g1 || 'ninguno'}) abre el gen grupo a grupo, con n y suelo en cada violín`, !!g1 && await esperaR(navR, violinesDe(g1)))
    ok('real: el detalle nombra la biopsia y da la referencia emparejada junto al grupo de interés', await navR.evaluate(`/Hígado/.test(document.querySelector('#exp-violines h2')?.textContent ?? '') && /Hígado/.test(document.querySelector('#exp-violines .exp__dbiop')?.textContent ?? '') && /Referencia emparejada \\(células no tumorales de la misma muestra, a la misma profundidad\\): \\d+\\s%/.test(document.querySelector('.vio__fila--interes .vio__ref')?.textContent ?? '')`))
    ok('real hígado: detectado frente a suelo, comparable en cada fila (decimal si redondean igual; «no supera el suelo» si queda por debajo)', await navR.evaluate(marcaSuelo))
    ok('real: al abrir el gen el foco va a su detalle (sin desplazar la página)', await navR.evaluate(`document.activeElement?.id === 'exp-violines'`))
    // comité médico (18-oct): por el buscador o los marcadores se veían las cifras sin la lectura de la revisión
    ok('real: el detalle de HER2 lleva «IHQ de HER2: 0» y su lectura (borrador)', await navR.evaluate(`/IHQ de HER2: 0/.test(document.querySelector('.exp__dlec')?.textContent ?? '') && /Lectura \\(borrador\\): Con matices/.test(document.querySelector('.exp__dlec')?.textContent ?? '')`))
    ok('real hígado: el detalle de HER2 no se sale del panel y cada violín cuadra con su eje', await navR.evaluate(sinDesborde))
    ok('real hígado: la nota bajo el mapa da las células leídas y las que pasaron el control (como «Célula a célula»)', await navR.evaluate(`[...document.querySelectorAll('.exp__mapacol .exp__nota')].some((p) => /19\\.047 células de la biopsia \\(de 20\\.625 leídas; el resto no pasó el control de calidad\\)/.test(p.textContent))`))
    await navR.evaluate(`document.querySelector('.exp__volver')?.click()`)
    ok('real: «Volver» devuelve el foco al gen de la lista desde el que se abrió', await esperaR(navR, `document.activeElement?.dataset?.gen === 'ERBB2'`, 5000))
    await navR.evaluate(eligeDeLista('TPBG'))
    ok('real: con 5T4 abierto, el segundo gen de «Dos genes» no es 5T4', await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('TPBG') && !!document.querySelector('.exp__masan select')?.value && document.querySelector('.exp__masan select').value !== 'TPBG' && !/5T4 \\(TPBG\\) y 5T4 \\(TPBG\\)/.test(document.querySelector('.exp__masan')?.textContent ?? '')`))
    await navR.evaluate(eligeDeLista('TACSTD2'))
    ok('real: el detalle de TROP2 dice «No se sostiene»', await esperaR(navR, `/Lectura \\(borrador\\): No se sostiene/.test(document.querySelector('.exp__dlec')?.textContent ?? '') && document.querySelector('#exp-violines h2')?.textContent.includes('TACSTD2')`))
    await navR.evaluate(eligeDeLista('ERBB2'))
    await esperaR(navR, violinesDe('ERBB2'))
    ok('real: el gen de la lista colorea el mapa y sale su chip con ✕ junto al buscador', await navR.evaluate(mapaEnGen) && await navR.evaluate(`!!document.querySelector('.exp__chip .exp__chipx')`))
    // diseño (18-oct): con el simulador justo bajo el aviso fijo del hígado, el mapa entero y las pestañas del panel
    // se ven a la vez (el alto del mapa descuenta cabecera y aviso; antes, con un porcentaje fijo, se cortaba)
    await navR.evaluate(`(() => { const fijo = parseFloat(getComputedStyle(document.querySelector('.exp')).getPropertyValue('--exp-top')) + document.querySelector('.exp__banner').offsetHeight + 8; window.scrollTo(0, document.querySelector('.exp__sim').getBoundingClientRect().top + window.scrollY - fijo) })()`)
    await navR.sleep(600)
    ok('real escritorio hígado: bajo el aviso fijo se ven enteros el mapa y las pestañas del panel', await esperaR(navR, `(() => { const b = document.querySelector('.exp__banner').getBoundingClientRect(), t = document.querySelector('.exp__pestanas').getBoundingClientRect(), m = document.querySelector('.exp-mapa').getBoundingClientRect(); return t.top >= b.bottom - 1 && m.top >= b.bottom - 1 && m.bottom <= window.innerHeight + 1 })()`, 5000), await navR.evaluate(`(() => { const r = (q) => { const e = document.querySelector(q)?.getBoundingClientRect(); return e ? [Math.round(e.top), Math.round(e.bottom)] : null }; return JSON.stringify({ aviso: r('.exp__banner'), pestanas: r('.exp__pestanas'), mapa: r('.exp-mapa'), alto: innerHeight, y: scrollY }) })()`))
    await navR.evaluate(`window.scrollTo(0, 0)`)
    ok('real simulador: «Más análisis» y «Calidad de los datos» plegados, con la tabla completa y con QC, número de copias, perfil y ADN dentro', await navR.evaluate(PLEGADOS))
    await navR.evaluate(ABRE_TODO)
    ok('real: «Detectado no es positivo» a la vista en marcadores, fuera de lo plegado', await esperaR(navR, `[...document.querySelectorAll('.mk p')].some((p) => /Detectado no es positivo/.test(p.textContent) && !p.closest('details'))`))
    ok('real: en marcadores la tabla va antes que sus notas', await navR.evaluate(`(() => { const t = document.querySelector('.mk__tabla'), c = document.querySelector('.mk__cap'); return !!t && !!c && !!(t.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) })()`))
    ok('real 1440: con las cinco columnas a la vista no sale «Desplaza…»', await navR.evaluate(`(() => { const e = document.querySelector('.mk__tabla'), v = document.querySelector('.mk__desliza'); return !!e && !!v && (e.scrollWidth > e.clientWidth + 1 || getComputedStyle(v).display === 'none') })()`))
    ok('real: marcadores enseña los 15 primeros con cinco columnas', await navR.evaluate(`document.querySelectorAll('.mk__tabla tbody tr').length === 15 && document.querySelectorAll('.mk__tabla thead th').length === 5`))
    await navR.evaluate(MARCADORES_TODOS)
    ok('real: «Ver los 50, con FDR» abre la lista entera y la columna FDR', await esperaR(navR, `document.querySelectorAll('.mk__tabla tbody tr').length > 15 && [...document.querySelectorAll('.mk__tabla thead th')].some((t) => t.textContent.trim() === 'FDR')`))
    ok('real: marcadores, perfil, ADN por grupo y QC con datos', await esperaR(navR, `document.querySelectorAll('.mk__tabla tbody tr').length > 0 && !!document.querySelector('.pf__linea') && document.querySelectorAll('.adng__fila').length > 0 && document.querySelectorAll('.qc__fila').length >= 6`))
    ok('real: el eje del perfil va en el orden del genoma (1, 2, … 22)', await navR.evaluate(perfilEnOrden))
    await navR.sleep(3000)
    ok('real escritorio: sin errores en la consola (mapa incluido)', (await navR.evaluate(`window.__errores.filter((m) => !/Failed to create WebGL context/.test(m)).length`)) === 0, JSON.stringify(await navR.evaluate(`window.__errores.slice(0, 2)`)))
    ok('real: ningún FDR de marcadores sale como «0,0e+0»', await navR.evaluate(sinFdrCero))
    ok('real: las etiquetas del eje del perfil no se pisan (20, 21, 22)', await navR.evaluate(perfilSinPisar))
    ok('real: ningún valor del QC desborda su celda', await navR.evaluate(qcSinDesborde))
    ok('real hígado: en marcadores del grupo de interés, los genes de la selección llevan asterisco y la nota de circularidad', await navR.evaluate(`!!document.querySelector('.mk__circ') && document.querySelectorAll('.mk__ast').length > 0`))
    // verificacion (18-oct): SPDEF y AGR2 son del panel de identidad y no están en la lista de la web; antes salían sin asterisco
    ok('real hígado: SPDEF y AGR2, fuera de la lista de la web, llevan el asterisco de circularidad en marcadores', await navR.evaluate(`(() => { const f = [...document.querySelectorAll('.mk__tabla tbody th')].filter((th) => /^(SPDEF|AGR2)\\b/.test(th.textContent.trim())); return f.length === 2 && f.every((th) => !!th.querySelector('.mk__ast')) })()`))
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hueso\\s*$/.test(b.textContent))?.click()`)
    ok('real hueso: nota de circularidad del grupo (número de copias) en la lista de llegada, marcadores, tabla completa y perfil', await esperaR(navR, `['.gin', '.mk', '.gi__circh'].every((q) => /En el hueso, las células malignas se eligieron/.test(document.querySelector(q)?.textContent ?? '')) && /En el hueso, el grupo de interés se eligió/.test(document.querySelector('.pf')?.textContent ?? '')`))
    ok('real hueso: el gen abierto en el hígado se vuelve a abrir en el hueso', await esperaR(navR, violinesDe(g1)))
    // verificacion (18-oct): el pie de la lista definía el suelo como «solo ARN suelto»; en el hueso incluye el ADN genómico
    ok('real hueso: el pie de la lista de llegada dice que el suelo incluye el ADN genómico', await navR.evaluate(`/En el hueso, el suelo incluye además el ADN genómico/.test(document.querySelector('.gin__pie')?.textContent ?? '')`))
    ok('real hueso: el detalle de HER2 no se sale del panel y cada violín cuadra con su eje (a 1440)', await navR.evaluate(sinDesborde))
    ok('real hueso: el detalle dice «Hueso» y cada fila compara detectado y suelo sin que el redondeo los iguale', await navR.evaluate(`/Hueso/.test(document.querySelector('#exp-violines h2')?.textContent ?? '')`) && await navR.evaluate(marcaSuelo))
    await navR.evaluate(eligeDeLista('MUC1'))
    ok('real hueso: MUC1, con filas por debajo del suelo, las marca («no supera el suelo») y cumple el invariante', await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('MUC1') && /no supera el suelo/.test(document.querySelector('#exp-violines')?.textContent ?? '')`) && await navR.evaluate(marcaSuelo))
    ok('real hueso: el detalle de MUC1 no se sale del panel', await navR.evaluate(sinDesborde))
    // comité médico (18-oct): FGFR1 del hueso (100 % frente a suelo 100 %) salía «no supera el suelo», un negativo falso
    await navR.evaluate(eligeDeLista('FGFR1'))
    ok('real hueso: FGFR1 en el grupo de interés dice «en casi todas las células: cuenta el nivel», no «no supera el suelo»', await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('FGFR1') && /en casi todas las células: cuenta el nivel/.test(document.querySelector('.vio__fila--interes .vio__txt')?.textContent ?? '') && !/no supera el suelo/.test(document.querySelector('.vio__fila--interes .vio__txt')?.textContent ?? '')`))
    await navR.evaluate(eligeDeLista('ERBB2'))
    await esperaR(navR, violinesDe('ERBB2'))
    ok('real hueso: «n = x de y» con su espacio (no «885de»)', !(await navR.evaluate(nPegado)))
    ok('real hueso: la leyenda del suelo, encima de los violines, dice que incluye el ADN genómico (FGFR1 sale con suelo del 100 %)', await navR.evaluate(`(() => { const l = document.querySelector('.vio__leyenda--arriba'), f = document.querySelector('.vio__fila'); return /En el hueso, el suelo incluye además el ADN genómico/.test(l?.textContent ?? '') && !!f && !!(l.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) })()`))
    // verificacion (18-oct): Scrublet 1-2 no es un recuento de dobletes; «Otras» del hueso lleva células sin GEM limpio
    ok('real hueso: el QC matiza Scrublet y da las células que comparten gota con el hígado', await navR.evaluate(`/no es un recuento de dobletes/.test(document.querySelector('.qc__matiz')?.textContent ?? '') && /comparten gota con una célula del hígado/.test(document.querySelector('.qc__matiz')?.textContent ?? '')`))
    ok('real hueso: junto a la leyenda del mapa, la nota dice cuántas de «Otras» no tienen GEM limpio', await navR.evaluate(`[...document.querySelectorAll('.exp__mapacol .exp__nota')].some((p) => /«Otras» incluye [\\d.]+ células sin GEM limpio/.test(p.textContent))`))
    await navR.evaluate(ponModo('grupo'))
    ok('real hueso: por grupo, ninguna fila de la leyenda repite color', await esperaR(navR, colorUnico))
    ok('real hueso: los violines del grupo de interés llevan la nota de circularidad de grupo', await navR.evaluate(`/En el hueso, las células malignas se eligieron/.test(document.querySelector('.vio__fila--interes .vio__circ--grupo')?.textContent ?? '')`))
    ok('real hueso: el número de copias da «n = x de y» y explica el GEM limpio cuando faltan células', await navR.evaluate(`(() => { const t = document.querySelector('.cnv')?.textContent ?? ''; return !/ de \\d/.test([...document.querySelectorAll('.cnv__n')].map((e) => e.textContent).join('|')) || /GEM limpio/.test(t) })()`))
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hígado\\s*$/.test(b.textContent))?.click()`)
    await esperaR(navR, `!!document.querySelector('.exp__banner')`)
    const todos = Array.isArray(manPub.zarr) && manPub.zarr.length > 0
    if (todos) {
      ok('real: buscador de todos los genes activo', await esperaR(navR, `!!document.querySelector('.exp__busca input:not([disabled])')`))
      await navR.evaluate(busca('ACT'))
      const gen = await esperaR(navR, `document.querySelectorAll('.exp__sug button').length > 0`) ? await navR.evaluate(`(() => { const b = document.querySelector('.exp__sug button'); b.click(); return b.textContent.trim() })()`) : ''
      ok(`real: un gen buscado (${gen || 'ninguno'}) se lee del Zarr y sale en los violines`, !!gen && await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('${gen}') && document.querySelectorAll('.vio__fila').length > 0`))
      ok('real: un gen buscado fuera de la revisión dice que no tiene lectura', await navR.evaluate(`/no está en la revisión: no tiene lectura/.test(document.querySelector('.exp__dlec')?.textContent ?? '')`))
      ok('real: el gen buscado pasa a colorear el mapa', await navR.evaluate(mapaEnGen))
      ok(`real: la leyenda del mapa da ${gen || 'el gen'} por tramos (no detectado aparte, tramos en CP10k con su n)`, !!gen && await esperaR(navR, leyendaGen(gen)))
      await navR.evaluate(`document.querySelector('.exp__volver')?.click()`)
      ok('real: «Volver» cierra el detalle y deja el gen en el mapa (chip a la vista)', await esperaR(navR, `!document.querySelector('#exp-violines') && !!document.querySelector('.exp__chip') && ${mapaEnGen}`))
      await navR.evaluate(`document.querySelector('.exp__chipx')?.click()`)
      ok('real: la ✕ del chip quita el gen y vuelve a la llegada (mapa por grupo)', await esperaR(navR, LLEGADA))
      ok('real: tras la ✕ el foco va al buscador', await esperaR(navR, `document.activeElement === document.querySelector('.exp__busca input')`, 5000))
      await navR.evaluate(busca('HER2'))
      ok('real: buscar por la proteína (HER2) sugiere el gen (ERBB2)', await esperaR(navR, `document.querySelector('.exp__sug button')?.dataset.gen === 'ERBB2'`))
      // el buscador acepta nombres de proteína: el aviso de «no encontrado» no puede mandar a no usarlos (salía en producción)
      await navR.evaluate(busca('ZZNOEXISTE1'))
      await navR.evaluate(`document.querySelector('.exp__busca input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
      ok('real: el aviso de gen no encontrado sale y no dice «no por el nombre de la proteína»', await esperaR(navR, `(() => { const t = document.querySelector('.exp__nota--busca')?.textContent ?? ''; return /No hay ningún gen «ZZNOEXISTE1»/.test(t) && !/no por el nombre de la proteína|no por la proteína/.test(t) })()`))
      // comité médico (18-oct): nombres clínicos que teclea un médico
      await navR.evaluate(busca('ER'))
      ok('real: «ER» sugiere ESR1 en primer lugar', await esperaR(navR, `document.querySelector('.exp__sug button')?.dataset.gen === 'ESR1'`))
      await navR.evaluate(busca('PD-L1'))
      ok('real: «PD-L1» sugiere CD274', await esperaR(navR, `[...document.querySelectorAll('.exp__sug button')].some((b) => b.dataset.gen === 'CD274')`))
      // diseño (18-oct): la grafía más tecleada, sin guion ni la M, también llega (KI67 → MKI67)
      await navR.evaluate(busca('Ki-67'))
      ok('real: «Ki-67» sugiere MKI67 (búsqueda sin guiones y por «contiene»)', await esperaR(navR, `[...document.querySelectorAll('.exp__sug button')].some((b) => b.dataset.gen === 'MKI67')`))
    }
    else ok('real sin la decisión de la matriz completa: no hay buscador de todos los genes', !(await navR.evaluate(`!!document.querySelector('.exp__busca')`)))
    await navR.cdp('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false })
    await navR.cargar('/celula-a-celula/explorar')
    await esperaR(navR, `document.querySelectorAll('.gin__tabla tbody tr').length > 0`)
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hueso\\s*$/.test(b.textContent))?.click()`)
    await esperaR(navR, `!document.querySelector('.exp__banner') && document.querySelectorAll('.gin__tabla tbody tr').length > 0`)
    await navR.evaluate(eligeDeLista('CD276'))
    ok('real 1024 hueso: el detalle de B7-H3 no se sale del panel', await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('CD276')`) && await navR.evaluate(sinDesborde))
    // tableta apaisada (táctil, ≥1024): el mapa también queda quieto hasta «Mover el mapa»
    await navR.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await navR.cdp('Emulation.setDeviceMetricsOverride', { width: 1180, height: 820, deviceScaleFactor: 1, mobile: true })
    await navR.cargar('/celula-a-celula/explorar')
    ok('real tableta 1180 táctil: el mapa queda quieto hasta «Mover el mapa»', await esperaR(navR, `matchMedia('(pointer: coarse)').matches ? (!!document.querySelector('.exp-mapa__velo') && /Mover el mapa/.test(document.querySelector('.exp-mapa__mover')?.textContent ?? '')) : 'sin-coarse'`, 20000) === true, `pointer coarse: ${await navR.evaluate(`matchMedia('(pointer: coarse)').matches`)}`)
    await navR.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
    await navR.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
    await navR.cargar('/celula-a-celula/explorar')
    await esperaR(navR, `document.querySelectorAll('.gin__tabla tbody tr').length > 0`)
    ok('real móvil 375×812 llegada: el buscador cabe en la primera pantalla', await esperaR(navR, `window.scrollY === 0 && (document.querySelector('.exp__busca input')?.getBoundingClientRect().bottom ?? 9999) <= innerHeight`))
    ok('real móvil 375×812 llegada: el mapa empieza antes de 1,2 pantallas', await esperaR(navR, `(document.querySelector('.exp-mapa')?.getBoundingClientRect().top ?? 9999) <= innerHeight * 1.2`), `${await navR.evaluate(`Math.round(document.querySelector('.exp-mapa')?.getBoundingClientRect().top ?? -1)`)} px`)
    // diseño (18-oct): fijo, a 375 el aviso del hígado medía 96 px y tapaba filas y «Volver»; fijo solo el titular, y la
    // frase de «Luminal… subconjunto / Hepatocitos y Otras» a la vista debajo, antes de las cifras
    ok('real móvil 375 hígado: el aviso fijo mide 70 px o menos y la frase del subconjunto se ve debajo', await navR.evaluate(`(() => { const b = document.querySelector('.exp__banner'), f = document.querySelector('.exp__banner-sig'); return !!b && b.getBoundingClientRect().height <= 70 && !!f && getComputedStyle(f).display !== 'none' && /es un subconjunto, no el tumor entero/.test(f.textContent) && /«Hepatocitos» y «Otras» también pueden incluir células tumorales/.test(f.textContent) })()`), `${await navR.evaluate(`Math.round(document.querySelector('.exp__banner')?.getBoundingClientRect().height ?? -1)`)} px`)
    ok('real móvil 375: por grupo, ninguna fila de la leyenda repite color', await esperaR(navR, colorUnico))
    // diseño (18-oct): a 375 la cabecera de la lista se iba de la pantalla tras cuatro genes y las cifras quedaban sin nombre
    ok('real móvil 375: en la lista cada cifra lleva su rótulo (Grupo, Ref., Suelo) y el grupo de interés se nombra arriba', await navR.evaluate(`(() => { const c = [...document.querySelector('.gin__fila').querySelectorAll('td.gin__num')].map((td) => getComputedStyle(td, '::before').content); const cab = document.querySelector('.gin__cabest'); return c.length === 3 && /Grupo/.test(c[0]) && /Ref/.test(c[1]) && /Suelo/.test(c[2]) && !!cab && getComputedStyle(cab).display !== 'none' && /Grupo de interés/.test(cab.textContent) })()`))
    const desb = `Math.round(Math.max(...[...document.querySelectorAll('.exp, .exp > *')].map((e) => e.getBoundingClientRect().right)) - window.innerWidth)`
    ok('real móvil: el explorador cabe en el ancho', (await navR.evaluate(desb)) <= 1)
    // capturas del 18-oct: a 375 la lista de llegada se salía por la derecha (Referencia y Suelo cortadas) y el test de
    // ancho, que mide solo los hijos directos del explorador, no lo veía. Se mide la tabla contra su caja.
    ok('real móvil 375: la lista de genes de interés cabe en su caja (las cuatro columnas a la vista)', await navR.evaluate(`(() => { const t = document.querySelector('.gin__tabla'), c = document.querySelector('.gin'); return !!t && !!c && t.getBoundingClientRect().right <= c.getBoundingClientRect().right + 1 && t.getBoundingClientRect().right <= innerWidth })()`), `${await navR.evaluate(`Math.round((document.querySelector('.gin__tabla')?.getBoundingClientRect().right ?? 0) - innerWidth)`)} px de más`)
    ok('real móvil: hay mapa, quieto (velo) hasta pulsar «Mover el mapa»', await esperaR(navR, `!!document.querySelector('.exp-mapa') && !!document.querySelector('.exp-mapa__velo') && /Mover el mapa/.test(document.querySelector('.exp-mapa__mover')?.textContent ?? '')`))
    await navR.evaluate(`document.querySelector('.exp-mapa__mover')?.click()`)
    await navR.evaluate(busca('SPDEF'))
    if (await esperaR(navR, `document.querySelector('.exp__sug button')?.dataset.gen === 'SPDEF'`, 15000)) await navR.evaluate(`document.querySelector('.exp__sug button').click()`)
    ok('real móvil: tras buscar un gen, su detalle lleva «Ver el mapa» a la vista y «Volver»', await esperaR(navR, verMapaEnDetalle, 20000))
    ok('real móvil: tras «Mover el mapa» el velo desaparece y el botón dice «Listo»', await esperaR(navR, `!document.querySelector('.exp-mapa__velo') && /Listo/.test(document.querySelector('.exp-mapa__mover')?.textContent ?? '')`, 5000))
    await navR.evaluate(ABRE_TODO)
    ok('real móvil 375: el resumen del perfil no se recorta (cada región dentro del bloque)', await navR.evaluate(resumenCabe))
    await navR.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /^\\s*Hueso\\s*$/.test(b.textContent))?.click()`)
    await esperaR(navR, `!document.querySelector('.exp__banner')`)
    await navR.evaluate(eligeDeLista('ERBB2'))
    ok('real móvil 375 hueso: el detalle de HER2 no se sale del panel y cada violín cuadra con su eje', await esperaR(navR, `document.querySelector('#exp-violines h2')?.textContent.includes('ERBB2')`) && await navR.evaluate(sinDesborde))
  }
  finally { await navR.cerrar() }
  // revisión final (18-oct): sin WebGL (PC de hospital, escritorio virtual) Vitessce dejaba una caja vacía y una leyenda
  // de un mapa que no estaba
  const navS = await abrirNavegador({ ancho: 1440, alto: 900, escala: 1 })
  try {
    await navS.cargar('/celula-a-celula/explorar')
    ok('real sin WebGL: aviso de que el mapa no se ha podido dibujar, sin caja ni leyenda del mapa, y la lista sigue', await esperaR(navS, `/El mapa no se ha podido dibujar/.test(document.querySelector('.exp__estado--error')?.textContent ?? '') && !document.querySelector('.exp-mapa') && !document.querySelector('.exp__leyenda') && !document.querySelector('.exp__mapabar') && document.querySelectorAll('.gin__tabla tbody tr').length > 0`, 20000))
  }
  finally { await navS.cerrar() }
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
const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1, gl: true })
try {
  await nav.cargar('/celula-a-celula/explorar')
  await nav.sleep(1200)
  ok('sin demo: no se pide ningún fichero de lesión', (await nav.evaluate(pedidos)).length === 0)
  ok('sin demo: no se monta el explorador', !(await nav.evaluate(`!!document.querySelector('.exp')`)))

  await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source: ESPIA })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  ok('demo: llegada con el mapa por grupo y la lista de genes de interés', await espera(nav, LLEGADA))
  const nGrupos = await nav.evaluate(`document.querySelectorAll('.exp__leyenda li').length`)   // por grupo: una entrada por grupo
  const gD = await nav.evaluate(eligeDeLista(''))
  ok(`demo: un toque en la lista (${gD || 'ninguno'}) abre los violines`, !!gD && await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`))
  const r = await nav.evaluate(`(() => ({
    rotulo: /DATOS DE EJEMPLO/.test(document.querySelector('.exp__demo')?.textContent ?? ''),
    banner: /tumor frente a hepatocito no está resuelto célula a célula/.test(document.querySelector('.exp__banner')?.textContent ?? ''),
    filas: document.querySelectorAll('.vio__fila').length,
    conSuelo: [...document.querySelectorAll('.vio__fila')].filter((f) => f.querySelector('.vio__suelo') && /suelo \\d+\\s%/.test(f.textContent) && /n = \\d/.test(f.textContent)).length,
    cnvCelula: document.querySelectorAll('.cnv__svg').length,
    cnvHigado: !!document.querySelector('.cnv__higado'),
    mapa: !!document.querySelector('.exp-mapa'),
    adn: /hibridan con el ADN genómico/.test(document.querySelector('.vio__adn')?.textContent ?? '') && /Matriz estándar de Cell Ranger/.test(document.querySelector('.vio__adn')?.textContent ?? ''),
    circTabla: /Circular: FGFR1/.test(document.querySelector('.gi__circ')?.textContent ?? ''),
    sondasTabla: (document.querySelector('.gi__tabla thead')?.textContent ?? '').includes('unión / total'),
    lectura: (document.querySelector('.gi__tabla thead')?.textContent ?? '').includes('Lectura de Polaris (borrador)'),
  }))()`)
  ok('demo: aviso de ADN genómico con el rótulo de la matriz, en el bloque del suelo ambiental', r.adn)
  ok('demo hígado: la tabla completa rotula la cifra circular (FGFR1) y enseña las sondas y la lectura de Polaris', r.circTabla && r.sondasTabla && r.lectura)
  ok('demo: rótulo «DATOS DE EJEMPLO»', r.rotulo)
  ok('demo hígado: aviso fijo «tumor frente a hepatocito…»', r.banner)
  ok('demo: un violín por grupo', r.filas > 0 && r.filas === nGrupos, `${r.filas} violines / ${nGrupos} grupos`)
  ok('demo: el suelo ambiental y el n están en CADA violín', r.conSuelo === r.filas, `${r.conSuelo} de ${r.filas}`)
  ok('demo hígado: sin CNV por célula y con su aviso', r.cnvCelula === 0 && r.cnvHigado)
  ok('demo escritorio: hay mapa', r.mapa)
  ok('demo simulador: «Más análisis» y «Calidad de los datos» plegados y con todo dentro', await nav.evaluate(PLEGADOS))
  ok('demo: el mapa (Vitessce) llega a dibujar su lienzo', await espera(nav, `!!document.querySelector('.exp-mapa canvas')`, 20000))
  await nav.sleep(3000)
  ok('demo escritorio: sin errores en la consola (mapa incluido)', (await nav.evaluate(`window.__errores.filter((m) => !/Failed to create WebGL context/.test(m)).length`)) === 0, JSON.stringify(await nav.evaluate(`window.__errores.slice(0, 2)`)))
  const hayBusca = await espera(nav, `!!document.querySelector('.exp__busca input:not([disabled])')`)
  ok('demo hígado: buscador de todos los genes activo', hayBusca)
  await nav.evaluate(busca('ESR1'))
  if (await espera(nav, `document.querySelector('.exp__sug button')?.dataset.gen === 'ESR1'`)) await nav.evaluate(`document.querySelector('.exp__sug button').click()`)
  ok('demo hígado: ESR1 en los violines lleva primero la cifra sin circularidad y después «Cifra circular»', await espera(nav, `/Sin esa circularidad.*Cifra circular\\./s.test(document.querySelector('.vio__circ')?.textContent ?? '')`))
  ok('demo hígado: la nota de circularidad va ANTES de la figura y de la cifra circular de la fila', await nav.evaluate(`(() => { const c = document.querySelector('.vio__fila--interes .vio__circ'), t = document.querySelector('.vio__fila--interes .vio__txt'); return !!c && !!t && c.nextElementSibling?.classList.contains('vio__svg') && !!(c.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) && /^\\s*Circular · /.test(t.textContent) })()`))
  await nav.evaluate(ABRE_TODO)
  await nav.evaluate(MARCADORES_TODOS)
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
  ok('escritorio 1280: toda tabla o figura que desborda avisa de que se desliza', await nav.evaluate(`[['.mk__tabla', '.mk__desliza'], ['.pf__marco', '.pf__desliza']].every(([m, a]) => { const e = document.querySelector(m), v = document.querySelector(a); if (!e || !v) return false; return e.scrollWidth <= e.clientWidth + 1 || getComputedStyle(v).display !== 'none' })`))
  // nivel «todos los genes» (Zarr, solo en la demo del ejemplo): buscar un gen fuera del panel y verlo en los violines
  if (hayBusca) {
    await nav.evaluate(busca('EJ001'))
    const haySug = await espera(nav, `document.querySelectorAll('.exp__sug button').length > 0`)
    ok('demo hígado: el buscador sugiere genes fuera del panel', haySug)
    if (haySug) {
      const elegido = await nav.evaluate(`(() => { const b = document.querySelector('.exp__sug button'); b.click(); return b.textContent.trim() })()`)
      ok(`demo hígado: ${elegido}, leído del Zarr, sale en los violines con n y suelo por grupo`, await espera(nav, violinesDe(elegido)))
      ok('demo escritorio: el gen buscado pasa a colorear el mapa', await nav.evaluate(mapaEnGen))
      // un gen de la selección FUERA de la lista de la web (EJ0003 en el ejemplo) lleva su nota de circularidad en los violines
      await nav.evaluate(busca('EJ0003'))
      if (await espera(nav, `document.querySelector('.exp__sug button')?.dataset.gen === 'EJ0003'`)) await nav.evaluate(`document.querySelector('.exp__sug button').click()`)
      ok('demo hígado: EJ0003 (selección, fuera de la lista de la web) sale como cifra circular en los violines', await espera(nav, `document.querySelector('#exp-violines h2')?.textContent.includes('EJ0003') && !!document.querySelector('.vio__fila--interes .vio__circ')`))
    }
  }
  // marcadores: pulsar un gen lo pinta en el mapa y abre su detalle; «Volver» regresa a marcadores con la fila marcada
  await nav.evaluate(ABRE_TODO)
  const genMk = await nav.evaluate(`(() => { const b = document.querySelector('.mk__gen:not(.mk__gen--fijo)'); if (!b) return ''; b.click(); return b.textContent.trim() })()`)
  ok('demo simulador: pulsar un marcador lo pinta en el mapa (leyenda por tramos de ese gen)', !!genMk && await espera(nav, leyendaGen(genMk)) && await nav.evaluate(mapaEnGen))
  ok('demo hígado: pulsar un marcador abre su detalle en el panel', !!genMk && await espera(nav, `document.querySelector('#exp-violines h2')?.textContent.includes('${genMk}')`))
  await nav.evaluate(`document.querySelector('.exp__volver')?.click()`)
  ok('demo hígado: «Volver» regresa a marcadores con la fila del gen marcada', await espera(nav, `!document.querySelector('#exp-violines') && document.querySelector('.mk')?.offsetParent !== null && document.querySelector('.mk__gen[aria-pressed="true"]')?.textContent.trim() === '${genMk}'`))
  await nav.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /Hueso/.test(b.textContent)).click()`)
  ok('demo hueso: CNV por célula', await espera(nav, `document.querySelectorAll('.cnv__svg').length > 0 && !document.querySelector('.cnv__higado')`))
  ok('demo hueso: el CNV dice que es inferido de la expresión y no lectura de ADN, y marca el 0', await nav.evaluate(`/no es lectura de ADN/.test(document.querySelector('.cnv')?.textContent ?? '') && document.querySelectorAll('.cnv__cero').length > 0`))
  ok('demo hueso: el CNV avisa de que el 0 no es «como la referencia»', await nav.evaluate(`/El 0 no es «como la referencia»/.test(document.querySelector('.cnv')?.textContent ?? '') && !/0 = como la referencia/.test(document.querySelector('.cnv')?.textContent ?? '')`))
  ok('demo hueso: sin el aviso del hígado', !(await nav.evaluate(`!!document.querySelector('.exp__banner')`)))

  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  ok('móvil: llegada con la lista de genes de interés', await espera(nav, LLEGADA))
  ok('móvil: hay mapa (simulador), quieto hasta «Mover el mapa»', await espera(nav, `!!document.querySelector('.exp-mapa') && !!document.querySelector('.exp-mapa__velo')`))
  await nav.evaluate(ABRE_TODO)
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
  // con el mapa encima del panel: tras pulsar un marcador, el detalle trae «Ver el mapa» (sin salto automático)
  const genMv = await nav.evaluate(`(() => { const b = document.querySelector('.mk__gen:not(.mk__gen--fijo)'); if (!b) return ''; b.click(); return b.textContent.trim() })()`)
  ok('móvil 375: tras pulsar un marcador, su detalle lleva «Ver el mapa» a la vista (44 px) y «Volver»', !!genMv && await espera(nav, verMapaEnDetalle))
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: true })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`)
  await nav.evaluate(ABRE_TODO)
  ok('tableta 820: toda tabla o figura que desborda avisa de que se desliza', await nav.evaluate(avisoSiDesborda))
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

  await nav.cargar('/celula-a-celula?demo=1')
  ok('demo: la tarjeta aparece en /celula-a-celula y lleva el demo', await espera(nav, `!!document.querySelector('a[href="/celula-a-celula/explorar?demo=1"]')`, 8000))
}
finally { await nav.cerrar() }

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
