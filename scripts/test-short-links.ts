// Test de los enlaces cortos: que no vuelva el 404 de #117–#119 ni el «shadowing» de Netlify.
//
// La clase del fallo: una routeRule de redirect que NO está en nitro.prerender.ignore
// genera su `.html` de meta-refresh, y Netlify sirve ESE fichero en vez del 302 limpio.
// Se comprueba sobre el nuxt.config.ts real, sin build.
//
// 1. Toda routeRule de redirect está excluida del prerender.
// 1.bis Ninguna ruta ignorada es PREFIJO de una página real: `prerender.ignore` casa por
//   prefijo, así que ignorar '/biopsia' dejó sin prerenderizar /biopsia-osea y tiró la
//   página a un 404 en producción (20-sep-2026).
// 2. Todo enlace corto lleva su UTM (source, medium y campaign) salvo los que saltan fuera.
// 3. Los cortos están documentados en SHORT-LINKS.md (la tabla no se queda atrás).
// 4. /caso, el enlace que se reenvía a médicos, aterriza en «Qué buscamos» de /datos (rediseño F1,
//   23-oct-2026), y esa ancla existe en la página y en la tabla de SHORT-LINKS.md.
// 5. Páginas fusionadas (rediseño F4, 23-oct-2026): /herramientas, /reservorio, /historia (y su capítulo) y /videos ya
//   no existen y solo queda su redirección. Tabla EXACTA ruta → destino → código (cada 301 son tres reglas: ES, EN y la
//   variante /en/<slug-es>), sin query, sin cadenas, con el destino real y su ancla, sin la página, sus claves de
//   prerender ni su colección, y documentada en SHORT-LINKS.md. Los /3d* siguen en 302 con los MISMOS UTM, ahora a /lesiones.
//
// Uso:  pnpm test:short-links
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const cfg = readFileSync('nuxt.config.ts', 'utf-8')
const doc = readFileSync('SHORT-LINKS.md', 'utf-8')
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// Rutas con redirect, y el bloque de ignore
const redirects = [...cfg.matchAll(/'(\/[^']*)':\s*\{\s*redirect:\s*\{\s*to:\s*'([^']+)'(?:,\s*statusCode:\s*(\d+))?/g)]
  .map(([, ruta, destino, codigo]) => ({ ruta, destino, codigo: Number(codigo) }))
ok(redirects.length > 0, `el config declara redirects (${redirects.length})`)

