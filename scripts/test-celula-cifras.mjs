#!/usr/bin/env node
// Test de cifras de /celula-a-celula: lo que la página PINTA como resultado tiene que estar en
// public/celula/resultados.json.
//
// Qué coteja, con Chrome por CDP sobre el build estático:
//   1. sin demo: no existe ni el contenedor de resultados ni rastro (título, bloques, rótulo), y el
//      estado sigue diciendo «todavía no». Lo mismo en ES y EN;
//   2. con ?demo=1 (host local, datos `ejemplo: true`): salen los bloques del JSON, con el rótulo
//      «DATOS DE EJEMPLO», y CADA cifra de su texto, de sus aria-label y de sus <title> está en el
//      JSON (en formato ES o EN). Se ignoran los dígitos pegados a letras o guiones (símbolos de
//      gen: Nectin-4, B7-H3);
//   3. el detector funciona: si se inyecta una cifra que no está en el JSON, lo avisa (si no, un
//      verde aquí no significaría nada).
// Qué NO coteja: la puerta (verificado + OK) y el contrato del fichero; eso es test:celula-puerta.
// Uso:  pnpm exec nuxt generate && pnpm test:celula-cifras   (CI: e2e.yml)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

if (!existsSync(join(ROOT, 'celula-a-celula.html')) && !existsSync(join(ROOT, 'celula-a-celula', 'index.html'))) {
  console.error(`No existe /celula-a-celula en ${ROOT}. Corre antes \`pnpm exec nuxt generate\`.`)
  process.exit(2)
}
const json = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'celula', 'resultados.json'), 'utf8'))
const miles = (n, sep) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep)
const permitidas = new Set()
;(function recorre(x) {
  if (typeof x === 'number') { permitidas.add(String(x)); permitidas.add(miles(x, '.')); permitidas.add(miles(x, ',')) }
  else if (Array.isArray(x)) x.forEach(recorre)
  else if (x && typeof x === 'object') Object.values(x).forEach(recorre)
})(json)

let fallos = 0
let hechos = 0
const comprobar = (nombre, ok, det = '') => { hechos++; if (!ok) { fallos++; if (fallos <= 25) console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }

// Todo lo que se lee o se anuncia dentro del contenedor: texto, aria-label, alt y <title> de los SVG.
const LEER = `(() => {
  const c = document.querySelector('#resultados')
  if (!c) return null
  const t = [c.innerText]
  for (const el of c.querySelectorAll('[aria-label],[alt],[title],title')) {
    for (const a of ['aria-label', 'alt', 'title']) if (el.getAttribute && el.getAttribute(a)) t.push(el.getAttribute(a))
    if (el.tagName.toLowerCase() === 'title') t.push(el.textContent)
  }
  return { texto: t.join(' \\n '), bloques: c.querySelectorAll('article').length, rotulo: /DATOS DE EJEMPLO|EXAMPLE DATA/.test(c.innerText) }
})()`
// una cifra es un número suelto: los dígitos pegados a letras o guiones (TROP2, Nectin-4, B7-H3) no cuentan
const cifrasDe = (texto) => [...texto.replaceAll('⁠', '').matchAll(/(?<![\p{L}\p{N}\-‑_])\d[\d.,]*/gu)].map((m) => m[0].replace(/[.,]+$/, ''))
const ajenas = (texto) => cifrasDe(texto).filter((c) => !permitidas.has(c))

const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
try {
  for (const [lg, ruta] of [['es', '/celula-a-celula'], ['en', '/en/cell-by-cell']]) {
    /* 1 · sin demo, nada */
    await nav.cargar(ruta)
    comprobar(`[${lg}] sin demo: no existe el contenedor de resultados`, (await nav.evaluate(LEER)) === null)
    comprobar(`[${lg}] sin demo: ni rastro (ancla, bloques ni rótulo)`, await nav.evaluate(`!document.querySelector('#resultados, .blq, .cel-cielo') && !/DATOS DE EJEMPLO|EXAMPLE DATA/.test(document.body.textContent)`))
    comprobar(`[${lg}] sin demo: el estado sigue diciendo que todavía no`, await nav.evaluate(`/todavía no|not yet/i.test(document.querySelector('.cel-estado')?.textContent ?? '')`))
    comprobar(`[${lg}] sin demo: el estado no enlaza a unos resultados que no existen`, await nav.evaluate(`!document.querySelector('a[href="#resultados"]')`))

    /* 2 · con demo, cada cifra está en el JSON */
    await nav.cargar(`${ruta}?demo=1`)
    for (let i = 0; i < 40 && !(await nav.evaluate(`!!document.querySelector('#resultados')`)); i++) await nav.sleep(100)
    const d = await nav.evaluate(LEER)
    comprobar(`[${lg}] demo: aparece el contenedor`, !!d)
    if (d) {
      comprobar(`[${lg}] demo: salen los bloques del JSON`, d.bloques === Object.keys(json.bloques).length, `salen ${d.bloques}, el JSON trae ${Object.keys(json.bloques).length}`)
      comprobar(`[${lg}] demo: lleva el rótulo de datos de ejemplo`, d.rotulo)
      const c = cifrasDe(d.texto)
      comprobar(`[${lg}] demo: hay cifras que cotejar`, c.length > 20, `solo ${c.length}`)
      comprobar(`[${lg}] demo: toda cifra pintada está en el JSON`, ajenas(d.texto).length === 0, `ajenas: ${JSON.stringify([...new Set(ajenas(d.texto))])}`)
      console.log(`  [${lg}] ${c.length} cifras cotejadas en ${d.bloques} bloques`)

      /* 3 · el detector detecta */
      comprobar(`[${lg}] el detector caza una cifra inventada`, ajenas(`${d.texto} 7 de cada 100`).includes('7') && ajenas(`${d.texto} 4.321`).includes('4.321'))
      comprobar(`[${lg}] el detector ignora los símbolos de gen`, ajenas('Nectin-4 B7-H3 SSTR2 TROP2').length === 0)
    }
  }
} finally {
  await nav.cerrar()
}
console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
