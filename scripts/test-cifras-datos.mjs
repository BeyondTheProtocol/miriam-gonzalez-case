#!/usr/bin/env node
// Test de cifras de /datos: lo que se PINTA tiene que ser lo que dice app/data/caso.json.
//
// Por qué existe (10-oct-2026): «La película del caso» mueve un cabezal por las analíticas de
// Miriam. Una cifra a medio camino entre dos análisis sería una analítica que no existe, con su
// nombre al lado. El 25-sep un vídeo generado alteró cifras en 3 de 6 clips; aquí el freno es un
// test y no una norma. La regla que vigila: la cifra que se lee es SIEMPRE la del último punto real
// con fecha ≤ cabezal, con su fecha, y nunca un valor intermedio.
//
// Qué coteja, leyendo el DOM del build estático con Chrome por CDP:
//   1. la película (?peli=1), en cada fecha con análisis de sus tres series, el día anterior a
//      cada una y los extremos: valor, fecha y texto visible de cada serie, y el reloj;
//   2. que la película no arranca sola, y que `seek` y `?t=` se acotan al rango real;
//   3. la página en reposo: el valor de cabecera de cada gráfico de analíticas a la vista y las
//      tarjetas de «Hoy» de CA 15-3 y hemoglobina;
//   4. carga tumoral: mientras el dibujo se anima, los rótulos solo dicen cifras de uno de los dos
//      estudios, nunca un valor intermedio;
//   5. la entrada animada de la primera visita: no deja ningún gráfico escondido y no se repite
//      en la segunda visita de la sesión.
// Qué NO coteja: las cifras de tejido, reservorio, PET, lesión a lesión ni las otras pestañas de
// analíticas. Verde aquí no es «todo /datos cotejado».
//
// La expectativa se calcula aquí, aparte del código de la web: si los dos se equivocan igual, será
// casualidad. Uso:  pnpm exec nuxt generate && pnpm test:cifras-datos   (CI: e2e.yml)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

if (!existsSync(join(ROOT, 'datos.html')) && !existsSync(join(ROOT, 'datos', 'index.html'))) {
  console.error(`No existe la página /datos en ${ROOT}. Corre antes \`pnpm exec nuxt generate\`.`)
  process.exit(2)
}
const caso = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'app', 'data', 'caso.json'), 'utf8'))

const DIA = 86400000
const ms = (iso) => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d) }
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const MES = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }
const fechaCorta = (f, lg) => { const [a, m, d] = f.split('-').map(Number); return lg === 'en' ? `${MES.en[m - 1]} ${d}, ${a}` : `${d} ${MES.es[m - 1]} ${a}` }
const num = (v, lg) => (lg === 'es' ? String(v).replace('.', ',') : String(v))
const valor = (p, lg) => `${p.cmp ?? ''}${num(p.v, lg)}`
const analito = (k) => { for (const g of Object.values(caso.analiticas.grupos)) { const a = g.analitos.find((x) => x.key === k); if (a) return a } return null }

const HOY = String(caso.generado).slice(0, 10)
const DESDE = Date.UTC(2023, 9, 1) // la ventana «desde el diagnóstico» de la web (rangoVentana('dx'))
// las tres series de la película y su modo: en «lsn» un punto sin límite superior no se dibuja
const SERIES = [['ca153', 'lsn'], ['got', 'lsn'], ['hemoglobina', 'real']]
const puntosPeli = (k, modo) => analito(k).puntos.filter((p) => ms(p.f) >= DESDE && ms(p.f) <= ms(HOY) && (modo === 'real' || (p.hi && p.hi > 0)))
const esperado = (k, modo, t) => puntosPeli(k, modo).filter((p) => ms(p.f) <= t).pop() ?? null

let fallos = 0
let hechos = 0
function comprobar(nombre, ok, detalle = '') {
  hechos++
  if (ok) return
  fallos++
  if (fallos <= 25) console.log(`✘ ${nombre}${detalle ? `\n    ${detalle}` : ''}`)
}

const LEER_PELI = `(() => ({
  reloj: document.querySelector('.pl__reloj')?.textContent.trim() ?? null,
  estado: window.__peli?.estado() ?? null,
  series: [...document.querySelectorAll('.pl .ps')].map((el) => ({
    k: el.dataset.k, f: el.dataset.f, v: el.dataset.v,
    etiqueta: el.querySelector('.ps__valor')?.textContent.trim() ?? '',
    cabecera: el.querySelector('.ps__lee')?.textContent.trim() ?? '',
  })),
}))()`
const esperarPeli = async (nav) => { for (let i = 0; i < 60; i++) { if (await nav.evaluate('!!window.__peli && !!document.querySelector(".pl[open] .ps")')) return true; await nav.sleep(100) } return false }

