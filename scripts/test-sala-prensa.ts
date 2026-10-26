// Frenos de la sala de prensa (/prensa, /en/press), pedidos en el plan del 14-oct-2026.
//
// La clase del fallo: la sala se mantiene a mano y se desincroniza sin que nada avise
// (citas que no son las aprobadas, una traducción presentada como «verbatim», una fecha de
// «última actualización» que nadie toca, un contador de campaña donde no debe, una palabra
// vetada escrita en la propia guía pública).
//
// 1. Mismas claves `press.*` en ES y EN (ni una sin traducir).
// 2. Las 4 citas son exactamente el set aprobado por Miriam (27-jun-2026), en ES y EN.
// 3. En EN el título no dice «verbatim» (las citas 1 a 3 son traducciones).
// 4. La guía pública no nombra lo que nunca se dice en público («Olune») ni «científica» como SÍ.
// 5. /prensa no lleva el contador de campaña ni la fecha fija «junio de 2026».
// 5c. Bandas de /prensa (sistema v3): como mucho una oscura, nunca la última, y sin dos del mismo tono seguidas.
// 5e. PRENSA2 (25-oct-2026): sin enlace al PDF del kit, una sola etiqueta para los botones a /contacto?role=journalist, «Diagnóstico» sin
//     receptores y la cronología plegable hasta su última clave `tl_N`.
// 5f. Con el plegable abierto, en Chrome y a 640/768/1280/1920 px: ninguna etiqueta de fecha de la cronología (ni la peor posible, «30 de septiembre
//     de 2026») ocupa más de una línea ni se sale de su columna. Necesita .output/public; sin él, o con SIN_NAVEGADOR=1, se omite con aviso.
// 6. `caseData.pressAsOf` es una fecha válida y no es futura.
// 7. La tira de medios de la home se LEE de content/<idioma>/press.yml (rediseño F5, 23-oct-2026): ni un medio ni una URL escritos
//    a mano en la página o en su componente. Desde el 24-oct-2026 la home enseña SOLO cuatro medios (Redacción Médica, El País,
//    La Vanguardia, El Español), en ese orden, el que marca el campo `home: N` de cada pieza (no el orden curado de la sala de
//    prensa); el resto sigue en press.yml y en /prensa. Cada enlace de la tira lleva los atributos de Umami (Clic-prensa + medio) y
//    no llama a trackPress (contaría doble); «Prensa-visible» sale una vez, con IntersectionObserver. Si hay build
//    (.output/public), se comprueba además en el HTML generado de las dos home.
//
// Uso:  pnpm test:sala-prensa
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')).press as Record<string, string>
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')).press as Record<string, string>
const pagina = readFileSync('app/pages/prensa.vue', 'utf-8')
const caseData = readFileSync('app/utils/caseData.ts', 'utf-8')

// 1
const soloEs = Object.keys(es).filter((k) => !(k in en))
const soloEn = Object.keys(en).filter((k) => !(k in es))
ok(soloEs.length === 0, `todas las claves press.* de ES existen en EN${soloEs.length ? ` (faltan: ${soloEs.join(', ')})` : ''}`)
ok(soloEn.length === 0, `todas las claves press.* de EN existen en ES${soloEn.length ? ` (faltan: ${soloEn.join(', ')})` : ''}`)

// 2 · set aprobado (EPK §3, OK de Miriam 27-jun-2026). Cambiar una cita exige su OK, no este test.
const APROBADAS_ES = [
  'No pido garantías, pido oportunidades.',
  'Que los casos raros dejen de ser notas a pie de página y pasen a ser datos, estudios, opciones reales.',
  'Uso la IA para amplificar mi conocimiento.',
  "AI doesn't replace them — it helps me meet them halfway.",
]
const APROBADAS_EN = [
  "I'm not asking for guarantees — I'm asking for opportunities.",
  'That rare cases stop being footnotes and become data, studies, real options.',
  'I use AI to amplify my knowledge.',
  "AI doesn't replace them — it helps me meet them halfway.",
]
APROBADAS_ES.forEach((q, i) => ok(es[`quote_${i + 1}`] === q, `ES cita ${i + 1} = set aprobado`))
APROBADAS_EN.forEach((q, i) => ok(en[`quote_${i + 1}`] === q, `EN cita ${i + 1} = set aprobado`))

