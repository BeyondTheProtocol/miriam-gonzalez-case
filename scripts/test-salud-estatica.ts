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
//
// 7. La cifra viva sustituye a la del build (en Chrome), al cargar la página y al navegar por el sitio.
//    Si el refresco se pierde, la tarjeta se queda con la cifra horneada y ningún otro test lo ve: el
//    servidor del arnés no tiene /fundraiser.json. Aquí se intercepta `fetch` y se contesta otra cifra,
//    o un error. Corre igual con o sin semilla (sin ella, el HTML llega sin tarjeta y el cliente la pinta).
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
// 9. El menú tiene 5 ítems («Datos» donde estaba «Herramientas») y marca la sección en las páginas de datos; el pie, 13
//    enlaces en 3 columnas más Redes y Legal, sin chips «por perfil», sin fecha global ni los enlaces que salieron; las
//    redes salen de UNA lista (pie, /colabora y schema.org); y /links y /gracias llevan el chrome mínimo (sin menú, sin barra
//    «lo último», pie reducido, y /gracias sin «Apoyar»). Lo que no se ve en el HTML (el chrome al navegar sin recargar,
//    los 44 px) lo prueba test-home-caminos §10 en Chrome.
//
// Y las fusiones del rediseño (F4, 23-oct-2026):
//
// 10. /herramientas, /reservorio, /historia (y su capítulo) y /videos ya no existen en lo generado (ni su .html ni su
//    entrada del sitemap) y NADA enlaza a ellas, salvo las migas «← Herramientas» de célula a célula y su explorador
//    (que esta fase no puede tocar y resuelven a través de una ruta de compatibilidad con 301). /datos lleva la franja
//    #visores (las herramientas, con el título y el texto ya publicados de cada una) y el bloque plegado #reservorio
//    (las dos frases y las medidas ya publicadas en /reservorio, palabra por palabra, SIN 3D). El mapa de metástasis
//    es un archivo: 200, noindex, «Histórico · junio 2026», fuera del sitemap y sin ningún enlace. El ADC vive en
//    /ciencia y el promo en /prensa, con su transcripción entera. El sitemap no lista redirigidas ni archivadas y su
//    hreflang va por pares recíprocos.
//
// Uso:  pnpm exec nuxt generate && pnpm test:salud-estatica
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, defineComponent, h } from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'
import { REGLAS_PETICIONES, hayEnlaceTodas, peticionesPublicas, seleccionarPeticiones } from '../app/utils/peticiones'
import { HERRAMIENTAS, LEGAL, MENU_ESCRITORIO, MENU_MOVIL, PIE, REDES, SECCIONES, copyHerramienta, type EnlaceNav } from '../app/utils/navegacion'
import { VIDEO_ADC, VIDEO_PROMO } from '../app/utils/videos'
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