const nav = await abrirNavegador()
try {
  for (const lg of ['es', 'en']) {
    const base = lg === 'en' ? '/en/data' : '/datos'

    /* ── 1 · la película, paso a paso ── */
    await nav.cargar(`${base}?peli=1`)
    comprobar(`[${lg}] la película se abre con ?peli=1`, await esperarPeli(nav))
    await nav.sleep(1300)
    const alAbrir = await nav.evaluate(LEER_PELI)
    comprobar(`[${lg}] no arranca sola`, alAbrir.estado?.reproduciendo === false && alAbrir.estado?.fecha === iso(DESDE), JSON.stringify(alAbrir.estado))

    const fechas = new Set([iso(DESDE), HOY])
    for (const [k, modo] of SERIES) for (const p of puntosPeli(k, modo)) { fechas.add(p.f); if (ms(p.f) - DIA >= DESDE) fechas.add(iso(ms(p.f) - DIA)) }
    const pasos = [...fechas].sort()
    for (const f of pasos) {
      await nav.evaluate(`window.__peli.seek(${JSON.stringify(f)})`)
      const d = await nav.evaluate(LEER_PELI)
      comprobar(`[${lg}] ${f}: el reloj dice la fecha del cabezal`, d.reloj === fechaCorta(f, lg), `reloj «${d.reloj}», esperado «${fechaCorta(f, lg)}»`)
      comprobar(`[${lg}] ${f}: están las tres series`, d.series.length === SERIES.length, `hay ${d.series.length}`)
      for (const [k, modo] of SERIES) {
        const s = d.series.find((x) => x.k === k)
        const e = esperado(k, modo, ms(f))
        if (!s) { comprobar(`[${lg}] ${f} ${k}: falta la serie`, false); continue }
        if (!e) { comprobar(`[${lg}] ${f} ${k}: sin análisis todavía, no enseña cifra`, s.f === '' && s.v === '' && s.etiqueta === '', JSON.stringify(s)); continue }
        comprobar(`[${lg}] ${f} ${k}: el valor es el del último análisis real`, s.f === e.f && s.v === String(e.v), `pinta ${s.v} (${s.f}); caso.json dice ${e.v} (${e.f})`)
        comprobar(`[${lg}] ${f} ${k}: la etiqueta escribe ese valor`, s.etiqueta.includes(valor(e, lg)), `etiqueta «${s.etiqueta}», esperado «${valor(e, lg)}»`)
        comprobar(`[${lg}] ${f} ${k}: lleva la fecha de ese análisis`, s.cabecera.includes(fechaCorta(e.f, lg)), `cabecera «${s.cabecera}», esperado «${fechaCorta(e.f, lg)}»`)
      }
    }
    console.log(`  [${lg}] película: ${pasos.length} fechas recorridas`)

    /* ── 2 · el cabezal no sale del rango real ── */
    await nav.evaluate(`window.__peli.seek('1999-01-01')`)
    comprobar(`[${lg}] seek antes del rango se queda en el inicio`, (await nav.evaluate(LEER_PELI)).estado.fecha === iso(DESDE))
    await nav.evaluate(`window.__peli.seek('2999-01-01')`)
    comprobar(`[${lg}] seek después del rango se queda en hoy`, (await nav.evaluate(LEER_PELI)).estado.fecha === HOY)
    for (const [t, quiere, por] of [['2025-03-10', '2025-03-10', 'una fecha válida'], ['%3Cimg%20src%3Dx%3E', iso(DESDE), 'un ?t= que no es una fecha'], ['2999-12-31', HOY, 'un ?t= futuro']]) {
      await nav.cargar(`${base}?peli=1&t=${t}`)
      await esperarPeli(nav)
      const d = await nav.evaluate(LEER_PELI)
      comprobar(`[${lg}] ${por} abre en ${quiere}`, d.estado?.fecha === quiere, JSON.stringify(d.estado))
    }

    /* ── 3 · la página en reposo ── */
    await nav.cargar(base)
    comprobar(`[${lg}] sin ?peli=1 la película no se abre`, await nav.evaluate('!document.querySelector(".pl[open]")'))
    const reposo = await nav.evaluate(`(() => ({
      minis: [...document.querySelectorAll('.ms[data-k]')].filter((el) => el.offsetParent !== null).map((el) => ({ k: el.dataset.k, f: el.dataset.f, v: el.dataset.v, txt: el.querySelector('.ms__valor')?.textContent.replace(/\\s+/g, ' ').trim() ?? '' })),
      hoy: document.querySelector('.dt-cifras')?.textContent.replace(/\\s+/g, ' ') ?? '',
    }))()`)
    comprobar(`[${lg}] hay gráficos de analíticas a la vista`, reposo.minis.length >= 3, `hay ${reposo.minis.length}`)
    const desdeAnio = ms(HOY) - 365 * DIA // ventana por defecto de la página: el último año
    for (const m of reposo.minis) {
      const e = analito(m.k)?.puntos.filter((p) => ms(p.f) >= desdeAnio && ms(p.f) <= ms(HOY) + 20 * DIA).pop()
      if (!e) { comprobar(`[${lg}] reposo ${m.k}: sin análisis en el año, no enseña cifra`, m.v === '', JSON.stringify(m)); continue }
      comprobar(`[${lg}] reposo ${m.k}: valor y fecha del último análisis`, m.f === e.f && m.v === String(e.v) && m.txt.includes(valor(e, lg)) && m.txt.includes(fechaCorta(e.f, lg)),
        `pinta «${m.txt}» (${m.v}, ${m.f}); caso.json dice ${valor(e, lg)} (${e.f})`)
    }
    /* ── 4 · carga tumoral: el dibujo se mueve, las cifras no pasan por valores intermedios ── */
    const em = caso.enfermedad_medible
    const rA = em.recist[0], rB = em.recist.at(-1), vA = em.volumen[0], vB = em.volumen.at(-1)
    const vale = {
      mm: [`${rA.suma_mm} mm`, `${rB.suma_mm} mm`],
      ml: [`${num(vA.ml, lg)} ml`, `${num(vB.ml, lg)} ml`],
      les: [vA.n_lesiones, vB.n_lesiones].map(String),
    }
    await nav.evaluate(`document.querySelector('.ct__otra').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await nav.sleep(2600) // que termine la entrada de la primera visita, si la hubo
    await nav.evaluate(`document.querySelector('.ct__otra').click()`)
    const vistas = { mm: new Set(), ml: new Set(), les: new Set() }
    for (let i = 0; i < 24; i++) {
      const d = await nav.evaluate(`[document.querySelector('.ct__cifra').textContent.trim(), document.querySelector('.ct__ml').textContent.trim(), document.querySelector('.ct__fecha').textContent.trim()]`)
      vistas.mm.add(d[0]); vistas.ml.add(d[1]); vistas.les.add((d[2].match(/· (\d+) /) ?? [])[1] ?? d[2])
      await nav.sleep(90)
    }
    for (const k of ['mm', 'ml', 'les']) {
      const raras = [...vistas[k]].filter((x) => !vale[k].includes(x))
      comprobar(`[${lg}] carga tumoral (${k}): durante la animación solo se leen cifras de un estudio real`, raras.length === 0, `aparecieron ${JSON.stringify(raras)}; válidas ${JSON.stringify(vale[k])}`)
      comprobar(`[${lg}] carga tumoral (${k}): la animación llega a enseñar los dos estudios`, vistas[k].size === 2, `vistas ${JSON.stringify([...vistas[k]])}`)
    }

    /* ── 5 · la entrada de la primera visita no esconde nada y no se repite ── */
    const ESCONDIDOS = `document.querySelectorAll('.ms--armado:not(.ms--visto), .lt--armado:not(.lt--visto), .cinta--armado:not(.cinta--visto)').length`
    const ARMADOS = `document.querySelectorAll('.ms--armado, .lt--armado, .cinta--armado').length`
    comprobar(`[${lg}] primera visita: hubo entrada animada`, (await nav.evaluate(ARMADOS)) > 0)
    await nav.sleep(1200) // la reserva de 3 s ya pasó con creces desde la carga
    comprobar(`[${lg}] primera visita: ningún gráfico se queda escondido`, (await nav.evaluate(ESCONDIDOS)) === 0, `escondidos: ${await nav.evaluate(ESCONDIDOS)}`)
    await nav.cargar(base, { conservar: true })
    comprobar(`[${lg}] segunda visita de la sesión: todo quieto, sin entrada`, (await nav.evaluate(ARMADOS)) === 0, `armados: ${await nav.evaluate(ARMADOS)}`)

    for (const k of ['ca153', 'hemoglobina']) {
      const e = analito(k).puntos.at(-1)
      comprobar(`[${lg}] «Hoy» escribe el último ${k}`, reposo.hoy.includes(valor(e, lg)), `esperado «${valor(e, lg)}» en las tarjetas de «Hoy»`)
    }
  }
} finally {
  await nav.cerrar()
}

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `\n${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
