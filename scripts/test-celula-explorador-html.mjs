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
    conSuelo: [...document.querySelectorAll('.vio__fila')].filter((f) => f.querySelector('.vio__suelo') && /suelo \\d+ %/.test(f.textContent) && /n = \\d/.test(f.textContent)).length,
    grupos: document.querySelectorAll('.exp__grupos li').length,
    cnvCelula: document.querySelectorAll('.cnv__svg').length,
    cnvHigado: !!document.querySelector('.cnv__higado'),
    mapa: !!document.querySelector('.exp-mapa'),
  }))()`)
  ok('demo: rótulo «DATOS DE EJEMPLO»', r.rotulo)
  ok('demo hígado: aviso fijo «tumor frente a hepatocito…»', r.banner)
  ok('demo: un violín por grupo', r.filas > 0 && r.filas === r.grupos, `${r.filas} violines / ${r.grupos} grupos`)
  ok('demo: el suelo ambiental y el n están en CADA violín', r.conSuelo === r.filas, `${r.conSuelo} de ${r.filas}`)
  ok('demo hígado: sin CNV por célula y con su aviso', r.cnvCelula === 0 && r.cnvHigado)
  ok('demo escritorio: hay mapa', r.mapa)
  ok('demo: el mapa (Vitessce) llega a dibujar su lienzo', await espera(nav, `!!document.querySelector('.exp-mapa canvas')`, 20000))
  await nav.evaluate(`[...document.querySelectorAll('.exp__ctl button')].find((b) => /Hueso/.test(b.textContent)).click()`)
  ok('demo hueso: CNV por célula', await espera(nav, `document.querySelectorAll('.cnv__svg').length > 0 && !document.querySelector('.cnv__higado')`))
  ok('demo hueso: sin el aviso del hígado', !(await nav.evaluate(`!!document.querySelector('.exp__banner')`)))

  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await nav.cargar('/celula-a-celula/explorar?demo=1')
  ok('móvil: aparecen los violines', await espera(nav, `document.querySelectorAll('.vio__fila').length > 0`))
  ok('móvil: sin mapa y con el aviso de vista reducida', await nav.evaluate(`!document.querySelector('.exp-mapa') && /versión reducida/.test(document.querySelector('.exp__movil')?.textContent ?? '')`))
  // la página tiene overflow-x: clip, así que un desborde no da scroll: se recortaría sin avisar. Se mide el bloque.
  const desborde = `Math.round(Math.max(...[...document.querySelectorAll('.exp, .exp > *')].map((e) => e.getBoundingClientRect().right)) - window.innerWidth)`
  ok('móvil: el explorador cabe en el ancho (nada recortado a la derecha)', (await nav.evaluate(desborde)) <= 1, `${await nav.evaluate(desborde)} px de más`)
  await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

  await nav.cargar('/celula-a-celula?demo=1')
  ok('demo: la tarjeta aparece en /celula-a-celula y lleva el demo', await espera(nav, `!!document.querySelector('a[href="/celula-a-celula/explorar?demo=1"]')`, 8000))
}
finally { await nav.cerrar() }

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
