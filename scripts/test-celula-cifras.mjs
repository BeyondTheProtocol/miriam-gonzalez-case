#!/usr/bin/env node
// Test de cifras de /celula-a-celula: lo que la página PINTA como resultado tiene que estar en
// public/celula/resultados.json, que a su vez solo lleva las cifras del texto aprobado por Miriam.
//
// Qué coteja, con Chrome por CDP sobre el build estático (ES y EN, sin ?demo):
//   1. salen los cinco bloques aprobados (R0, R3, R4, R5, R6) y en ese orden; NO sale el censo (R1),
//      ni rótulo de ejemplo; el estado ya no dice «todavía no» y enlaza a #resultados;
//   2. CADA cifra de su texto, de sus aria-label y de sus <title> está en el JSON (en formato ES o
//      EN). Se ignoran los dígitos pegados a letras o guiones (símbolos de gen: 5T4, HER3, NY-BR-1);
//   3. las cuadrículas pintan exactamente los rellenos que dice el JSON (50, 50, 25, 25 y ninguno en
//      R4), R5 y R6 no pintan ninguna cifra y R6 ningún porcentaje;
//   4. el detector funciona: si se inyecta una cifra que no está en el JSON, lo avisa (si no, un
//      verde aquí no significaría nada).
// Qué NO cotejo: la puerta (verificado + OK) y el contrato del fichero; eso es test:celula-puerta.
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
})([json.bloques, json.por_cada])

