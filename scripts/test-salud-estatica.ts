// Test de lo que se rompe en silencio en el sitio YA generado (.output/public): nadie lo ve
// en `nuxt dev` y ningún otro test lo mira.
//
// Tres fallos reales, los tres encontrados en producción el 13-oct-2026:
//
// 1. El ancla #lo-ultimo. El hero y la barra global enlazan a /timeline#lo-ultimo; el id solo
//    se pintaba si el hito más reciente era «destacado», y con el del 20-sep dejó de existir:
//    el enlace aterrizaba arriba de la página. Tiene que haber UNO, y en el primer hito.
// 2. «hace N días» horneado. Se calculaba en el prerender, así que el HTML decía para siempre
//    el número del día del build. Ahora se calcula al hidratar: en el HTML no puede haber cifra.
// 3. El sitemap. Listaba /es/historia/… (404: el español no lleva prefijo) y, en inglés,
//    páginas con noindex. Cada <loc> tiene que ser una página generada e indexable.
//
// Y tres invariantes del arreglo mecánico del rediseño (F0, 23-oct-2026):
//
// 4. Un solo <main> por página. El layout ya lo pone; /links, /gracias y las tres legales traían otro
//    dentro (dos landmarks principales, uno dentro de otro).
// 5. «Ver quién apoya», en /colabora, lleva al muro de gracias (#gracias) y no a /gracias, la página
//    de después de donar, que dice «Donación recibida» a quien solo quería ver quién apoya.
// 6. La tarjeta de la campaña llega en el HTML prerenderizado (antes se cargaba al montar y buscadores,
//    lectores de IA y quien no tiene JS veían un bloque vacío). Solo si hay semilla (seed/fundraiser.json,
//    la escribe `pnpm update-fundraiser`): el CI corre `nuxt generate` a secas y ahí no hay cifra que pintar.
//    Desde T2b (24-oct-2026, decisión de Miriam) lleva el IMPORTE y los DONANTES, con «en GoFundMe» y la fecha de la cifra (es la del
//    build), y NO lleva objetivo, porcentaje, barra de progreso, «Faltan» ni importes en las fases: se mide aquí en el HTML generado.
//
// 7. La cifra viva sustituye a la del build (en Chrome), al cargar la página y al navegar por el sitio.
//    Si el refresco se pierde, la tarjeta se queda con la cifra horneada y ningún otro test lo ve: el
//    servidor del arnés no tiene /fundraiser.json. Aquí se intercepta `fetch` y se contesta otra cifra,
//    o un error. Corre igual con o sin semilla (sin ella, el HTML llega sin tarjeta y el cliente la pinta).
//    La cifra se lee de `data-gofundme-importe` (el importe sin formato) y `data-gofundme-origen` (vivo o semilla); la fecha
//    «cifra a …» sale mientras la cifra es de la semilla y se va cuando llega la viva.
//
// Y la petición del rediseño (F1, 23-oct-2026):
//
// 8. «Qué buscamos» es la 2.ª sección de /datos (Hoy → Qué buscamos → Tejido → Carga tumoral → Evolución →
//    visores), con su ancla #que-buscamos (a ella aterriza /caso) y SOLO las 5 peticiones aprobadas, en el
//    orden provisional de prioridad. La FoundationOne y la anemia (6.ª y 7.ª de se_busca) esperan su gate y
//    no se pintan. El corte es una lista blanca (app/utils/peticiones.ts), no «las 5 primeras»: aquí se
//    prueba que cada regla casa con UN elemento de la fuente, para que una petición reescrita en caso.json
//    ponga esto en rojo en vez de desaparecer de /datos en silencio.
//    El enlace «Ver todo lo que buscamos» (la home y /ciencia lo llevarán con `limite`) sale solo si se enseñan
//    menos de las publicadas, salvo que la página diga lo contrario; y la prop del componente lo permite de
//    verdad: una prop booleana ausente llega como `false` si no declara `default`.
//
// Y la navegación del rediseño (F3, 23-oct-2026):
//
// 9. El menú tiene 5 ítems («Herramientas» vuelve al hueco de «Datos», tanda 2, T2a, 24-oct-2026; antes, F3, lo ocupó «Datos») y marca
//    la sección en cada herramienta; el pie, 14 enlaces en 3 columnas (la de «Herramientas» abre con «Todas las herramientas») más
//    Redes y Legal, sin chips «por perfil», sin fecha global ni los enlaces que salieron; las redes salen de UNA lista (pie, /colabora
//    y schema.org); el selector de idioma está en la cabecera a todos los anchos; y /links y /gracias llevan el chrome mínimo (sin
//    menú, sin barra «lo último», pie reducido y, desde F6, sin «Apoyar» en la cabecera de ninguna de las dos). Lo que no se ve en el
//    HTML (el chrome al navegar sin recargar, los 44 px) lo prueba test-home-caminos §10 y §11 en Chrome.
//
// Y las fusiones del rediseño (F4, 23-oct-2026), revisadas por la tanda 2 (T2a, 24-oct-2026):
//
// 10. F4 plegó /herramientas, /reservorio, /historia (y su capítulo) y /videos con redirects. T2a devolvió a la vida las tres primeras
//    (Miriam, 24-oct): hoy ESTÁN generadas, en el sitemap con su hreflang y sin redirect. Sigue sin existir lo que solo es un redirect
//    (capítulo de /historia, /videos y las variantes /en/herramientas y /en/historia). /datos ya no lleva la franja #visores ni el
//    bloque plegado: una fila a «Todas las herramientas» y otra al reservorio. El mapa de metástasis es público e indexable, con su
//    rótulo «Histórico · junio 2026» y, arriba, la línea de Miriam. /herramientas: dos grupos, tarjetas con el mismo orden fijo y
//    tres puertas. /reservorio: con su 3D, la línea de Miriam, el motivo del recambio (en inglés SIN «innominate trunk») y las
//    medidas leídas de caso.json. /historia: viva, con su texto de siempre. La salida común (Apoyar y volver al inicio) cierra
//    cada herramienta, menos el índice y /lesiones. El ADC vive en el hito del 7-oct de /timeline (T2c) y el promo en /prensa, con su transcripción entera.
//
// Y la home del rediseño (F5, 23-oct-2026):
//
// 11. Ocho bloques en el orden decidido (hero · prensa · herramientas · el caso en 3 frases · cita · dónde estamos y qué falta · dinero ·
//    cómo ayudar; la cita subió tras «El caso en 3 frases» el 24-oct-2026 y la banda de herramientas volvió en T2a), un solo <h1> con la edad y un <h2> por bloque; los euros solo dentro del bloque de la campaña y NINGUNA de
//    las frases retiradas por el criterio del dinero («cada euro», «100 %», «sin intermediarios», «mensual», «recibo
//    disponible»); UNA frase de destino (money.destino) y UN solo botón coral en esa zona; «Ahora» = la misma cuenta que la cifra
//    «Tratamiento» de /datos; «Qué buscamos» con las 3 primeras peticiones PÚBLICAS (ni la FoundationOne ni la anemia, ni en el
//    HTML ni en el payload); la tira de prensa y las cinco puertas con sus destinos; nada de «ultra-raro» en el SEO/OG/schema;
//    y el JSON de 230 KB del caso fuera del JS que carga la home.
//
// Y las puertas sociales del rediseño (F6, 23-oct-2026):
//
// 12. /lesiones lleva «En corto» arriba (≤ 40 palabras, con la fecha de la foto, hecho de frases que la propia página ya publica) y,
//    antes de los dos enlaces de cierre de siempre, un cierre de apoyo ESTÁTICO con «Apoyar a Miriam» y «Entender el caso»; el texto
//    sellado sigue entero. /links: nueve filas (ocho de F6 y, desde T2a, «Todas mis herramientas») en el orden decidido, con el apoyo (GoFundMe directo, coral) en 2.º lugar y UN solo
//    enlace a GoFundMe en la página; «mama, hígado y hueso»; la prensa va a /prensa#cobertura (que existe). /gracias: sin «Donación
//    recibida», «100 %», «mensual» ni «sin intermediarios»; el recibo como lo dice /gastos (money.recibo), con el rol «other» y sin
//    correo directo; un paso siguiente útil y ≤ 70 palabras.
//
// Y el dinero del rediseño (T2b, 24-oct-2026):
//
// 13. Norma de transparencia de Miriam («mostramos algunas cifras y el desglose de gastos por categorías; no detallamos ciertas cosas») medida
//    en el HTML generado, que es lo que ven los buscadores y los lectores de IA (el <head>, los metadatos, el JSON-LD y el texto): ni una de las
//    frases retiradas («cada euro», «transparencia radical / total», «100 % al caso», «recibo disponible», «presupuestos abiertos», «cada gasto
//    está documentado», «nada se desvía») en /gastos, /colabora, /prensa, la home, /gracias y /links, en español y en inglés; /gastos pinta TODAS las
//    cifras de app/data/dinero.json (partidas, total, disponible y las tres líneas de la rebiopsia) con su fecha de corte y la línea de cuadre, y
//    ya no dice «el primer objetivo de 40.000 €»; /colabora dice a los laboratorios que su precio no se publica; /prensa y /colabora llevan la
//    frase única money.transparencia.
//
// Uso:  pnpm exec nuxt generate && pnpm test:salud-estatica
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, defineComponent, h } from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'
import { REGLAS_PETICIONES, TEMAS_HERRAMIENTA, hayEnlaceTodas, peticionesPublicas, seleccionarPeticiones } from '../app/utils/peticiones'
import { HERRAMIENTAS, HERRAMIENTAS_PASADAS, LEGAL, LO_ULTIMO, MENU_ESCRITORIO, MENU_MOVIL, PARA_HERRAMIENTA, PIE, REDES, ROL_HERRAMIENTA, SALIDA_HERRAMIENTA, SECCIONES, copyHerramienta, type EnlaceNav } from '../app/utils/navegacion'
import { VIDEO_ADC, VIDEO_PROMO } from '../app/utils/videos'
import { PUERTAS } from '../app/utils/caminos'
import { caseData } from '../app/utils/caseData'
import { formatCurrency } from '../app/utils/currency'
import { DINERO, euros, fechaDeCifra, fechaDeCorte } from '../app/utils/dinero'
import { msFecha, tratamientoHoy, txtCaso } from '../app/utils/datosCaso'
import { estadoPuerta, type Manifiesto } from '../app/utils/celulaExplorador'
import manifiestoExplorador from '../public/celula/explorador/manifiesto.json'

const PUB = '.output/public'
const SITIO = 'https://helpmiriam.com'
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

if (!existsSync(PUB)) {
  console.error(`❌ no existe ${PUB}: ejecuta antes \`pnpm exec nuxt generate\``)
  process.exit(1)
}
const html = (ruta: string) => readFileSync(join(PUB, ruta), 'utf-8')

// 1
for (const pagina of ['timeline.html', 'en/timeline.html']) {
  const h = html(pagina)
  const anclas = h.match(/\bid="lo-ultimo"/g)?.length ?? 0
  ok(anclas === 1, `${pagina}: exactamente un id="lo-ultimo" (${anclas})`)
  const primerHito = h.match(/<li\b[^>]*class="[^"]*\bscroll-mt-24\b[^"]*"[^>]*>/)?.[0] ?? ''
  ok(primerHito.includes('id="lo-ultimo"'), `${pagina}: el ancla está en el primer hito (el más reciente)`)
}

// 2 — el texto se toma de i18n: si cambia la frase, el test la sigue
for (const [idioma, pagina] of [['es', 'index.html'], ['en', 'en.html']] as const) {
  const hero = JSON.parse(readFileSync(`i18n/locales/${idioma}.json`, 'utf-8')).hero as Record<string, string>
  const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const frases = [
    hero.updated_today!,
    hero.updated_ago_one!,
    ...hero.updated_ago!.split('{n}').map((t) => t.trim()).filter((t) => t.length > 2),
  ]
  // Solo el texto pintado: fuera <script> (el payload de i18n lleva las frases como plantilla).
  const pintado = html(pagina).replace(/<script\b[\s\S]*?<\/script>/g, '')
  const meta = pintado.match(/hero__latest-meta"[\s\S]*?hero__latest-title"/)?.[0] ?? ''
  ok(meta.length > 0, `${pagina}: el hero pinta «lo último»`)
  const horneada = frases.find((f) => new RegExp(escapar(f), 'i').test(meta))
  ok(!horneada, `${pagina}: sin «hace N días» horneado en el HTML${horneada ? ` (encontrado: «${horneada}»)` : ''}`)
}

