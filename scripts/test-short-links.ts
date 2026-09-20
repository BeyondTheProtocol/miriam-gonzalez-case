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
//
// Uso:  pnpm test:short-links
import { readFileSync, readdirSync } from 'node:fs'

const cfg = readFileSync('nuxt.config.ts', 'utf-8')
const doc = readFileSync('SHORT-LINKS.md', 'utf-8')
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// Rutas con redirect, y el bloque de ignore
const redirects = [...cfg.matchAll(/'(\/[^']*)':\s*\{\s*redirect:\s*\{\s*to:\s*'([^']+)'/g)]
  .map(([, ruta, destino]) => ({ ruta, destino }))
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

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ enlaces cortos en verde')
process.exit(fallos ? 1 : 0)
