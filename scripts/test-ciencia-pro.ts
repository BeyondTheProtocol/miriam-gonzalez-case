// /ciencia como UNA sola capa, la profesional, y lo que se movió con ella (tanda 2 del rediseño, T2c, 24-oct-2026), sobre el sitio YA
// generado (.output/public). Lo que mira el HTML que ve el lector, no el fuente: un texto bien escrito en el i18n pero que no llega a la
// página (o que llega partido por un glosario) no lo atrapa ningún test del fuente.
//
//  1. El estado clínico se LEE de caso.json (utils/casoCiencia.ts), no se escribe: la ficha, el material, «Actualizado el» y «en cuarta línea
//     desde…». Y es FAIL-CLOSED: si el caso deja de estar en cuarta línea, la frase desaparece en vez de seguir diciendo lo que ya no es verdad.
//  2. /ciencia: sin conmutador, los bloques en su orden, la franja de herramientas (#mapa-acceso) con UNA «Todas las herramientas», el botón
//     de donar (único coral), los cinco ejes con su enlace a una sección que existe en /ciencia/evidencia, y nada del FAQ ni del JSON-LD
//     escritos a mano.
//  3. Los textos clínicos corregidos son los LITERALES del comité médico (C1 a C6, E1, E2, E6 y E7), en español, y el inglés dice lo mismo.
//  4. Las seis deudas del cotejo no vuelven en NINGUNA página generada (el patrón es la clase, no el ejemplo: scripts/lib/deudas-clinicas.mjs).
//  5. /datos recibe la historia de tratamientos (con la dosis de la RT y la UCI, que solo vivían ahí) y el PET con Galio-68.
//  6. La Cronología lleva los hitos del 19-jun y del 8-jul con lo que decidió Miriam, sin decir que el mapa eligiera la lesión.
//  7. /videos apunta a un ancla que existe.
//  8. La página en inglés no lleva palabras en español fuera de comillas, y ningún <template #slot> de i18n-t lleva texto fijo de un solo
//     idioma (la clase del fallo «ignoring the neuroendocrino component» en /en/science, 24-oct-2026).
//  9. «Explicado sin tecnicismos» (fase «llano» de la tanda 3, 25-oct-2026): la capa llana de /ciencia, arriba. Cuatro preguntas con los literales de
//     voz-miriam, la cuarta con la fecha de caso.json (y sin tratamiento si el caso deja de estar en cuarta línea: fail-closed), el enlace «Ir al detalle
//     profesional» ANTES de la hoja profesional, y la ruta dentro del bloque.
// 10. El esquema del tumor (TumorEsquema, fase «esquema» de la tanda 3, 25-oct-2026), entre las cuatro respuestas y la ruta: cero texto dentro de
//     los SVG, RB1 y ESR1 solo en el panel de la sangre, ninguna cifra clínica escrita a mano (todo sale del i18n, que es el literal del cotejo de
//     `verificacion`), una sola fuente por glifo y fail-closed con los bloques R4, R5 y R6 de /celula-a-celula. Con canarios: cada freno se prueba
//     contra una copia rota a propósito, porque un test que pasa con el código roto es decorativo.
//
// Uso:  pnpm exec nuxt generate && pnpm test:ciencia-pro   (CI: .github/workflows/e2e.yml)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import caso from '../app/data/caso.json'
import { cuartaLineaDe, fechaDia, leerCasoCiencia } from '../app/utils/casoCiencia'
import { msFecha } from '../app/utils/datosCaso'
import { formatearFechaCambio } from '../app/utils/fechaCambio'
import { HERRAMIENTAS } from '../app/utils/navegacion'
import { fechaEstado } from '../app/utils/celulaResultados'
import { gota, membranaPath, partirCifra, receptorDeMembrana } from '../app/utils/esquemaTumor'
import { DEUDAS } from './lib/deudas-clinicas.mjs'
import { ESQUEMA_LITERALES } from './lib/esquema-tumor-literales.mjs'

const PUB = '.output/public'
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }
if (!existsSync(PUB)) { console.error(`❌ no existe ${PUB}: ejecuta antes \`pnpm exec nuxt generate\``); process.exit(1) }

const html = (r: string) => readFileSync(join(PUB, r), 'utf-8')
const limpio = (r: string) => html(r).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
const decodifica = (x: string) =>
  x.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
