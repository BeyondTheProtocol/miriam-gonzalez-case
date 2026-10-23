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
// Uso:  pnpm exec nuxt generate && pnpm test:salud-estatica
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, defineComponent, h } from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'
import { REGLAS_PETICIONES, hayEnlaceTodas, peticionesPublicas, seleccionarPeticiones } from '../app/utils/peticiones'

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
  const IDS = ['id="s-hoy"', 'id="que-buscamos"', 'id="s-tejido"', 'id="s-higado"', 'id="s-evo"', 'id="s-vitrina"']
  for (const [idioma, pagina, contacto] of [['es', 'datos.html', '/contacto?role=researcher'], ['en', 'en/data.html', '/en/contact?role=researcher']] as const) {
    const h = html(pagina)
    ok((h.match(/\bid="que-buscamos"/g)?.length ?? 0) === 1, `${pagina}: exactamente un id="que-buscamos"`)
    const pos = IDS.map((id) => h.indexOf(id))
    ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]!)), `${pagina}: orden Hoy → Qué buscamos → Tejido → Carga tumoral → Evolución → visores (${pos.join(' < ')})`)
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

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ ancla, «hace N días», sitemap, <main> único, «Ver quién apoya», campaña (en el HTML y en vivo) y «Qué buscamos» en verde')
process.exit(fallos ? 1 : 0)