// 3.bis — sitemap sin redirigidas ni archivadas, y hreflang por pares (F4)
{
  const cfg = readFileSync('nuxt.config.ts', 'utf-8')
  const redirigidas = new Set([...cfg.matchAll(/'(\/[^']*)':\s*\{\s*redirect:/g)].map((m) => m[1]!))
  const ARCHIVADAS = ['/mapa-metastasis', '/en/mapa-metastasis']
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
  const archivadas = todas.filter((e) => ARCHIVADAS.includes(ruta(e.loc)))
  ok(archivadas.length === 0, `el sitemap no lista el mapa de metástasis (archivo)${archivadas.length ? ` (${archivadas.map((e) => e.loc).join(', ')})` : ''}`)
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
if (existsSync('seed/fundraiser.json')) {
  const semilla = JSON.parse(readFileSync('seed/fundraiser.json', 'utf-8')) as {
    currentAmount: { amount: number }
    goalAmount: { amount: number }
    donationCount: number
  }
  for (const [idioma, paginas] of [['es', ['index.html', 'colabora.html', 'gastos.html']], ['en', ['en.html', 'en/collaborate.html', 'en/expenses.html']]] as const) {
    const etiqueta = JSON.parse(readFileSync(`i18n/locales/${idioma}.json`, 'utf-8')).gofundme.progress_label as string
    for (const pagina of paginas) {
      const barras = [...html(pagina).matchAll(/<div\b[^>]*role="progressbar"[^>]*>/g)].map((m) => m[0]).filter((b) => b.includes(`aria-label="${etiqueta}"`))
      const cuadra = barras.some((b) => b.includes(`aria-valuenow="${semilla.currentAmount.amount}"`) && b.includes(`aria-valuemax="${semilla.goalAmount.amount}"`))
      ok(cuadra, `${pagina}: la barra de la campaña llega en el HTML con la cifra de la semilla (${semilla.currentAmount.amount} de ${semilla.goalAmount.amount})`)
    }
  }
} else {
  console.log('  ⚠️  sin seed/fundraiser.json: se omite la comprobación de la tarjeta de la campaña (ejecuta `pnpm update-fundraiser` antes de generar)')
}

// 7
{
  const { abrirNavegador } = await import('./lib/navegador-cdp.mjs')
  const nav = await abrirNavegador({ ancho: 1024, alto: 900, escala: 1 })
  try {
    // ?fund=viva → la función contesta otra cifra · ?fund=caida → contesta 500
    await nav.cdp('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__pedidos = [];
        const modo = new URLSearchParams(location.search).get('fund');
        const f = window.fetch.bind(window);
        window.fetch = (input, init) => {
          const url = typeof input === 'string' ? input : input.url;
          if (!url.includes('/fundraiser.json')) return f(input, init);
          window.__pedidos.push(url);
          if (modo === 'caida') return Promise.resolve(new Response('no', { status: 500 }));
          return Promise.resolve(new Response(JSON.stringify({ currentAmount: { amount: 12345, currencyCode: 'EUR' }, goalAmount: { amount: 100000, currencyCode: 'EUR' }, donationCount: 77, donationsEnabled: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
        };`,
    })
    const barras = (): Promise<string[]> =>
      nav.evaluate(`[...document.querySelectorAll('[role=progressbar]')].filter((b) => /GoFundMe/.test(b.getAttribute('aria-label') || '')).map((b) => b.getAttribute('aria-valuenow'))`)
    const pedidos = (): Promise<number> => nav.evaluate('window.__pedidos.length')
    // espera (hasta 10 s, la máquina puede ir cargada) a que TODAS las barras valgan `valor`
    const esperaBarras = async (valor: string) => {
      let b: string[] = []
      for (let i = 0; i < 50; i++) {
        b = await barras()
        if (b.length > 0 && b.every((v) => v === valor)) break
        await nav.sleep(200)
      }
      return b
    }
    for (const ruta of ['/', '/colabora', '/gastos', '/en']) {
      await nav.cargar(`${ruta}?fund=viva`)
      const b = await esperaBarras('12345')
      ok(b.length > 0 && b.every((v) => v === '12345'), `${ruta}: la barra de la campaña pasa a la cifra viva (12345) al montar (${b.join(', ') || 'sin barra'})`)
      if (ruta === '/') ok((await pedidos()) === 1, `${ruta}: el hero y la tarjeta comparten UNA petición a /fundraiser.json (${await pedidos()})`)
    }
    // navegar dentro del sitio: al volver a una página con la tarjeta tras pasar por otra sin ella, Nuxt la monta
    // con la cifra del payload prerenderizado (la del build) aunque se acabe de traer la viva
    await nav.cargar('/?fund=viva')
    await esperaBarras('12345')
    for (const destino of ['/colabora', '/equipo', '/colabora', '/gastos']) {
      await nav.evaluate(`document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.push('${destino}')`)
      if (destino === '/equipo') { await nav.sleep(1500); continue }
      const b = await esperaBarras('12345')
      ok(b.length > 0 && b.every((v) => v === '12345'), `navegando por el sitio a ${destino}: la barra vuelve a mostrar la cifra viva (${b.join(', ') || 'sin barra'})`)
    }
    if (existsSync('seed/fundraiser.json')) {
      const semilla = String((JSON.parse(readFileSync('seed/fundraiser.json', 'utf-8')) as { currentAmount: { amount: number } }).currentAmount.amount)
      for (const ruta of ['/', '/colabora']) {
        await nav.cargar(`${ruta}?fund=caida`)
        for (let i = 0; i < 25 && (await pedidos()) === 0; i++) await nav.sleep(200)
        await nav.sleep(800)
        const b = await barras()
        ok((await pedidos()) >= 1 && b.length > 0 && b.every((v) => v === semilla), `${ruta}: si /fundraiser.json falla, la barra conserva la cifra del build (${b.join(', ') || 'sin barra'}; ${await pedidos()} petición/es)`)
      }
    } else {
      console.log('  ⚠️  sin seed/fundraiser.json: se omite «si /fundraiser.json falla, la barra conserva la cifra del build»')
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
  const IDS = ['id="s-hoy"', 'id="que-buscamos"', 'id="s-tejido"', 'id="s-higado"', 'id="s-evo"', 'id="visores"', 'id="reservorio"', 'id="s-vitrina"']
  for (const [idioma, pagina, contacto] of [['es', 'datos.html', '/contacto?role=researcher'], ['en', 'en/data.html', '/en/contact?role=researcher']] as const) {
    const h = html(pagina)
    ok((h.match(/\bid="que-buscamos"/g)?.length ?? 0) === 1, `${pagina}: exactamente un id="que-buscamos"`)
    const pos = IDS.map((id) => h.indexOf(id))
    ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${pagina}: orden Hoy → Qué buscamos → Tejido → Carga tumoral → Evolución → herramientas (#visores) → reservorio → vitrina (${pos.join(' < ')})`)
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
    es: { index: '/', ciencia: '/ciencia', 'ciencia-evidencia': '/ciencia/evidencia', timeline: '/timeline', equipo: '/equipo', datos: '/datos', lesiones: '/lesiones', laminillas: '/laminillas', 'celula-a-celula': '/celula-a-celula', 'celula-a-celula-explorar': '/celula-a-celula/explorar', colabora: '/colabora', prensa: '/prensa', gastos: '/gastos', contacto: '/contacto', 'aviso-legal': '/aviso-legal', privacidad: '/privacidad', cookies: '/cookies' },
    en: { index: '/en', ciencia: '/en/science', 'ciencia-evidencia': '/en/science/evidence', timeline: '/en/timeline', equipo: '/en/team', datos: '/en/data', lesiones: '/en/lesiones', laminillas: '/en/slides', 'celula-a-celula': '/en/cell-by-cell', 'celula-a-celula-explorar': '/en/cell-by-cell/explore', colabora: '/en/collaborate', prensa: '/en/press', gastos: '/en/expenses', contacto: '/en/contact', 'aviso-legal': '/en/legal-notice', privacidad: '/en/privacy', cookies: '/en/cookies-policy' },
  }
  const abierto = estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real'
  const visible = (e: EnlaceNav) => e.key !== 'cell_explorer' || abierto

  // — la fuente (navegacion.ts)
  ok(JSON.stringify(MENU_ESCRITORIO.map((e) => e.key)) === JSON.stringify(['science', 'data', 'timeline', 'team', 'collaborate']), 'menú: La ciencia · Datos · Cronología · Equipo · Cómo ayudar')
  ok(MENU_MOVIL.length === 6 && MENU_MOVIL[0]!.key === 'home' && MENU_MOVIL.slice(1).every((e, i) => e === MENU_ESCRITORIO[i]), 'menú móvil: Inicio primero y luego los mismos cinco')
  ok(PIE.flatMap((g) => g.enlaces).length === 13 && JSON.stringify(PIE.map((g) => g.enlaces.length)) === JSON.stringify([4, 5, 4]), 'pie: 13 enlaces de navegación en 3 columnas (4 + 5 + 4)')
  ok(!('tools' in SECCIONES) && JSON.stringify(SECCIONES.data) === JSON.stringify(['datos', 'lesiones', 'laminillas', 'celula-a-celula', 'celula-a-celula-explorar', 'mapa-metastasis']), 'SECCIONES: «tools» pasa a «data» con sus 6 páginas')
  const fuera = ['herramientas', 'reservorio', 'historia', 'historia-slug', 'ciencia-slug'].filter((n) => Object.values(SECCIONES).some((l) => l.includes(n)))
  ok(fuera.length === 0, `SECCIONES: ya no marcan ítem /herramientas, /reservorio, /historia ni la ruta de artículos${fuera.length ? ` (siguen: ${fuera.join(', ')})` : ''}`)
  ok(MENU_ESCRITORIO.every((e) => e.key in SECCIONES), 'cada ítem del menú tiene su sección')
  ok(REDES.length === 5 && new Set(REDES.map((r) => r.id)).size === 5 && new Set(REDES.map((r) => r.url)).size === 5 && REDES.every((r) => r.url.startsWith('https://') && r.url.includes('miriamgonp')), 'REDES: 5 redes distintas, https, de @miriamgonp')

  for (const loc of ['es', 'en'] as const) {
    const home = loc === 'es' ? 'index.html' : 'en.html'
    const R = RUTA[loc]
    // — el menú
    const m = enlaces(menu(limpio(home), t(loc, 'nav.main_label')))
    ok(JSON.stringify(m.map((e) => e.texto)) === JSON.stringify(MENU_ESCRITORIO.map((e) => etiqueta(loc, e))), `${home}: el menú dice ${m.map((e) => e.texto).join(' · ')}`)
    ok(JSON.stringify(m.map((e) => e.href)) === JSON.stringify(MENU_ESCRITORIO.map((e) => R[e.name])), `${home}: y lleva a ${m.map((e) => e.href).join(' · ')}`)
    // La sección se marca por nombre de ruta: las seis de datos marcan «Datos»; las que salieron de SECCIONES, ninguna.
    const marcada = (pagina: string) => enlaces(menu(limpio(pagina), t(loc, 'nav.main_label'))).filter((e) => e.actual).map((e) => `${e.texto}=${e.actual}`)
    const pag = (es: string, en: string) => (loc === 'es' ? es : en)
    const datos = t(loc, 'nav.data')
    ok(JSON.stringify(marcada(pag('datos.html', 'en/data.html'))) === JSON.stringify([`${datos}=page`]), `${pag('datos.html', 'en/data.html')}: marca «${datos}» (page)`)
    ok(JSON.stringify(marcada(pag('lesiones.html', 'en/lesiones.html'))) === JSON.stringify([`${datos}=true`]), `${pag('lesiones.html', 'en/lesiones.html')}: marca «${datos}» (true), como sección`)
    ok(JSON.stringify(marcada(pag('timeline.html', 'en/timeline.html'))) === JSON.stringify([`${t(loc, 'nav.timeline')}=page`]), `${pag('timeline.html', 'en/timeline.html')}: marca la cronología`)
    // F4: /herramientas se fusionó en /datos#visores; ya no hay página que marque ítem (ni que no lo marque). Lo comprueba §10.
    ok(!existsSync(join(PUB, pag('herramientas.html', 'en/tools.html'))), `${pag('herramientas.html', 'en/tools.html')}: ya no existe (F4 la fusionó en /datos)`)

    // — el pie
    const f = pie(limpio(home))
    const grupos = [...f.matchAll(/<h3 id="pie-([a-z]+)"[^>]*>([^<]*)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((g) => ({ id: g[1]!, titulo: g[2]!, links: enlaces(g[3]!) }))
    ok(JSON.stringify(grupos.map((g) => g.id)) === JSON.stringify(['caso', 'datos', 'participa', 'redes', 'legal']), `${home}: el pie tiene 5 columnas: ${grupos.map((g) => g.id).join(' · ')}`)
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
    const salidos = (loc === 'es' ? ['/historia', '/videos', '/marcas', '/reservorio', '/herramientas'] : ['/en/story', '/en/videos', '/en/brands', '/en/reservorio', '/en/tools'])
    const hrefsPie = enlaces(f).map((e) => e.href)
    ok(salidos.every((r) => !hrefsPie.includes(r)), `${home}: el pie ya no enlaza ${salidos.join(', ')}`)
    ok(!/pathway-chip|<time\b|data-pie-fecha/.test(f), `${home}: el pie no lleva chips «por perfil» ni fecha`)
    ok(!f.includes(t(loc, 'nav.all_tools')), `${home}: ni «${t(loc, 'nav.all_tools')}»`)
    ok(new RegExp(`<section[^>]*aria-label="${t(loc, 'index.supported_by')}"`).test(f) && !new RegExp(`>\\s*${t(loc, 'index.supported_by')}\\s*<`).test(f), `${home}: los logos «${t(loc, 'index.supported_by')}» van sin rótulo visible y con su nombre accesible`)
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
  for (const [pagina, loc, gracias] of [['links.html', 'es', false], ['en/links.html', 'en', false], ['gracias.html', 'es', true], ['en/thank-you.html', 'en', true]] as const) {
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
    ok(gracias ? !apoyoCab : apoyoCab, gracias ? `${pagina}: sin «Apoyar» en la cabecera` : `${pagina}: conserva «Apoyar» en la cabecera (F6 lo pondrá en la página)`)
  }
  {
    const h = limpio('datos.html')
    ok(/<nav\b/.test(cabecera(h)) && h.includes('latest-bar') && h.includes('id="pie-caso"') && h.includes('logo-wall'), 'control: /datos conserva el chrome completo (menú, barra «lo último», pie de 5 columnas y logos)')
  }
}

// 10 — fusiones del rediseño (F4, 23-oct-2026)
{
  const limpio = (ruta: string) => html(ruta).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const decodifica = (x: string) => x.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  const texto = (trozo: string) => decodifica(trozo.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const D = { es: JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')), en: JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')) }
  const t = (loc: 'es' | 'en', clave: string) => clave.split('.').reduce<any>((o, k) => o?.[k], D[loc]) as string
  const P = {
    es: { datos: 'datos.html', lesiones: 'lesiones.html', laminillas: 'laminillas.html', celula: 'celula-a-celula.html', explorar: 'celula-a-celula/explorar.html', mapa: 'mapa-metastasis.html', ciencia: 'ciencia.html', prensa: 'prensa.html', timeline: 'timeline.html', home: 'index.html' },
    en: { datos: 'en/data.html', lesiones: 'en/lesiones.html', laminillas: 'en/slides.html', celula: 'en/cell-by-cell.html', explorar: 'en/cell-by-cell/explore.html', mapa: 'en/mapa-metastasis.html', ciencia: 'en/science.html', prensa: 'en/press.html', timeline: 'en/timeline.html', home: 'en.html' },
  } as const
  const RUTA = {
    es: { lesions: '/lesiones', slides: '/laminillas', cell_by_cell: '/celula-a-celula', cell_explorer: '/celula-a-celula/explorar', visores: '/datos#visores', reservorio: '/datos#reservorio' },
    en: { lesions: '/en/lesiones', slides: '/en/slides', cell_by_cell: '/en/cell-by-cell', cell_explorer: '/en/cell-by-cell/explore', visores: '/en/data#visores', reservorio: '/en/data#reservorio' },
  } as const

  // a) las páginas fusionadas no existen en lo generado (ni .html ni carpeta con index)
  const RETIRADAS = ['herramientas', 'reservorio', 'historia', 'historia/01-el-comienzo', 'videos', 'en/tools', 'en/herramientas', 'en/reservorio', 'en/story', 'en/historia', 'en/story/01-the-beginning', 'en/historia/01-el-comienzo', 'en/videos']
  const quedan = RETIRADAS.filter((r) => existsSync(join(PUB, `${r}.html`)) || existsSync(join(PUB, r, 'index.html')))
  ok(quedan.length === 0, `ninguna página fusionada sigue generada (su .html sombrearía el redirect)${quedan.length ? `: ${quedan.join(', ')}` : ''}`)
  ok(existsSync(join(PUB, 'reservorio')) && existsSync(join(PUB, 'videos', 'como-funciona-un-adc.mp4')), 'public/reservorio/ y public/videos/ siguen ahí (los ficheros no se tocan; el redirect de /reservorio y los vídeos conviven con ellos)')

  // b) nada enlaza a lo retirado (ni al mapa, que es archivo sin enlaces), salvo las migas de célula a célula y su explorador
  const COMPAT = new Set(['celula-a-celula.html', 'celula-a-celula/explorar.html', 'en/cell-by-cell.html', 'en/cell-by-cell/explore.html'])
  const RETIRADA_HREF = /^(?:\/en)?\/(?:herramientas|tools|reservorio|historia|story|videos|mapa-metastasis)(?:[/#?]|$)/
  const hrefsDe = (ruta: string) => [...limpio(ruta).matchAll(/<a\b([^>]*)>/g)].map((m) => /\bhref="([^"]*)"/.exec(m[1]!)?.[1])
  const malos: string[] = [], sinHref: string[] = []
  for (const f of paginasNuxt) {
    for (const href of hrefsDe(f)) {
      if (href === undefined) sinHref.push(f)
      else if (RETIRADA_HREF.test(href) && !(COMPAT.has(f) && /^(?:\/en\/tools|\/herramientas)$/.test(href)) && !(f.endsWith('mapa-metastasis.html') && href.includes('mapa-metastasis'))) malos.push(`${f} → ${href}`)
    }
  }
  ok(malos.length === 0, `ninguna página enlaza a /herramientas, /reservorio, /historia, /videos ni al mapa${malos.length ? `: ${malos.slice(0, 6).join(' · ')}` : ''}`)
  ok(sinHref.length === 0, `ningún <a> sin href en ${paginasNuxt.length} páginas (una miga a una ruta que no existe se pinta así)${sinHref.length ? `: ${[...new Set(sinHref)].join(', ')}` : ''}`)
  for (const loc of ['es', 'en'] as const) {
    // las migas de célula a célula siguen a la ruta de compatibilidad, que el CDN redirige (3 reglas en nuxt.config.ts)
    for (const f of [P[loc].celula, P[loc].explorar]) {
      const compat = loc === 'es' ? '/herramientas' : '/en/tools'
      ok(hrefsDe(f).includes(compat), `${f}: su miga «${t(loc, 'nav.tools')}» lleva a ${compat} (301 a /datos#visores), no a un <a> vacío`)
    }
    // el resto de migas van a la franja de herramientas de /datos
    for (const f of [P[loc].lesiones, P[loc].laminillas, P[loc].mapa]) {
      const enl = [...limpio(f).matchAll(/<a\b([^>]*\bhref="([^"]*)"[^>]*)>([\s\S]*?)<\/a>/g)].filter((m) => m[2] === RUTA[loc].visores)
      ok(enl.length === 1 && texto(enl[0]![3]!) === t(loc, 'nav.data'), `${f}: su miga es «${t(loc, 'nav.data')}» → ${RUTA[loc].visores} (${enl.length})`)
    }
    ok(!hrefsDe(P[loc].datos).some((h) => h === RUTA[loc].visores), `${P[loc].datos}: no lleva miga a sí misma (es de primer nivel desde F3)`)
  }

  // c) /datos: la franja de herramientas y el bloque plegado del reservorio
  const XABIERTO = estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real'
  for (const loc of ['es', 'en'] as const) {
    const f = P[loc].datos
    const h = limpio(f)
    const A = h.indexOf('id="visores"'), B = h.indexOf('id="reservorio"'), C = h.indexOf('id="s-vitrina"')
    ok((h.match(/\bid="visores"/g)?.length ?? 0) === 1 && (h.match(/\bid="reservorio"/g)?.length ?? 0) === 1, `${f}: exactamente un id="visores" y un id="reservorio" (a ellos aterrizan los redirects)`)
    const franja = h.slice(h.lastIndexOf('<section', A), h.lastIndexOf('<section', B)), bloque = h.slice(h.lastIndexOf('<section', B), C)
    ok(texto(franja).startsWith(`${t(loc, 'herramientas.title')} ${t(loc, 'herramientas.intro')}`), `${f}: la franja se titula «${t(loc, 'herramientas.title')}» y lleva su intro ya publicada`)
    const esperadas = HERRAMIENTAS.filter((x) => x.key !== 'data' && (x.key !== 'cell_explorer' || XABIERTO))
    const tarjetas = [...franja.matchAll(/<li\b[^>]*>\s*<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/g)]
    ok(JSON.stringify(tarjetas.map((m) => m[1])) === JSON.stringify(esperadas.map((x) => RUTA[loc][x.key as 'lesions'])), `${f}: tarjetas en el orden de HERRAMIENTAS, sin /datos, sin el mapa y sin el reservorio (${tarjetas.map((m) => m[1]).join(' · ')})`)
    esperadas.forEach((x, i) => {
      const [titulo, descripcion] = copyHerramienta(x.key, loc)
      const cuerpo = texto(tarjetas[i]?.[2] ?? '')
      ok(cuerpo.includes(titulo) && cuerpo.includes(descripcion), `${f}: la tarjeta «${titulo}» lleva su título y su descripción ya publicados, palabra por palabra`)
    })
    ok(!/reservorio|port-a-cath|\bport\b/i.test(texto(franja).replace(t(loc, 'herramientas.intro'), '')), `${f}: la franja de herramientas no incluye el reservorio`)
    ok(h.includes('href="#visores"'), `${f}: la barra de secciones tiene su chip «Herramientas» (sin él, el scroll-spy seguía marcando «Evolución»)`)
    // los dos enlaces «Todas las herramientas» que quedan (la home y /ciencia) llevan a la franja, no a la página que ya no existe
    for (const origen of [P[loc].home, P[loc].ciencia]) {
      const todas = [...limpio(origen).matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter((m) => texto(m[2]!).includes(t(loc, 'nav.all_tools')))
      ok(todas.length === 1 && todas[0]![1] === RUTA[loc].visores, `${origen}: «${t(loc, 'nav.all_tools')}» lleva a ${RUTA[loc].visores} (${todas.map((m) => m[1]).join(', ') || 'no está'})`)
    }
    // el bloque del reservorio: plegado, SIN 3D, con las frases y las medidas publicadas
    const FRASES = {
      es: 'Es una cámara pequeña que se implanta bajo la piel del pecho, unida a un catéter fino que llega hasta una vena grande, cerca del corazón. Se pincha a través de una membrana con una aguja especial, y la membrana se cierra al sacarla.',
      en: 'It’s a small chamber implanted under the skin of the chest, joined to a thin catheter that runs to a large vein near the heart. A special needle goes in through a membrane, and the membrane seals again when the needle comes out.',
    }
    const MEDIDAS = {
      es: 'Longitud del catéter, portal→punta, en las tres fechas: 150,8 mm · 152,2 mm · 151,7 mm (± 5 mm cada medida; ± 10 mm en la diferencia entre fechas). Dentro de ese margen, es la misma medida las tres veces.',
      en: 'Catheter length, port→tip, across the three dates: 150.8 mm · 152.2 mm · 151.7 mm (± 5 mm per measurement; ± 10 mm on the difference between dates). Within that margin, it is the same measurement all three times.',
    }
    const det = /<details\b([^>]*)>/.exec(bloque)
    ok(!!det && !/\bopen\b/.test(det[1]!), `${f}: el reservorio va en un <details> cerrado por defecto`)
    ok(texto(bloque).includes(FRASES[loc]), `${f}: las dos frases de «qué es un port-a-cath», tal cual estaban en /reservorio`)
    ok(texto(bloque).includes(MEDIDAS[loc]), `${f}: las medidas, tal cual estaban en /reservorio (si caso.json cambia una cifra, esto se pone en rojo: es dato clínico)`)
    ok(!/<button\b|<canvas\b|3D|ReservoirView|\/reservorio\//i.test(bloque), `${f}: el bloque del reservorio no lleva 3D (ni botón, ni lienzo, ni mallas)`)
  }

  // d) el mapa de metástasis es un archivo: noindex, rotulado, fuera del sitemap y sin enlaces
  for (const loc of ['es', 'en'] as const) {
    const f = P[loc].mapa
    const meta = html(f).match(/<meta\b[^>]*\bname="robots"[^>]*>/gi)?.join(' ') ?? ''
    ok(/noindex/i.test(meta) && !/content="index/i.test(meta), `${f}: robots dice noindex (${meta.match(/content="([^"]*)"/)?.[1] ?? 'sin meta'})`)
    ok(texto(limpio(f)).includes(loc === 'es' ? 'Histórico · junio 2026' : 'Archive · June 2026'), `${f}: lleva su rótulo «${loc === 'es' ? 'Histórico · junio 2026' : 'Archive · June 2026'}»`)
    ok((limpio(f).match(/<h1\b/g)?.length ?? 0) === 1, `${f}: sigue en 200 y con un solo <h1>`)
  }
  ok(!/Disallow:\s*\/(?:en\/)?mapa-metastasis/.test(readFileSync('public/_robots.txt', 'utf-8')), 'public/_robots.txt no bloquea el mapa: bloquearlo impediría ver su noindex')

  // e) vídeos: el ADC en /ciencia (junto al eje TROP-2) y el promo en /prensa, con la transcripción entera
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
    chequeaVideo(P[loc].ciencia, VIDEO_ADC, (art) => {
      ok(loc === 'es' ? !art.includes(t('es', 'videos.voice_other')) : texto(art).includes(t('en', 'videos.voice_other')) && texto(art).includes(VIDEO_ADC.resumenEn!), `${P[loc].ciencia}: ${loc === 'es' ? 'sin aviso de idioma' : 'avisa de que está narrado en español y lleva su resumen en inglés'}`)
    })
    chequeaVideo(P[loc].prensa, VIDEO_PROMO[loc], () => {})
    // el ADC está pegado al eje TROP-2: después de los ejes y antes del panel de rebiopsia
    const c = limpio(P[loc].ciencia)
    const ejes = c.indexOf('id="axes-title"'), adc = c.indexOf(VIDEO_ADC.src), panel = c.indexOf('id="panel-title"')
    ok(ejes > 0 && adc > ejes && panel > adc, `${P[loc].ciencia}: el vídeo del ADC va justo después de los ejes terapéuticos y antes del panel (${ejes} < ${adc} < ${panel})`)
    // fuera de la capa de datos (v-show) para que se vea también en el modo llano, que es el que abre quien venía de /videos:
    // el HTML sale con el modo llano, así que la capa de datos lleva display:none y el vídeo NO puede estar dentro de ninguna.
    const abiertos: string[] = []
    for (const m of c.slice(0, adc).matchAll(/<(\/?)(div|section)\b([^>]*)>/g)) { if (m[1]) abiertos.pop(); else abiertos.push(m[3]!) }
    ok(adc > 0 && !abiertos.some((a) => /display:\s*none/.test(a)), `${P[loc].ciencia}: el vídeo del ADC se ve también en el modo llano (ningún contenedor suyo está oculto)`)
  }

  // f) /timeline: la línea humana de /historia (frase ya publicada), sin enlace a /historia
  for (const loc of ['es', 'en'] as const) {
    ok(texto(limpio(P[loc].timeline)).includes(t(loc, 'historia.story_teaser_1')), `${P[loc].timeline}: lleva la línea de /historia (historia.story_teaser_1), tal cual`)
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ ancla, «hace N días», sitemap (sin redirigidas ni archivadas, hreflang por pares), <main> único, «Ver quién apoya», campaña (en el HTML y en vivo), «Qué buscamos», navegación (menú, pie, redes, chrome mínimo) y fusiones de F4 (herramientas, reservorio, mapa archivado, vídeos) en verde')
process.exit(fallos ? 1 : 0)