const texto = (trozo: string) => decodifica(trozo.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const principal = (r: string) => limpio(r).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? ''
const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
const sinMarcas = (s: string) => s.replace(/\s+/g, ' ').trim()

const P = {
  es: { ciencia: 'ciencia.html', evidencia: 'ciencia/evidencia.html', datos: 'datos.html', timeline: 'timeline.html', prensa: 'prensa.html' },
  en: { ciencia: 'en/science.html', evidencia: 'en/science/evidence.html', datos: 'en/data.html', timeline: 'en/timeline.html', prensa: 'en/press.html' },
} as const

// ── Los textos clínicos LITERALES del comité médico (24-oct-2026). Única copia de la verdad de este test: el i18n tiene que decir esto.
const C = {
  c1: 'En la biopsia diagnóstica de 2024, el 80 % de las células neoplásicas expresaban cromogranina y sinaptofisina (CD56 negativo); en la revisión del mismo bloque en 2026 la expresión es focal y heterogénea, y los marcadores aparecen también en el hueso (sinaptofisina) y en el hígado (cromogranina A y sinaptofisina), sin porcentaje.',
  c2: 'La clasificación de la OMS de 2019 reserva «neoplasia neuroendocrina de mama» para los tumores con más del 90 % de células neuroendocrinas; este es un carcinoma NST con diferenciación neuroendocrina, que queda fuera de esa categoría y se trata con las guías del cáncer de mama luminal. La evidencia sobre su pronóstico es retrospectiva y no coincide entre series; ninguna cohorte publicada es de estadio IV de novo en premenopáusicas. En esta web lo llamamos BC-NED como etiqueta de trabajo, no como categoría diagnóstica.',
  c3: 'FGFR1: 13 copias en el primario de 2024 (TSO500; el remitente estimó un 75 % de tumor y el laboratorio avisa de que el número de copias no es fiable por debajo del 50 %; VIGex midió un 50 % en el mismo bloque). En el hueso de 2026 el informe clínico de FoundationOne CDx dice «amplificación de FGFR1» sin cifra; las 33 copias de FGFR1 y 37 del clúster 11q13 salen del fichero de investigación de ese análisis («for research use only», pureza computacional 61 %). Plataformas, muestras y purezas distintas: la amplificación es firme, las cifras no se comparan entre sí.',
  c3Fgfr1: '13 copias (primario 2024) · amplificado (hueso 2026; 33 copias en el fichero de investigación)',
  c3Ccnd1: '20 y 18 copias (primario 2024) · amplificado (hueso 2026; 37 en el fichero de investigación)',
  c4: 'Ese informe recoge la sinaptofisina dos veces («heterogénea» y «negativa»). La laminilla se revisó en una reunión del 29 de septiembre de 2026 y, según lo dicho en ella, confirma la expresión; no hay informe escrito de esa revisión ni petición de aclaración al hospital. Aquí se usa «heterogénea», con esa reserva.',
  c5_3L: 'por RECIST 1.1 era enfermedad estable (suma de las cuatro dianas 68 → 74 mm, +8,8 %, sin lesiones nuevas: hígado s.II 18 → 20 y s.IVb 15 → 19, mama 14 → 15, vértebra dorsal 21 → 20), pero las lesiones hepáticas crecían con empeoramiento de la función hepática y el CA 15-3 pasó de 145 a 509,5 U/mL.',
  c5_4L: 'Línea basal RECIST del ensayo (6 de octubre de 2026): hígado s.II 27 mm, hígado s.VII 18 mm, mama 10 mm; suma 55 mm. No se compara con la del ensayo anterior: otro centro y otra basal.',
  c5_ficha: 'de una lesión de unos 2,2 cm del segmento IVa; el informe',
  c6_28may: 'El fulvestrant sigue hasta el 28/05/2026; la goserelina continúa.',
  c6_3L: 'Fulvestrant + BG-75202 (inhibidor de KAT6A/B), ensayo de fase 1a/1b, con goserelina de fondo',
  c6_4L: 'Goserelina de fondo (última dosis documentada: 08/09/2026); ácido zoledrónico 4 mg cada 3 meses previsto desde el 2.º ciclo.',
  e1: "En cuarta línea desde el 7 de octubre de 2026: datopotamab deruxtecan 6 mg/kg cada 3 semanas en TROPION-Breast06 (Vall d'Hebron); el curso clínico documenta la inclusión y pauta el primer ciclo ese día.",
  e2: 'PD-L1 CPS 0 en el primario (2024) y en la biopsia hepática (22C3, informe del 25-09-2026)',
  e6: 'sin marcadores NE en el informe',
  e7: 'TROP-2 → Dato-DXd (en curso desde el 7-oct-2026)',
  e5: 'Objetivo: una terapia diseñada sobre el perfil de este tumor (N-of-1), decidida por su equipo médico.',
}

// ═══ 1 · caso.json es la fuente del estado, y es fail-closed ═══
console.log('\n1. El estado se lee de caso.json')
{
  const c = caso as any
  const es = leerCasoCiencia(c, 'es'), en = leerCasoCiencia(c, 'en')
  ok(es.actualizado === c.actualizado && /^\d{4}-\d{2}-\d{2}$/.test(es.actualizado), `la fecha de la página es la de caso.json (${es.actualizado})`)
  ok(es.filas.map((f) => f.clave).join() === 'diagnostico,histologia,estadio' && es.receptores.map((r) => r.marcador).join() === 'RE,RP,HER2 IHC,Ki67', 'la ficha trae diagnóstico, histología, estadio y los cuatro receptores, con las palabras de caso.json')
  ok(es.material.length === 2 && en.material.length === 2 && /^Hueso, ilion derecho$/.test(es.material[0]!.muestra) && /^Hígado, segmento IVa$/.test(es.material[1]!.muestra) && es.material.every((m) => m.sello === 'verificado'), `el material de la ficha: solo el verificado, hueso e hígado (${es.material.map((m) => m.muestra).join(' · ')}); la mama, con ubicación deducida, va con su sello en /datos`)
  ok(es.peticiones.length === 5, `las peticiones son las 5 públicas (lista blanca), no las 7 de caso.json (${es.peticiones.length})`)
  ok(!JSON.stringify(es).includes('error del informe') && !JSON.stringify(en).includes('error in the report'), 'lo que lee la ficha NO incluye `detalle` (el de la sinaptofisina contaba la revisión de la laminilla como hecho verificado)')
  const hoy = msFecha(String(c.generado).slice(0, 10))
  ok(es.cuartaLinea?.larga === '7 de octubre de 2026' && es.cuartaLinea?.corta === '7-oct-2026' && en.cuartaLinea?.larga === '7 October 2026' && en.cuartaLinea?.corta === '7 Oct 2026', `la cuarta línea empieza el ${es.cuartaLinea?.larga} / ${en.cuartaLinea?.larga}, leído de lineas[4L].inicio`)
  // fail-closed: terminada la 4L, o con una 5L en curso, la frase desaparece
  const terminada = (c.lineas as any[]).map((l) => (l.id === '4L' ? { ...l, fin: '2026-10-20' } : l))
  ok(cuartaLineaDe(terminada, hoy, 'es') === null, 'si la 4L termina, `cuartaLinea` es null: la página no pinta «en cuarta línea desde…»')
  const cinco = [...(c.lineas as any[]).map((l) => (l.id === '4L' ? { ...l, fin: '2026-10-14' } : l)), { id: '5L', tratamiento: { es: 'x' }, inicio: '2026-10-15', fin: null }]
  ok(cuartaLineaDe(cinco, hoy, 'es') === null, 'si la 4L termina y empieza una 5L, `cuartaLinea` es null (la línea actual ya no es la cuarta)')
  // El estado «TROP-2 en uso / en curso» no vive en frases fijas: la ficha («Dianas») y la nota de los ejes lo dicen solo si `cuartaLinea` existe.
  // Test de invariante estructural a propósito (mira el fuente): lo que se aprieta es QUIÉN pinta la frase de estado, no el texto.
  const vue = readFileSync('app/pages/ciencia/index.vue', 'utf-8')
  const ESTADO = /en curso|en uso|va a usarse|under way|in use|is going to be used/i
  for (const loc of ['es', 'en'] as const) ok(!ESTADO.test(t(loc, 'ciencia.snapshot_target')) && !ESTADO.test(t(loc, 'ciencia.axes_note')) && !ESTADO.test(t(loc, 'ciencia.axes_note_cierre')) && ESTADO.test(t(loc, 'ciencia.axes_note_uso')), `(${loc}) «snapshot_target», «axes_note» y «axes_note_cierre» no dicen si TROP-2 está en uso; solo «axes_note_uso» lo dice`)
  ok(/caso\.value\?\.cuartaLinea \? t\('ciencia\.axes_note_uso'\)/.test(vue) && (vue.match(/axes_note_uso/g)?.length ?? 0) === 1, 'la frase «Solo el eje TROP-2 está en uso» se pinta solo si `caso.cuartaLinea` existe, y desde un único sitio')
  // «Explicado sin tecnicismos»: la 4.ª respuesta nombra el tratamiento de hoy, así que (como «Solo el eje TROP-2 está en uso») solo se pinta con la
  // cuarta línea viva; si no, la versión sin tratamiento. Invariante estructural a propósito (mira el fuente): QUIÉN decide cuál se pinta, y que la
  // versión de reserva no pueda nombrar el tratamiento.
  for (const loc of ['es', 'en'] as const) ok(/\{desde\}/.test(t(loc, 'ciencia.llano.q4_a')) && !/\{/.test(t(loc, 'ciencia.llano.q4_a_sin_linea')) && !/Dato-DXd|TROPION|datopotamab/i.test(t(loc, 'ciencia.llano.q4_a_sin_linea')), `(${loc}) «llano.q4_a» lleva {desde}; «q4_a_sin_linea» no lleva fecha ni nombra Dato-DXd ni TROPION`)
  ok(/desde \? t\('ciencia\.llano\.q4_a', \{ desde \}\) : t\('ciencia\.llano\.q4_a_sin_linea'\)/.test(vue) && /const desde = caso\.value\?\.cuartaLinea\?\.larga/.test(vue), 'la 4.ª respuesta usa la fecha de `caso.cuartaLinea` y cae a «q4_a_sin_linea» sin ella (fail-closed)')
  ok(fechaDia('2026-10', 'es') === null && fechaDia('2026-13-01', 'es') === null && fechaDia('', 'es') === null && fechaDia('2026-10-07', 'es') !== null, 'una fecha de mes o año sueltos, o imposible, no es «desde el …»')
}

// ═══ 2 · /ciencia ═══
for (const loc of ['es', 'en'] as const) {
  console.log(`\n2. /ciencia (${loc})`)
  const f = P[loc].ciencia
  const h = limpio(f)
  const main = principal(f)
  const txt = texto(main)
  ok((main.match(/<h1\b/g)?.length ?? 0) === 1, `${f}: un solo <h1>`)
  ok(!/reading-level|NivelLectura|data-nivel/i.test(h), `${f}: sin conmutador de nivel`)
  ok(!/twofaces|two-faces/i.test(h) && !/"@type":"Question"/.test(html(f)) && !/FAQPage/.test(html(f)), `${f}: sin TwoFaces ni FAQ escrito a mano`)
  const ld = [...html(f).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!).join('\n')
  ok(/MedicalCondition/.test(ld) && !/cribado|screening|×13|ultra-?raro|ultra-?rare|~80/i.test(ld), `${f}: el JSON-LD de la condición se genera de caso.json y no dice «cribado», «×13», «ultra-raro» ni «~80»`)
  // orden de los bloques (ids de sus títulos)
  const IDS = ['ciencia-llano', 'ruta-title', 'ciencia-busca', 'mapa-acceso', 'snapshot-title', 'por-que-no-encaja', 'tejido-3veces', 'molecular-profile-title', 'axes-title', 'panel-title', 'ciencia-pro-help-title']
  const pos = IDS.map((id) => h.indexOf(`id="${id}"`))
  ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${f}: orden Explicado sin tecnicismos → La ruta → Qué buscamos → Herramientas → De un vistazo → Por qué no encaja → Patología → Perfil molecular → Ejes → Panel → cierre (${pos.join(' < ')})`)
  ok(IDS.every((id) => (h.match(new RegExp(`\\bid="${id}"`, 'g'))?.length ?? 0) === 1), `${f}: cada id de bloque aparece una sola vez`)
  ok(/<h2\b[^>]*\bid="mapa-acceso"/.test(h) && /<h2\b[^>]*\bid="snapshot-title"/.test(h), `${f}: #mapa-acceso y #snapshot-title (las anclas de los enlaces antiguos) son los <h2> de su bloque`)
  // ── «Explicado sin tecnicismos» (zona A2): la capa llana, arriba. Los literales son los de voz-miriam (ciencia.llano.* en el i18n); la fecha de la
  // cuarta respuesta es la de caso.json.
  {
    const cl = leerCasoCiencia(caso as any, loc).cuartaLinea
    const iLlano = h.indexOf('id="ciencia-llano"')
    const iHoja = h.indexOf('id="detalle-profesional"')
    const zona = h.slice(iLlano, iHoja)
    // Las cuatro respuestas son las del <ul class="ci-llano">: la zona entera lleva además el esquema del tumor, cuyo h3 no es una respuesta.
    const iLista = zona.indexOf('class="ci-llano"')
    const lista = iLista >= 0 ? zona.slice(iLista, zona.indexOf('</ul>', iLista)) : ''
    const qa = [...lista.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => [texto(m[1]!), texto(m[2]!)] as const)
    const esperadas = (['q1', 'q2', 'q3', 'q4'] as const).map((id) => [t(loc, `ciencia.llano.${id}_q`), id === 'q4' ? t(loc, 'ciencia.llano.q4_a').replace('{desde}', cl?.larga ?? '') : t(loc, `ciencia.llano.${id}_a`)] as const)
    ok(iLlano >= 0 && iHoja > iLlano && /<h2\b[^>]*\bid="ciencia-llano"/.test(h) && texto(h.slice(iLlano, iLlano + 400)).includes(t(loc, 'ciencia.llano.titulo')), `${f}: «${t(loc, 'ciencia.llano.titulo')}» es el <h2> de la banda llana y va antes de la hoja profesional`)
    ok(texto(h.slice(h.lastIndexOf('<section', iLlano), iLlano)).includes(t(loc, 'ciencia.level_simple')), `${f}: el rótulo de la banda, encima del titular, es «${t(loc, 'ciencia.level_simple')}» (clave publicada)`)
    ok(qa.length === 4 && qa.every((x, i) => x[0] === sinMarcas(esperadas[i]![0]) && x[1] === sinMarcas(esperadas[i]![1])), `${f}: las cuatro preguntas y sus respuestas, literales de voz-miriam${qa.length === 4 ? '' : ` (hay ${qa.length})`}`)
    ok(!!cl && qa[3]?.[1].includes(cl.larga) && /Dato-DXd/.test(qa[3]![1]) && /TROPION-Breast06/.test(qa[3]![1]), `${f}: la 4.ª respuesta nombra Dato-DXd y TROPION-Breast06 con la fecha de la cuarta línea de caso.json (${cl?.larga ?? 'sin 4L'})`)
    // El enlace va ANTES de la hoja profesional (el 62 % que pasaba a la capa profesional no tiene que cruzar el bloque) y lleva a «Qué buscamos»
    const enlaceIr = [...zona.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].find((m) => texto(m[2]!).includes(t(loc, 'ciencia.llano.ir_detalle')))
    ok(!!enlaceIr && enlaceIr[1] === (loc === 'es' ? '/ciencia#ciencia-busca' : '/en/science#ciencia-busca') && zona.indexOf(enlaceIr[0]) < zona.indexOf('class="ci-llano"'), `${f}: «${t(loc, 'ciencia.llano.ir_detalle')}» va bajo el titular, antes de las preguntas, hacia #ciencia-busca (${enlaceIr?.[1] ?? 'no está'})`)
    ok(zona.includes('id="ruta-title"') && zona.indexOf('id="ruta-title"') > zona.indexOf('class="ci-llano"'), `${f}: la ruta (#ruta-title, ancla del botón de la home) está dentro del bloque llano, debajo de las preguntas`)
    // La ruta NO repite el tratamiento de hoy con la línea «Ahora»: la 4.ª respuesta ya lo cuenta en llano (y la hoja profesional lo dice en `notaEjes`)
    const rutaTxt = texto(zona.slice(zona.indexOf('id="ruta-title"')))
    ok(rutaTxt.length > 0 && !/En cuarta línea desde|In fourth line since|datopotamab|\b(Ahora|Now):/i.test(rutaTxt), `${f}: la ruta de la banda llana no lleva la línea «Ahora» (el tratamiento de hoy ya lo dice la 4.ª respuesta)`)
    // Invariante estructural del índice pegajoso: la hoja profesional NO cuelga de una Banda (su overflow:hidden anula el sticky)
    ok(/<\/section>\s*<section\s+$/.test(zona) && /<section\b[^>]*\bid="detalle-profesional"[^>]*>/.test(h), `${f}: la banda llana se cierra antes de la hoja profesional (el índice pegajoso no queda dentro de una Banda)`)
    ok(!/<button\b/.test(zona), `${f}: el bloque llano no lleva glosario en línea (un botón de 24 px; el sistema pide 44)`)
    ok(!/dos caras|dos enfermedades a la vez|two faces|two diseases at once|previsto|expected to start|está previsto/i.test(texto(zona)), `${f}: el bloque llano no repite el copy viejo («dos caras», «dos enfermedades a la vez», «previsto en octubre»)`)
    // La mama en célula a célula NO está verificada (lo publicado son dos muestras: hígado y hueso): ninguna respuesta lo dice
    ok(!qa.some((x) => /(mama|breast)[^.]{0,60}(célula a célula|cell by cell)|(célula a célula|cell by cell)[^.]{0,60}(mama|breast)/i.test(x[1])), `${f}: ninguna respuesta dice que la mama se lea célula a célula (solo hígado y hueso)`)
  }
  // Qué buscamos: 3 peticiones (laboratorio, HLA, IHQ), con el botón de escribir y el enlace a todas
  const busca = h.slice(h.indexOf('id="ciencia-busca"'), h.indexOf('id="mapa-acceso"'))
  ok((busca.match(/<li\b/g)?.length ?? 0) === 3, `${f}: «Qué buscamos» enseña 3 peticiones (${busca.match(/<li\b/g)?.length ?? 0})`)
  ok(busca.includes(loc === 'es' ? 'href="/contacto?role=researcher"' : 'href="/en/contact?role=researcher"') && busca.includes(loc === 'es' ? 'href="/datos#que-buscamos"' : 'href="/en/data#que-buscamos"'), `${f}: «Escribir al equipo» (rol researcher) y «Ver todo lo que buscamos» → /datos#que-buscamos`)
  // Herramientas: una tarjeta por herramienta visible, la línea de /caso y UNA «Todas las herramientas»
  const herr = h.slice(h.indexOf('id="mapa-acceso"'), h.indexOf('id="snapshot-title"'))
  const enlacesHerr = [...herr.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1]!, txt: texto(m[2]!) }))
  const todas = enlacesHerr.filter((e) => e.txt.includes(t(loc, 'nav.all_tools')))
  ok(todas.length === 1 && todas[0]!.href === (loc === 'es' ? '/herramientas' : '/en/tools'), `${f}: «${t(loc, 'nav.all_tools')}» una vez, hacia el índice (${todas.map((e) => e.href).join(', ') || 'no está'})`)
  ok(enlacesHerr.length - 1 >= HERRAMIENTAS.length - 1 && enlacesHerr.length - 1 <= HERRAMIENTAS.length, `${f}: una tarjeta por herramienta (el explorador solo con su puerta abierta): ${enlacesHerr.length - 1} de ${HERRAMIENTAS.length}`)
  ok(texto(herr).includes('helpmiriam.com/caso'), `${f}: conserva la línea «Compártelo… helpmiriam.com/caso»`)
  // Ficha: viene de caso.json
  const L = leerCasoCiencia(caso as any, loc)
  const ficha = texto(h.slice(h.indexOf('id="snapshot-title"'), h.indexOf('id="por-que-no-encaja"')))
  ok(L.filas.every((r) => ficha.includes(r.valor)) && L.receptores.every((r) => ficha.includes(r.valor)) && L.material.every((m) => ficha.includes(m.muestra) && ficha.includes(m.donde)), `${f}: la ficha dice lo que caso.json (diagnóstico, histología, estadio, receptores y material con su «dónde está»)`)
  ok(!/Estado 2026|Status 2026|ECOG 0 ·/.test(ficha), `${f}: la ficha no lleva estado escrito a mano («Estado 2026»)`)
  // «Actualizado el …»: la fecha de caso.json, con el MISMO formateador y la misma frase que ActualizadoEl (nada de una fecha escrita en el test)
  const esperadoFecha = t(loc, 'page.updated').replace('{date}', formatearFechaCambio((caso as any).actualizado, loc))
  ok(esperadoFecha.length > 12 && txt.includes(esperadoFecha), `${f}: dice «${esperadoFecha}», la fecha de caso.json`)
  // La página en inglés no lleva español fuera de comillas. La clase del fallo: un slot de i18n-t con el literal en español (en /en/science
  // salía «ignoring the neuroendocrino component»). Lo entrecomillado puede ser español a propósito (se cita un informe tal cual).
  if (loc === 'en') {
    const fueraDeCitas = txt.replace(/«[^»]*»|“[^”]*”|"[^"]{0,200}"/g, ' ')
    const espanol = fueraDeCitas.match(/\bneuroendocrin(?:o|a|os|as)\b/i)
    ok(!espanol, `${f}: sin «neuroendocrino» (con o final) fuera de comillas${espanol ? `; sale «…${fueraDeCitas.slice(Math.max(0, espanol.index! - 30), espanol.index! + 40)}…»` : ''}`)
  }
  ok(!/Última actualización: 29|Last updated: 29|septiembre de 2026\.? *$/m.test(txt) && !/al día de septiembre|current as of September/i.test(html(f)), `${f}: sin fecha de septiembre escrita a mano (ni en la página ni en la meta description)`)
  // Donar: UN botón coral en la zona de cierre
  const botones = [...main.matchAll(/<a\b[^>]*\bclass="[^"]*\bbtn-cta\b[^"]*"[^>]*>/g)].map((m) => m[0])
  ok(botones.length === 1 && /href="https:\/\/gofund\.me\//.test(botones[0]!) && /rel="noopener noreferrer"/.test(botones[0]!), `${f}: un solo botón de donar (btn-cta) a GoFundMe, con rel noopener noreferrer`)
  ok(h.indexOf('btn-cta') > h.indexOf('id="ciencia-pro-help-title"'), `${f}: el botón de donar va en el cierre profesional`)
  // Ejes: cinco, el primero con la fecha de caso.json, cada uno con su enlace a /evidencia#ancla que EXISTE
  const ejes = h.slice(h.indexOf('id="axes-title"'), h.indexOf('id="panel-title"'))
  const evid = [...ejes.matchAll(/href="([^"]*\/(?:ciencia|science)\/(?:evidencia|evidence)#([a-z0-9-]+))"/g)]
  ok(evid.length === 5, `${f}: cinco ejes con su enlace a la evidencia (${evid.length})`)
  const hEv = html(P[loc].evidencia)
  ok(evid.every((m) => new RegExp(`<section\\b[^>]*\\bid="${m[2]}"`).test(hEv)), `${f}: cada ancla (${evid.map((m) => m[2]).join(', ')}) es el id de una sección de ${P[loc].evidencia}`)
  // Panel: solo «qué responde»; nada de estado ni de material a mano
  const panel = h.slice(h.indexOf('id="panel-title"'), h.indexOf('id="ciencia-pro-help-title"'))
  ok(!/Primeros resultados \(octubre|Material en el laboratorio|No posible hoy|Hecho \(julio|Pendiente: aún|First results \(October|Not possible today|Material at the lab/i.test(texto(panel)) && !/Ahora: el laboratorio|Now: Paloma Cejas/.test(texto(panel)), `${f}: el panel no lleva columnas de estado ni la frase «Ahora: …» escritas a mano`)
  // El enlace de la fila que lo lleva (single-cell RNA-seq) va en su propio bloque: a 1280 la tabla no se pinta como tarjetas y, en línea y sin espacio, se pegaba al final de la frase.
  const enlacesPanel = [...panel.matchAll(/<a\b[^>]*\bclass="[^"]*\blink-action\b[^"]*"[^>]*>/g)]
  const enBloque = [...panel.matchAll(/<span class="block[^"]*"[^>]*>\s*<a\b[^>]*\bclass="[^"]*\blink-action\b/g)]
  ok(enlacesPanel.length >= 2 && enBloque.length === 1, `${f}: el enlace de la fila del panel va en su propio bloque (${enBloque.length} envuelto; ${enlacesPanel.length} enlaces de acción en la sección)`)
  ok(!/[^>\s]<a\b[^>]*\bclass="[^"]*\blink-action\b/.test(panel), `${f}: ningún enlace del panel empieza pegado a la letra de delante (la regresión de «…cada unaLos primeros resultados…»)`)
  // Con la 4L viva (caso.json), la nota de los ejes lleva su frase de estado y la ficha no la repite fija
  const notaEjes = texto(ejes.slice(ejes.indexOf('ci-nota-eje')))
  ok(notaEjes.includes(t(loc, 'ciencia.axes_note')) && notaEjes.includes(t(loc, 'ciencia.axes_note_uso')) && notaEjes.includes(t(loc, 'ciencia.axes_note_cierre')), `${f}: la nota de los ejes lleva sus tres frases mientras el caso está en cuarta línea`)
  ok(/<th[^>]*>\s*(Qué responde|What it answers)/.test(panel) && !/(Método|Method)\s*<\/th>/.test(panel), `${f}: el panel tiene la columna «${t(loc, 'ciencia.panel_col_responde')}» y no la de método`)
}

// ═══ 3 · los textos clínicos corregidos, en el HTML ═══
console.log('\n3. Los textos clínicos corregidos (C1 a C6, E1, E2, E5, E6, E7)')
{
  const es = texto(limpio(P.es.ciencia).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '')
  const en = texto(limpio(P.en.ciencia).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '')
  ok(es.includes(C.c1), 'C1 (ES): el 80 % de las células neoplásicas en 2024; focal y heterogénea en 2026')
  ok(es.includes(C.c2), 'C2 (ES): la OMS 2019, el carcinoma NST y el pronóstico retrospectivo, con BC-NED como etiqueta de trabajo')
  ok(es.includes(C.c3), 'C3 (ES): la nota de unidades de FGFR1 y CCND1, literal')
  ok(es.split(C.c3).length - 1 === 1, 'C3: la nota de unidades sale UNA sola vez')
  ok(es.includes(C.c3Fgfr1) && es.includes(C.c3Ccnd1), 'C3 (ES): las celdas de FGFR1 y de CCND1/FGF3/4/19, literales')
  ok(es.includes(C.c4), 'C4 (ES): la laminilla del 29-sep es «dicha», sin informe escrito')
  ok(es.includes(C.c5_ficha) && !es.includes('no es una de las lesiones diana'), 'C5 (ES): la lesión hepática biopsiada, sin el paréntesis del RECIST')
  ok(es.includes(C.e2), 'E2 (ES): PD-L1 CPS 0 en el primario y en la biopsia hepática')
  ok(es.includes(C.e6), 'E6 (ES): el informe de MD Anderson no trae marcadores neuroendocrinos')
  ok(es.includes(C.e7), 'E7 (ES): el primer eje, «en curso desde el 7-oct-2026»')
  // Una sola vez: en la fila TROP-2 de la hoja profesional. La banda llana (4.ª respuesta, en llano) NO la repite bajo la ruta: era el mismo hecho con otro nombre.
  ok(es.includes(C.e1) && es.split(C.e1).length - 1 === 1, 'E1 (ES): la frase de la cuarta línea, literal, una sola vez (fila TROP-2); la ruta de la banda llana no la repite')
  ok(es.includes(C.e5), 'E5 (ES): el objetivo N-of-1 (la frase de la gate G1: pendiente de la firma del comité médico y de Miriam)')
  ok(!/previsto desde octubre|previsto para octubre|Está en cribado|en cribado para|en curso desde oct/.test(es), 'E1 (ES): ningún «cribado» ni «previsto para octubre»')
  ok(es.includes('no fueron accesibles entonces (faltaba tejido para fabricar); no están cerrados de forma definitiva y se siguen revisando'), 'E4 (ES): los ensayos de vacuna de junio no fueron accesibles, no están cerrados')
  ok(/Hoy el caso está en el paso 2/.test(es), 'E1 (ES): el paso de hoy de la ruta («paso 2») sale de rutaPasos.ts')
  // EN: dice lo mismo (traducción de un literal; pendiente de `verificacion`)
  for (const [n, re] of [
    ['C1', /80% of the neoplastic cells expressed chromogranin and synaptophysin \(CD56 negative\).*focal and heterogeneous/],
    ['C2', /2019 WHO classification reserves .{1,5}neuroendocrine neoplasm of the breast.{1,5} for tumors with more than 90% neuroendocrine cells.*no published cohort is de novo stage IV in premenopausal patients/],
    ['C3', /13 copies in the 2024 primary.*not reliable below 50%.*33 copies of FGFR1 and 37 of the 11q13 cluster.*computational purity 61%.*the figures are not comparable with each other/],
    ['C4', /no written report of that review and no request for clarification to the hospital/],
    ['E1', /In fourth line since 7 October 2026: datopotamab deruxtecan 6 mg\/kg every 3 weeks in TROPION-Breast06/],
    ['E2', /PD-L1 CPS 0 in the primary \(2024\) and in the liver biopsy \(22C3, report of 25-09-2026\)/],
    ['E6', /no NE markers in the report/],
    ['E7', /TROP-2 → Dato-DXd \(under way since 7 Oct 2026\)/],
  ] as const) ok(re.test(en), `${n} (EN): dice lo mismo`)
}

// ═══ 4 · las seis deudas no vuelven en NINGUNA página generada ═══
console.log('\n4. Ninguna página generada repite las seis deudas del cotejo')
{
  const paginas: string[] = []
  const recorre = (dir: string) => { for (const n of readdirSync(join(PUB, dir))) { const rel = join(dir, n); if (statSync(join(PUB, rel)).isDirectory()) { if (!/^(_nuxt|_ipx|__|_i18n|_og|celula|laminillas|videos|img)/.test(n)) recorre(rel) } else if (n.endsWith('.html')) paginas.push(rel) } }
  recorre('')
  const malas: string[] = []
  for (const f of paginas) {
    const visible = texto(limpio(f))
    for (const d of DEUDAS) { const m = visible.match(d.re); if (m) malas.push(`${f}: «${m[0]}» → ${d.id}`) }
  }
  ok(paginas.length > 30, `se revisaron ${paginas.length} páginas generadas`)
  ok(malas.length === 0, `ninguna cae en las seis deudas${malas.length ? ` (${malas.slice(0, 6).join(' · ')})` : ''}`)
}

// ═══ 5 · /datos: la historia de tratamientos y el PET ═══
for (const loc of ['es', 'en'] as const) {
  console.log(`\n5. /datos (${loc}): historia de tratamientos y PET con Galio-68`)
  const f = P[loc].datos
  const h = limpio(f)
  const ciencia = parse(readFileSync(`content/${loc}/science.yml`, 'utf-8')) as { treatments: { line: string; regimen: string; outcome: string }[]; imaging: { title: string; date: string; quote?: string; meaning: string; caveat?: string } }
  const historia = h.match(/<details\b[^>]*\bid="s-historia"[\s\S]*?<\/details>/)?.[0] ?? ''
  const pet = h.match(/<details\b[^>]*\bid="s-pet"[\s\S]*?<\/details>/)?.[0] ?? ''
  const th = texto(historia), tp = texto(pet)
  ok(historia.length > 0 && pet.length > 0, `${f}: hay un <details> #s-historia y otro #s-pet`)
  ok(ciencia.treatments.every((x) => th.includes(sinMarcas(x.regimen)) && th.includes(sinMarcas(x.outcome))), `${f}: las ${ciencia.treatments.length} líneas de la historia, tal cual (régimen y resultado, palabra por palabra)`)
  ok(/30 Gy/.test(th) && (loc === 'es' ? /diez días en UCI/ : /ten days in ICU/).test(th), `${f}: conserva la dosis de la radioterapia sobre L3 (30 Gy) y los días de UCI, que no viven en ningún otro sitio`)
  if (loc === 'es') {
    ok(th.includes(C.c5_3L) && th.includes(C.c5_4L), `${f}: C5 (RECIST de la 3L con las cuatro dianas; la línea basal de la 4L)`)
    ok(th.includes(C.c6_28may) && th.includes(C.c6_3L) && th.includes(C.c6_4L), `${f}: C6 (la goserelina continúa; fase 1a/1b, KAT6A/B; goserelina y zoledronato en la 4L)`)
  } else {
    ok(/by RECIST 1\.1 it was stable disease \(sum of the four target lesions 68 → 74 mm/.test(th) && /sum 55 mm/.test(th), `${f}: C5 (EN)`)
    ok(/Fulvestrant continues until 28 May 2026; goserelin continues/.test(th) && /KAT6A\/B inhibitor\), phase 1a\/1b trial, with background goserelin/.test(th), `${f}: C6 (EN)`)
  }
  ok(tp.includes(sinMarcas(ciencia.imaging.title)) && tp.includes(sinMarcas(ciencia.imaging.date)) && (!ciencia.imaging.quote || tp.includes(sinMarcas(ciencia.imaging.quote))) && tp.includes(sinMarcas(ciencia.imaging.meaning)), `${f}: el PET con Galio-68 con su título, su fecha, la cita del informe y su significado`)
  ok(/<details\b[^>]*\bid="s-historia"[^>]*>(?![\s\S]*?\bopen\b)/.test(historia.slice(0, 200)), `${f}: la historia va plegada (cerrada de entrada)`)
  ok((h.match(/<nav class="dt-barra"[\s\S]*?<\/nav>/)?.[0].match(/class="dt-chip"/g)?.length ?? 0) === 6, `${f}: la barra de secciones sigue en 6 chips (los plegables no suman chip)`)
}

// ═══ 6 · Cronología ═══
for (const loc of ['es', 'en'] as const) {
  console.log(`\n6. /timeline (${loc})`)
  const f = P[loc].timeline
  const tl = texto(limpio(f))
  const frases = loc === 'es'
    ? ['Lo hace para llevar a sus médicos una pregunta mejor tras la biopsia de abril sin tumor: dónde volver a pinchar.', 'La lesión fue el ilion derecho. La lente del mapa, sin validar, ya puntuaba alto el ilíaco derecho.']
    : ['She does it to bring her doctors a better question after the April biopsy that found no tumor: where to biopsy again.', 'The lesion was the right ilium. The map’s lens, not validated, had already scored the right iliac high.']
  ok(frases.every((x) => tl.includes(x.replace('’', "'")) || tl.includes(x)), `${f}: los hitos del 19-jun (el mapa, para llevar una pregunta mejor) y del 8-jul (el ilion derecho y la lente del mapa)`)
  // el hito del 8-jul no dice que la lesión se eligiera por el mapa
  const hitos = limpio(f).split(/<li\b/).map((x) => texto(x))
  const julio = hitos.find((x) => x.includes(loc === 'es' ? 'Primera biopsia ósea con tumor viable' : 'First bone biopsy with viable tumour')) ?? ''
  ok(julio.length > 200 && !/por (eso|el mapa)|gracias al mapa|elegid[ao]|se eligió|because of the map|chosen|was chosen|selected/i.test(julio), `${f}: el hito del 8-jul no dice que la lesión se eligiera por el mapa`)
  ok(!/FGFR1[^.]{0,40}×\s?\d/.test(tl) && /13 (copias|copies)/.test(tl), `${f}: la cronología dice las copias (13, 20 y 18), no «×13»`)
}

// ═══ 7 · /videos: el ancla de destino existe ═══
console.log('\n7. /videos → /prensa#video')
for (const loc of ['es', 'en'] as const) ok(/\bid="video"/.test(limpio(P[loc].prensa)), `${P[loc].prensa}: tiene id="video" (el destino de ${loc === 'es' ? '/videos' : '/en/videos'})`)

// ═══ 8 · ningún slot de i18n-t lleva texto fijo de un solo idioma ═══
// Test de invariante estructural a propósito (mira el fuente, sin build): un <template #x>texto</template> dentro de un <i18n-t> pinta ese texto
// en ES y en EN. Solo vale si es lo mismo en los dos idiomas (siglas, nombres de gen); una palabra común va con `L('es', 'en')` o con `$t()`.
console.log('\n8. Slots de i18n-t con texto fijo')
{
  const NEUTROS = new Set(['luminal', 'FGFR1', 'CCND1', 'BC-NED', 'SSTR+', 'PRRT']) // iguales en español y en inglés
  const SLOT_FIJO = () => /<template\s+#([\w-]+)>([^<>{}]+)<\/template>/g
  const fijos: string[] = []
  const recorre = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      if (statSync(p).isDirectory()) recorre(p)
      else if (n.endsWith('.vue')) for (const m of readFileSync(p, 'utf-8').matchAll(SLOT_FIJO())) { const lit = m[2]!.trim(); if (lit && !NEUTROS.has(lit)) fijos.push(`${p}: #${m[1]} → «${lit}»`) }
    }
  }
  recorre('app')
  ok(fijos.length === 0, `ningún slot de i18n-t lleva una palabra fija de un solo idioma${fijos.length ? ` (${fijos.join(' · ')})` : ''}`)
  ok(SLOT_FIJO().test('<template #neuroendocrino>neuroendocrino</template>') && !SLOT_FIJO().test("<template #neuroendocrino>{{ L('neuroendocrino', 'neuroendocrine') }}</template>"), 'canario: el patrón casa con el slot fijo y no con el localizado')
}

// ═══ 10 · el esquema del tumor (TumorEsquema, fase «esquema» de la tanda 3, 25-oct-2026) ═══
// Las dos revisiones devuelven la lista de PROBLEMAS (vacía si todo está bien). Cada una se prueba dos veces: contra lo real (tiene que salir limpia) y
// contra copias rotas a propósito (cada una tiene que salir con algún problema): «canario del autor», porque un test que pasa con el código roto es
// decorativo. `revisaFuente` mira el fuente (sin build); `revisaHtml`, la página generada (lo que ve el lector).
console.log('\n10. El esquema del tumor (TumorEsquema)')
{
  const NS = { es: D.es.esquemaTumor, en: D.en.esquemaTumor } as Record<'es' | 'en', Record<string, any>>
  const LIT = ESQUEMA_LITERALES as { titulo: Record<string, string>; lede: Record<string, string>; cifras: Record<string, string[]>; limites: Record<string, Record<string, string>> }
  // Genes y siglas clínicas: en el componente y en la geometría NO se escribe ninguna (el texto vive en el i18n, cotejado contra los informes).
  const GENES = /\b(?:RB1|ESR1|FGFR1|CCND1|FGF3|FGF4|FGF19|PIK3CA|SSTR2|DLL3|INSM1|CHGA|SYP)\b/i
  const RB1_ESR1 = /\b(?:RB1|ESR1)\b/
  // Lo que la figura NO dice (cotejo y diseno): «dos caras», «escapa por el otro», «→ PRRT», «sin diana», «dianas para atacar», «se está perdiendo»,
  // «el 80 % del tumor» y «×N». Va aquí y no en las deudas compartidas (scripts/lib/deudas-clinicas.mjs) porque las claves muertas `twofaces.*` y
  // `pathways.brief_points` del i18n todavía llevan «dos biologías» y pondrían en rojo `test:afirmaciones-clinicas` sin que se pueda arreglar sin borrarlas.
  const PROHIBIDO = /dos biolog[ií]as|two biologies|dos caras|two faces|escapa por el otro|escapes? through the other|dos poblaciones|two populations|\bPRRT\b|sin diana|dianas? para atacar|se est[aá] perdiendo|being lost|80\s?%\s*(?:del\s+tumor|of the tumou?r)|(?:FGFR1|CCND1|FGF3)[^\n]{0,20}(?:×|(?<![A-Za-z0-9&#])x)\s?\d|×/i
  const ESPANOL = /\b(?:del|los|las|una|pero|aunque|también|hígado|mama|sangre|copias|rasgos|células|tumoral|lectura|lecturas|tinción|sin|según)\b/i
  const sinCom = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\w'"`])\/\/[^\n]*/g, '$1')
  const trozo = (src: string, tag: string) => src.match(new RegExp(`^<${tag}\\b[^>]*>([\\s\\S]*?)^</${tag}>`, 'm'))?.[1] ?? ''

  // ── El fuente: la plantilla no lleva texto propio, el script no lleva cifras, el estilo solo roles, y la puerta es R4, R5 y R6 ──
  const revisaFuente = (vue: string, ts: string): string[] => {
    const p: string[] = []
    const v = sinCom(vue), u = sinCom(ts)
    const tpl = trozo(v, 'template'), scr = trozo(v, 'script'), sty = trozo(v, 'style')
    if (!tpl || !scr || !sty) p.push('no encuentro template, script y style en TumorEsquema.vue')
    if (/(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i.test(v) || /\b(?:rgba?|hsla?)\(\s*\d/.test(v)) p.push('color escrito a mano (hex, rgb o hsl): solo roles del sistema')
    for (const [re, que] of [
      [/Caveat/, 'la fuente Caveat'],
      [/<text\b|<tspan\b|<foreignObject\b/i, 'texto dentro de un SVG'],
      [/<button\b/i, 'un <button> (el bloque llano no los lleva)'],
      [/twofaces|two-faces/i, 'algo de twofaces'],
      [/v-reveal/, 'v-reveal (la Banda ya lo lleva)'],
      [/transition|animation|@keyframes/i, 'movimiento propio'],
    ] as const) if (re.test(v)) p.push(`lleva ${que}`)
    if (GENES.test(v) || GENES.test(u)) p.push('un gen o una sigla clínica escrita en el componente o en la geometría (el texto va en el i18n)')
    const suelto = tpl.replace(/\{\{[\s\S]*?\}\}/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    if (suelto) p.push(`texto escrito en la plantilla: «${suelto.slice(0, 40)}»`)
    const malas = [...tpl.matchAll(/\{\{\s*([\s\S]*?)\s*\}\}/g)].map((m) => m[1]!).filter((e) => !/^(?:\$t\('(?:esquemaTumor|sectionNav\.ciencia)\.[\w.]+'\)|[a-z]\w*(?:\.\w+)?)$/.test(e))
    if (malas.length) p.push(`interpolación que no es una clave del i18n ni un dato de la lista: ${malas.slice(0, 2).join(' · ')}`)
    const cadenas = [...scr.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g), ...u.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]!)
    const clinicas = cadenas.filter((c) => /%|×|copias|copies|\bx\s?\d/i.test(c))
    if (clinicas.length) p.push(`cadena con cifra o «copias» escrita a mano: «${clinicas[0]}»`)
    if (!(/useCelulaResultados\(\)/.test(scr) && /\['R4', 'R5', 'R6'\]/.test(scr) && /reales\.value\.includes/.test(scr) && /<section\s+v-if="abierta"/.test(tpl))) p.push('la figura no es fail-closed con los bloques R4, R5 y R6')
    const definidos = new Set([...tpl.matchAll(/<symbol :id="`\$\{uid\}-(\w+)`"/g)].map((m) => m[1]!))
    const usados = [...tpl.matchAll(/sym\('(\w+)'\)/g)].map((m) => m[1]!)
    if (!definidos.size || !usados.length || usados.some((n) => !definidos.has(n))) p.push('un glifo se usa sin su <symbol> (una sola fuente por glifo)')
    // El glifo de «cambios» (`fragmento`): un aro partido en DOS arcos con DOS huecos, girado. Con un solo hueco (con o sin trozo suelto) se leía como la
    // letra «C» («C'» a 20 px; «C)» pegado a «Cambios»): falló dos veces seguidas, a ojo. Es un test de FORMA a propósito (invariante estructural, como
    // tests/test_fuga.sh): fija la geometría del <symbol>, no el aspecto. Con huecos sobre los ejes (arriba y abajo) los dos arcos se leen «( )».
    const simF = tpl.match(/<symbol :id="`\$\{uid\}-fragmento`"[^>]*>([\s\S]*?)<\/symbol>/)?.[1] ?? ''
    const angulo = (x: string, y: string) => ((Math.atan2(Number(y) - 12, Number(x) - 12) * 180) / Math.PI + 360) % 360
    const arcosF = [...simF.matchAll(/<path\s+d="M([\d.]+) ([\d.]+) A([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+)"/g)].map((m) => {
      const a0 = angulo(m[1]!, m[2]!), a1 = angulo(m[5]!, m[6]!)
      return { a0, a1, tramo: (a1 - a0 + 360) % 360 }
    })
    const piezasF = (simF.match(/<(?:path|circle|ellipse|rect|line|polyline|polygon|use)\b/g) ?? []).length
    const [f1, f2] = arcosF
    const huecosF = f1 && f2 ? [(f2.a0 - f1.a1 + 360) % 360, (f1.a0 - f2.a1 + 360) % 360] : []
    const centrosF = f1 && f2 ? [(f1.a1 + huecosF[0]! / 2) % 360, (f2.a1 + huecosF[1]! / 2) % 360] : []
    const sobreEje = (c: number) => Math.min(c % 90, 90 - (c % 90)) < 15
    const finoF = piezasF === 2 && arcosF.length === 2 && arcosF.every((a) => a.tramo >= 100 && a.tramo <= 170) && huecosF.length === 2 && huecosF.every((h) => h >= 30) && centrosF.length === 2 && !centrosF.some(sobreEje)
    if (!finoF) p.push('el glifo «fragmento» no es un aro partido en dos arcos de 100° a 170° con dos huecos de 30° o más, fuera de los ejes (un arco con un solo hueco se lee «C»)')
    const medias = [...sty.matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1]!.trim())
    if (!medias.length || medias.some((m) => m !== '(min-width: 1024px)')) p.push(`la composición cambia por debajo de lg (@media: ${medias.join(', ') || 'ninguno'}): mobile-first`)
    return p
  }
  const vue = readFileSync('app/components/TumorEsquema.vue', 'utf-8')
  const tsSrc = readFileSync('app/utils/esquemaTumor.ts', 'utf-8')
  const rompe = (src: string, de: string, a: string) => { if (!src.includes(de)) throw new Error(`canario mal hecho: no encuentro «${de.slice(0, 50)}»`); return src.replace(de, a) }
  const pf = revisaFuente(vue, tsSrc)
  ok(pf.length === 0, `TumorEsquema.vue y utils/esquemaTumor.ts: sin texto ni cifras a mano, sin colores propios, sin texto en SVG, puerta R4+R5+R6, un symbol por glifo, mobile-first${pf.length ? ` (${pf.join(' · ')})` : ''}`)
  const canariosFuente: [string, () => string[]][] = [
    ['texto dentro de un SVG', () => revisaFuente(rompe(vue, '<path :d="GOTA_PATH" class="te__gota" />', '<path :d="GOTA_PATH" class="te__gota" /><text>x</text>'), tsSrc)],
    ['una cifra escrita en la plantilla', () => revisaFuente(rompe(vue, `<p class="te__nota">{{ $t('esquemaTumor.nota') }}</p>`, '<p class="te__nota">13 copias</p>'), tsSrc)],
    ['una interpolación con literal', () => revisaFuente(rompe(vue, `{{ $t('esquemaTumor.nota') }}`, `{{ 'hola' }}`), tsSrc)],
    ['un hex en el estilo', () => revisaFuente(rompe(vue, '.te__fragmento { fill: var(--texto-3); }', '.te__fragmento { fill: #2d1b3d; }'), tsSrc)],
    ['la puerta sin R6', () => revisaFuente(rompe(vue, "['R4', 'R5', 'R6']", "['R4', 'R5']"), tsSrc)],
    ['un gen en una clase de la plantilla', () => revisaFuente(rompe(vue, 'class="te__membrana"', 'class="te__membrana rb1"'), tsSrc)],
    ['un @media por debajo de lg', () => revisaFuente(rompe(vue, '@media (min-width: 1024px)', '@media (min-width: 640px)'), tsSrc)],
    ['un símbolo que no existe', () => revisaFuente(rompe(vue, `sym('fragmento')`, `sym('inexistente')`), tsSrc)],
    ['un botón', () => revisaFuente(rompe(vue, '<p class="eyebrow te__eyebrow">', '<button>x</button><p class="eyebrow te__eyebrow">'), tsSrc)],
    ['el glifo de cambios con un solo arco (la «C»)', () => revisaFuente(rompe(vue, '<path d="M7.18 6.25 A7.5 7.5 0 0 1 19.47 12.65" class="te__g-fragmento" />', ''), tsSrc)],
    ['el glifo de cambios de 161deac (un hueco y un trozo suelto: «C\')»)', () => revisaFuente(rompe(rompe(vue, '<path d="M16.82 17.75 A7.5 7.5 0 0 1 4.53 11.35" class="te__g-fragmento" />', '<path d="M15 6.6 A7 7 0 1 0 15 17.4" class="te__g-fragmento" />'), '<path d="M7.18 6.25 A7.5 7.5 0 0 1 19.47 12.65" class="te__g-fragmento" />', '<path d="M20.5 8.8 Q22.6 12 20.5 15.2" class="te__g-fragmento" />'), tsSrc)],
    ['el glifo de cambios con los huecos casi cerrados (5°)', () => revisaFuente(rompe(vue, 'M16.82 17.75 A7.5 7.5 0 0 1 4.53 11.35', 'M16.82 17.75 A7.5 7.5 0 0 1 6.70 6.70'), tsSrc)],
    ['el glifo de cambios con los huecos arriba y abajo (se lee «( )»)', () => revisaFuente(rompe(rompe(vue, 'M16.82 17.75 A7.5 7.5 0 0 1 4.53 11.35', 'M8.83 18.80 A7.5 7.5 0 0 1 8.83 5.20'), 'M7.18 6.25 A7.5 7.5 0 0 1 19.47 12.65', 'M15.17 5.20 A7.5 7.5 0 0 1 15.17 18.80'), tsSrc)],
    ['una cadena clínica en la geometría', () => revisaFuente(vue, `${tsSrc}\nexport const MAL = '13 copias'\n`)],
    ['un gen en la geometría', () => revisaFuente(vue, `${tsSrc}\nexport const MAL = 'FGFR1'\n`)],
  ]
  for (const [que, f] of canariosFuente) {
    let r: string[] = []
    try { r = f() } catch (e) { r = []; ok(false, `canario del fuente «${que}»: ${(e as Error).message}`); continue }
    ok(r.length > 0, `canario del fuente: con «${que}» el test se pone ROJO`)
  }

  // ── La geometría: pura y determinista, y las cifras se pintan tal cual (cabeza + separador + resto = la fila exacta) ──
  {
    const a = JSON.stringify([gota(), membranaPath(), receptorDeMembrana(15, 1.4)])
    ok(a === JSON.stringify([gota(), membranaPath(), receptorDeMembrana(15, 1.4)]), 'utils/esquemaTumor: determinista (la misma entrada da el mismo dibujo: el HTML estático y el cliente coinciden)')
    const g = gota()
    ok(g.arcos.length === 2 && g.puntos.length >= 55 && g.puntos.length <= 62, `la gota lleva unos 60 fragmentos: ${g.puntos.length} normales y ${g.arcos.length} con cambio`)
    ok(g.arcos.every((x) => g.puntos.every((y) => Math.hypot(x.x - y.x, x.y - y.y) >= 11)), 'los dos fragmentos con cambio no se pisan con ningún punto')
    const filas = [...LIT.cifras.es!, ...LIT.cifras.en!]
    const partidas = filas.map((f) => partirCifra(f))
    ok(partidas.every((x, i) => x.cabeza + x.sep + x.resto === filas[i] && x.cabeza.length > 0 && x.resto.length > 0), 'partirCifra: las 30 filas (ES y EN) se parten en cabeza y resto sin perder ni cambiar una letra (también las que no llevan « · »: A2, A4, B6 y C2)')
  }

  // ── El i18n: es el literal del cotejo, ES y EN a la vez ──
  {
    const claves = (o: Record<string, unknown>) => Object.keys(o).sort().join()
    ok(claves(NS.es) === claves(NS.en), 'esquemaTumor.*: las mismas claves en ES y en EN')
    for (const loc of ['es', 'en'] as const) {
      const n = NS[loc]
      const todas = Object.values(n).flat() as unknown[]
      ok(todas.every((s) => typeof s === 'string' && s.trim() === s && s.length > 0), `(${loc}) ninguna cadena vacía, ni con espacios en los bordes`)
      ok(n.titulo === LIT.titulo[loc] && n.lede === LIT.lede[loc], `(${loc}) título y subtítulo: los literales del cotejo («${n.titulo}»)`)
      ok(Array.isArray(n.cifras) && n.cifras.length === 15 && n.cifras.every((c: string, i: number) => c === LIT.cifras[loc]![i]), `(${loc}) las 15 cifras (A1 a C4) son el literal del cotejo, fila a fila`)
      ok(Object.entries(LIT.limites[loc]!).every(([k, lit]) => n[`limite_${k}`] === lit) && Object.keys(LIT.limites[loc]!).length === 7, `(${loc}) los límites 2 a 8 son el literal del cotejo (el 2 lleva {fecha} y define Polaris; el 1 es la nota de la figura)`)
      ok(n.limite_2.includes('{fecha}') && !todas.some((s) => typeof s === 'string' && s !== n.limite_2 && /[{}]/.test(s)), `(${loc}) {fecha} solo en el límite 2 (la fecha sale de fechaEstado(), no escrita a mano)`)
      ok(!todas.some((s) => typeof s === 'string' && PROHIBIDO.test(s)), `(${loc}) el namespace no dice «dos caras», «dos biologías», «escapa por el otro», «PRRT», «sin diana», «se está perdiendo», «el 80 % del tumor» ni «×N»`)
      ok(!todas.some((s) => typeof s === 'string' && /[—–]/.test(s)), `(${loc}) sin guion largo en ningún texto`)
      // RB1 y ESR1 solo en la gota de sangre: ni en los textos de la célula ni en los del tumor, ni en los rótulos
      const sinSangre = Object.entries(n).filter(([k]) => !['alt_sangre', 'clave_sangre', 'cifras', 'limite_2', 'limite_3', 'limite_4', 'limite_5', 'limite_6', 'limite_7', 'limite_8'].includes(k)).flatMap(([, x]) => x as string[])
      ok(!sinSangre.some((s) => RB1_ESR1.test(String(s))) && RB1_ESR1.test(n.alt_sangre) && /\bRB1\b/.test(n.clave_sangre) && /\bESR1\b/.test(n.clave_sangre) && /\bESR1\b/.test(n.alt_sangre), `(${loc}) RB1 y ESR1 solo en los textos del panel de la sangre (alt y leyenda); ninguno en el tumor, la célula, el rótulo ni las notas`)
    }
    ok(!NS.en.cifras.concat(Object.values(NS.en).filter((x): x is string => typeof x === 'string')).some((s: string) => ESPANOL.test(s.replace(/«[^»]*»|"[^"]*"/g, ' '))), '(en) ninguna palabra en español fuera de comillas')
    ok(PROHIBIDO.test('Si se bloquea un lado, escapa por el otro') && PROHIBIDO.test('→ PRRT') && PROHIBIDO.test('FGFR1 ×13') && PROHIBIDO.test('el 80 % del tumor') && !PROHIBIDO.test(NS.es.cifras[11]) && !PROHIBIDO.test(NS.es.cifras[5]), 'canario: el patrón de frases retiradas casa con las malas y no con el literal corregido (80 % de las células tumorales; 13 copias)')
  }

  // ── El HTML generado ──
  const revisaHtml = (h: string, loc: 'es' | 'en'): string[] => {
    const p: string[] = []
    const n = NS[loc]
    const i = h.indexOf('aria-labelledby="te-titulo"')
    if (i < 0) return ['no está la sección del esquema (aria-labelledby="te-titulo")']
    const ini = h.lastIndexOf('<section', i)
    const sec = h.slice(ini, h.indexOf('</section>', i) + 10)
    const iLista = h.indexOf('class="ci-llano"'), iRuta = h.indexOf('id="ruta-title"')
    if (!(iLista >= 0 && ini > iLista && ini < iRuta)) p.push('el esquema no está entre las cuatro respuestas y la ruta')
    if ((h.match(/\bid="te-titulo"/g)?.length ?? 0) !== 1 || !/<h3\b[^>]*\bid="te-titulo"/.test(sec)) p.push('#te-titulo no es un único <h3>')
    if (texto(sec.match(/<h3\b[^>]*\bid="te-titulo"[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '') !== n.titulo) p.push('el <h3> no dice el título')
    const txt = texto(sec)
    for (const k of ['eyebrow', 'lede', 'nota', 'nota_procedencia', 'cifras_titulo', 'cifras_lead', 'limites_titulo', 'panel_tumor', 'panel_celula', 'panel_sangre', 'clave_luminal', 'clave_ne', 'clave_er', 'clave_her2', 'clave_copias', 'clave_sangre']) {
      if (!txt.includes(sinMarcas(n[k]))) p.push(`falta el texto «${k}»`)
    }
    const alts = [...sec.matchAll(/<svg\b[^>]*\brole="img"[^>]*>/g)].map((m) => decodifica(m[0].match(/aria-label="([^"]*)"/)?.[1] ?? ''))
    if (alts.join('|') !== [n.alt_tumor, n.alt_celula, n.alt_sangre].map(sinMarcas).join('|')) p.push(`los tres dibujos (role="img") y su texto alternativo no son los del i18n (hay ${alts.length})`)
    const pildoras = [...sec.matchAll(/<span\b[^>]*\bclass="[^"]*\bpill-data--neutral\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => texto(m[1]!))
    if (pildoras.join('|') !== [n.rotulo_esquema, n.rotulo_resultados].join('|')) p.push(`las dos píldoras no son «${n.rotulo_esquema}» y «${n.rotulo_resultados}» (hay ${pildoras.length})`)
    if (/<text\b|<tspan\b|<foreignObject\b/i.test(sec)) p.push('hay texto dentro de un SVG')
    if (/<button\b/i.test(sec)) p.push('hay un <button>')
    const iT = sec.indexOf('data-panel="tumor"'), iC = sec.indexOf('data-panel="celula"'), iS = sec.indexOf('data-panel="sangre"'), iPie = sec.indexOf('<figcaption')
    if (!(iT > 0 && iC > iT && iS > iC && iPie > iS)) p.push('los paneles no van en el orden tumor, célula, sangre y la nota')
    else {
      const sangre = sec.slice(iS, iPie)
      const fuera = sec.slice(sec.indexOf('<figure'), iS) + sec.slice(iPie, sec.indexOf('</figure>'))
      if (RB1_ESR1.test(fuera)) p.push('RB1 o ESR1 fuera del panel de la sangre (en el tumor, la célula, los rótulos o la nota)')
      if (!(/\bRB1\b/.test(sangre) && /\bESR1\b/.test(sangre))) p.push('el panel de la sangre no nombra RB1 y ESR1')
    }
    // Una sola fuente por glifo: el dibujo y la leyenda apuntan al MISMO <symbol>
    const simbolos = new Set([...sec.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]!))
    const usos = [...sec.matchAll(/<use\b[^>]*\bhref="#([^"]+)"/g)].map((m) => m[1]!)
    if (!usos.length || usos.some((u) => !simbolos.has(u))) p.push('un <use> apunta a un <symbol> que no existe')
    const dibujos = [...sec.matchAll(/<svg\b[^>]*\brole="img"[\s\S]*?<\/svg>/g)].map((m) => m[0]).join('')
    const leyendas = [...sec.matchAll(/<ul\b[^>]*\bclass="te__clave"[\s\S]*?<\/ul>/g)].map((m) => m[0]).join('')
    for (const g of ['er', 'her2', 'copias', 'fragmento']) {
      const id = [...simbolos].find((x) => x.endsWith(`-${g}`))
      if (!id || !dibujos.includes(`href="#${id}"`) || !leyendas.includes(`href="#${id}"`)) p.push(`el glifo «${g}» no es el mismo en el dibujo y en la leyenda`)
    }
    // Las cifras: 15 filas, el literal del cotejo, plegadas, con los dos enlaces a las tablas
    const det = sec.match(/<details\b[^>]*\bclass="desplegable te__cifras"[^>]*>([\s\S]*?)<\/details>/)
    if (!det) p.push('falta el desplegable de las cifras')
    else {
      if (/\bopen\b/.test(det[0].slice(0, det[0].indexOf('>') + 1))) p.push('el desplegable de las cifras va abierto de entrada')
      const filas = [...det[1]!.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => texto(m[1]!))
      const lit = LIT.cifras[loc]!.map(sinMarcas)
      const mala = filas.findIndex((f, k) => f !== lit[k])
      if (filas.length !== 15 || mala >= 0) p.push(`las 15 cifras no son el literal del cotejo (hay ${filas.length}${mala >= 0 ? `; la ${mala + 1} difiere: «${filas[mala]?.slice(0, 60)}»` : ''})`)
      if ((det[1]!.match(/<strong\b/g)?.length ?? 0) !== 15) p.push('cada cifra lleva su cabeza en negrita (15)')
      const base = loc === 'es' ? '/ciencia' : '/en/science'
      const hrefs = [...det[1]!.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]!)
      if (hrefs.join('|') !== `${base}#tejido-3veces|${base}#molecular-profile-title`) p.push(`los enlaces a las tablas: ${hrefs.join(', ') || 'no hay'}`)
    }
    // Los límites: 2 a 8, plegados, con la fecha del estado de /celula-a-celula
    const av = sec.match(/<details\b[^>]*\brole="note"[^>]*>[\s\S]*?<\/details>/)
    if (!av) p.push('falta el aviso «Lo que este esquema no dice»')
    else {
      if (/\bopen\b/.test(av[0].slice(0, av[0].indexOf('>') + 1))) p.push('el aviso de límites va abierto de entrada')
      const items = [...av[0].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => texto(m[1]!))
      const esperados = Object.keys(LIT.limites[loc]!).sort().map((k) => sinMarcas(LIT.limites[loc]![k]!.replace('{fecha}', fechaEstado(loc))))
      if (items.join('|') !== esperados.join('|')) p.push(`los límites 2 a 8 no son el literal del cotejo con la fecha de fechaEstado() (hay ${items.length})`)
    }
    return p
  }
  const tocaSec = (h: string, f: (s: string) => string) => {
    const i = h.indexOf('aria-labelledby="te-titulo"')
    if (i < 0) throw new Error('canario mal hecho: no hay sección')
    const a = h.lastIndexOf('<section', i), b = h.indexOf('</section>', i) + 10
    return h.slice(0, a) + f(h.slice(a, b)) + h.slice(b)
  }
  for (const loc of ['es', 'en'] as const) {
    const f = P[loc].ciencia
    const h = limpio(f)
    const pr = revisaHtml(h, loc)
    ok(pr.length === 0, `${f}: la figura va entre las cuatro respuestas y la ruta; 3 dibujos con su texto alternativo, 2 píldoras, cero texto en los SVG, RB1/ESR1 solo en la sangre, un símbolo por glifo, 15 cifras y 7 límites literales${pr.length ? ` (${pr.join(' · ')})` : ''}`)
    const n = NS[loc]
    const sinCifra = loc === 'es' ? ['100 % y 85 %', '100 % y 86 %'] : ['100% and 85%', '100% and 86%']
    const canariosHtml: [string, () => string[]][] = [
      ['sin la figura (puerta cerrada)', () => revisaHtml(tocaSec(h, () => ''), loc)],
      ['texto dentro de un SVG', () => revisaHtml(tocaSec(h, (s) => rompe(s, '<path d="M80 6', '<text>x</text><path d="M80 6')), loc)],
      ['RB1 en el texto alternativo de la célula', () => revisaHtml(tocaSec(h, (s) => rompe(s, n.alt_celula, `${n.alt_celula} RB1`)), loc)],
      ['ESR1 fuera de la sangre (en la leyenda de la célula)', () => revisaHtml(tocaSec(h, (s) => rompe(s, n.clave_copias, `${n.clave_copias} ESR1`)), loc)],
      ['sin ESR1 en la sangre', () => revisaHtml(tocaSec(h, (s) => s.replaceAll('ESR1', 'XX')), loc)],
      ['una cifra cambiada', () => revisaHtml(tocaSec(h, (s) => rompe(s, sinCifra[0]!, sinCifra[1]!)), loc)],
      ['un dibujo sin role="img"', () => revisaHtml(tocaSec(h, (s) => rompe(s, 'role="img"', '')), loc)],
      ['un botón', () => revisaHtml(tocaSec(h, (s) => rompe(s, '<figcaption', '<button>x</button><figcaption')), loc)],
      ['un <use> sin su symbol', () => revisaHtml(tocaSec(h, (s) => rompe(s, 'href="#', 'href="#zz-')), loc)],
      ['un límite cambiado', () => revisaHtml(tocaSec(h, (s) => rompe(s, n.limite_3, `${n.limite_3} x`)), loc)],
    ]
    for (const [que, g] of canariosHtml) {
      let r: string[] = []
      try { r = g() } catch (e) { ok(false, `${f}: canario «${que}»: ${(e as Error).message}`); continue }
      ok(r.length > 0, `${f}: canario: con «${que}» el test se pone ROJO`)
    }
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ /ciencia en una capa, textos clínicos literales, las seis deudas fuera, /datos con la historia y el PET, la cronología, /videos y el esquema del tumor en verde')
process.exit(fallos ? 1 : 0)
