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
import { DEUDAS } from './lib/deudas-clinicas.mjs'

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
  const IDS = ['ciencia-busca', 'mapa-acceso', 'snapshot-title', 'por-que-no-encaja', 'tejido-3veces', 'molecular-profile-title', 'axes-title', 'panel-title', 'ruta-title', 'ciencia-pro-help-title']
  const pos = IDS.map((id) => h.indexOf(`id="${id}"`))
  ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${f}: orden Qué buscamos → Herramientas → De un vistazo → Por qué no encaja → Patología → Perfil molecular → Ejes → Panel → La ruta → cierre (${pos.join(' < ')})`)
  ok(IDS.every((id) => (h.match(new RegExp(`\\bid="${id}"`, 'g'))?.length ?? 0) === 1), `${f}: cada id de bloque aparece una sola vez`)
  ok(/<h2\b[^>]*\bid="mapa-acceso"/.test(h) && /<h2\b[^>]*\bid="snapshot-title"/.test(h), `${f}: #mapa-acceso y #snapshot-title (las anclas de los enlaces antiguos) son los <h2> de su bloque`)
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
  const panel = h.slice(h.indexOf('id="panel-title"'), h.indexOf('id="ruta-title"'))
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
  ok(es.includes(C.e1) && es.split(C.e1).length - 1 === 2, 'E1 (ES): la frase de la cuarta línea, literal, en la fila TROP-2 y en la ruta (2 veces)')
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

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ /ciencia en una capa, textos clínicos literales, las seis deudas fuera, /datos con la historia y el PET, la cronología y /videos en verde')
process.exit(fallos ? 1 : 0)