// 3
const sitemaps = readdirSync(join(PUB, '__sitemap__')).filter((f) => f.endsWith('.xml'))
ok(sitemaps.length > 0, `hay sitemaps por idioma (${sitemaps.join(', ')})`)
let total = 0
for (const sm of sitemaps) {
  const locs = [...html(join('__sitemap__', sm)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)
  total += locs.length
  for (const loc of locs) {
    if (!loc.startsWith(SITIO)) { ok(false, `${sm}: ${loc} no es de ${SITIO}`); continue }
    const ruta = loc.slice(SITIO.length).replace(/^\/|\/$/g, '') || 'index'
    const fichero = `${ruta}.html`
    if (!existsSync(join(PUB, fichero))) { ok(false, `${sm}: ${loc} no existe en el sitio generado (daría 404)`); continue }
    const robots = html(fichero).match(/<meta\b[^>]*\bname="robots"[^>]*>/i)?.[0] ?? ''
    if (/noindex/i.test(robots)) ok(false, `${sm}: ${loc} es noindex y no debe ir en el sitemap`)
  }
  ok(!locs.some((l) => /^https:\/\/helpmiriam\.com\/es(\/|$)/.test(l)), `${sm}: ninguna URL con prefijo /es (el español no lo lleva)`)
}
ok(total > 0, `cada URL del sitemap existe y es indexable (${total} revisadas)`)

// 3.bis — sitemap sin redirigidas y con las páginas que volvieron a la vida, y hreflang por pares (F4 y T2a)
{
  const cfg = readFileSync('nuxt.config.ts', 'utf-8')
  const redirigidas = new Set([...cfg.matchAll(/'(\/[^']*)':\s*\{\s*redirect:/g)].map((m) => m[1]!))
  // T2a (24-oct-2026): el mapa de metástasis dejó de ser archivo (volvió a ser público e indexable) y /herramientas, /reservorio e /historia
  // volvieron a ser páginas: las ocho rutas TIENEN que estar en el sitemap, con su pareja de hreflang. Lo que sigue fuera es la guía viva.
  const LISTADAS = ['/mapa-metastasis', '/en/mapa-metastasis', '/herramientas', '/en/tools', '/reservorio', '/en/reservorio', '/historia', '/en/story']
  const FUERA = ['/guia-de-estilo', '/en/style-guide']
  type Entrada = { loc: string; alt: Record<string, string> }
  const entradas: Record<string, Entrada[]> = {}
  for (const sm of sitemaps) {
    entradas[sm.replace('.xml', '')] = [...html(join('__sitemap__', sm)).matchAll(/<url>([\s\S]*?)<\/url>/g)].map((u) => ({
      loc: /<loc>([^<]+)<\/loc>/.exec(u[1]!)![1]!,
      alt: Object.fromEntries([...u[1]!.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map((a) => [a[1]!, a[2]!])),
    }))
  }
  const todas = Object.values(entradas).flat()
  const ruta = (loc: string) => loc.slice(SITIO.length) || '/'
  const conRedirect = todas.filter((e) => redirigidas.has(ruta(e.loc)) || redirigidas.has(ruta(e.loc).replace(/\/$/, '')))
  ok(conRedirect.length === 0, `el sitemap no lista ninguna URL que redirige${conRedirect.length ? ` (${conRedirect.map((e) => e.loc).join(', ')})` : ''}`)
  const faltan = LISTADAS.filter((r) => !todas.some((e) => ruta(e.loc) === r))
  ok(faltan.length === 0, `el sitemap lista el mapa de metástasis, /herramientas, /reservorio e /historia, en ES y EN${faltan.length ? ` (faltan: ${faltan.join(', ')})` : ''}`)
  const sobran = todas.filter((e) => FUERA.includes(ruta(e.loc)))
  ok(sobran.length === 0, `y no lista la guía viva del sistema de diseño (noindex)${sobran.length ? ` (${sobran.map((e) => e.loc).join(', ')})` : ''}`)
  // hreflang por pares: toda URL lleva es-ES, en-US y x-default; cada alternativa es una URL del sitemap de SU idioma; y el par es
  // recíproco (la página inglesa apunta de vuelta a la española). Antes, /historia/01-el-comienzo salía sin pareja.
  const idiomas: Record<string, string> = { 'es-ES': 'es-ES', 'en-US': 'en-US' }
  let sinPar = 0
  for (const [sm, lista] of Object.entries(entradas)) {
    for (const e of lista) {
      const par = idiomas[sm] ? e.alt : {}
      const alts = ['es-ES', 'en-US', 'x-default'].map((k) => par[k])
      if (alts.some((a) => !a)) { sinPar++; ok(false, `${sm}: ${e.loc} sin es-ES / en-US / x-default (${Object.keys(par).join(', ') || 'ninguno'})`); continue }
      const [es, en, def] = alts as string[]
      if (!(entradas['es-ES']?.some((x) => x.loc === es) && entradas['en-US']?.some((x) => x.loc === en))) { sinPar++; ok(false, `${sm}: ${e.loc} apunta a una alternativa que no está en el sitemap de su idioma (${es} / ${en})`); continue }
      if (def !== es) { sinPar++; ok(false, `${sm}: ${e.loc} tiene x-default distinto de la versión española (${def} ≠ ${es})`); continue }
      const vuelta = entradas[sm === 'es-ES' ? 'en-US' : 'es-ES']?.find((x) => x.loc === (sm === 'es-ES' ? en : es))
      if (!vuelta || vuelta.alt['es-ES'] !== es || vuelta.alt['en-US'] !== en) { sinPar++; ok(false, `${sm}: ${e.loc} ↔ ${sm === 'es-ES' ? en : es} no es un par recíproco`) }
    }
  }
  ok(sinPar === 0 && todas.length > 0, `hreflang por pares: cada URL del sitemap tiene su pareja recíproca en el otro idioma (${todas.length} URL)`)
  ok(entradas['es-ES']?.length === entradas['en-US']?.length, `el sitemap en español y en inglés tienen el mismo número de URL (${entradas['es-ES']?.length} y ${entradas['en-US']?.length})`)
}

// 4
const paginasNuxt: string[] = []
const recorre = (dir: string) => {
  for (const e of readdirSync(join(PUB, dir), { withFileTypes: true })) {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) recorre(ruta)
    else if (e.name.endsWith('.html') && html(ruta).includes('id="__nuxt"')) paginasNuxt.push(ruta)
  }
}
recorre('')
const conMainDoble = paginasNuxt.filter((f) => (html(f).match(/<main[\s>]/g)?.length ?? 0) > 1)
ok(paginasNuxt.length > 0, `hay páginas de Nuxt que revisar (${paginasNuxt.length})`)
ok(conMainDoble.length === 0, `ninguna página lleva más de un <main>${conMainDoble.length ? ` (con dos: ${conMainDoble.join(', ')})` : ''}`)
for (const f of ['links.html', 'en/links.html', 'gracias.html', 'en/thank-you.html']) {
  ok((html(f).match(/<main[\s>]/g)?.length ?? 0) === 1, `${f}: exactamente un <main>`)
}

// 5 — el texto del enlace sale de i18n, como en el punto 2
for (const [idioma, pagina, muro, agradecimiento] of [
  ['es', 'colabora.html', '/colabora#gracias', '/gracias'],
  ['en', 'en/collaborate.html', '/en/collaborate#gracias', '/en/thank-you'],
] as const) {
  const texto = JSON.parse(readFileSync(`i18n/locales/${idioma}.json`, 'utf-8')).collaborate.trust_social_link as string
  const h = html(pagina)
  const enlaces = [...h.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  const verQuien = enlaces.find((m) => m[2]!.includes(texto))
  ok(verQuien?.[1] === muro, `${pagina}: «${texto}» lleva a ${muro} (lleva a ${verQuien?.[1] ?? 'ningún sitio'})`)
  ok(!enlaces.some((m) => m[1] === agradecimiento), `${pagina}: ningún enlace a ${agradecimiento}, la página de después de donar`)
}

// 6
/** El contenido de la etiqueta <div> que empieza en `desde` (cuenta los <div> anidados; en el HTML generado no hay <div> en atributos). */
function bloqueDiv(h: string, desde: number): string {
  let nivel = 0
  for (const m of h.slice(desde).matchAll(/<(\/?)div\b/g)) {
    nivel += m[1] ? -1 : 1
    if (nivel === 0) return h.slice(desde, desde + m.index! + '</div>'.length)
  }
  return h.slice(desde)
}
const textoDe = (trozo: string) => trozo.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
if (existsSync('seed/fundraiser.json')) {
  const semilla = JSON.parse(readFileSync('seed/fundraiser.json', 'utf-8')) as {
    currentAmount: { amount: number; currencyCode: string }
    donationCount: number
    actualizado?: string
    origen?: string
  }
  ok(semilla.origen === 'semilla' && !!semilla.actualizado && !Number.isNaN(Date.parse(semilla.actualizado)), `la semilla lleva origen «semilla» y la fecha en que se escribió (${semilla.origen}, ${semilla.actualizado}); si falta, es de antes de T2b: \`pnpm update-fundraiser --force\``)
  for (const [idioma, paginas] of [['es', ['index.html', 'colabora.html', 'gastos.html']], ['en', ['en.html', 'en/collaborate.html', 'en/expenses.html']]] as const) {
    const D = JSON.parse(readFileSync(`i18n/locales/${idioma}.json`, 'utf-8'))
    const importeTexto = formatCurrency(semilla.currentAmount.amount, semilla.currentAmount.currencyCode, idioma).replace(/\s+/g, ' ')
    const donantesTexto = new Intl.NumberFormat(idioma === 'es' ? 'es-ES' : 'en-US').format(semilla.donationCount)
    const fecha = semilla.actualizado ? (D.gofundme.cifra_a as string).replace('{fecha}', fechaDeCifra(semilla.actualizado, idioma)) : null
    for (const pagina of paginas) {
      const h = html(pagina)
      const marcas = [...h.matchAll(/\bdata-gofundme-importe="([^"]+)"[^>]*\bdata-gofundme-origen="([^"]+)"/g)]
      ok(marcas.length > 0 && marcas.every((m) => m[1] === String(semilla.currentAmount.amount) && m[2] === 'semilla'), `${pagina}: el importe de la campaña llega en el HTML con la cifra de la semilla (${semilla.currentAmount.amount}) y su origen «semilla» (${marcas.length} sitio/s)`)
      const bloques = [...h.matchAll(/<div class="gfm gfm--(?:card|linea)"[^>]*>/g)].map((m) => textoDe(bloqueDiv(h, m.index!)))
      ok(bloques.length > 0 && bloques.every((b) => b.replace(/\s/g, ' ').includes(importeTexto) && b.includes(`${donantesTexto} ${D.gofundme.donators}`)), `${pagina}: la tarjeta de la campaña dice «${importeTexto}» y «${donantesTexto} ${D.gofundme.donators}» (${bloques.length})`)
      ok(bloques.every((b) => b.includes(D.gofundme.raised_on) || b.includes(D.gofundme.on_gofundme)), `${pagina}: y de dónde sale: «${D.gofundme.on_gofundme}»`)
      ok(!fecha || (textoDe(h).includes(fecha) && bloques.every((b) => b.includes(fecha))), `${pagina}: la cifra del build lleva su fecha («${fecha ?? 'sin fecha en la semilla'}»)`)
      // lo que se quitó: ni objetivo, ni porcentaje, ni barra, ni «Faltan», ni importes en las fases
      ok(bloques.every((b) => !/faltan|remaining|objetivo|\bgoal\b|\btarget\b|%/i.test(b)), `${pagina}: la tarjeta no dice objetivo, porcentaje ni «faltan»`)
      ok(!/goalAmount/.test(h), `${pagina}: el objetivo de GoFundMe no viaja en el HTML (ni en el payload de Nuxt): ya no se le pide`)
      ok(!/<(div|span)\b[^>]*role="progressbar"[^>]*aria-label="[^"]*(GoFundMe|campaña|campaign)/i.test(h), `${pagina}: ninguna barra de progreso de la campaña`)
    }
  }
  const fasesES = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')).gofundme
  const fasesEN = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')).gofundme
  for (const [pagina, D] of [['index.html', fasesES], ['en.html', fasesEN]] as const) {
    const h = html(pagina)
    const tarjeta = textoDe(bloqueDiv(h, h.search(/<div class="gfm gfm--card"/)))
    for (const f of DINERO.fases) {
      ok(tarjeta.includes(`${D.phases[f.clave].label} · ${D.estado[f.estado]}`), `${pagina}: la fase «${D.phases[f.clave].label} · ${D.estado[f.estado]}» está en la tarjeta, con su estado en texto`)
    }
    ok(DINERO.fases.length === (bloqueDiv(h, h.search(/<div class="gfm gfm--card"/)).match(/<li\b/g)?.length ?? 0), `${pagina}: la tarjeta lista las ${DINERO.fases.length} fases, una por <li> de una <ol>`)
    ok(!/[€$£]|\beuros?\b/i.test(DINERO.fases.map((f) => `${D.phases[f.clave].label} ${D.phases[f.clave].desc}`).join(' ')), `${pagina}: las fases no llevan importes`)
    // La lista de fases tiene nombre (revisión de T2b): aria-labelledby → el título «Fases de la campaña», con un id que existe y es único en la página
    const abierta = bloqueDiv(h, h.search(/<div class="gfm gfm--card"/)).match(/<ol\b[^>]*>/)?.[0] ?? ''
    const idLista = abierta.match(/aria-labelledby="([^"]+)"/)?.[1]
    const idEsc = (idLista ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const titulos = idLista ? [...h.matchAll(new RegExp(`<p[^>]*\\bid="${idEsc}"[^>]*>([\\s\\S]*?)</p>`, 'g'))] : []
    ok(/\brole="list"/.test(abierta) && !!idLista && titulos.length === 1 && textoDe(titulos[0]![1]!) === D.fases_titulo && (h.match(new RegExp(`\\bid="${idEsc}"`, 'g'))?.length ?? 0) === 1, `${pagina}: la lista de fases se nombra con aria-labelledby → «${D.fases_titulo}» (id ${idLista ?? 'sin id'} único en la página; role="list")`)
    // la fecha de la cifra va en su línea (otro <p>) y sin «·» delante
    ok(!/·\s*<time\b/.test(h), `${pagina}: ninguna «·» delante de una fecha de cifra (la fecha va en su línea)`)
  }
} else {
  console.log('  ⚠️  sin seed/fundraiser.json: se omite la comprobación de la tarjeta de la campaña (ejecuta `pnpm update-fundraiser` antes de generar)')
}

// 7
{
  const { abrirNavegador } = await import('./lib/navegador-cdp.mjs')
  const nav = await abrirNavegador({ ancho: 1024, alto: 900, escala: 1 })
  try {
    // ?fund=viva → la función contesta otra cifra, «vivo» · ?fund=vieja → una copia de la CDN anterior a T2b (sin origen y CON el objetivo que ya
    // no se pide) · ?fund=semilla → GoFundMe no respondió y la función contesta su copia de seguridad (origen «semilla», con SU fecha) ·
    // ?fund=caida → contesta 500
    await nav.cdp('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__pedidos = [];
        const modo = new URLSearchParams(location.search).get('fund');
        const f = window.fetch.bind(window);
        window.fetch = (input, init) => {
          const url = typeof input === 'string' ? input : input.url;
          if (!url.includes('/fundraiser.json')) return f(input, init);
          window.__pedidos.push(url);
          if (modo === 'caida') return Promise.resolve(new Response('no', { status: 500 }));
          const base = { currentAmount: { amount: 12345, currencyCode: 'EUR' }, donationCount: 77, donationsEnabled: true };
          const cuerpo = modo === 'semilla' ? { ...base, origen: 'semilla', actualizado: '2026-10-20T08:00:00.000Z' }
            : modo === 'vieja' ? { ...base, goalAmount: { amount: 777777, currencyCode: 'EUR' } }
            : { ...base, origen: 'vivo', actualizado: new Date().toISOString() };
          return Promise.resolve(new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'content-type': 'application/json' } }));
        };`,
    })
    const importes = (): Promise<string[]> =>
      nav.evaluate(`[...document.querySelectorAll('[data-gofundme-importe]')].map((e) => e.getAttribute('data-gofundme-importe'))`)
    const origenes = (): Promise<string[]> =>
      nav.evaluate(`[...document.querySelectorAll('[data-gofundme-importe]')].map((e) => e.getAttribute('data-gofundme-origen'))`)
    const textoPagina = (): Promise<string> => nav.evaluate('document.body.innerText')
    const pedidos = (): Promise<number> => nav.evaluate('window.__pedidos.length')
    // espera (hasta 10 s, la máquina puede ir cargada) a que TODAS las cifras de la campaña valgan `valor`
    const esperaImportes = async (valor: string) => {
      let b: string[] = []
      for (let i = 0; i < 50; i++) {
        b = await importes()
        if (b.length > 0 && b.every((v) => v === valor)) break
        await nav.sleep(200)
      }
      return b
    }
    const FECHA_DE_CIFRA = /cifra a |figure as of /
    for (const ruta of ['/', '/colabora', '/gastos', '/en']) {
      await nav.cargar(`${ruta}?fund=viva`)
      const b = await esperaImportes('12345')
      ok(b.length > 0 && b.every((v) => v === '12345'), `${ruta}: el importe de la campaña pasa a la cifra viva (12345) al montar (${b.join(', ') || 'sin importe'})`)
      ok((await origenes()).every((o) => o === 'vivo') && !FECHA_DE_CIFRA.test(await textoPagina()), `${ruta}: y con la cifra viva se va la fecha de la semilla («cifra a …») y el origen pasa a «vivo»`)
      if (ruta === '/') ok((await pedidos()) === 1, `${ruta}: el hero y la tarjeta comparten UNA petición a /fundraiser.json (${await pedidos()})`)
    }
    // una copia de la CDN anterior a T2b: sin origen (se toma por «vivo») y con un objetivo que NO debe llegar a la pantalla
    await nav.cargar('/?fund=vieja')
    const vieja = await esperaImportes('12345')
    ok(vieja.length > 0 && vieja.every((v) => v === '12345') && (await origenes()).every((o) => o === 'vivo'), '/: una respuesta sin «origen» (copia vieja de la CDN) se toma por viva')
    ok(!/777[.,\s]?777/.test(await textoPagina()), '/: y el objetivo que traiga una copia vieja de la CDN no llega a la pantalla')
    // GoFundMe no respondió: la función contesta su copia de seguridad, que es de la semilla y lo dice con SU fecha
    await nav.cargar('/?fund=semilla')
    const sem = await esperaImportes('12345')
    const fecha20 = (idioma: 'es' | 'en') => fechaDeCifra('2026-10-20T08:00:00.000Z', idioma)
    ok(sem.length > 0 && (await origenes()).every((o) => o === 'semilla') && (await textoPagina()).includes(fecha20('es')), `/: si la función contesta con su copia de seguridad, la cifra sigue siendo «semilla» y enseña SU fecha (${fecha20('es')})`)
    // A 375 px (revisión de T2b): la fecha de la cifra no se parte en «cifra a / 24 oct 2026» y la «·» no cuelga al principio ni al final de una línea.
    // Con la cifra «semilla» de la función (fecha fija del 20-oct) la fecha se ve en el hero, en la tarjeta y en la variante en línea.
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: false })
    const LINEAS = `(() => {
      // texto de cada línea de los bloques de la campaña: se agrupan los caracteres visibles por su posición vertical
      const lineas = (el) => {
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        const cs = []
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (n.parentElement.closest('.sr-only')) continue
          for (let i = 0; i < n.data.length; i++) {
            if (/\\s/.test(n.data[i]) && n.data[i] !== '\\u00a0') continue
            const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1)
            const b = r.getBoundingClientRect()
            if (b.width) cs.push({ c: n.data[i], top: Math.round(b.top) })
          }
        }
        const l = []
        for (const x of cs) { let g = l.find((y) => Math.abs(y.top - x.top) < 4); if (!g) l.push(g = { top: x.top, txt: '' }); g.txt += x.c }
        return l.sort((a, b) => a.top - b.top).map((g) => g.txt)
      }
      const bloques = [...document.querySelectorAll('.hero__support, .gfm')]
      return {
        bloques: bloques.length,
        fechas: [...document.querySelectorAll('.hero__support time, .gfm time')].map((t) => t.getClientRects().length),
        colgadas: bloques.flatMap((b) => lineas(b)).filter((t) => t.startsWith('·') || t.endsWith('·')),
        desborde: document.documentElement.scrollWidth > innerWidth,
      }
    })()`
    for (const ruta of ['/?fund=semilla', '/en?fund=semilla', '/colabora?fund=semilla', '/gastos?fund=semilla']) {
      await nav.cargar(ruta)
      await esperaImportes('12345')
      const m = (await nav.evaluate(LINEAS)) as { bloques: number; fechas: number[]; colgadas: string[]; desborde: boolean }
      ok(m.bloques > 0 && m.fechas.length > 0 && m.fechas.every((n) => n === 1), `${ruta} a 375 px: la fecha de la cifra no se parte en dos líneas (${m.fechas.length} fecha/s en ${m.bloques} bloque/s, ${m.fechas.join('+')} línea/s)`)
      ok(m.colgadas.length === 0 && !m.desborde, `${ruta} a 375 px: ninguna «·» al principio ni al final de una línea y sin scroll horizontal (${m.colgadas.join(' | ') || 'ninguna'})`)
    }
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false })
    // navegar dentro del sitio: al volver a una página con la tarjeta tras pasar por otra sin ella, Nuxt la monta
    // con la cifra del payload prerenderizado (la del build) aunque se acabe de traer la viva
    await nav.cargar('/?fund=viva')
    await esperaImportes('12345')
    for (const destino of ['/colabora', '/equipo', '/colabora', '/gastos']) {
      await nav.evaluate(`document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.push('${destino}')`)
      if (destino === '/equipo') { await nav.sleep(1500); continue }
      const b = await esperaImportes('12345')
      ok(b.length > 0 && b.every((v) => v === '12345'), `navegando por el sitio a ${destino}: el importe vuelve a mostrar la cifra viva (${b.join(', ') || 'sin importe'})`)
    }
    if (existsSync('seed/fundraiser.json')) {
      const semilla = String((JSON.parse(readFileSync('seed/fundraiser.json', 'utf-8')) as { currentAmount: { amount: number } }).currentAmount.amount)
      for (const ruta of ['/', '/colabora']) {
        await nav.cargar(`${ruta}?fund=caida`)
        for (let i = 0; i < 25 && (await pedidos()) === 0; i++) await nav.sleep(200)
        await nav.sleep(800)
        const b = await importes()
        ok((await pedidos()) >= 1 && b.length > 0 && b.every((v) => v === semilla), `${ruta}: si /fundraiser.json falla, el importe conserva la cifra del build (${b.join(', ') || 'sin importe'}; ${await pedidos()} petición/es)`)
        ok((await origenes()).every((o) => o === 'semilla') && FECHA_DE_CIFRA.test(await textoPagina()), `${ruta}: y sigue diciendo que es la cifra del build, con su fecha`)
      }
    } else {
      console.log('  ⚠️  sin seed/fundraiser.json: se omite «si /fundraiser.json falla, el importe conserva la cifra del build»')
    }
  } finally {
    await nav.cerrar()
  }
}

// 8
{
  const seBusca = (JSON.parse(readFileSync('app/data/caso.json', 'utf-8')) as { se_busca: { valor: { es: string; en: string } }[] }).se_busca
  const publicas = peticionesPublicas(seBusca as never)
  const CLAVES = ['ensayo-post-tb06', 'laboratorio-neoantigenos', 'radiologia-higado', 'hla', 'ihc-dianas']

  // la fuente: cada regla casa con UN elemento (ni con ninguno, ni con dos) y salen las 5, en orden
  for (const r of REGLAS_PETICIONES) {
    const n = seBusca.filter((b) => r.huella.test(b.valor.es)).length
    ok(n === 1, `se_busca: la huella de «${r.clave}» casa con un solo elemento (casa con ${n})`)
  }
  ok(JSON.stringify(publicas.map((p) => p.clave)) === JSON.stringify(CLAVES), `se publican las 5 peticiones aprobadas, por prioridad (${publicas.map((p) => p.clave).join(' · ')})`)
  const SIN_GATE = /FoundationOne|hipoproliferativa|hypoproliferative/
  ok(!publicas.some((p) => SIN_GATE.test(p.valor.es) || SIN_GATE.test(p.valor.en)), 'ni la FoundationOne ni la anemia (6.ª y 7.ª, pendientes de su gate) están entre las publicadas')
  // el componente: tope y filtro
  ok(JSON.stringify(seleccionarPeticiones(publicas, { limite: 3 }).map((p) => p.clave)) === JSON.stringify(CLAVES.slice(0, 3)), 'con límite 3 salen las 3 de mayor prioridad')
  ok(JSON.stringify(seleccionarPeticiones(publicas, { filtro: ['hla', 'ihc'], limite: 1 }).map((p) => p.clave)) === JSON.stringify(['hla']), 'el filtro por tema se aplica antes del límite')
  ok(seleccionarPeticiones(publicas).length === 5 && seleccionarPeticiones(publicas, { limite: 0 }).length === 0, 'sin opciones salen las 5; con límite 0, ninguna')

  // el enlace «Ver todo lo que buscamos»: la regla…
  ok(hayEnlaceTodas(undefined, 3, 5) === true, 'enlace «Ver todo»: con límite 3 de 5 publicadas, sale')
  ok(hayEnlaceTodas(undefined, 5, 5) === false, 'enlace «Ver todo»: si se enseñan todas (/datos), no sale')
  ok(hayEnlaceTodas(false, 3, 5) === false && hayEnlaceTodas(true, 5, 5) === true, 'enlace «Ver todo»: verTodas explícito manda (false lo quita, true lo pone)')
  // …y que el componente la deja actuar. Se compila el SFC real, se toma la declaración de su prop `verTodas` y se
  // renderiza con Vue: ausente tiene que llegar `undefined` (con `false`, la regla de arriba nunca se aplicaría).
  {
    const { descriptor } = parse(readFileSync('app/components/QueBuscamos.vue', 'utf-8'), { filename: 'QueBuscamos.vue' })
    const declaracion = compileScript(descriptor, { id: 'qb' }).content.match(/\bverTodas:\s*(\{[^}]*\})/)?.[1]
    ok(!!declaracion, `QueBuscamos: la prop verTodas está declarada (${declaracion ?? 'no se encuentra'})`)
    if (declaracion) {
      const sonda = defineComponent({ props: { verTodas: new Function(`return (${declaracion})`)() }, setup: (p) => () => h('i', String(p.verTodas)) })
      const ausente = await renderToString(createSSRApp(sonda))
      ok(ausente.includes('undefined'), `QueBuscamos: sin verTodas llega «undefined» y no «false» (${ausente})`)
    }
  }

  // lo generado, en ES y EN
  // T2a (24-oct-2026): la franja #visores salió de /datos (el índice /herramientas volvió a ser una página); #reservorio queda como una fila con un enlace
  // T2c (24-oct-2026): la historia de tratamientos y el PET con Galio-68 salieron de /ciencia y viven en /datos, entre «Evolución» y el reservorio
  const IDS = ['id="s-hoy"', 'id="que-buscamos"', 'id="s-tejido"', 'id="s-higado"', 'id="s-evo"', 'id="s-historia"', 'id="s-pet"', 'id="reservorio"', 'id="s-vitrina"']
  for (const [idioma, pagina, contacto] of [['es', 'datos.html', '/contacto?role=researcher'], ['en', 'en/data.html', '/en/contact?role=researcher']] as const) {
    const h = html(pagina)
    ok((h.match(/\bid="que-buscamos"/g)?.length ?? 0) === 1, `${pagina}: exactamente un id="que-buscamos"`)
    const pos = IDS.map((id) => h.indexOf(id))
    ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${pagina}: orden Hoy → Qué buscamos → Tejido → Carga tumoral → Evolución → Historia de tratamientos → PET Ga-68 → reservorio → vitrina (${pos.join(' < ')})`)
    ok(!h.includes('id="visores"') && !h.includes('href="#visores"'), `${pagina}: ya no lleva la franja #visores ni su chip (volvió a /herramientas)`)
    const bloque = h.slice(h.indexOf('id="que-buscamos"'), h.indexOf('id="s-tejido"'))
    ok((bloque.match(/<li\b/g)?.length ?? 0) === 5, `${pagina}: «Qué buscamos» pinta 5 peticiones (${bloque.match(/<li\b/g)?.length ?? 0})`)
    ok(!/<details\b/.test(bloque), `${pagina}: sin plegar: ninguna petición queda dentro de un <details>`)
    const puestos = publicas.map((p) => bloque.indexOf(p.valor[idioma].slice(0, 24)))
    ok(puestos.every((q, i) => q >= 0 && (i === 0 || q > puestos[i - 1]!)), `${pagina}: las 5 peticiones salen en el orden de prioridad (${puestos.join(' < ')})`)
    ok(!SIN_GATE.test(bloque), `${pagina}: ni la FoundationOne ni la anemia en «Qué buscamos»`)
    ok(bloque.includes(`href="${contacto}"`), `${pagina}: «Escríbenos» va a ${contacto}, sin correo directo`)
    ok(!/mailto:/.test(bloque), `${pagina}: ningún mailto: en «Qué buscamos»`)
    ok(h.includes('href="#que-buscamos"'), `${pagina}: la barra de secciones tiene su chip «Qué buscamos»`)
  }
}