// 2b · la nota de traducción de /en/press enseña el ORIGINAL en español. Antes lo pedía a vue-i18n con { locale: 'es' }: en /en/press esos mensajes no
// están cargados y la página (y producción, 25-oct-2026) decía «Original: «press.quote_1»». Ahora la página lleva los tres originales y aquí se
// comprueba que son el set aprobado, que no se vuelve al truco y, si hay build, que el HTML inglés dice el original y no una clave.
APROBADAS_ES.slice(0, 3).forEach((q, i) => ok(pagina.includes(`'${q}'`), `la página lleva el original en español de la cita ${i + 1} (nota de /en/press)`))
ok(!/\{\s*locale:\s*'es'\s*\}/.test(pagina), "la página no pide los originales con { locale: 'es' } (en /en/press no están cargados)")
if (existsSync('.output/public/en/press.html')) {
  const hEn = readFileSync('.output/public/en/press.html', 'utf-8')
  ok(!/Original: «press\./.test(hEn), 'en/press.html: ninguna nota enseña una clave («Original: «press.quote_1»»)')
  APROBADAS_ES.slice(0, 3).forEach((q, i) => ok(hEn.includes(`Original: «${q}»`), `en/press.html: la cita ${i + 1} dice su original en español`))
} else console.log('  ⚠️  sin .output/public/en/press.html: se omite la comprobación del HTML inglés (ejecuta antes `pnpm exec nuxt generate`)')

// 3
ok(!/verbatim/i.test(en.quotes_title ?? ''), 'EN: el título de las citas no dice «verbatim»')

// 4
for (const [lang, d] of [['ES', es], ['EN', en]] as const) {
  const guia = `${d.guide_yes} ${d.guide_no}`
  ok(!/olune/i.test(guia), `${lang}: la guía pública no escribe la palabra vetada`)
  ok(!/cient[ií]fica|scientist/i.test(d.guide_yes), `${lang}: «científica» solo aparece en el NO`)
}

// 5
ok(!pagina.includes('GoFundMeProgress'), '/prensa no lleva el contador de campaña (sin importes de recaudación)')
ok(!pagina.includes('month_updated'), '/prensa no usa la fecha fija «junio de»')

// 5b · un id de sección no se repite (un bloque duplicado por un mal pegado dejaba dos «texto listo para copiar»)
const ids = [...pagina.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1])
const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i)
ok(repetidos.length === 0, `/prensa no repite ningún id${repetidos.length ? ` (${[...new Set(repetidos)].join(', ')})` : ''}`)

// 5c · bandas (sistema v3, tanda 3, 25-oct-2026): como mucho UNA oscura y nunca la última (el pie empieza con su banda berenjena de logos y dos
// oscuras seguidas se leen como una; el panel oscuro de contacto, en caja y pegado al pie, llevaba un botón berenjena sobre berenjena, 1,00:1) y dos
// bandas del mismo tono nunca seguidas (alternan crema y tarjeta para marcar capítulos). Es una invariante de ESTRUCTURA del fuente, a propósito.
const tonos = [...pagina.matchAll(/<Banda\b[^>]*\btono="(crema|tarjeta|oscura)"/g)].map((x) => x[1])
ok(tonos.length >= 4, `/prensa se compone de bandas (${tonos.length}: ${tonos.join(' · ')})`)
ok(tonos.filter((t) => t === 'oscura').length <= 1, '/prensa lleva como mucho una banda oscura')
ok(tonos.at(-1) !== 'oscura', '/prensa no acaba en una banda oscura (el pie ya empieza con la suya)')
ok(tonos.every((t, i) => i === 0 || t !== tonos[i - 1]), '/prensa no pone dos bandas del mismo tono seguidas')