const bloqueIgnore = cfg.match(/ignore:\s*\[([\s\S]*?)\]/)?.[1] ?? ''
const ignorados = new Set([...bloqueIgnore.matchAll(/'([^']+)'/g)].map(m => m[1]))

// 1
for (const { ruta } of redirects)
  ok(ignorados.has(ruta), `${ruta} está en prerender.ignore (si no, su .html sombrea el 302)`)

// 1.bis — el ignore casa por prefijo: que no se coma una página real
const paginas = readdirSync('app/pages', { recursive: true })
  .filter((f): f is string => typeof f === 'string' && f.endsWith('.vue'))
  .map(f => '/' + f.replace(/\.vue$/, '').replace(/\/?index$/, ''))
for (const ign of ignorados) {
  const comidas = paginas.filter(pg => pg !== ign && pg.startsWith(ign))
  ok(comidas.length === 0, `'${ign}' no es prefijo de ninguna página${comidas.length ? ` (se come ${comidas.join(', ')})` : ''}`)
}

// 2 · 3 — solo los cortos de campaña: destino interno y con query
for (const { ruta, destino } of redirects) {
  if (!destino.startsWith('/') || !destino.includes('?')) continue
  for (const utm of ['utm_source=', 'utm_medium=', 'utm_campaign='])
    ok(destino.includes(utm), `${ruta} lleva ${utm.replace('=', '')}`)
  ok(destino === destino.toLowerCase(), `${ruta} apunta a un destino en minúsculas (Umami agrupa exacto)`)
  ok(doc.includes(`\`${ruta}\``), `${ruta} está en la tabla de SHORT-LINKS.md`)
}

// 4
const caso = redirects.find(r => r.ruta === '/caso')?.destino ?? ''
ok(/^\/datos\?utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#que-buscamos$/.test(caso), `/caso → /datos con su UTM de equipo clínico y el ancla #que-buscamos (${caso || 'sin regla'})`)
ok(readFileSync('app/pages/datos.vue', 'utf-8').includes('id="que-buscamos"'), 'app/pages/datos.vue lleva el id="que-buscamos" al que apunta /caso')
ok(/\|\s*`\/caso`\s*\|\s*`\/datos#que-buscamos`\s*\|/.test(doc), 'la fila de /caso en SHORT-LINKS.md dice /datos#que-buscamos')

// 5
{
  const FUSIONADAS: [string, string, number][] = [
    ['/herramientas', '/datos#visores', 301], ['/en/tools', '/en/data#visores', 301], ['/en/herramientas', '/en/data#visores', 301],
    ['/reservorio', '/datos#reservorio', 302], ['/en/reservorio', '/en/data#reservorio', 302],
    ['/historia', '/timeline', 302], ['/en/story', '/en/timeline', 302], ['/en/historia', '/en/timeline', 302],
    ['/historia/01-el-comienzo', '/timeline', 301], ['/en/story/01-the-beginning', '/en/timeline', 301], ['/en/historia/01-el-comienzo', '/en/timeline', 301],
    ['/videos', '/ciencia', 301], ['/en/videos', '/en/science', 301],
  ]
  const porRuta = new Map(redirects.map((r) => [r.ruta, r]))
  for (const [ruta, destino, codigo] of FUSIONADAS) {
    const r = porRuta.get(ruta)
    ok(r?.destino === destino && r?.codigo === codigo, `${ruta} → ${destino} (${codigo})${r ? ` [config: ${r.destino} ${r.codigo}]` : ' [sin regla]'}`)
    ok(!destino.includes('?'), `${ruta}: sin query (un «?» lo trataría este test como corto de campaña)`)
    ok(!porRuta.has(destino.split('#')[0]!), `${ruta}: el destino no es otro redirect (sin cadenas)`)
    ok(doc.includes(`\`${ruta}\``), `${ruta} está en la tabla de «Páginas fusionadas» de SHORT-LINKS.md`)
  }
  // el destino es una página real y, si lleva ancla, el id existe en ella
  const PAGINA_ES: Record<string, string> = { '/datos': 'app/pages/datos.vue', '/timeline': 'app/pages/timeline.vue', '/ciencia': 'app/pages/ciencia/index.vue' }
  for (const [, destino] of FUSIONADAS) {
    const [ruta, ancla] = destino.split('#') as [string, string | undefined]
    const es = ruta.replace(/^\/en(?=\/|$)/, '')
    const fichero = PAGINA_ES[es === '' ? '/' : es.replace(/^\/(data)$/, '/datos').replace(/^\/(science)$/, '/ciencia')]
    ok(!!fichero, `${destino}: apunta a una página conocida (${fichero ?? 'desconocida'})`)
    if (fichero && ancla) ok(readFileSync(fichero, 'utf-8').includes(`id="${ancla}"`), `${destino}: ${fichero} lleva id="${ancla}"`)
  }
  // los destinos EN son la ruta traducida REAL de i18n.pages (o la española con /en, si no está traducida)
  const enDe = (nombre: string) => cfg.match(new RegExp(`'${nombre}':\\s*\\{\\s*en:\\s*'([^']+)'`))?.[1]
  ok(enDe('datos') === '/data' && enDe('ciencia/index') === '/science', `i18n.pages: datos → /en/data y ciencia → /en/science (${enDe('datos')}, ${enDe('ciencia/index')})`)
  ok(!enDe('timeline'), '/timeline no está traducida: su ruta inglesa es /en/timeline')
  // la página, sus claves de prerender y su colección ya no existen
  for (const f of ['app/pages/herramientas.vue', 'app/pages/reservorio.vue', 'app/pages/videos.vue', 'app/pages/historia', 'content/es/historia', 'content/en/story'])
    ok(!existsSync(f), `${f} ya no existe (solo queda su redirect)`)
  ok(!/'(?:historia\/index|historia\/\[slug\]|reservorio|herramientas)':\s*\{\s*en:/.test(cfg), 'i18n.pages ya no traduce historia, reservorio ni herramientas')
  ok(!/historia_(es|en)/.test(readFileSync('content.config.ts', 'utf-8')), 'content.config.ts ya no define las colecciones de historia')
  const rutasPrerender = cfg.match(/routes:\s*\[([^\]]*)\]/)?.[1] ?? ''
  ok(!/herramientas|\/tools/.test(rutasPrerender), `nitro.prerender.routes ya no lista /herramientas (si no, su .html sombrea el 301): ${rutasPrerender.trim()}`)
  // los /3d* siguen en 302, con los mismos UTM, y ahora llevan a /lesiones
  const UTM3D: Record<string, string> = { '/3d': 'source=short&utm_medium=link', '/3d-x': 'source=twitter&utm_medium=post', '/3d-in': 'source=linkedin&utm_medium=post', '/3d-ig': 'source=instagram&utm_medium=bio', '/3d-tt': 'source=tiktok&utm_medium=bio', '/3d-yt': 'source=youtube&utm_medium=bio' }
  for (const [ruta, utm] of Object.entries(UTM3D)) {
    const r = porRuta.get(ruta)
    ok(r?.destino === `/lesiones?utm_${utm}&utm_campaign=lanzamiento-herramienta` && r?.codigo === 302, `${ruta} → /lesiones con los mismos UTM (302): ${r?.destino ?? 'sin regla'} ${r?.codigo ?? ''}`)
    ok(doc.includes(`| \`${ruta}\` | \`/lesiones\` |`), `${ruta}: la tabla de SHORT-LINKS.md dice /lesiones`)
  }
  // ninguna regla sigue apuntando a las páginas retiradas, ni al mapa (archivo, sin enlaces ni redirects entrantes propios)
  const aRetiradas = redirects.filter((r) => /^\/(?:en\/)?(?:herramientas|tools|reservorio|historia|story|videos|mapa-metastasis)(?:[/?#]|$)/.test(r.destino))
  ok(aRetiradas.length === 0, `ningún redirect apunta a una página retirada o archivada${aRetiradas.length ? ` (${aRetiradas.map((r) => r.ruta).join(', ')})` : ''}`)
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ enlaces cortos en verde')
process.exit(fallos ? 1 : 0)