// 9
{
  const limpio = (ruta: string) => html(ruta).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  type Enlace = { href: string; actual?: string; texto: string }
  const enlaces = (trozo: string): Enlace[] =>
    [...trozo.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
      href: /\bhref="([^"]*)"/.exec(m[1]!)?.[1] ?? '',
      actual: /\baria-current="([^"]+)"/.exec(m[1]!)?.[1],
      texto: m[2]!.replace(/<span class="sr-only"[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim(),
    }))
  const bloque = (h: string, re: RegExp) => h.match(re)?.[0] ?? ''
  const cabecera = (h: string) => bloque(h, /<div class="sticky top-0 z-50"[\s\S]*?<\/header>/)
  const pie = (h: string) => bloque(h, /<footer\b[\s\S]*?<\/footer>/)
  const menu = (h: string, etiqueta: string) => bloque(cabecera(h), new RegExp(`<nav\\b[^>]*aria-label="${etiqueta}"[\\s\\S]*?</nav>`))

  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (locale: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[locale]) as string
  const etiqueta = (locale: 'es' | 'en', e: EnlaceNav) => t(locale, e.etiqueta ?? `nav.${e.key}`)
  const RUTA: Record<'es' | 'en', Record<string, string>> = {
    es: { index: '/', ciencia: '/ciencia', 'ciencia-evidencia': '/ciencia/evidencia', timeline: '/timeline', equipo: '/equipo', herramientas: '/herramientas', datos: '/datos', lesiones: '/lesiones', laminillas: '/laminillas', 'celula-a-celula': '/celula-a-celula', 'celula-a-celula-explorar': '/celula-a-celula/explorar', colabora: '/colabora', prensa: '/prensa', gastos: '/gastos', contacto: '/contacto', 'aviso-legal': '/aviso-legal', privacidad: '/privacidad', cookies: '/cookies' },
    en: { index: '/en', ciencia: '/en/science', 'ciencia-evidencia': '/en/science/evidence', timeline: '/en/timeline', equipo: '/en/team', herramientas: '/en/tools', datos: '/en/data', lesiones: '/en/lesiones', laminillas: '/en/slides', 'celula-a-celula': '/en/cell-by-cell', 'celula-a-celula-explorar': '/en/cell-by-cell/explore', colabora: '/en/collaborate', prensa: '/en/press', gastos: '/en/expenses', contacto: '/en/contact', 'aviso-legal': '/en/legal-notice', privacidad: '/en/privacy', cookies: '/en/cookies-policy' },
  }
  const abierto = estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real'
  const visible = (e: EnlaceNav) => e.key !== 'cell_explorer' || abierto

  // — la fuente (navegacion.ts)
  ok(JSON.stringify(MENU_ESCRITORIO.map((e) => e.key)) === JSON.stringify(['science', 'tools', 'timeline', 'team', 'collaborate']), 'menú: La ciencia · Herramientas · Cronología · Equipo · Cómo ayudar (T2a: «Herramientas» vuelve al hueco de «Datos»; la key sigue siendo tools)')
  ok(MENU_MOVIL.length === 6 && MENU_MOVIL[0]!.key === 'home' && MENU_MOVIL.slice(1).every((e, i) => e === MENU_ESCRITORIO[i]), 'menú móvil: Inicio primero y luego los mismos cinco')
  ok(PIE.flatMap((g) => g.enlaces).length === 14 && JSON.stringify(PIE.map((g) => g.enlaces.length)) === JSON.stringify([4, 6, 4]), 'pie: 14 enlaces de navegación en 3 columnas (4 + 6 + 4)')
  ok(JSON.stringify(PIE.find((g) => g.id === 'herramientas')?.enlaces.map((e) => e.key)) === JSON.stringify(['tools', ...HERRAMIENTAS.map((h) => h.key)]), 'pie: la columna «Herramientas» abre con «Todas las herramientas» y sigue con HERRAMIENTAS, en su orden')
  ok(!('data' in SECCIONES) && JSON.stringify(SECCIONES.tools) === JSON.stringify(['herramientas', 'datos', 'lesiones', 'laminillas', 'celula-a-celula', 'celula-a-celula-explorar', 'mapa-metastasis', 'reservorio']), 'SECCIONES: «data» desaparece y «tools» recoge el índice y las siete herramientas, con el índice la primera (es la raíz: aria-current="page")')
  ok(SECCIONES.timeline!.join() === 'timeline,historia', 'SECCIONES: /historia cuelga de la cronología')
  const fuera = ['historia-slug', 'ciencia-slug'].filter((n) => Object.values(SECCIONES).some((l) => l.includes(n)))
  ok(fuera.length === 0, `SECCIONES: la ruta de capítulos de /historia y la de artículos de ciencia siguen sin existir${fuera.length ? ` (siguen: ${fuera.join(', ')})` : ''}`)
  ok(JSON.stringify(HERRAMIENTAS_PASADAS.map((e) => e.key)) === JSON.stringify(['map', 'port']), 'HERRAMIENTAS_PASADAS: el mapa de metástasis y el reservorio')
  ok(JSON.stringify(SALIDA_HERRAMIENTA) === JSON.stringify(['datos', 'laminillas', 'celula-a-celula', 'celula-a-celula-explorar', 'mapa-metastasis', 'reservorio']), 'SALIDA_HERRAMIENTA: las herramientas menos el índice y /lesiones (que ya tiene su cierre de apoyo)')
  ok(MENU_ESCRITORIO.every((e) => e.key in SECCIONES), 'cada ítem del menú tiene su sección')
  ok(REDES.length === 5 && new Set(REDES.map((r) => r.id)).size === 5 && new Set(REDES.map((r) => r.url)).size === 5 && REDES.every((r) => r.url.startsWith('https://') && r.url.includes('miriamgonp')), 'REDES: 5 redes distintas, https, de @miriamgonp')

  for (const loc of ['es', 'en'] as const) {
    const home = loc === 'es' ? 'index.html' : 'en.html'
    const R = RUTA[loc]
    // — el menú
    const m = enlaces(menu(limpio(home), t(loc, 'nav.main_label')))
    ok(JSON.stringify(m.map((e) => e.texto)) === JSON.stringify(MENU_ESCRITORIO.map((e) => etiqueta(loc, e))), `${home}: el menú dice ${m.map((e) => e.texto).join(' · ')}`)
    ok(JSON.stringify(m.map((e) => e.href)) === JSON.stringify(MENU_ESCRITORIO.map((e) => R[e.name])), `${home}: y lleva a ${m.map((e) => e.href).join(' · ')}`)
    // La sección se marca por nombre de ruta: el índice marca «Herramientas» (page) y cada herramienta, también (true); /historia marca la cronología.
    const marcada = (pagina: string) => enlaces(menu(limpio(pagina), t(loc, 'nav.main_label'))).filter((e) => e.actual).map((e) => `${e.texto}=${e.actual}`)
    const pag = (es: string, en: string) => (loc === 'es' ? es : en)
    const herr = t(loc, 'nav.tools')
    ok(JSON.stringify(marcada(pag('herramientas.html', 'en/tools.html'))) === JSON.stringify([`${herr}=page`]), `${pag('herramientas.html', 'en/tools.html')}: marca «${herr}» (page)`)
    for (const [es, en] of [['datos.html', 'en/data.html'], ['lesiones.html', 'en/lesiones.html'], ['laminillas.html', 'en/slides.html'], ['celula-a-celula.html', 'en/cell-by-cell.html'], ['mapa-metastasis.html', 'en/mapa-metastasis.html'], ['reservorio.html', 'en/reservorio.html']]) {
      ok(JSON.stringify(marcada(pag(es, en))) === JSON.stringify([`${herr}=true`]), `${pag(es, en)}: marca «${herr}» (true), como sección`)
    }
    ok(JSON.stringify(marcada(pag('timeline.html', 'en/timeline.html'))) === JSON.stringify([`${t(loc, 'nav.timeline')}=page`]), `${pag('timeline.html', 'en/timeline.html')}: marca la cronología`)
    ok(JSON.stringify(marcada(pag('historia.html', 'en/story.html'))) === JSON.stringify([`${t(loc, 'nav.timeline')}=true`]), `${pag('historia.html', 'en/story.html')}: marca la cronología (true): la historia cuelga de ella`)
    ok(existsSync(join(PUB, pag('herramientas.html', 'en/tools.html'))), `${pag('herramientas.html', 'en/tools.html')}: existe (T2a la devolvió a la vida)`)

    // — el pie
    const f = pie(limpio(home))
    const grupos = [...f.matchAll(/<h3 id="pie-([a-z]+)"[^>]*>([^<]*)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((g) => ({ id: g[1]!, titulo: g[2]!, links: enlaces(g[3]!) }))
    ok(JSON.stringify(grupos.map((g) => g.id)) === JSON.stringify(['caso', 'herramientas', 'participa', 'redes', 'legal']), `${home}: el pie tiene 5 columnas: ${grupos.map((g) => g.id).join(' · ')}`)
    for (const g of PIE) {
      const real = grupos.find((x) => x.id === g.id)
      const esperados = g.enlaces.filter(visible)
      ok(!!real && JSON.stringify(real.links.map((e) => e.texto)) === JSON.stringify(esperados.map((e) => etiqueta(loc, e))), `${home} · ${g.id}: ${real?.links.map((e) => e.texto).join(' · ')}`)
      ok(!!real && JSON.stringify(real.links.map((e) => e.href)) === JSON.stringify(esperados.map((e) => R[e.name])), `${home} · ${g.id}: los destinos son los de navegacion.ts`)
      ok(!!real && real.titulo === t(loc, g.heading), `${home} · ${g.id}: el título de la columna es «${t(loc, g.heading)}»`)
    }
    const redes = grupos.find((g) => g.id === 'redes')
    ok(!!redes && JSON.stringify(redes.links.map((e) => e.href)) === JSON.stringify([...REDES.map((r) => r.url), 'https://gofund.me/3e25cae99']), `${home} · redes: las 5 de REDES y, al final, la campaña`)
    ok(!!redes && JSON.stringify(redes.links.slice(0, 5).map((e) => e.texto)) === JSON.stringify(REDES.map((r) => r.pie ?? r.nombre)), `${home} · redes: ${redes?.links.slice(0, 5).map((e) => e.texto).join(' · ')}`)
    const legal = grupos.find((g) => g.id === 'legal')
    ok(!!legal && JSON.stringify(legal.links.map((e) => e.href)) === JSON.stringify(LEGAL.map((l) => R[l.name])) && JSON.stringify(legal.links.map((e) => e.texto)) === JSON.stringify(LEGAL.map((l) => t(loc, l.etiqueta))), `${home} · legal: ${legal?.links.map((e) => e.texto).join(' · ')}`)
    const salidos = (loc === 'es' ? ['/historia', '/videos', '/marcas', '/reservorio', '/mapa-metastasis'] : ['/en/story', '/en/videos', '/en/brands', '/en/reservorio', '/en/mapa-metastasis'])
    const hrefsPie = enlaces(f).map((e) => e.href)
    ok(salidos.every((r) => !hrefsPie.includes(r)), `${home}: el pie no enlaza ${salidos.join(', ')} (las pasadas van en el índice)`)
    ok(!/pathway-chip|<time\b|data-pie-fecha/.test(f), `${home}: el pie no lleva chips «por perfil» ni fecha`)
    ok(f.includes(t(loc, 'nav.all_tools')) && hrefsPie.includes(R.herramientas!), `${home}: y sí «${t(loc, 'nav.all_tools')}» → ${R.herramientas}`)
    ok(new RegExp(`<section[^>]*aria-label="${t(loc, 'index.supported_by')}"`).test(f) && !new RegExp(`>\\s*${t(loc, 'index.supported_by')}\\s*<`).test(f), `${home}: los logos «${t(loc, 'index.supported_by')}» van sin rótulo visible y con su nombre accesible`)
    // T2a (24-oct-2026): el selector de idioma está SIEMPRE en la cabecera, también en móvil (antes, bajo `sm`, solo dentro del menú desplegable)
    const grupoIdiomaNormal = cabecera(limpio(home)).match(/<div\b[^>]*role="group"[^>]*>/)?.[0] ?? ''
    const clasesNormal = (/class="([^"]*)"/.exec(grupoIdiomaNormal)?.[1] ?? '').split(/\s+/)
    ok(clasesNormal.includes('flex') && !clasesNormal.includes('hidden') && !clasesNormal.some((c) => /^(sm|md|lg):hidden$/.test(c)), `${home}: el selector de idioma está en la cabecera a todos los anchos (clases: ${clasesNormal.slice(0, 3).join(' ')}…)`)
  }

  // — las redes, de una sola lista, en los tres sitios
  {
    const raw = html('index.html')
    const jsonld = [...raw.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((x) => x[1]!).join('\n')
    ok(REDES.every((r) => jsonld.includes(r.url)), 'schema.org: las 5 redes en sameAs (Organization y Person)')
    ok((jsonld.match(/https:\/\/github\.com\/beyondtheprotocol\/miriam-gonzalez-case/g)?.length ?? 0) >= 1, 'schema.org: el repo sigue en el sameAs de la organización')
    const c = enlaces(limpio('colabora.html'))
    ok(REDES.every((r) => c.some((e) => e.href === r.url && e.texto === `@miriamgonp · ${r.nombre}`)), '/colabora: sus enlaces rápidos a las 5 redes, con el rótulo de siempre («@miriamgonp · X»…)')
  }

  // — chrome mínimo: /links y /gracias
  for (const [pagina, loc] of [['links.html', 'es'], ['en/links.html', 'en'], ['gracias.html', 'es'], ['en/thank-you.html', 'en']] as const) {
    const h = limpio(pagina)
    const cab = cabecera(h), f = pie(h)
    ok(!/<nav\b/.test(cab) && !cab.includes('aria-controls="mobile-nav"'), `${pagina}: la cabecera no lleva menú ni botón de menú`)
    ok(!h.includes('latest-bar'), `${pagina}: sin la barra «lo último»`)
    const grupoIdioma = cab.match(/<div\b[^>]*role="group"[^>]*>/)?.[0] ?? ''
    const clasesIdioma = (/class="([^"]*)"/.exec(grupoIdioma)?.[1] ?? '').split(/\s+/)
    ok(clasesIdioma.includes('flex') && !clasesIdioma.includes('hidden'), `${pagina}: el selector de idioma está en la cabecera también en móvil (clases: ${clasesIdioma.slice(0, 2).join(' ')}…)`)
    const hrefs = enlaces(f).map((e) => e.href)
    ok(REDES.every((r) => hrefs.includes(r.url)) && LEGAL.every((l) => hrefs.includes(RUTA[loc][l.name]!)), `${pagina}: el pie reducido lleva las 5 redes y lo legal`)
    ok(!f.includes('id="pie-caso"') && !f.includes('logo-wall'), `${pagina}: sin columnas de navegación ni muro de logos`)
    ok(!hrefs.some((x) => x.includes('gofund.me')), `${pagina}: el pie no lleva «Apoyar»`)
    const apoyoCab = enlaces(cab).some((e) => e.href.includes('gofund.me'))
    // F6 (23-oct-2026): hasta F3 /links conservaba «Apoyar» en la cabecera porque la página aún no llevaba la campaña; ahora es su 2.ª fila
    // (§12) y la cabecera no la repite: en ninguna de las dos hay un segundo enlace a GoFundMe.
    ok(!apoyoCab, `${pagina}: sin «Apoyar» en la cabecera${pagina.includes('links') ? ' (es la 2.ª fila de la página: §12)' : ''}`)
  }
  {
    const h = limpio('datos.html')
    ok(/<nav\b/.test(cabecera(h)) && h.includes('latest-bar') && h.includes('id="pie-caso"') && h.includes('logo-wall'), 'control: /datos conserva el chrome completo (menú, barra «lo último», pie de 5 columnas y logos)')
  }
}