// 5d · enlaces de las preguntas frecuentes (revisión del 25-oct-2026): `link-action` es el enlace con flecha FUERA de un párrafo (DESIGN-SYSTEM §4).
// Metido en la frase de la respuesta no se distinguía del texto (mismo color, sin subrayado, sin flecha: WCAG 1.4.1) y su caja de 44 px abría un hueco
// entre las dos últimas líneas. La respuesta va en un <p>, el enlace debajo y con su flecha. Es una invariante de ESTRUCTURA, a propósito.
const respuestasConEnlace = [...pagina.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((x) => x[1]).filter((d) => d.includes('class="link-action'))
ok(respuestasConEnlace.length > 0, `/prensa tiene respuestas con enlace (${respuestasConEnlace.length}) y este test las mira`)
ok(
  respuestasConEnlace.every((d) => d.includes('</p>') && d.indexOf('</p>') < d.indexOf('class="link-action')),
  '/prensa: el enlace de cada pregunta frecuente va DESPUÉS de cerrar el párrafo de la respuesta, no dentro de la frase'
)
ok(
  respuestasConEnlace.every((d) => (d.match(/<Icon\b[^>]*ph:arrow-right/g) ?? []).length === (d.match(/class="link-action/g) ?? []).length),
  '/prensa: cada enlace de las preguntas frecuentes lleva su flecha (Icon ph:arrow-right), no solo el color'
)
for (const fichero of ['prensa.html', 'en/press.html']) {
  const ruta = join('.output/public', fichero)
  if (!existsSync(ruta)) { console.log(`  ⚠️  sin ${ruta}: se omite la comprobación del HTML de las preguntas frecuentes (ejecuta antes \`pnpm exec nuxt generate\`)`); continue }
  const h = readFileSync(ruta, 'utf-8').replace(/<script\b[\s\S]*?<\/script>/g, '')
  const dds = [...h.matchAll(/<dd\b[^>]*>((?:(?!<\/dd>)[\s\S])*)<\/dd>/g)].map((x) => x[1]).filter((d) => d.includes('link-action'))
  ok(dds.length > 0 && dds.every((d) => d.startsWith('<p')), `${fichero}: ${dds.length} respuestas con enlace, todas con la respuesta en un <p> y el enlace fuera`)
  ok(dds.every((d) => /<svg\b|iconify/.test(d.slice(d.indexOf('link-action')))), `${fichero}: el enlace de cada respuesta lleva icono en el HTML generado`)
}

// 5e · PRENSA2 (25-oct-2026): lo que la revisión del comité dejó sin arreglar y que no debe volver.
//  · El PDF del kit pedía financiar una rebiopsia y una revisión que ya estaban hechas, llevaba «vacuna» y la edad en la columna NO (vetos
//    levantados) y 2 de 4 citas fuera del set aprobado: la sala no lo enlaza (el fichero sigue en public/, borrarlo es decisión de Miriam).
//  · Dos botones al mismo destino (/contacto?role=journalist) con etiquetas distintas («Escribir a prensa» / «Escribir al equipo»): todos usan la misma clave.
//  · «Diagnóstico» no lleva receptores (HR+/HER2−): la metástasis del hígado es RE 0 % (caso.json) y la guía de la sala veta las cifras moleculares.
//  · La cronología plegable llega hasta la última clave `tl_N` que existe (una clave nueva sin sumar al rango nunca se pintaba).
ok(!/press-kit-miriam-gonzalez\.pdf|kit_download_/.test(pagina), '/prensa no enlaza el PDF del kit de prensa (desfasado)')
const botonesPrensa = [...pagina.matchAll(/<NuxtLink\b[^>]*\?role=journalist[^>]*>([\s\S]*?)<\/NuxtLink>/g)].map((x) => x[1].match(/\$t\('(press\.[a-z_0-9]+)'\)/)?.[1])
ok(botonesPrensa.length >= 2 && new Set(botonesPrensa).size === 1, `los botones a /contacto?role=journalist usan UNA sola etiqueta (${botonesPrensa.join(', ')})`)
for (const [lang, d] of [['ES', es], ['EN', en]] as const) {
  ok(!/HR\s*\+|HER2/i.test(d.fact_diagnosis_value ?? ''), `${lang}: «Diagnóstico» no lleva receptores (HR+/HER2)`)
}
const ultimaTl = Math.max(...Object.keys(es).map((k) => Number(k.match(/^tl_(\d+)_date$/)?.[1] ?? 0)))
const rangoTl = pagina.match(/\[([\d, ]+)\]\.map\(\(i\) => \(\{ date: t\(`press\.tl_\$\{i\}_date`\)/)?.[1]?.split(',').map((n) => Number(n.trim())) ?? []
ok(ultimaTl > 0 && Math.max(...rangoTl) === ultimaTl && rangoTl.length === ultimaTl, `la cronología de /prensa pinta tl_1 a tl_${ultimaTl} (el rango de la página es ${rangoTl.join(', ')})`)
for (const fichero of ['prensa.html', 'en/press.html']) {
  const ruta = join('.output/public', fichero)
  if (!existsSync(ruta)) { console.log(`  ⚠️  sin ${ruta}: se omite la comprobación del HTML del PDF y las etiquetas (ejecuta antes \`pnpm exec nuxt generate\`)`); continue }
  const h = readFileSync(ruta, 'utf-8').replace(/<script\b[\s\S]*?<\/script>/g, '')
  ok(!h.includes('press-kit-miriam-gonzalez.pdf'), `${fichero}: ningún enlace al PDF del kit`)
  const etiquetas = [...h.matchAll(/<a\b[^>]*href="[^"]*role=journalist"[^>]*>([\s\S]*?)<\/a>/g)].map((x) => x[1].replace(/<[^>]+>/g, '').trim())
  ok(etiquetas.length >= 2 && new Set(etiquetas).size === 1, `${fichero}: los ${etiquetas.length} botones a /contacto?role=journalist dicen lo mismo («${etiquetas[0] ?? ''}»)`)
}

// 5f · las etiquetas de fecha de la cronología plegable no se parten ni se salen de su columna (revisión de PRENSA2, 25-oct-2026).
// La columna de fecha es fija desde 640 px y la etiqueta es mono 12 px en mayúsculas: «16 DE OCTUBRE DE 2026» (21 caracteres) no cabía en 11rem y dejaba
// «2026» huérfano en una segunda línea. El fuente no lo enseña: hay que mirarlo con la página pintada y el plegable ABIERTO (cerrado no mide nada).
// Dos medidas por etiqueta, no una: una sola línea Y que el texto cabe en su caja. Con `white-space: nowrap` la falta de sitio ya no parte la fecha, la saca
// de su columna y la monta sobre la frase, y un test que solo contase líneas saldría verde. Además de las fechas de hoy, mide una copia con la peor fecha
// que puede escribir cada idioma (30 de septiembre, 24 caracteres en ES): así el freno cubre la clase «columna fija contra etiqueta más larga» y no solo
// los datos de esta semana. Se mide a 640 (donde nace la segunda columna y es la más estrecha), 768, 1280 y 1920.
if (process.env.SIN_NAVEGADOR) {
  console.log('  ⚠️  SIN_NAVEGADOR=1: se omite la comprobación de las fechas de la cronología en Chrome')
} else if (!existsSync('.output/public/prensa.html')) {
  console.log('  ⚠️  sin .output/public/prensa.html: se omite la comprobación de las fechas de la cronología en Chrome (ejecuta antes `pnpm exec nuxt generate`)')
} else {
  const { abrirNavegador } = await import('./lib/navegador-cdp.mjs')
  const nav = await abrirNavegador({ ancho: 1280, alto: 900, escala: 1 })
  const PEOR_FECHA: Record<string, string> = { '/prensa': '30 de septiembre de 2026', '/en/press': 'September 30, 2026' }
  const medirFechas = (peor: string) => `(async () => {
    await document.fonts.ready
    document.querySelectorAll('details').forEach((d) => { d.open = true })
    const ol = document.querySelector('.pr-cronologia')
    if (!ol) return null
    const reales = ol.querySelectorAll(':scope > li').length
    const copia = ol.lastElementChild.cloneNode(true)
    copia.querySelector('.etiqueta').textContent = ${JSON.stringify(peor)}
    ol.appendChild(copia)
    const etiquetas = [...ol.querySelectorAll(':scope > li > .etiqueta')].map((e) => {
      const r = document.createRange(); r.selectNodeContents(e)
      const lineas = new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size
      const sobra = Math.max(r.getBoundingClientRect().width - e.getBoundingClientRect().width, e.scrollWidth - e.clientWidth)
      return { texto: e.textContent.trim(), lineas, sobra: Math.round(sobra) }
    })
    return { reales, etiquetas }
  })()`
  try {
    for (const ruta of ['/prensa', '/en/press']) {
      for (const ancho of [640, 768, 1280, 1920]) {
        await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false })
        await nav.cargar(ruta)
        const r = (await nav.evaluate(medirFechas(PEOR_FECHA[ruta]))) as { reales: number; etiquetas: { texto: string; lineas: number; sobra: number }[] } | null
        const mal = (r?.etiquetas ?? []).filter((e) => e.lineas !== 1 || e.sobra > 1)
        ok(
          !!r && r.reales === ultimaTl && r.etiquetas.length === ultimaTl + 1 && mal.length === 0,
          `${ruta} a ${ancho} px, plegables abiertos: las ${r?.reales ?? 0} fechas de la cronología y la peor posible («${PEOR_FECHA[ruta]}») caben en una línea y dentro de su columna` +
            (mal.length ? ` — mal: ${mal.map((e) => `«${e.texto}» (${e.lineas} líneas, se sale ${e.sobra} px)`).join('; ')}` : '')
        )
      }
    }
  } finally {
    await nav.cerrar()
  }
}

// 6
const m = caseData.match(/pressAsOf:\s*'(\d{4}-\d{2}-\d{2})'/)
ok(!!m, 'caseData.pressAsOf existe (AAAA-MM-DD)')
if (m) {
  const f = new Date(`${m[1]}T00:00:00Z`)
  ok(!Number.isNaN(f.getTime()) && f.getTime() <= Date.now() + 86_400_000, `pressAsOf (${m[1]}) es una fecha válida y no futura`)
}

// 7 · la tira de medios de la home sale de press.yml (rediseño F5): antes eran 7 enlaces a mano en index.vue y se desincronizaban.
// Se reproduce AQUÍ la regla de usePrensaMedios (un medio una vez, con la primera pieza; sin paréntesis) y se compara con el código y,
// si hay build, con el HTML generado.
const HOME_MEDIOS = ['Redacción Médica', 'El País', 'La Vanguardia', 'El Español'] // decisión de Miriam, 24-oct-2026
const SOLO_SALA = ['Corresponsables', 'La Opinión de Murcia', 'La 7'] // siguen en /prensa; no salen en la home
function leerPrensa(loc: 'es' | 'en') {
  const yml = readFileSync(`content/${loc}/press.yml`, 'utf-8')
  const piezas: { medio: string; url: string; home?: number }[] = []
  for (const linea of yml.split('\n')) {
    const o = linea.match(/^\s*- outlet:\s*(.+?)\s*$/)
    if (o) { piezas.push({ medio: o[1].replace(/^['"]|['"]$/g, ''), url: '' }); continue }
    const h = linea.match(/^\s*home:\s*(\d+)\s*$/)
    if (h && piezas.length) piezas[piezas.length - 1].home = Number(h[1])
    const u = linea.match(/^\s*url:\s*(\S+)\s*$/)
    if (u && piezas.length) piezas[piezas.length - 1].url = u[1]
  }
  const limpia = (m: string) => m.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const unicos = <T extends { medio: string }>(l: T[]) => l.filter((p, i) => l.findIndex((q) => q.medio === p.medio) === i)
  // Lo mismo que usePrensaMedios: solo las piezas con `home`, por ese número, y un medio una vez con el enlace de su pieza marcada.
  const home = unicos(piezas.filter((p) => p.home !== undefined).sort((a, b) => a.home! - b.home!).map((p) => ({ medio: limpia(p.medio), url: p.url })))
  return { home, todos: unicos(piezas.map((p) => ({ medio: limpia(p.medio), url: p.url }))) }
}
const home = readFileSync('app/pages/index.vue', 'utf-8')
const tira = readFileSync('app/components/PrensaTira.vue', 'utf-8')
const compo = readFileSync('app/composables/usePrensaMedios.ts', 'utf-8')
const lecturas = { es: leerPrensa('es'), en: leerPrensa('en') }
const ymls = { es: lecturas.es.home, en: lecturas.en.home } // lo que debe pintar la tira, por idioma
ok(lecturas.es.todos.length > 0 && lecturas.en.todos.length > 0, `content/{es,en}/press.yml listan medios (${lecturas.es.todos.length} y ${lecturas.en.todos.length})`)
for (const loc of ['es', 'en'] as const) {
  const nombres = ymls[loc].map((m) => m.medio)
  ok(JSON.stringify(nombres) === JSON.stringify(HOME_MEDIOS), `${loc}: la home marca (home: N) exactamente estos cuatro medios y en este orden: ${HOME_MEDIOS.join(', ')}${JSON.stringify(nombres) === JSON.stringify(HOME_MEDIOS) ? '' : ` — sale: ${nombres.join(', ')}`}`)
  const todos = lecturas[loc].todos.map((m) => m.medio)
  ok(SOLO_SALA.every((m) => todos.includes(m)), `${loc}: ${SOLO_SALA.join(', ')} siguen en press.yml (se quedan en /prensa, no se borran)`)
}
ok(/home:\s*z\.number\(\)/.test(readFileSync('content.config.ts', 'utf-8')), 'content.config.ts declara `home` en el esquema de press (un campo que el esquema no conoce se descarta y la tira saldría vacía)')
ok(/<PrensaTira\b/.test(home) && /queryCollection\(/.test(compo) && /press_es/.test(compo) && /press_en/.test(compo) && /usePrensaMedios\(\)/.test(tira), 'la home pinta PrensaTira, que lee press_es / press_en con queryCollection (usePrensaMedios)')
const escritos = [...lecturas.es.todos, ...lecturas.en.todos].flatMap((m) => [m.medio, m.url]).filter((x) => x && (home.includes(x) || tira.includes(x)))
ok(escritos.length === 0, `ni index.vue ni PrensaTira.vue llevan un medio o una URL de press.yml escritos a mano${escritos.length ? ` (${[...new Set(escritos)].join(', ')})` : ''}`)
ok(!/trackPress\('/.test(home), 'la home ya no llama a trackPress con un medio literal (lo hace la tira con el nombre leído)')
// Medición de la tira (Umami): atributos en cada enlace, ningún trackPress en la tira (contaría doble) y «Prensa-visible» una vez.
const soporte = readFileSync('app/composables/useSupport.ts', 'utf-8')
ok(/data-umami-event="Clic-prensa"/.test(tira) && /:data-umami-event-medio="m\.medio"/.test(tira), 'PrensaTira: cada medio lleva data-umami-event="Clic-prensa" y data-umami-event-medio="<medio>"')
ok(!/trackPress/.test(tira), 'PrensaTira no llama a trackPress (Umami ya cuenta el clic por el atributo: contaría doble)')
// «Prensa-visible» { pagina } lo envía useUmamiVisto (utils/umamiVistas.ts: una vez por vista, con la mitad de la tira en pantalla y espera al
// script de Umami), el mismo medidor que «Hero-visto» y «Campana-visible» (T2d, 24-oct-2026; antes, un observador propio en la tira y
// trackPrensaVisible en useSupport: dos maneras de medir lo mismo). test-umami-eventos comprueba en Chrome que llega UNA vez.
ok(/useUmamiVisto\(tira,\s*EVENTO_PRENSA_VISIBLE\)/.test(tira) && /ref="tira"/.test(tira) && !/trackPrensaVisible/.test(tira + soporte), 'PrensaTira envía «Prensa-visible» con useUmamiVisto, el medidor común (y useSupport ya no tiene un emisor propio)')
ok(/trackUmami\('Clic-prensa'/.test(soporte), 'useSupport sigue emitiendo «Clic-prensa» (lo usa /prensa)')
ok(/trackPress\(item\.outlet\)/.test(pagina), '/prensa sigue midiendo «Clic-prensa» por trackPress (sin cambios)')

// 7b · en el HTML generado (si hay build): mismos medios, mismo orden y el enlace de la primera pieza de cada uno
const pub = '.output/public'
for (const [loc, fichero] of [['es', 'index.html'], ['en', 'en.html']] as const) {
  if (!existsSync(join(pub, fichero))) { console.log(`  ⚠️  sin ${pub}/${fichero}: se omite la comprobación del HTML (ejecuta antes \`pnpm exec nuxt generate\`)`); continue }
  const h = readFileSync(join(pub, fichero), 'utf-8').replace(/<script\b[\s\S]*?<\/script>/g, '')
  const franja = h.match(/<section[^>]*class="[^"]*prensa-tira[^"]*"[\s\S]*?<\/section>/)?.[0] ?? ''
  ok(franja.length > 0, `${fichero}: la tira de prensa está en el HTML`)
  const enlaces = [...franja.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*class="[^"]*prensa-tira__medio[^"]*"[^>]*>([^<]*)</g)].map((m) => ({ medio: m[2].trim(), url: m[1].replace(/&amp;/g, '&') }))
  ok(JSON.stringify(enlaces) === JSON.stringify(ymls[loc]), `${fichero}: la tira = las piezas con home de press.yml (${ymls[loc].map((m) => m.medio).join(', ')})${JSON.stringify(enlaces) === JSON.stringify(ymls[loc]) ? '' : ` — sale: ${JSON.stringify(enlaces)}`}`)
  const atributos = [...franja.matchAll(/<a\b[^>]*class="[^"]*prensa-tira__medio[^"]*"[^>]*>/g)].map((m) => m[0])
  ok(atributos.length === ymls[loc].length && atributos.every((a, i) => a.includes('data-umami-event="Clic-prensa"') && a.includes(`data-umami-event-medio="${ymls[loc][i].medio}"`)), `${fichero}: cada enlace de la tira lleva data-umami-event="Clic-prensa" y data-umami-event-medio con su medio`)
}

if (fallos) {
  console.error(`\n❌ ${fallos} fallo(s) en la sala de prensa`)
  process.exit(1)
}
console.log('\n✅ sala de prensa en verde')