let fallos = 0
let hechos = 0
const comprobar = (nombre, ok, det = '') => { hechos++; if (!ok) { fallos++; if (fallos <= 25) console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }

// Por bloque: todo lo que se lee o se anuncia (texto, aria-label, alt, <title> de los SVG) y lo que se dibuja.
const LEER = `(() => {
  const c = document.querySelector('#resultados')
  if (!c) return null
  const leer = (raiz) => {
    const t = [raiz.innerText]
    for (const el of raiz.querySelectorAll('[aria-label],[alt],[title],title')) {
      for (const a of ['aria-label', 'alt', 'title']) if (el.getAttribute && el.getAttribute(a)) t.push(el.getAttribute(a))
      if (el.tagName.toLowerCase() === 'title') t.push(el.textContent)
    }
    return t.join(' \\n ')
  }
  return {
    texto: leer(c),
    rotulo: /DATOS DE EJEMPLO|EXAMPLE DATA/.test(c.innerText),
    bloques: [...c.querySelectorAll('article')].map((a) => ({
      clave: a.getAttribute('data-bloque'),
      texto: leer(a),
      rejillas: [...a.querySelectorAll('svg.rej')].map((s) => ({ total: s.querySelectorAll('circle').length, rellenos: s.querySelectorAll('circle.on').length, contorno: s.querySelectorAll('.contorno').length })),
    })),
  }
})()`
// una cifra es un número suelto: los dígitos pegados a letras o guiones (5T4, HER3, NY-BR-1) no cuentan
const cifrasDe = (texto) => [...texto.replaceAll('⁠', '').matchAll(/(?<![\p{L}\p{N}\-‑_])\d[\d.,]*(?![\p{L}])/gu)].map((m) => m[0].replace(/[.,]+$/, ''))
const ajenas = (texto) => cifrasDe(texto).filter((c) => !permitidas.has(c))
const sinSello = (texto) => texto.replace(/verificado|verified/g, '')

const ESPERADO = Object.keys(json.bloques) // orden del JSON = orden de la página (R0, R3, R4, R5, R6)
const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
try {
  for (const [lg, ruta] of [['es', '/celula-a-celula'], ['en', '/en/cell-by-cell']]) {
    await nav.cargar(ruta)
    const d = await nav.evaluate(LEER)
    comprobar(`[${lg}] aparece el contenedor de resultados`, !!d)
    if (!d) continue

    /* 1 · qué bloques salen */
    const claves = d.bloques.map((b) => b.clave)
    comprobar(`[${lg}] salen los bloques del JSON, en orden`, JSON.stringify(claves) === JSON.stringify(ESPERADO), `salen ${claves}, el JSON trae ${ESPERADO}`)
    comprobar(`[${lg}] salen exactamente R0, R3, R4, R5 y R6`, JSON.stringify(claves) === '["R0","R3","R4","R5","R6"]')
    comprobar(`[${lg}] no sale el censo (R1)`, !claves.includes('R1') && !/censo|census/i.test(d.texto))
    comprobar(`[${lg}] sin rótulo de datos de ejemplo`, !d.rotulo && !(await nav.evaluate(`/DATOS DE EJEMPLO|EXAMPLE DATA/.test(document.body.textContent)`)))
    comprobar(`[${lg}] el estado ya no dice «todavía no»`, await nav.evaluate(`!/todavía no|not yet/i.test(document.querySelector('.cel-estado')?.textContent ?? '') && !!document.querySelector('.cel-estado')`))
    comprobar(`[${lg}] el estado enlaza a los resultados`, await nav.evaluate(`!!document.querySelector('.cel-estado a[href="#resultados"]')`))
    comprobar(`[${lg}] la página ya no dice que no hay resultados`, await nav.evaluate(`!/Todavía no hay resultados|There are no results yet/.test(document.body.textContent)`))

    /* 2 · cada cifra está en el JSON */
    const c = cifrasDe(sinSello(d.texto))
    comprobar(`[${lg}] hay cifras que cotejar`, c.length >= 8, `solo ${c.length}`)
    comprobar(`[${lg}] toda cifra pintada está en el JSON`, ajenas(d.texto).length === 0, `ajenas: ${JSON.stringify([...new Set(ajenas(d.texto))])}`)
    const R = (k) => d.bloques.find((b) => b.clave === k)
    const f = (n) => miles(n, lg === 'en' ? ',' : '.')
    comprobar(`[${lg}] R0 pinta las dos cifras de células`, R('R0') && R('R0').texto.includes(f(json.bloques.R0.datos.muestras.higado.celulas)) && R('R0').texto.includes(f(json.bloques.R0.datos.muestras.hueso.celulas)))

    /* 3 · las figuras pintan lo que dice el JSON y nada más */
    const r3 = R('R3')
    const dianas = json.bloques.R3.datos.muestras
    const rellenosR3 = r3.rejillas.map((q) => q.rellenos)
    const esperado = [...dianas.higado.dianas.flatMap((g, i) => [g.por_100, dianas.hueso.dianas[i].por_100]), ...json.bloques.R3.datos.ausentes.map((a) => a.por_100)]
    comprobar(`[${lg}] R3 pinta las cuadrículas de cada 100 que dice el JSON`, JSON.stringify(rellenosR3) === JSON.stringify(esperado) && r3.rejillas.every((q) => q.total === json.por_cada), `pinta ${rellenosR3}, JSON ${esperado}`)
    const r4 = R('R4')
    comprobar(`[${lg}] R4: una cuadrícula, ningún punto relleno y un contorno «menos de 1»`, r4.rejillas.length === 1 && r4.rejillas[0].rellenos === 0 && r4.rejillas[0].contorno === 1 && /(menos de|fewer than) 1\b/.test(r4.texto))
    comprobar(`[${lg}] R5 no pinta ninguna cifra`, cifrasDe(sinSello(R('R5').texto)).length === 0, JSON.stringify(cifrasDe(sinSello(R('R5').texto))))
    comprobar(`[${lg}] R6 no pinta ninguna cifra ni porcentaje`, cifrasDe(sinSello(R('R6').texto)).length === 0 && !/%|de cada|in every|per cent|percent/i.test(R('R6').texto), JSON.stringify(cifrasDe(sinSello(R('R6').texto))))
    comprobar(`[${lg}] R6 nombra los rasgos neuroendocrinos (CHGA, SYP, INSM1)`, ['CHGA', 'SYP', 'INSM1'].every((g) => R('R6').texto.includes(g)))

    console.log(`  [${lg}] ${c.length} cifras cotejadas en ${d.bloques.length} bloques`)

    /* 4 · el detector detecta */
    comprobar(`[${lg}] el detector caza una cifra inventada`, ajenas(`${d.texto} 7 de cada 100`).includes('7') && ajenas(`${d.texto} 4.321`).includes('4.321'))
    comprobar(`[${lg}] el detector ignora los símbolos de gen`, ajenas('Nectin-4 B7-H3 SSTR2 TROP2 5T4 HER3 NY-BR-1 INSM1 FGFR1').length === 0)
  }
} finally {
  await nav.cerrar()
}
console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