// 10 — las páginas fusionadas del rediseño (F4, 23-oct-2026) y las que volvieron a la vida (T2a, 24-oct-2026)
{
  const limpio = (ruta: string) => html(ruta).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const decodifica = (x: string) => x.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  const texto = (trozo: string) => decodifica(trozo.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const principal = (ruta: string) => limpio(ruta).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? ''
  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
  const P = {
    es: { datos: 'datos.html', lesiones: 'lesiones.html', laminillas: 'laminillas.html', celula: 'celula-a-celula.html', explorar: 'celula-a-celula/explorar.html', mapa: 'mapa-metastasis.html', reservorio: 'reservorio.html', herramientas: 'herramientas.html', historia: 'historia.html', ciencia: 'ciencia.html', prensa: 'prensa.html', timeline: 'timeline.html', home: 'index.html', links: 'links.html' },
    en: { datos: 'en/data.html', lesiones: 'en/lesiones.html', laminillas: 'en/slides.html', celula: 'en/cell-by-cell.html', explorar: 'en/cell-by-cell/explore.html', mapa: 'en/mapa-metastasis.html', reservorio: 'en/reservorio.html', herramientas: 'en/tools.html', historia: 'en/story.html', ciencia: 'en/science.html', prensa: 'en/press.html', timeline: 'en/timeline.html', home: 'en.html', links: 'en/links.html' },
  } as const
  const RUTA = {
    es: { tools: '/herramientas', lesions: '/lesiones', slides: '/laminillas', cell_by_cell: '/celula-a-celula', cell_explorer: '/celula-a-celula/explorar', data: '/datos', map: '/mapa-metastasis', port: '/reservorio', inicio: '/', prensa: '/prensa', contacto: '/contacto', timeline: '/timeline', ciencia: '/ciencia', prensaVideo: '/prensa#video' },
    en: { tools: '/en/tools', lesions: '/en/lesiones', slides: '/en/slides', cell_by_cell: '/en/cell-by-cell', cell_explorer: '/en/cell-by-cell/explore', data: '/en/data', map: '/en/mapa-metastasis', port: '/en/reservorio', inicio: '/en', prensa: '/en/press', contacto: '/en/contact', timeline: '/en/timeline', ciencia: '/en/science', prensaVideo: '/en/press#video' },
  } as const
  const GOFUNDME = 'https://gofund.me/3e25cae99'
  const XABIERTO = estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real'
  const hrefsDe = (ruta: string) => [...limpio(ruta).matchAll(/<a\b([^>]*)>/g)].map((m) => /\bhref="([^"]*)"/.exec(m[1]!)?.[1])
  const robotsDe = (f: string) => html(f).match(/<meta\b[^>]*\bname="robots"[^>]*>/gi)?.join(' ') ?? ''
  const unaVez = (haystack: string, aguja: string) => haystack.split(aguja).length - 1 === 1

  // a) viven las ocho (T2a) y siguen sin existir las que son solo redirect
  const VIVAS = ['herramientas', 'reservorio', 'historia', 'mapa-metastasis', 'en/tools', 'en/reservorio', 'en/story', 'en/mapa-metastasis']
  const muertas = VIVAS.filter((r) => !existsSync(join(PUB, `${r}.html`)))
  ok(muertas.length === 0, `están generadas /herramientas, /reservorio, /historia y el mapa, en ES y EN${muertas.length ? ` (faltan: ${muertas.join(', ')})` : ''}`)
  const RETIRADAS = ['historia/01-el-comienzo', 'videos', 'en/herramientas', 'en/historia', 'en/story/01-the-beginning', 'en/historia/01-el-comienzo', 'en/videos']
  const quedan = RETIRADAS.filter((r) => existsSync(join(PUB, `${r}.html`)) || existsSync(join(PUB, r, 'index.html')))
  ok(quedan.length === 0, `lo que solo es un redirect NO está generado (su .html sombrearía el redirect)${quedan.length ? `: ${quedan.join(', ')}` : ''}`)
  ok(existsSync(join(PUB, 'reservorio')) && existsSync(join(PUB, 'videos', 'como-funciona-un-adc.mp4')), 'public/reservorio/ (las mallas) y public/videos/ siguen ahí, junto a reservorio.html: conviven (así estaban en producción antes de F4)')

  // b) nada enlaza a lo que ya no existe, y ningún <a> se queda sin href (una miga a una ruta que no existe se pinta así)
  const MUERTA_HREF = /^\/(?:videos|historia\/01-el-comienzo)(?:[/#?]|$)|^\/en\/(?:herramientas|historia|videos|story\/01-the-beginning|historia\/01-el-comienzo)(?:[/#?]|$)/
  const malos: string[] = [], sinHref: string[] = []
  for (const f of paginasNuxt) {
    for (const href of hrefsDe(f)) {
      if (href === undefined) sinHref.push(f)
      else if (MUERTA_HREF.test(href)) malos.push(`${f} → ${href}`)
    }
  }
  ok(malos.length === 0, `ninguna página enlaza a /videos, a los capítulos de /historia ni a las variantes /en/herramientas y /en/historia${malos.length ? `: ${malos.slice(0, 6).join(' · ')}` : ''}`)
  ok(sinHref.length === 0, `ningún <a> sin href en ${paginasNuxt.length} páginas${sinHref.length ? `: ${[...new Set(sinHref)].join(', ')}` : ''}`)
  // la decisión 6 (24-oct-2026): «PAC acortado a tronco innominado» se cita en español y NO se glosa en inglés como «innominate trunk»
  const conTronco = paginasNuxt.filter((f) => /innominate trunk/i.test(html(f)))
  ok(conTronco.length === 0, `ninguna página generada dice «innominate trunk»${conTronco.length ? ` (${conTronco.join(', ')})` : ''}`)

  for (const loc of ['es', 'en'] as const) {
    const R = RUTA[loc]
    // c) las migas «← Herramientas» de las seis herramientas vuelven al índice, que existe (celula* se resuelven solas al volver la ruta)
    for (const f of [P[loc].lesiones, P[loc].laminillas, P[loc].mapa, P[loc].reservorio, P[loc].celula, P[loc].explorar]) {
      // dentro de <main>: el ítem «Herramientas» del menú también lleva a ${R.tools}, y no es la miga
      const enl = [...principal(f).matchAll(/<a\b([^>]*\bhref="([^"]*)"[^>]*)>([\s\S]*?)<\/a>/g)].filter((m) => m[2] === R.tools && texto(m[3]!) === t(loc, 'nav.tools'))
      ok(enl.length === 1, `${f}: su miga «${t(loc, 'nav.tools')}» → ${R.tools} (${enl.length})`)
    }
    ok(!hrefsDe(P[loc].datos).some((h) => h?.includes('#visores')), `${P[loc].datos}: ningún enlace a #visores (la franja salió de /datos)`)

    // d) /datos: una fila «Todas las herramientas» y otra al reservorio; ni franja ni bloque plegado
    {
      const f = P[loc].datos
      const h = limpio(f)
      ok((h.match(/\bid="reservorio"/g)?.length ?? 0) === 1, `${f}: exactamente un id="reservorio" (los enlaces de fuera que ya lo usaban siguen aterrizando)`)
      const A = h.indexOf('id="reservorio"'), C = h.indexOf('id="s-vitrina"')
      const bloque = h.slice(h.lastIndexOf('<section', A), C)
      const enlaces = [...bloque.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], texto: texto(m[2]!) }))
      ok(enlaces.length === 1 && enlaces[0]!.href === R.port && enlaces[0]!.texto === (loc === 'es' ? 'El reservorio: qué es y por qué se cambió' : 'The port: what it is and why it was replaced'), `${f}: el reservorio es un enlace a ${R.port} con el H1 de su página (${enlaces.map((e) => e.href).join(', ')})`)
      ok(!/<details\b/.test(bloque) && !/150[.,]8|PAC acortado|port-a-cath|catheter length|longitud del catéter/i.test(texto(bloque)), `${f}: sin el bloque plegado ni las medidas (viven en ${R.port})`)
      const filas = [...principal(f).matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter((m) => m[1] === R.tools && texto(m[2]!) === t(loc, 'nav.all_tools'))
      ok(filas.length === 1, `${f}: una fila «${t(loc, 'nav.all_tools')}» → ${R.tools} (${filas.length})`)
    }

    // e) el mapa de metástasis: público e indexable, rotulado, con la línea de Miriam arriba
    {
      const f = P[loc].mapa
      const meta = robotsDe(f)
      ok(!/noindex/i.test(meta) && /index/i.test(meta), `${f}: robots dice index (${meta.match(/content="([^"]*)"/)?.[1] ?? 'sin meta'}): ya no es noindex`)
      const main = principal(f)
      ok(texto(main).includes(t(loc, 'herramientas.historico_mapa')), `${f}: lleva su rótulo «${t(loc, 'herramientas.historico_mapa')}»`)
      const aviso = [...main.matchAll(/<div\b[^>]*role="note"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => texto(m[1]!)).find((x) => x.includes(t(loc, 'herramientas.pasada_titulo')))
      ok(!!aviso && aviso.includes(t(loc, 'herramientas.linea_mapa')), `${f}: lleva arriba la línea de Miriam (cuándo se hizo y para qué sirvió), tal cual`)
      ok(main.indexOf(t(loc, 'herramientas.pasada_titulo')) > 0 && main.indexOf(t(loc, 'herramientas.pasada_titulo')) < main.indexOf(loc === 'es' ? 'Foto de marzo a junio de 2026' : 'Snapshot from March to June 2026'), `${f}: y va antes que el detalle de la foto de marzo a junio`)
      ok((main.match(/<h1\b/g)?.length ?? 0) === 1, `${f}: sigue en 200 y con un solo <h1>`)
    }
  }
  ok(!/Disallow:\s*\/(?:en\/)?(?:mapa-metastasis|herramientas|tools|reservorio|historia|story)/.test(readFileSync('public/_robots.txt', 'utf-8')), 'public/_robots.txt no bloquea el mapa ni las páginas que volvieron')

  // f) /herramientas: dos grupos, tarjetas con el mismo orden fijo, y tres puertas
  {
    const publicas = peticionesPublicas((JSON.parse(readFileSync('app/data/caso.json', 'utf-8')) as { se_busca: never[] }).se_busca)
    const visibles = HERRAMIENTAS.filter((h) => h.key !== 'cell_explorer' || XABIERTO)
    for (const loc of ['es', 'en'] as const) {
      const R = RUTA[loc]
      const f = P[loc].herramientas
      const main = principal(f)
      const meta = robotsDe(f)
      ok(!/noindex/i.test(meta), `${f}: indexable`)
      ok(unaVez(main, '<h1') && texto(main.match(/<h1\b[\s\S]*?<\/h1>/)?.[0] ?? '') === t(loc, 'herramientas.title'), `${f}: un solo <h1>, «${t(loc, 'herramientas.title')}» (el publicado)`)
      const cab = texto(main.slice(0, main.indexOf('id="h-ahora"')))
      ok(cab.includes(t(loc, 'herramientas.eyebrow')) && cab.includes(`${t(loc, 'herramientas.apertura')} ${t(loc, 'herramientas.apertura_cada_una')}`), `${f}: lleva la frase de apertura y «${t(loc, 'herramientas.eyebrow')}»`)
      const h2 = [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => texto(m[1]!))
      ok(JSON.stringify(h2) === JSON.stringify([t(loc, 'herramientas.grupo_ahora'), t(loc, 'herramientas.grupo_pasadas'), t(loc, 'home.puertas_heading')]), `${f}: los grupos son «${t(loc, 'herramientas.grupo_ahora')}» y «${t(loc, 'herramientas.grupo_pasadas')}», y luego las puertas (${h2.join(' · ')})`)
      const tarjetas = [...main.matchAll(/<article\b([^>]*)aria-labelledby="herr-([a-z_]+)-t"([^>]*)>([\s\S]*?)<\/article>/g)].map((m) => ({ clave: m[2]!, attrs: `${m[1]}${m[3]}`, cuerpo: m[4]! }))
      const ahora = tarjetas.filter((x) => !['map', 'port'].includes(x.clave)), pasadas = tarjetas.filter((x) => ['map', 'port'].includes(x.clave))
      ok(JSON.stringify(ahora.map((x) => x.clave)) === JSON.stringify(visibles.map((h) => h.key)), `${f}: «Las de ahora», en el orden de HERRAMIENTAS (${ahora.map((x) => x.clave).join(' · ')})`)
      ok(JSON.stringify(pasadas.map((x) => x.clave)) === JSON.stringify(HERRAMIENTAS_PASADAS.map((h) => h.key)), `${f}: «${t(loc, 'herramientas.grupo_pasadas')}»: el mapa y el reservorio (${pasadas.map((x) => x.clave).join(' · ')})`)
      ok(!/<a\b[^>]*>\s*<article\b/.test(main), `${f}: ninguna tarjeta es un enlace envolvente (lleva un <details> dentro)`)
      ok(main.split('card-marked').length - 1 === 1 && ahora.find((x) => x.attrs.includes('card-marked'))?.clave === 'cell_by_cell', `${f}: una sola tarjeta destacada, la de «Lo último» (célula a célula)`)

      for (const h of visibles) {
        const x = ahora.find((y) => y.clave === h.key)!
        const cuerpo = texto(x.cuerpo)
        const [titulo, descripcion] = copyHerramienta(h.key, loc)
        ok(cuerpo.includes(titulo) && cuerpo.includes(descripcion), `${f} · ${h.key}: título y descripción ya publicados, palabra por palabra`)
        ok(cuerpo.startsWith(t(loc, PARA_HERRAMIENTA[h.key]!)), `${f} · ${h.key}: abre con su etiqueta «${t(loc, PARA_HERRAMIENTA[h.key]!)}» (mismo orden en todas: etiqueta, título, descripción, qué buscamos, botones)`)
        ok(cuerpo.includes(t(loc, 'home.tools_new')) === (h.key === 'cell_by_cell'), `${f} · ${h.key}: ${h.key === 'cell_by_cell' ? 'lleva' : 'no lleva'} «${t(loc, 'home.tools_new')}»`)
        const botones = [...x.cuerpo.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*class="(btn-[a-z]+)"[^>]*>/g)].map((m) => `${m[2]} ${m[1]}`)
        ok(botones.join() === `btn-dark ${R[h.key as 'lesions']},btn-secondary ${R.contacto}?role=${ROL_HERRAMIENTA[h.key]}`, `${f} · ${h.key}: «${t(loc, 'herramientas.abrir')}» → ${R[h.key as 'lesions']} y «${t(loc, 'home.buscamos_escribir')}» con el rol ${ROL_HERRAMIENTA[h.key]} (${botones.join(' | ')})`)
        const temas = TEMAS_HERRAMIENTA[h.key] ?? []
        const esperadas = publicas.filter((p) => temas.includes(p.tema))
        const det = /<details\b([^>]*)>([\s\S]*?)<\/details>/.exec(x.cuerpo)
        if (temas.length) {
          const items = [...(det?.[2] ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => texto(m[1]!))
          ok(!!det && !/\bopen\b/.test(det[1]!) && items.length === esperadas.length && esperadas.every((p, i) => items[i]?.startsWith(txtCaso(p.valor, loc).slice(0, 40))), `${f} · ${h.key}: «${t(loc, 'home.buscamos_heading')}» plegado, con sus ${esperadas.length} petición(es) por tema (${temas.join('/')}), tal cual y por prioridad`)
        } else {
          ok(!det && x.cuerpo.includes(`href="${R.data}#que-buscamos"`) && cuerpo.includes(t(loc, 'home.buscamos_todas')), `${f} · ${h.key}: sin tema propio: enlaza a «${t(loc, 'home.buscamos_todas')}» (${R.data}#que-buscamos), sin inventar una petición nueva`)
        }
      }
      for (const [clave, rotulo, linea] of [['map', 'herramientas.historico_mapa', 'herramientas.linea_mapa'], ['port', 'herramientas.historico_port', 'herramientas.linea_port']] as const) {
        const x = pasadas.find((y) => y.clave === clave)!
        const cuerpo = texto(x.cuerpo)
        ok(cuerpo.startsWith(t(loc, rotulo)) && cuerpo.includes(copyHerramienta(clave, loc)[0]) && cuerpo.includes(t(loc, linea)), `${f} · ${clave}: «${t(loc, rotulo)}», su título y la línea de Miriam (cuándo y para qué), tal cual`)
        ok(!/<details\b/.test(x.cuerpo) && [...x.cuerpo.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]).join() === R[clave === 'map' ? 'map' : 'port'], `${f} · ${clave}: un solo botón, «${t(loc, 'herramientas.abrir')}» → ${R[clave === 'map' ? 'map' : 'port']}`)
      }
      // el promo de Polaris vive en /prensa#video: aquí solo se enlaza, con su título y su duración
      const promo = VIDEO_PROMO[loc]
      const enlacePromo = [...main.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].find((m) => m[1] === R.prensaVideo)
      ok(!!enlacePromo && texto(enlacePromo[2]!).includes(promo.titulo) && texto(enlacePromo[2]!).includes(`${Math.floor(promo.segundos / 60)}:${String(Math.floor(promo.segundos) % 60).padStart(2, '0')}`) && !main.includes('<video'), `${f}: enlaza al promo («${promo.titulo}») en ${R.prensaVideo}, con su duración, sin copiarlo`)
      // las tres puertas
      const puertas = main.slice(main.indexOf('id="h-puertas"'))
      const hp = [...puertas.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({ href: /\bhref="([^"]*)"/.exec(m[1]!)?.[1], clase: /class="([^"]*)"/.exec(m[1]!)?.[1] ?? '', texto: texto(m[2]!), atributos: m[1]! }))
      ok(JSON.stringify(hp.map((x) => x.href)) === JSON.stringify([`${R.contacto}?role=researcher`, R.prensa, GOFUNDME]), `${f}: tres puertas: escribir al equipo, prensa y apoyar (${hp.map((x) => x.href).join(' · ')})`)
      ok(hp[0]?.texto === t(loc, 'home.buscamos_escribir') && hp[1]?.texto === t(loc, 'nav.press') && hp[2]?.texto.startsWith(t(loc, 'nav.donate')), `${f}: con los rótulos ya publicados, sin copy nuevo`)
      ok(/\bbtn-cta\b/.test(hp[2]?.clase ?? '') && /data-support-cta/.test(hp[2]?.atributos ?? '') && /rel="noopener noreferrer"/.test(hp[2]?.atributos ?? '') && (hp[2]?.texto ?? '').includes(t(loc, 'a11y.new_tab')) && (main.match(/\bbtn-cta\b/g)?.length ?? 0) === 1, `${f}: «Apoyar» es el único botón coral, abre pestaña nueva con rel y aviso`)
      ok(!/[—]/.test(`${t(loc, 'herramientas.apertura')}${t(loc, 'herramientas.apertura_cada_una')}${t(loc, 'herramientas.grupo_ahora')}${t(loc, 'herramientas.grupo_pasadas')}`), `${f}: la copy nueva no lleva guion largo`)
    }
  }

  // g) /reservorio: vuelve con su 3D, la línea de Miriam, el motivo del recambio y las medidas leídas de caso.json
  {
    const MEDIDAS = {
      es: 'Longitud del catéter, portal→punta, en las tres fechas: 150,8 mm · 152,2 mm · 151,7 mm (± 5 mm cada medida; ± 10 mm en la diferencia entre fechas). Dentro de ese margen, es la misma medida las tres veces.',
      en: 'Catheter length, port→tip, across the three dates: 150.8 mm · 152.2 mm · 151.7 mm (± 5 mm per measurement; ± 10 mm on the difference between dates). Within that margin, it is the same measurement all three times.',
    }
    const FRASES = {
      es: 'Es una cámara pequeña que se implanta bajo la piel del pecho, unida a un catéter fino que llega hasta una vena grande, cerca del corazón. Se pincha a través de una membrana con una aguja especial, y la membrana se cierra al sacarla.',
      en: 'It’s a small chamber implanted under the skin of the chest, joined to a thin catheter that runs to a large vein near the heart. A special needle goes in through a membrane, and the membrane seals again when the needle comes out.',
    }
    const MOTIVO = {
      es: 'El informe de radiología del recambio da como motivo «PAC acortado a tronco innominado»: el catéter se quedaba corto.',
      en: 'The radiology report of the replacement gives as its reason «PAC acortado a tronco innominado» (in Spanish in the report): a short catheter that ended at the level of the innominate (brachiocephalic) vein.',
    }
    for (const loc of ['es', 'en'] as const) {
      const f = P[loc].reservorio
      const main = principal(f)
      const txt = texto(main)
      ok(!/noindex/i.test(robotsDe(f)), `${f}: indexable`)
      ok(unaVez(main, '<h1') && texto(main.match(/<h1\b[\s\S]*?<\/h1>/)?.[0] ?? '') === copyHerramienta('port', loc)[0], `${f}: un solo <h1>, «${copyHerramienta('port', loc)[0]}»`)
      const aviso = [...main.matchAll(/<div\b[^>]*role="note"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => texto(m[1]!)).find((x) => x.includes(t(loc, 'herramientas.pasada_titulo')))
      ok(!!aviso && aviso.includes(t(loc, 'herramientas.linea_port')), `${f}: lleva arriba la línea de Miriam (cuándo se usó y para qué), tal cual`)
      ok(txt.includes(FRASES[loc]), `${f}: las dos frases de «qué es un port-a-cath», tal cual estaban`)
      ok(txt.includes(MEDIDAS[loc]), `${f}: las medidas salen de caso.json y dicen lo de siempre (si caso.json cambia una cifra, esto se pone en rojo: es dato clínico)`)
      ok(txt.includes(MOTIVO[loc]), `${f}: el motivo del recambio, «PAC acortado a tronco innominado» citado en español${loc === 'en' ? ' y glosado como catéter corto que terminaba en la vena innominada (braquiocefálica)' : ''}`)
      ok(/class="visor res-visor-espera"/.test(main), `${f}: el visor 3D del catéter anterior vuelve (en el HTML sale su marco de carga, .visor; el visor es solo de cliente)`)
      ok(new RegExp(`<p class="etiqueta res-historico[^"]*"[^>]*>${loc === 'es' ? 'Histórico' : 'Archive'}</p>`).test(main), `${f}: el 3D lleva su rótulo «${loc === 'es' ? 'Histórico' : 'Archive'}» (la etiqueta mono del sistema, no la píldora vieja)`)
      const h2 = [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => texto(m[1]!))
      ok(h2.length === 4 && h2.every((x) => x.length > 0), `${f}: cuatro capítulos con su <h2> (${h2.length})`)
    }
  }

  // h) /historia: viva, sin redirect, con su texto de siempre y sin capítulos
  {
    for (const loc of ['es', 'en'] as const) {
      const f = P[loc].historia
      const main = principal(f)
      const txt = texto(main)
      ok(!/noindex/i.test(robotsDe(f)), `${f}: indexable`)
      ok(unaVez(main, '<h1') && texto(main.match(/<h1\b[\s\S]*?<\/h1>/)?.[0] ?? '') === t(loc, 'story.title'), `${f}: un solo <h1>, «${t(loc, 'story.title')}»`)
      ok(txt.includes(t(loc, 'historia.pending_notice')) && [1, 2, 3, 4].every((n) => txt.includes(t(loc, `historia.story_teaser_${n}`))), `${f}: el aviso y los cuatro párrafos de siempre, tal cual`)
      const h = hrefsDe(f)
      ok(h.includes(RUTA[loc].timeline) && h.includes(RUTA[loc].ciencia) && !h.some((x) => MUERTA_HREF.test(x ?? '')), `${f}: da salida a la cronología y a la ciencia, y no enlaza capítulos`)
    }
  }

  // i) vídeos: el ADC en la Cronología (dentro del hito del 7-oct, T2c, 24-oct-2026) y el promo en /prensa, con la transcripción entera
  const chequeaVideo = (f: string, v: typeof VIDEO_ADC, extra: (cuerpo: string) => void) => {
    const cuerpo = limpio(f)
    const art = [...cuerpo.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map((m) => m[0]).find((a) => a.includes(v.src))
    ok(!!art, `${f}: lleva el vídeo ${v.id}`)
    if (!art) return
    ok(/<video\b[^>]*\bpreload="none"/.test(art) && art.includes(`poster="${v.poster}"`) && /<video\b[^>]*\bcontrols/.test(art), `${f}: ${v.id} con controles, sin descargar nada antes de pulsar play y con su póster`)
    ok(texto(art).includes(v.titulo) && texto(art).includes(v.descripcion), `${f}: ${v.id} con su título y su descripción`)
    ok(v.transcripcion.every((p) => texto(art).includes(p)), `${f}: ${v.id} con su transcripción entera (${v.transcripcion.length} párrafos), palabra por palabra`)
    ok(/<details\b[^>]*>\s*<summary\b/.test(art), `${f}: ${v.id} con la transcripción en un plegable`)
    extra(art)
  }
  for (const loc of ['es', 'en'] as const) {
    chequeaVideo(P[loc].timeline, VIDEO_ADC, (art) => {
      ok(loc === 'es' ? !art.includes(t('es', 'videos.voice_other')) : texto(art).includes(t('en', 'videos.voice_other')) && texto(art).includes(VIDEO_ADC.resumenEn!), `${P[loc].timeline}: ${loc === 'es' ? 'sin aviso de idioma' : 'avisa de que está narrado en español y lleva su resumen en inglés'}`)
      ok(/<h4\b/.test(art) && !/<h2\b|<h3\b/.test(art), `${P[loc].timeline}: el título del vídeo es un h4 (el del hito es un h3, sin saltarse un escalón)`)
    })
    chequeaVideo(P[loc].prensa, VIDEO_PROMO[loc], () => {})
    // el ADC va DENTRO del hito del 7-oct (<li id="adc">), con el texto del hito intacto
    const tl = limpio(P[loc].timeline)
    const hito = tl.match(/<li\b[^>]*\bid="adc"[^>]*>[\s\S]*?<\/li>/)?.[0] ?? ''
    ok(unaVez(tl, 'id="adc"'), `${P[loc].timeline}: exactamente un id="adc" (el del hito del 7-oct)`)
    ok(hito.includes(VIDEO_ADC.src), `${P[loc].timeline}: el vídeo del ADC está dentro del hito con id="adc"`)
    ok(texto(hito).includes(loc === 'es' ? 'Empieza el TROPION-Breast06' : 'Starts TROPION-Breast06') && texto(hito).includes(loc === 'es' ? 'un ADC dirigido contra TROP2' : 'an ADC that targets TROP-2'), `${P[loc].timeline}: el hito del 7-oct conserva su título y su texto (el vídeo lo presenta)`)
    // y /ciencia ya no lo lleva: una casa por cosa
    ok(!limpio(P[loc].ciencia).includes(VIDEO_ADC.src) && !limpio(P[loc].ciencia).includes('como-funciona-un-adc'), `${P[loc].ciencia}: ya no lleva el vídeo del ADC (vive en ${P[loc].timeline}, hito del 7-oct)`)
    // T2a: el índice de herramientas es una página, así que «Todas las herramientas» (/ciencia, /prensa) lleva a ella
    for (const origen of [P[loc].ciencia, P[loc].prensa]) {
      const enMain = [...principal(origen).matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter((m) => texto(m[2]!).includes(t(loc, 'nav.all_tools')))
      ok(enMain.length === 1 && enMain[0]![1] === RUTA[loc].tools, `${origen}: «${t(loc, 'nav.all_tools')}» lleva a ${RUTA[loc].tools} (${enMain.map((m) => m[1]).join(', ') || 'no está'})`)
    }
  }

  // j) /timeline: la línea humana de /historia (frase ya publicada)
  for (const loc of ['es', 'en'] as const) {
    ok(texto(limpio(P[loc].timeline)).includes(t(loc, 'historia.story_teaser_1')), `${P[loc].timeline}: lleva la línea de /historia (historia.story_teaser_1), tal cual`)
  }

  // k) la salida común de las herramientas (T2a): «Apoyar a Miriam» y «Volver al inicio» al final de cada una, y en ningún otro sitio
  for (const loc of ['es', 'en'] as const) {
    const R = RUTA[loc]
    const rotulo = t(loc, 'herramientas.salida')
    const CON = [P[loc].datos, P[loc].laminillas, P[loc].celula, P[loc].explorar, P[loc].mapa, P[loc].reservorio]
    const SIN = [P[loc].herramientas, P[loc].lesiones, P[loc].home, P[loc].ciencia, P[loc].links, P[loc].prensa, P[loc].historia, P[loc].timeline]
    for (const f of CON) {
      const main = principal(f)
      const bloque = main.match(new RegExp(`<section\\b[^>]*aria-label="${rotulo}"[^>]*>[\\s\\S]*?</section>`))?.[0] ?? ''
      const a = [...bloque.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({ href: /\bhref="([^"]*)"/.exec(m[1]!)?.[1], clase: /class="([^"]*)"/.exec(m[1]!)?.[1] ?? '', atributos: m[1]!, texto: texto(m[2]!) }))
      ok(bloque.length > 0 && unaVez(main, `aria-label="${rotulo}"`), `${f}: lleva la salida común («${rotulo}»), una vez`)
      ok(a.length === 2 && a[0]!.href === GOFUNDME && a[1]!.href === R.inicio, `${f}: con «Apoyar» (GoFundMe) y «Volver al inicio» (${R.inicio}) (${a.map((x) => x.href).join(' · ')})`)
      ok(a[0]?.texto.startsWith(t(loc, 'nav.donate')) && a[1]?.texto === t(loc, 'herramientas.salida_inicio'), `${f}: con los rótulos «${t(loc, 'nav.donate')}» y «${t(loc, 'herramientas.salida_inicio')}»`)
      ok(/\bbtn-cta\b/.test(a[0]?.clase ?? '') && /data-support-cta/.test(a[0]?.atributos ?? '') && /target="_blank"/.test(a[0]?.atributos ?? '') && /rel="noopener noreferrer"/.test(a[0]?.atributos ?? '') && (a[0]?.texto ?? '').includes(t(loc, 'a11y.new_tab')) && /\bbtn-secondary\b/.test(a[1]?.clase ?? ''), `${f}: el de apoyo es el botón coral (data-support-cta, pestaña nueva con rel y aviso) y el otro, el secundario`)
      ok(bloque.length > 0 && main.lastIndexOf('<section') === main.indexOf(bloque), `${f}: es el último bloque de <main>, tras el contenido de la página`)
    }
    for (const f of SIN) ok(!principal(f).includes(`aria-label="${rotulo}"`), `${f}: NO lleva la salida común (tiene la suya o no es una herramienta)`)
  }
}


// 11
{
  const decodificar = (t: string) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  const sinScripts = (ruta: string) => html(ruta).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const visible = (trozo: string) => decodificar(trozo.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
  const caso = JSON.parse(readFileSync('app/data/caso.json', 'utf-8')) as { generado: string; lineas: never[]; se_busca: never[] }
  const publicas = peticionesPublicas(caso.se_busca)
  const semilla = existsSync('seed/fundraiser.json') ? (JSON.parse(readFileSync('seed/fundraiser.json', 'utf-8')) as { donationCount: number; currentAmount: { amount: number; currencyCode: string }; actualizado?: string }) : null
  // lo que la decisión quitó o la regla del dinero prohíbe: ni una de estas en el texto visible de la home
  const SE_FUERON: [RegExp, string][] = [
    [/cada euro|every euro/i, '«cada euro»'], [/100\s?%/, '«100 %»'], [/sin intermediarios|no intermediar/i, '«sin intermediarios»'], [/mensual|monthly/i, '«mensual»'],
    [/recibo disponible|receipt available/i, '«recibo disponible»'], [/ultra-?raro|ultra-?rare/i, '«ultra-raro»'], [/5\+/, '«5+ especialistas»'], [/23[.,]100/, '«23.100»'],
    [/\(pronto\)|\(soon\)/i, '«(pronto)»'], [/Resumen del caso en 2 minutos|2-minute/i, 'resumen de 2 min'], [/Tómate el tiempo|Take the time/i, 'microcopy de relleno'],
    [/Sin registro\. Sin presión|No sign-up\. No pressure/i, 'microcopy de relleno'], [/dos biolog|two biolog/i, '«dos biologías» como hecho'], [/en el país que sea|wherever it is/i, 'lista de partidas del dinero'],
  ]
  const RUTA_MAPA = (loc: 'es' | 'en') => (loc === 'es' ? '/mapa-metastasis' : '/en/mapa-metastasis')
  const RUTA_PORT = (loc: 'es' | 'en') => (loc === 'es' ? '/reservorio' : '/en/reservorio')
  for (const [loc, pagina, edadTexto] of [
    ['es', 'index.html', `Miriam, ${caseData.currentAge} años, busca un tratamiento hecho a partir de su propio tumor.`],
    ['en', 'en.html', `Miriam, ${caseData.currentAge}, is looking for a treatment made from her own tumor.`],
  ] as const) {
    const crudo = html(pagina)
    const h = sinScripts(pagina)
    const main = h.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? ''
    const texto = visible(main)
    const seccion = (re: RegExp) => main.match(re)?.[0] ?? ''
    const hero = seccion(/<section class="hero\b[\s\S]*?<\/section>/)
    const campana = seccion(/<section[^>]*id="campaign"[\s\S]*?<\/section>/)
    const donde = seccion(/<section[^>]*aria-labelledby="h-donde"[\s\S]*?<\/section>/)
    const puertas = seccion(/<ul class="puertas"[\s\S]*?<\/ul>/)

    // a) estructura: 7 bloques, en orden, un h1 y un h2 por bloque
    const marcas = ['<section class="hero', 'class="prensa-tira', 'aria-labelledby="h-herramientas"', 'id="caso"', 'aria-labelledby="h-cita"', 'aria-labelledby="h-donde"', 'id="campaign"', 'aria-labelledby="h-puertas"']
    const pos = marcas.map((m) => main.indexOf(m))
    ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${pagina}: los 8 bloques, en este orden: hero · prensa · herramientas · caso · cita · dónde estamos · dinero · cómo ayudar (${pos.join(' < ')})`)
    ok((main.match(/<section\b/g)?.length ?? 0) === 8, `${pagina}: exactamente 8 bloques (${main.match(/<section\b/g)?.length ?? 0}): los 7 de F5 y, desde T2a, la banda de herramientas tras la prensa`)
    ok((main.match(/<h1\b/g)?.length ?? 0) === 1 && decodificar((main.match(/<h1\b[\s\S]*?<\/h1>/)?.[0] ?? '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() === edadTexto, `${pagina}: un solo <h1>, «${edadTexto}» (la edad sale de caseData)`)
    const h2 = [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => visible(m[1]!))
    const H2 = ['herramientas.title', 'home.caso_heading', 'home.s6_eyebrow', 'home.donde_heading', 'home.dinero_heading', 'home.puertas_heading'].map((k) => t(loc, k))
    ok(JSON.stringify(h2) === JSON.stringify(H2), `${pagina}: un <h2> por bloque, sin saltos (${h2.join(' · ')})`)
    ok((main.match(/\bid="caso"/g)?.length ?? 0) === 1 && /<section id="caso"[^>]*\bscroll-mt-24\b/.test(main), `${pagina}: #caso existe una vez y deja hueco bajo la cabecera pegajosa (scroll-mt-24)`)

    // b) hero
    ok(visible(hero).includes(t(loc, 'home.hero_eyebrow')) && visible(hero).includes(t(loc, 'hero.lede')), `${pagina}: el hero lleva el eyebrow y el lede pedidos`)
    ok(hero.includes('href="https://gofund.me/3e25cae99"') && hero.includes('href="#caso"'), `${pagina}: el hero: «Apoyar» (GoFundMe) y «Entender el caso» (#caso)`)
    const proRuta = loc === 'es' ? '/datos#que-buscamos' : '/en/data#que-buscamos'
    ok(new RegExp(`class="hero__pro[^"]*"[^>]*>|href="${proRuta}"[^>]*class="hero__pro`).test(hero) && hero.includes(`href="${proRuta}"`), `${pagina}: el enlace «¿Eres clínico o laboratorio?» va a ${proRuta}`)
    ok(hero.includes(`href="${loc === 'es' ? '/timeline' : '/en/timeline'}#lo-ultimo"`), `${pagina}: «Lo último» va a /timeline#lo-ultimo`)
    // T2b (24-oct-2026, decisión de Miriam): el hero lleva el importe y los donantes EN VIVO, con «en GoFundMe»; nada de objetivo, porcentaje ni «faltan»
    ok(!/faltan|remaining|objetivo|\bgoal\b|%/i.test(visible(hero)), `${pagina}: el hero no dice objetivo, porcentaje ni «faltan»`)
    if (semilla) {
      const n = new Intl.NumberFormat(loc === 'es' ? 'es-ES' : 'en-US').format(semilla.donationCount)
      const importe = formatCurrency(semilla.currentAmount.amount, semilla.currentAmount.currencyCode, loc).replace(/\s+/g, ' ')
      // la «·» va entre espacios duros (U+00A0) para no colgar a 375 px; el texto visible ya los lleva normalizados a espacio
      const linea = t(loc, 'hero.proof_money').replace('{importe}', importe).replace('{n}', n).replace(/\u00a0/g, ' ')
      ok(visible(hero).includes(linea) && hero.includes('hero__support'), `${pagina}: la prueba dice «${linea}» (importe y donantes, con «en GoFundMe»)`)
      const fecha = semilla.actualizado ? t(loc, 'gofundme.cifra_a').replace('{fecha}', fechaDeCifra(semilla.actualizado, loc)) : null
      ok(!fecha || visible(hero).includes(fecha), `${pagina}: y, como la cifra es la del build, con su fecha («${fecha ?? 'la semilla no trae fecha'}»)`)
      ok(/data-gofundme-importe="\d+/.test(hero) && /data-gofundme-origen="semilla"/.test(hero), `${pagina}: el importe del hero lleva su marca de cifra y de origen (la que lee el test de la cifra viva)`)
    } else {
      ok(!hero.includes('hero__support') && !/\s—\s/.test(visible(hero)), `${pagina}: sin cifra de la campaña, la línea del importe no se pinta (nada de «—»)`)
    }

    // c) lo que se fue y lo que la regla del dinero prohíbe, en TODO el texto visible
    for (const [re, nombre] of SE_FUERON) ok(!re.test(texto), `${pagina}: sin ${nombre}`)
    ok(!/[€$£]|\beuros?\b/i.test(visible(main.replace(hero, '').replace(campana, ''))), `${pagina}: ningún importe ni «euros» fuera del hero y del bloque de la campaña (ambos, de GoFundMe en vivo)`)
    ok(!/faltan|remaining|objetivo|\bgoal\b|%/i.test(visible(campana)) && !/role="progressbar"/.test(campana), `${pagina}: el bloque de la campaña no lleva objetivo, porcentaje, «faltan» ni barra de progreso`)

    // d) el dinero: UNA frase de destino, un solo botón coral
    const destino = t(loc, 'money.destino')
    ok(texto.split(destino).length - 1 === 1, `${pagina}: money.destino aparece una vez`)
    ok(campana.includes(destino) && campana.includes(`href="${loc === 'es' ? '/gastos' : '/en/expenses'}"`), `${pagina}: el bloque del dinero lleva la frase de destino y el enlace al informe de gastos`)
    const corales = [...campana.matchAll(/<a\b[^>]*class="[^"]*\bbtn-cta\b[^"]*"[^>]*>/g)].map((m) => m[0])
    ok(corales.length === 1 && corales[0]!.includes('href="https://gofund.me/3e25cae99"'), `${pagina}: un solo botón coral en la zona del dinero (${corales.length})`)
    ok(!/\bbtn-cta\b/.test(main.replace(hero, '').replace(campana, '')), `${pagina}: fuera del hero y del bloque del dinero no hay más botones coral`)

    // e) «Dónde estamos»: Ahora = /datos, 3 peticiones públicas y sus tres enlaces
    const hoy = tratamientoHoy(caso.lineas, msFecha(String(caso.generado).slice(0, 10)), loc)
    ok(hoy.enCurso, `${pagina}: caso.json tiene una línea sistémica en curso (la que alimenta «Ahora»)`)
    const ahora = visible(donde.match(/<p[^>]*class="home-ahora"[\s\S]*?<\/p>/)?.[0] ?? '')
    ok(ahora.startsWith(t(loc, 'home.ahora')) && ahora.includes(`${hoy.detalle} · ${hoy.fecha}`), `${pagina}: «Ahora» dice «${hoy.detalle} · ${hoy.fecha}» (${ahora.slice(0, 90)})`)
    const datosTxt = visible(html(loc === 'es' ? 'datos.html' : 'en/data.html'))
    ok(datosTxt.includes(hoy.detalle) && datosTxt.includes(hoy.fecha), `${pagina}: y /datos dice lo mismo en su cifra «Tratamiento» (misma función: tratamientoHoy)`)
    const lista = donde.match(/<ul class="qb__lista"[\s\S]*?<\/ul>/)?.[0] ?? ''
    const items = [...lista.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => visible(m[1]!))
    ok(items.length === 3 && items.every((it, i) => it.startsWith(txtCaso(publicas[i]!.valor, loc).slice(0, 40))), `${pagina}: «Qué buscamos» pinta las 3 primeras peticiones públicas, tal cual y por prioridad (${items.length})`)
    ok(!/FoundationOne CDx de hueso|hipoproliferativa|hypoproliferative/.test(crudo) && !donde.includes('qb__acciones'), `${pagina}: ni la FoundationOne ni la anemia en el HTML, y la fila de acciones es la de la home (no la del componente)`)
    const contacto = loc === 'es' ? '/contacto?role=researcher' : '/en/contact?role=researcher'
    const hrefs = [...donde.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]!)
    ok(hrefs.includes(contacto) && hrefs.includes(proRuta) && !/mailto:/.test(donde), `${pagina}: «${t(loc, 'home.buscamos_escribir')}» → ${contacto}, «ver todo» → ${proRuta}, sin correo directo`)
    // T2a: «Míralo en 3D» salió de aquí: «Mama, hígado y hueso» es una fila de la banda de herramientas, dos bloques más arriba
    ok(!hrefs.includes(loc === 'es' ? '/lesiones' : '/en/lesiones') && !visible(donde).includes(t(loc, 'home.donde_3d')), `${pagina}: «Dónde estamos» ya no enlaza a /lesiones (el 3D está en la banda de herramientas)`)
    ok(visible(donde).includes(t(loc, 'home.pasos_nota_barra')) && donde.includes('role="progressbar"'), `${pagina}: la ruta de 5 pasos con su nota (la barra no mide cuánto falta para ninguna meta médica)`)

    // f) prensa y puertas
    ok(/<li[^>]*>\s*<a\b[^>]*prensa-tira__medio/.test(main) && (main.match(/prensa-tira__medio/g)?.length ?? 0) === 4, `${pagina}: la tira de prensa pinta 4 medios (el detalle del orden y de las URLs, en test-sala-prensa)`)
    // y bajo las puertas, la línea de apoyo entre pacientes, enlazada a la tarjeta de /colabora (fuera de la lista de puertas)
    const pares = seccion(/<p class="puertas-pares"[\s\S]*?<\/p>/)
    const hrefPares = pares.match(/<a\b[^>]*\bhref="([^"]+)"/)?.[1]
    ok(visible(pares).includes(t(loc, 'home.puertas_pares')) && visible(pares).includes(t(loc, 'home.puertas_pares_cta')) && hrefPares === (loc === 'es' ? '/colabora#apoyo-mutuo' : '/en/collaborate#apoyo-mutuo') && main.indexOf('class="puertas-pares"') > main.indexOf('<ul class="puertas"'), `${pagina}: bajo las puertas, «${t(loc, 'home.puertas_pares')}» → ${hrefPares}`)
    const hp = [...puertas.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1]!, texto: visible(m[2]!).replace(t(loc, 'a11y.new_tab'), '').trim() }))
    const esperadas = [
      'https://gofund.me/3e25cae99', loc === 'es' ? '/datos#que-buscamos' : '/en/data#que-buscamos', loc === 'es' ? '/colabora#tech-ia' : '/en/collaborate#tech-ia', loc === 'es' ? '/prensa' : '/en/press', loc === 'es' ? '/colabora' : '/en/collaborate',
    ]
    ok(JSON.stringify(hp.map((x) => x.href)) === JSON.stringify(esperadas), `${pagina}: las 5 puertas, en orden, con sus destinos (${hp.map((x) => x.href).join(' · ')})`)
    ok(JSON.stringify(hp.map((x) => x.texto)) === JSON.stringify(PUERTAS.map((p) => t(loc, p.etiqueta))), `${pagina}: y con los rótulos de puertas.* (${hp.map((x) => x.texto).join(' · ')})`)
    ok(/rel="noopener noreferrer"/.test(puertas) && /\(se abre|\(opens/.test(puertas), `${pagina}: la puerta de GoFundMe abre en pestaña nueva y lo avisa`)

    // f.bis) la banda de herramientas (T2a): tras la prensa, con la destacada «Lo último» y el resto en filas, todo con el título ya publicado
    {
      const banda = seccion(/<section[^>]*aria-labelledby="h-herramientas"[\s\S]*?<\/section>/)
      const R = loc === 'es' ? { celula: '/celula-a-celula', todas: '/herramientas' } : { celula: '/en/cell-by-cell', todas: '/en/tools' }
      const RUTAS: Record<string, string> = loc === 'es'
        ? { cell_by_cell: '/celula-a-celula', cell_explorer: '/celula-a-celula/explorar', lesions: '/lesiones', data: '/datos', slides: '/laminillas' }
        : { cell_by_cell: '/en/cell-by-cell', cell_explorer: '/en/cell-by-cell/explore', lesions: '/en/lesiones', data: '/en/data', slides: '/en/slides' }
      const visibles = HERRAMIENTAS.filter((h) => h.key !== 'cell_explorer' || estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real')
      const enlaces = [...banda.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1]!, texto: visible(m[2]!), cuerpo: m[0] }))
      ok(visible(banda).startsWith(`${t(loc, 'herramientas.eyebrow')} ${t(loc, 'herramientas.title')} ${t(loc, 'herramientas.apertura')}`), `${pagina}: la banda abre con «${t(loc, 'herramientas.eyebrow')}», «${t(loc, 'herramientas.title')}» y la frase de apertura`)
      const esperados = [...visibles.map((h) => RUTAS[h.key]!), R.todas]
      // la destacada va la primera, aunque no sea la primera de HERRAMIENTAS
      const orden = [LO_ULTIMO.key, ...visibles.map((h) => h.key).filter((k) => k !== LO_ULTIMO.key)].map((k) => RUTAS[k]!)
      ok(JSON.stringify(enlaces.map((e) => e.href)) === JSON.stringify([...orden, R.todas]) && esperados.length === orden.length + 1, `${pagina}: la banda lleva la destacada, el resto de herramientas en el orden de HERRAMIENTAS y «${t(loc, 'nav.all_tools')}» (${enlaces.map((e) => e.href).join(' · ')})`)
      const [titulo, descripcion] = copyHerramienta(LO_ULTIMO.key, loc)
      ok(enlaces[0]!.texto.includes(titulo) && enlaces[0]!.texto.includes(descripcion) && enlaces[0]!.texto.includes(t(loc, 'home.tools_new')) && enlaces[0]!.texto.includes(t(loc, PARA_HERRAMIENTA[LO_ULTIMO.key]!)) && /card-marked/.test(enlaces[0]!.cuerpo), `${pagina}: la destacada es «${titulo}»: su título y su descripción ya publicados, «${t(loc, 'home.tools_new')}» y su etiqueta, como tarjeta marcada`)
      const filas = enlaces.slice(1, -1)
      ok(filas.every((e, i) => e.texto.startsWith(copyHerramienta(visibles.filter((h) => h.key !== LO_ULTIMO.key)[i]!.key, loc)[0]) && e.texto.includes(t(loc, PARA_HERRAMIENTA[visibles.filter((h) => h.key !== LO_ULTIMO.key)[i]!.key]!))), `${pagina}: cada fila lleva solo el título publicado y su etiqueta «Para…»`)
      ok(!/\bbtn-cta\b/.test(banda) && !/<details\b/.test(banda), `${pagina}: la banda no lleva botón coral ni plegables`)
      ok(!banda.includes(t(loc, 'herramientas.linea_mapa')) && ![RUTA_MAPA(loc), RUTA_PORT(loc)].some((r) => enlaces.some((e) => e.href === r)), `${pagina}: ni el mapa ni el reservorio (van en el índice, no en la banda)`)
    }

    // g) todo enlace que abre pestaña nueva lo avisa, sin excepciones: también el botón de la tarjeta de la campaña (GoFundMeProgress), que
    //    T2b reescribió entera y al que puso el aviso.
    const nuevas = [...main.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0])
    ok(nuevas.length >= 6 && nuevas.every((a) => /rel="noopener/.test(a) && a.includes(t(loc, 'a11y.new_tab'))), `${pagina}: los ${nuevas.length} enlaces de pestaña nueva (también el de la tarjeta de la campaña) llevan rel="noopener" y el aviso para lectores de pantalla`)

    // h) presupuesto de palabras. La decisión puso un tope de 530 para toda la home; no contó que «Qué buscamos» va TAL CUAL (≈150
    //    palabras de caso.json) ni la tarjeta de la campaña (≈70, de otra fuente y «se queda como hoy»). Se vigila lo PROPIO de la
    //    home (con los textos para lectores de pantalla): hoy ≈ 410; 450 deja margen sin dejar que crezca.
    //    T2a (24-oct-2026) suma la banda de herramientas (≈ 110 palabras entre cabecera, frase de apertura, etiquetas y títulos). La descripción literal
    //    de la destacada (≈ 25) tampoco es texto propio: es la meta-description de su página, como las peticiones. El techo propio sube de 450 a 540
    //    y la decisión de 530 para toda la home sigue sin cumplirse, a la vista en el mensaje.
    const sinAjenos = visible(main.replace(/<ul class="qb__lista"[\s\S]*?<\/ul>/, '').replace(/<span class="tarjeta-enlace__meta"[\s\S]*?<\/span>/, '').replace(/<div class="gfm gfm--card"[\s\S]*?<\/section>/, '</section>'))
    const n = sinAjenos.split(' ').length
    ok(n <= 520, `${pagina}: el texto propio de la home (sin las peticiones literales, la descripción de la destacada ni la tarjeta de la campaña) cabe en 520 palabras: ${n} (con ellas: ${texto.split(' ').length}; tope de la decisión: 530)`)

    // i) SEO: sin «ultra-raro» y con la identidad «ingeniera de software» (no «paciente» + perfil molecular)
    const cabeza = crudo.match(/<head\b[\s\S]*?<\/head>/)?.[0] ?? ''
    const ld = [...crudo.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
    ok(!/ultra/i.test(visible(cabeza.replace(/<link\b[^>]*>/g, '').replace(/<meta\b([^>]*)>/g, ' $1 ')) + ld), `${pagina}: ni el <title>, ni la meta description, ni OG, ni Twitter, ni el JSON-LD dicen «ultra-raro»`)
    const desc = decodificar(cabeza.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? '')
    ok(/ingeniera de software|software engineer/.test(desc) && !/paciente con|patient with/i.test(desc), `${pagina}: la descripción presenta a Miriam como ingeniera de software (${desc.slice(0, 70)}…)`)
  }

  // j) la home no carga el JSON del caso (≈230 KB): ni en su JS inicial ni en su payload
  const cargados = [...html('index.html').matchAll(/<(?:link\b[^>]*rel="modulepreload"[^>]*href|script\b[^>]*src)="(\/_nuxt\/[^"]+\.js)"/g)].map((m) => m[1]!)
  const pesados = cargados.filter((f) => existsSync(join(PUB, f)) && /"n_analiticas"/.test(readFileSync(join(PUB, f), 'utf-8')))
  ok(cargados.length > 0 && pesados.length === 0, `index.html: ninguno de los ${cargados.length} .js que carga la home lleva el JSON de caso.json${pesados.length ? ` (lo lleva ${pesados.join(', ')})` : ''}`)
  const payload = existsSync(join(PUB, '_payload.json')) ? readFileSync(join(PUB, '_payload.json'), 'utf-8') : ''
  ok(payload.length > 0 && payload.length < 60_000 && !/FoundationOne CDx de hueso|n_analiticas/.test(payload), `index: el payload de la home es corto (${payload.length} B) y sin las peticiones sin gate ni las analíticas`)
}

// 12 — las puertas sociales del rediseño (F6, 23-oct-2026): /lesiones, /links y /gracias
{
  const decodificar = (t: string) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  const sinScripts = (ruta: string) => html(ruta).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const visible = (trozo: string) => decodificar(trozo.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const principal = (ruta: string) => sinScripts(ruta).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? ''
  const palabras = (s: string) => s.split(' ').filter(Boolean).length
  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
  type A = { href: string; clase: string; atributos: string; texto: string }
  const anclas = (trozo: string): A[] =>
    [...trozo.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
      href: decodificar(/\bhref="([^"]*)"/.exec(m[1]!)?.[1] ?? ''),
      clase: /\bclass="([^"]*)"/.exec(m[1]!)?.[1] ?? '',
      atributos: m[1]!,
      texto: visible(m[2]!),
    }))
  const GOFUNDME = 'https://gofund.me/3e25cae99'
  const PODCAST = 'https://www.youtube.com/watch?v=zVUECrux6zA'
  const R = {
    es: { celula: '/celula-a-celula', lesiones: '/lesiones', datos: '/datos', prensa: '/prensa#cobertura', timeline: '/timeline', marcas: '/marcas', inicio: '/', gastos: '/gastos', contacto: '/contacto?role=other', ultimo: '/timeline#lo-ultimo', caso: '/#caso', reservorio: '/reservorio', herramientas: '/herramientas' },
    en: { celula: '/en/cell-by-cell', lesiones: '/en/lesiones', datos: '/en/data', prensa: '/en/press#cobertura', timeline: '/en/timeline', marcas: '/en/brands', inicio: '/en', gastos: '/en/expenses', contacto: '/en/contact?role=other', ultimo: '/en/timeline#lo-ultimo', caso: '/en#caso', reservorio: '/en/reservorio', herramientas: '/en/tools' },
  }
  // lo que el criterio de legal-burocracia (23-oct-2026) retira, y lo que la decisión quitó de estas tres páginas
  const DINERO_RETIRADO = /cada euro|every euro|100\s?%|sin intermediarios|middlem|no intermediar|mensual|monthly|recibo disponible|receipt available|por (email|correo)|by e-?mail|transparencia total|full transparency|[€$£]|\beuros?\b/i

  for (const [loc, lesiones, links, gracias, prensa] of [
    ['es', 'lesiones.html', 'links.html', 'gracias.html', 'prensa.html'],
    ['en', 'en/lesiones.html', 'en/links.html', 'en/thank-you.html', 'en/press.html'],
  ] as const) {
    // ── /lesiones ──────────────────────────────────────────────────────────────────────────────────────────────
    {
      const h = sinScripts(lesiones)
      const main = principal(lesiones)
      const txt = visible(main)
      const bloque = main.match(/<section[^>]*aria-labelledby="en-corto-titulo"[\s\S]*?<\/section>/)?.[0] ?? ''
      const cuerpo = visible(bloque.replace(/<h2\b[\s\S]*?<\/h2>/, ''))
      const resto = txt.replace(visible(bloque), '')
      ok(bloque.length > 0 && visible(bloque.match(/<h2\b[\s\S]*?<\/h2>/)?.[0] ?? '') === (loc === 'es' ? 'En corto' : 'In short'), `${lesiones}: lleva el bloque «${loc === 'es' ? 'En corto' : 'In short'}»`)
      ok(palabras(cuerpo) <= 40 && palabras(cuerpo) >= 20, `${lesiones}: «En corto» cabe en 40 palabras (${palabras(cuerpo)})`)
      ok(/2026/.test(cuerpo) && (loc === 'es' ? /8 de septiembre/ : /8 September/).test(cuerpo), `${lesiones}: «En corto» lleva la fecha de la foto (8-sep-2026)`)
      ok(!/\d\s?(mm|cm)\b|→|55\b|[€$£]/.test(cuerpo), `${lesiones}: «En corto» sin cifras clínicas, sin flechas y sin el «55» del radiólogo (va abajo, con sus dos salvedades)`)
      // cada frase de «En corto» (salvo la de las fechas de mama e hígado, que las compone) existe ENTERA y TAL CUAL en el resto de la página
      const frases = cuerpo.split(/(?<=\.)\s+/).filter(Boolean)
      ok(frases.length === 3, `${lesiones}: «En corto» son 3 frases (${frases.length})`)
      const rotulo = loc === 'es' ? /^Hueso:\s*/ : /^Bone:\s*/
      // ENTERAS, con su punto: una frase recortada («…RM de junio.» por «…RM de junio de 2026.») ya no es la publicada
      const fuera = [frases[1]?.replace(rotulo, ''), frases[2]]
      ok(fuera.every((f) => !!f && resto.includes(f)), `${lesiones}: la del hueso y la del PET del 8-sep existen ENTERAS y tal cual en la propia página, fuera del bloque (${fuera.map((f) => (f ?? '').slice(0, 30)).join(' | ')})`)
      // el texto sellado sigue ahí, entero (la comprobación completa se hizo contra el HTML de antes de F6: solo líneas añadidas)
      const SELLADO = loc === 'es'
        ? ['Un radiólogo, en lectura informal por DM y sin informe firmado, marcó 55 medidas en el hígado de este TC y las considera 55 lesiones distintas', 'El informe oficial dice M1 múltiples.', 'Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'La mama, el hígado y las lesiones óseas.']
        : ['A radiologist, in an informal DM read and without a signed report, marked 55 measurements on the liver in this CT and considers them 55 distinct lesions', 'The official report says multiple M1.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.', 'The breast, the liver and the bone lesions.']
      ok(SELLADO.every((f) => txt.includes(f)), `${lesiones}: el texto sellado de la página sigue entero (${SELLADO.length} frases)`)
      // orden del DOM = orden visual: título · «En corto» · aviso · …; y el aviso va DESPUÉS de «En corto»
      const pos = ['<h1', 'id="en-corto-titulo"', 'class="alert-callout', 'id="mama-titulo"', 'id="hueso-titulo"', 'id="cierre-apoyo-titulo"'].map((m) => main.indexOf(m))
      ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${lesiones}: título · En corto · aviso · mama · hueso · cierre de apoyo, en ese orden (${pos.join(' < ')})`)
      ok((main.match(/<h1\b/g)?.length ?? 0) === 1, `${lesiones}: un solo <h1>`)
      // el cierre de apoyo: estático (en el HTML), con los dos botones del hero y los dos enlaces de antes intactos
      const cierre = main.match(/<section[^>]*aria-labelledby="cierre-apoyo-titulo"[\s\S]*?<\/section>/)?.[0] ?? ''
      const ca = anclas(cierre)
      ok(ca.length === 2 && ca[0]!.href === GOFUNDME && ca[1]!.href === R[loc].caso, `${lesiones}: el cierre lleva «Apoyar» (GoFundMe) y «Entender el caso» (${R[loc].caso}) (${ca.map((a) => a.href).join(' · ')})`)
      ok(ca[0]?.texto.startsWith(t(loc, 'nav.donate')) && ca[1]?.texto === t(loc, 'hero.cta_understand'), `${lesiones}: con los rótulos de siempre («${t(loc, 'nav.donate')}», «${t(loc, 'hero.cta_understand')}»)`)
      ok(/\bbtn-cta\b/.test(ca[0]?.clase ?? '') && /\bbtn-secondary\b/.test(ca[1]?.clase ?? '') && /data-support-cta/.test(ca[0]?.atributos ?? ''), `${lesiones}: el de apoyo es el botón coral del DS (btn-cta, data-support-cta) y el otro, el secundario`)
      ok(/target="_blank"/.test(ca[0]?.atributos ?? '') && /rel="noopener noreferrer"/.test(ca[0]?.atributos ?? '') && (ca[0]?.texto ?? '').includes(t(loc, 'a11y.new_tab')), `${lesiones}: el de GoFundMe abre pestaña nueva con rel="noopener noreferrer" y lo avisa`)
      ok((main.match(/\bbtn-cta\b/g)?.length ?? 0) === 1, `${lesiones}: un solo botón coral en toda la página`)
      const viejos = anclas(main.slice(main.indexOf('id="cierre-apoyo-titulo"'))).filter((a) => a.href === R[loc].datos || a.href === R[loc].reservorio).map((a) => a.href)
      ok(JSON.stringify(viejos) === JSON.stringify([R[loc].datos, R[loc].reservorio]), `${lesiones}: los dos enlaces de cierre que ya había (${R[loc].datos}, ${R[loc].reservorio}) siguen, detrás del bloque nuevo (T2a: el del reservorio vuelve a llevar a su página)`)
      // T2a: vuelve el enlace al mapa de metástasis desde el visor del hueso (F4 lo había quitado porque el mapa se quedó sin enlaces)
      const aMapa = anclas(main).filter((a) => a.href === (loc === 'es' ? '/mapa-metastasis' : '/en/mapa-metastasis'))
      ok(aMapa.length === 1 && aMapa[0]!.texto === (loc === 'es' ? 'Ver este foco con todo el detalle en el mapa de metástasis' : 'See this focus in full detail on the metastasis map'), `${lesiones}: vuelve el enlace al mapa de metástasis, con su texto de siempre (${aMapa.map((a) => a.texto).join(' | ')})`)
      ok(!DINERO_RETIRADO.test(visible(cierre)) && !DINERO_RETIRADO.test(cuerpo), `${lesiones}: ni «En corto» ni el cierre llevan importes ni frases del dinero retiradas`)
      ok(!h.includes('>Donación recibida<'), `${lesiones}: control del test (la página no habla de donaciones)`)
    }

    // ── /links ─────────────────────────────────────────────────────────────────────────────────────────────────
    {
      const main = principal(links)
      const nav = main.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] ?? ''
      const filas = anclas(nav)
      // T2a (24-oct-2026): «Todas mis herramientas» entra la primera de los secundarios (nueve filas)
      const ESPERADAS = [R[loc].celula, GOFUNDME, R[loc].lesiones, R[loc].datos, R[loc].prensa, PODCAST, R[loc].herramientas, R[loc].timeline, R[loc].marcas]
      ok(JSON.stringify(filas.map((a) => a.href)) === JSON.stringify(ESPERADAS), `${links}: nueve filas en el orden decidido: célula a célula · apoyar · lesiones · datos · prensa · podcast · herramientas · cronología · marcas (${filas.map((a) => a.href).join(' · ')})`)
      const hr = nav.indexOf('<hr')
      ok(hr > 0 && anclas(nav.slice(0, hr)).length === 6 && anclas(nav.slice(hr)).length === 3, `${links}: seis destacados y, tras el filete, tres secundarios (herramientas, cronología y marcas)`)
      ok(filas[6]!.texto.includes(t(loc, 'links.herramientas_title')) && filas[6]!.texto.includes(t(loc, 'links.herramientas_sub')), `${links}: «${t(loc, 'links.herramientas_title')}» · ${t(loc, 'links.herramientas_sub')}`)
      const apoyo = filas[1]
      ok(!!apoyo && /bio-link--apoyo/.test(apoyo.clase) && /data-support-cta/.test(apoyo.atributos) && /target="_blank"/.test(apoyo.atributos) && /rel="noopener noreferrer"/.test(apoyo.atributos) && apoyo.texto.includes(t(loc, 'a11y.new_tab')), `${links}: la 2.ª fila es el apoyo: GoFundMe directo, coral, con data-support-cta, pestaña nueva con rel="noopener noreferrer" y aviso`)
      ok(filas.filter((a) => a.href.includes('gofund.me')).length === 1 && (sinScripts(links).match(/gofund\.me/g)?.length ?? 0) === 1, `${links}: un solo enlace a GoFundMe en toda la página (ni cabecera ni pie)`)
      ok(!!apoyo && apoyo.texto.startsWith(t(loc, 'links.apoyar_title')) && apoyo.texto.includes(t(loc, 'links.apoyar_sub')), `${links}: «${t(loc, 'links.apoyar_title')}» · ${t(loc, 'links.apoyar_sub')}`)
      // la fila de lesiones dice las TRES zonas (antes «el hígado y la mama»: faltaba el hueso)
      const sub = t(loc, 'links.lesiones_sub')
      ok(filas[2]!.texto.includes(sub) && (loc === 'es' ? /mama/i.test(sub) && /hígado/i.test(sub) && /hueso/i.test(sub) : /breast/i.test(sub) && /liver/i.test(sub) && /bone/i.test(sub)), `${links}: la fila de lesiones nombra mama, hígado y hueso («${sub}»)`)
      ok(!/elespanol\.com/.test(sinScripts(links)), `${links}: sin enlace suelto al artículo de El Español (la prensa va a ${R[loc].prensa})`)
      const texto = visible(main)
      ok(!DINERO_RETIRADO.test(texto) && !/apoyar (mi|su) tratamiento|support (my|her) treatment|financiar|fund(ing)? (my|her)/i.test(texto), `${links}: ni frases del dinero retiradas ni «apoyar mi tratamiento» (destino del dinero, criterio de legal-burocracia)`)
      ok(!/financ|tratamiento|treatment/i.test(t(loc, 'links.meta_description')) || /apoyar el caso|support the case/.test(t(loc, 'links.meta_description')), `${links}: la meta description habla de apoyar el caso, no de financiar un tratamiento`)
      // el presupuesto: la decisión puso 100 palabras (hoy 158 con este recuento). Las ocho filas y sus subtítulos suman más; el techo es
      // lo que había antes de F6 (no puede crecer) y la cifra real queda en el mensaje para la revisión.
      // T2a suma una fila secundaria («Todas mis herramientas» y su subtítulo): el techo sube de 158 a 165 (hoy 162 en ES y 154 en EN) y la cifra real queda en el mensaje
      ok(palabras(texto) <= 165, `${links}: ${palabras(texto)} palabras (techo: 158 de antes de F6 + la fila de herramientas de T2a; tope de la decisión: 100, no alcanzado)`)
    }

    // ── /prensa#cobertura (el destino de la fila de prensa de /links) ─────────────────────────────────────────
    {
      const p = sinScripts(prensa)
      const ancla = p.match(/<div id="cobertura"[^>]*>[\s\S]*?id="press-mentions"/)?.[0] ?? ''
      ok((p.match(/\bid="cobertura"/g)?.length ?? 0) === 1 && ancla.length > 0, `${prensa}: #cobertura existe una vez y abre la sección de cobertura (donde aterriza /links)`)
      ok(/\bscroll-mt-24\b/.test(ancla), `${prensa}: #cobertura deja hueco bajo la cabecera pegajosa (scroll-mt-24)`)
    }

    // ── /gracias ───────────────────────────────────────────────────────────────────────────────────────────────
    {
      const h = sinScripts(gracias)
      const main = principal(gracias)
      const texto = visible(main)
      ok(!DINERO_RETIRADO.test(texto) && !/Donaci[oó]n recibida|Donation received/i.test(h), `${gracias}: sin «Donación recibida», «100 %», «mensual», «sin intermediarios», «por email» ni importes`)
      ok(texto.split(t(loc, 'money.recibo')).length - 1 === 1, `${gracias}: el recibo lo dice la frase canónica (money.recibo), una vez: «${t(loc, 'money.recibo')}»`)
      const a = anclas(main)
      const contacto = a.find((x) => x.href === R[loc].contacto)
      ok(!!contacto && contacto.texto === t(loc, 'expenses.faq_help_link') && /aria-describedby="gracias-recibo"/.test(contacto.atributos), `${gracias}: «${t(loc, 'expenses.faq_help_link')}» → ${R[loc].contacto} (rol «other»), descrito por la frase del recibo; sin correo directo`)
      ok(!/mailto:/.test(h) && !/@[a-z0-9-]+\.[a-z]{2,}/i.test(texto.replace(/@miriamgonp/g, '')), `${gracias}: ningún correo directo (el contacto profesional va por /contacto)`)
      ok(a.some((x) => x.href === R[loc].gastos && x.texto === t(loc, 'home.dinero_informe')), `${gracias}: enlaza al informe de gastos (${R[loc].gastos})`)
      const siguiente = a.find((x) => x.href === R[loc].ultimo)
      ok(!!siguiente && siguiente.texto === t(loc, 'thanks.next') && /btn-secondary/.test(siguiente.clase), `${gracias}: el paso siguiente lleva a lo último del caso (${R[loc].ultimo}) con «${t(loc, 'thanks.next')}»`)
      ok(!a.some((x) => x.href === R[loc].inicio) && !a.some((x) => x.href.includes('gofund.me')), `${gracias}: sin «Volver al inicio» (el logo de la cabecera va a la home) y sin enlace a GoFundMe`)
      ok(/name="robots"[^>]*noindex|noindex[^>]*name="robots"/.test(h), `${gracias}: sigue en noindex`)
      ok(!/Donaci[oó]n recibida|Donation received/i.test(h.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '') && h.includes(`<title>${t(loc, 'thanks.eyebrow')} ·`), `${gracias}: el <title> dice «${t(loc, 'thanks.eyebrow')}»`)
      ok(palabras(texto) <= 70, `${gracias}: ${palabras(texto)} palabras (tope de la decisión: 70)`)
      // el texto que sale de la web al compartir tampoco promete a qué va el dinero
      ok(!/financ|fund\b|funding|tratamiento oncol|cancer treatment|[€$£]|\beuros?\b/i.test(t(loc, 'thanks.share_text')), `${gracias}: el texto de «Compartir» («${t(loc, 'thanks.share_text')}») no dice a qué va el dinero`)
      ok(/ingeniera de software|software engineer/.test(t(loc, 'thanks.share_text')), `${gracias}: y presenta a Miriam como ingeniera de software`)
    }
  }
}

// 13
{
  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
  const sinEtiquetas = (h: string) => h.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
  // las frases retiradas, sobre el HTML ENTERO (cabecera, metadatos, JSON-LD y cuerpo): una clave fuera de la vista también las publica
  const RETIRADAS: [RegExp, string][] = [
    [/cada euro|every euro/i, '«cada euro»'],
    [/transparencia (radical|total)|(radical|full|total) transparency|m[aá]xima transparencia|maximum transparency/i, '«transparencia radical / total»'],
    [/100\s?%\s?(al caso|va |de lo|to (the )?(case|miriam)|goes)/i, '«100 % al caso»'],
    [/recibo disponible|receipt available/i, '«recibo disponible»'],
    [/presupuestos (abiertos|p[uú]blicos)|open budgets?|public budgets?/i, '«presupuestos abiertos»'],
    [/cada gasto (est[aá]|se)|every (expense|cost) (is|will)/i, '«cada gasto está documentado»'],
    [/nada se desv|nothing is diverted/i, '«nada se desvía»'],
  ]
  const PAGINAS: [string, string][] = [
    ['gastos.html', 'es'], ['en/expenses.html', 'en'], ['colabora.html', 'es'], ['en/collaborate.html', 'en'], ['prensa.html', 'es'], ['en/press.html', 'en'],
    ['index.html', 'es'], ['en.html', 'en'], ['gracias.html', 'es'], ['en/thank-you.html', 'en'], ['links.html', 'es'], ['en/links.html', 'en'],
  ]
  for (const [pagina] of PAGINAS) {
    const h = html(pagina)
    const hay = RETIRADAS.filter(([re]) => re.test(h)).map(([, n]) => n)
    ok(hay.length === 0, `${pagina}: ninguna frase retirada en el HTML entero (cabecera, metadatos, JSON-LD y cuerpo)${hay.length ? ` (aún dice ${hay.join(', ')})` : ''}`)
  }
  // La CLASE «prometo detallar cada gasto / cada importe», por concepto y no por frase exacta («el destino de cada gasto», «cada importe se
  // publicará», «where every expense goes»): la norma es «no detallamos ciertas cosas». Se mira el HTML entero (cabecera, metadatos,
  // JSON-LD y cuerpo) de /prensa, /gastos y /colabora en ES y EN, su versión .md y su trozo de llms-full.txt (el agradecimiento de /gracias
  // —«every amount brings the next test closer»— no es una promesa de detalle y no se mira).
  const DETALLE_DE_CADA = /(cada|todo) (gasto|importe|factura|partida)|(destino|detalle) de cada|every (expense|amount|invoice|cost)|each amount/i
  const DETALLE_PAGINAS: [string, string][] = [['prensa', '/prensa'], ['en/press', '/en/press'], ['gastos', '/gastos'], ['en/expenses', '/en/expenses'], ['colabora', '/colabora'], ['en/collaborate', '/en/collaborate']]
  const llmsFull = existsSync(join(PUB, 'llms-full.txt')) ? html('llms-full.txt').split(/\n---\n/) : []
  ok(llmsFull.length > 50, `llms-full.txt existe y trae las páginas por trozos (${llmsFull.length})`)
  for (const [ruta, url] of DETALLE_PAGINAS) {
    const md = existsSync(join(PUB, `${ruta}.md`)) ? html(`${ruta}.md`) : ''
    const trozo = llmsFull.find((c) => c.includes(`Source: ${SITIO}${url}\n`)) ?? ''
    ok(md.length > 500 && trozo.length > 500, `${ruta}: existen su .md y su trozo de llms-full.txt (${md.length} y ${trozo.length} caracteres)`)
    for (const [donde, texto] of [[`${ruta}.html`, html(`${ruta}.html`)], [`${ruta}.md`, md], [`llms-full.txt (${url})`, trozo]] as const) {
      const hallazgo = texto.match(DETALLE_DE_CADA)?.[0]
      ok(!hallazgo, `${donde}: no promete detallar cada gasto ni cada importe${hallazgo ? ` (dice «${hallazgo}»)` : ''}`)
    }
  }

  for (const [pagina, loc] of [['marcas.html', 'es'], ['en/brands.html', 'en']] as const) {
    // solo las etiquetas <meta> y el <title>: «transparent» también es una palabra de CSS
    const head = html(pagina).match(/<head>[\s\S]*?<\/head>/)?.[0] ?? ''
    const metas = [...head.matchAll(/<(?:meta\b[^>]*|title>[^<]*)>?/g)].map((m) => m[0]).join(' ')
    ok(metas.length > 200 && !/transparen/i.test(metas), `${pagina}: los metadatos (descripción, Open Graph, Twitter) no dicen «transparencia total» (el texto visible de /marcas espera a Miriam)`)
    void loc
  }

  for (const [pagina, loc] of [['gastos.html', 'es'], ['en/expenses.html', 'en']] as const) {
    const h = html(pagina)
    const txt = sinEtiquetas(h.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? h)
    const todas = [
      ...DINERO.partidas.map((p) => p.importe), DINERO.comprometido, DINERO.disponible,
      DINERO.rebiopsia.ejecutado, DINERO.rebiopsia.biopsia, DINERO.rebiopsia.secuenciacion, DINERO.rebiopsia.imagen,
    ]
    const faltan = [...new Set(todas)].filter((n) => !txt.replace(/\s/g, ' ').includes(euros(n, loc).replace(/\s/g, ' ')))
    ok(faltan.length === 0, `${pagina}: pinta TODAS las cifras de dinero.json con el formato de siempre${faltan.length ? ` (faltan ${faltan.join(', ')})` : ''}`)
    const corte = fechaDeCorte(DINERO.corte, loc)
    ok(txt.includes(t(loc, 'expenses.report_eyebrow').replace('{fecha}', corte)) && txt.includes(t(loc, 'expenses.note').replace('{fecha}', corte)), `${pagina}: la fecha de corte (${corte}) sale en el informe y en la nota`)
    ok(txt.includes(t(loc, 'expenses.cuadre')), `${pagina}: la línea de cuadre está («${t(loc, 'expenses.cuadre').slice(0, 60)}…»)`)
    ok(txt.includes(t(loc, 'money.transparencia')), `${pagina}: la frase única de transparencia (money.transparencia) está`)
    ok(!/40[.,]000/.test(txt) && !/primer objetivo|first €?\s?40|first target/i.test(txt), `${pagina}: ya no dice «el primer objetivo de 40.000 €»`)
    ok(txt.includes(t(loc, 'expenses.rebiopsy_now_desc').replace('{biopsia}', euros(DINERO.rebiopsia.biopsia, loc)).replace('{secuenciacion}', euros(DINERO.rebiopsia.secuenciacion, loc)).replace('{imagen}', euros(DINERO.rebiopsia.imagen, loc)).replace(/\s/g, ' ')), `${pagina}: las tres sublíneas de la rebiopsia siguen (biopsia, secuenciación e imagen)`)
    const faq = (h.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/g) ?? []).join(' ')
    ok(faq.includes('FAQPage') && !RETIRADAS.some(([re]) => re.test(faq)), `${pagina}: el JSON-LD de las preguntas frecuentes no lleva frases retiradas`)
    // lista GENÉRICA de entidades (la misma que test-dinero-fuente): nombrar solo las de la casa sería señalarlas
    ok(!/\b(banco (santander|sabadell)|bbva|caixabank|openbank|n26|abanca|unicaja|ibercaja|kutxabank|bankia|cajamar|deutsche bank|bnp paribas|commerzbank|barclays|hsbc|lloyds|monzo|bunq)\b/i.test(h), `${pagina}: ningún banco por su nombre en el HTML (repo y web públicos)`)
  }

  for (const [pagina, loc] of [['colabora.html', 'es'], ['en/collaborate.html', 'en']] as const) {
    const txt = sinEtiquetas(html(pagina).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '')
    ok(txt.includes(`${t(loc, 'collaborate.profile1_precio_para')} ${t(loc, 'collaborate.profile1_precio')}`), `${pagina}: a los laboratorios les dice «${t(loc, 'collaborate.profile1_precio_para')} ${t(loc, 'collaborate.profile1_precio')}» (el rótulo, delante, dice a quién habla)`)
    ok(html(pagina).includes(`>${t(loc, 'collaborate.profile1_precio_para')}</strong>`), `${pagina}: el rótulo de los laboratorios va en negrita`)
    ok(txt.includes(t(loc, 'money.transparencia')), `${pagina}: lleva la frase única de transparencia`)
    ok(txt.includes(t(loc, 'money.recibo')), `${pagina}: el recibo lo dice la frase canónica (money.recibo)`)
  }
  for (const [pagina, loc] of [['prensa.html', 'es'], ['en/press.html', 'en']] as const) {
    const txt = sinEtiquetas(html(pagina).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '')
    ok(txt.includes(`${t(loc, 'press.faq_a5')} ${t(loc, 'money.transparencia')}`), `${pagina}: «${t(loc, 'press.faq_q5')}» se responde con la frase única de transparencia`)
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ ancla, «hace N días», sitemap (sin redirigidas ni archivadas, hreflang por pares), <main> único, «Ver quién apoya», campaña (en el HTML y en vivo), «Qué buscamos», navegación (menú, pie, redes, chrome mínimo) herramientas, reservorio, historia y mapa de vuelta (T2a), la salida común, vídeos, la home de F5 con su banda de herramientas y las puertas sociales de F6 (/lesiones, /links, /gracias) en verde')
process.exit(fallos ? 1 : 0)
