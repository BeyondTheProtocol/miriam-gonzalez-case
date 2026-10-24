// Texto que de verdad sale de los componentes base (sistema v3, revisión de la fase DS), sobre el build ESTÁTICO.
//
// Por qué existe: Vue compila con `whitespace: 'condense'` y elimina el espacio que es el primer o el último hijo de un
// <span> o de un <template>. Dato pintaba «1.234unidades», Referencia «ejemplo.Revista de ejemplo» y el aviso sr-only de
// «pestaña nueva» salía como «Externa(se abre…)». Se veía en la captura y en `textContent`, no en ningún lint de CSS. R11 de
// `pnpm test:diseno` atrapa el patrón en el código; este test mira el TEXTO RESULTANTE de la guía viva, que es lo que lee un
// lector de pantalla. Un margen de CSS no cuenta: el espacio tiene que ser texto (un `\s` de JS incluye el &nbsp;).
//
// Sin baseline: si falla, falla. Mira solo la guía viva (`/guia-de-estilo`), que pinta los componentes reales con datos de ejemplo.
//
//   pnpm exec nuxt generate && pnpm test:componentes-texto
import { existsSync } from 'node:fs'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

/** Corre dentro de la página. Cada comprobación devuelve la lista de lo que la incumple. */
const COMPROBAR = `(() => {
  const txt = (e) => (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70)
  const fallos = []
  const cuenta = { dato_unidad: 0, referencia: 0, sr_only: 0 }

  // Dato: entre el valor y la unidad hay un espacio de TEXTO.
  for (const u of document.querySelectorAll('.dato__unidad')) {
    cuenta.dato_unidad++
    if (!/^\\s/.test(u.textContent || '')) fallos.push('Dato: la unidad «' + txt(u) + '» empieza sin espacio, sale pegada al valor (' + txt(u.parentElement) + ')')
  }

  // Referencia: espacio de texto antes de la revista y antes del DOI.
  for (const r of document.querySelectorAll('.referencia')) {
    cuenta.referencia++
    const em = r.querySelector('em')
    if (em && !/\\s$/.test(em.previousSibling?.textContent || '')) fallos.push('Referencia: la revista sale pegada al título (' + txt(r) + ')')
    const doi = r.querySelector('a.referencia__doi')
    if (doi && !/\\s$/.test(doi.previousSibling?.textContent || '')) fallos.push('Referencia: el DOI sale pegado a la cita (' + txt(r) + ')')
  }

  // El aviso sr-only de «pestaña nueva» empieza por un espacio, en cualquier componente base que lo lleve.
  for (const s of document.querySelectorAll('.dato .sr-only, .referencia .sr-only, .tarjeta-enlace .sr-only')) {
    cuenta.sr_only++
    if (!/^\\s/.test(s.textContent || '')) fallos.push('Aviso sr-only sin espacio inicial: «' + txt(s.parentElement) + '»')
  }
  return { fallos, cuenta }
})()`

/** Canario del autor: marcado ROTO (lo que producía Vue al eliminar el espacio). Si el comprobador no lo marca, el test es decorativo. */
const SEMBRAR_ROTO = `(() => {
  const d = document.createElement('div')
  d.id = 'canario-roto'
  d.innerHTML = '<div class="dato"><p class="dato__valor"><span>1.234</span><span class="dato__unidad">unidades</span></p></div>'
    + '<p class="referencia"><span class="referencia__cita">Autoría (2000). Título.<em>Revista</em>.</span>'
    + '<a class="referencia__doi" href="#">doi:10.0000/x<span class="sr-only">(se abre en una pestaña nueva)</span></a></p>'
  document.body.appendChild(d)
})()`
const DEFECTOS_SEMBRADOS = 4 // unidad pegada, revista pegada, DOI pegado, aviso sr-only pegado

if (!existsSync(ROOT)) {
  console.error('No existe .output/public: corre antes `pnpm exec nuxt generate`.')
  process.exit(2)
}

const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
let res, canario
try {
  await nav.cargar('/guia-de-estilo')
  res = await nav.evaluate(COMPROBAR)
  await nav.evaluate(SEMBRAR_ROTO)
  canario = await nav.evaluate(COMPROBAR)
} finally {
  await nav.cerrar()
}

// Canario: el comprobador tiene que marcar los defectos sembrados (y solo esos: lo real de la guía ya salió limpio o con sus fallos arriba).
const detectados = canario.fallos.length - res.fallos.length
if (detectados < DEFECTOS_SEMBRADOS) {
  console.log(`✘ El comprobador es decorativo: de ${DEFECTOS_SEMBRADOS} defectos sembrados solo marcó ${detectados}.\n${canario.fallos.map((f) => `   ${f}`).join('\n')}`)
  process.exit(1)
}

// Si la guía deja de pintar alguno de los tres componentes, el test no puede dar verde por no haber mirado nada.
const vacio = Object.entries(res.cuenta).filter(([, n]) => n === 0).map(([k]) => k)
if (vacio.length) {
  console.log(`✘ La guía viva no pinta ${vacio.join(', ')}: el test no comprobaría nada. Recuento: ${JSON.stringify(res.cuenta)}`)
  process.exit(1)
}
if (res.fallos.length) {
  console.log(res.fallos.map((f) => `✘ ${f}`).join('\n'))
  console.log(`\n${res.fallos.length} fallo(s).`)
  process.exit(1)
}
console.log(`✔ test:componentes-texto  Dato ${res.cuenta.dato_unidad} · Referencia ${res.cuenta.referencia} · sr-only ${res.cuenta.sr_only} · canario: ${detectados} de ${DEFECTOS_SEMBRADOS} defectos sembrados marcados`)
process.exit(0) // el servidor estático del arnés puede dejar el proceso vivo (conexiones abiertas)
