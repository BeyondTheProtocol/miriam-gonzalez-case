// Sitemap del explorador célula a célula (/celula-a-celula/explorar, EN /cell-by-cell/explore), sobre el build ESTÁTICO.
//
// Por qué existe (20-oct-2026): nuxt.config.ts sacaba el explorador del sitemap con una lista fija «mientras no
// haya datos reales con el OK». La puerta se abrió el 19-oct (la página ya sirve «index, follow») y la lista
// siguió igual: Google no recibía el explorador por el sitemap. Ahora la exclusión sigue a la misma puerta que el
// robots de la página (estadoPuerta del manifiesto) y esto lo comprueba en lo generado:
//   1. puerta abierta (`real`): es-ES.xml lista la URL española y en-US.xml la inglesa, cada una en su <loc>
//      (la inglesa es la ruta traducida, justo la que la exclusión automática de noindex no casaba);
//   2. puerta cerrada: ningún sitemap lista ninguna de las dos;
//   3. en los dos casos, el robots del HTML generado dice lo mismo que el sitemap.
// Lee __sitemap__/*.xml: el sitemap_index.xml de la raíz solo lista los sitemaps por idioma, no las páginas.
// Uso: pnpm exec nuxt generate && pnpm test:sitemap-explorador   (CI: e2e.yml)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { estadoPuerta, type Manifiesto } from '../app/utils/celulaExplorador'

const RAIZ = join(import.meta.dirname, '..')
const PUB = join(RAIZ, '.output', 'public')
const DIR = join(PUB, '__sitemap__')
const SITIO = 'https://helpmiriam.com'
const man = JSON.parse(readFileSync(join(RAIZ, 'public', 'celula', 'explorador', 'manifiesto.json'), 'utf8')) as Manifiesto
const abierta = estadoPuerta(man) === 'real'
let fallos = 0, hechos = 0
const ok = (cond: boolean, msg: string) => { hechos++; console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

if (!existsSync(DIR)) { console.error(`❌ no existe ${DIR}: falta \`pnpm exec nuxt generate\``); process.exit(1) }
const locs = (f: string) => [...readFileSync(join(DIR, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/\/$/, ''))
const porSitemap: Record<string, string[]> = Object.fromEntries(readdirSync(DIR).filter((f) => f.endsWith('.xml')).map((f) => [f, locs(f)]))
const todas = Object.values(porSitemap).flat()
ok(todas.length > 0, `hay URLs en los sitemaps por idioma (${Object.keys(porSitemap).join(', ')})`)

console.log(`Puerta del explorador: ${abierta ? 'abierta (real)' : 'cerrada'}`)
for (const [sm, ruta, fichero] of [
  ['es-ES.xml', '/celula-a-celula/explorar', 'celula-a-celula/explorar.html'],
  ['en-US.xml', '/en/cell-by-cell/explore', 'en/cell-by-cell/explore.html'],
] as const) {
  const url = SITIO + ruta
  if (abierta) ok(!!porSitemap[sm]?.includes(url), `${sm} lista ${url}`)
  else ok(!todas.includes(url), `ningún sitemap lista ${url} (puerta cerrada)`)
  const h = existsSync(join(PUB, fichero)) ? readFileSync(join(PUB, fichero), 'utf8') : ''
  const robots = h.match(/<meta\b[^>]*\bname="robots"[^>]*>/i)?.[0]?.match(/content="([^"]*)"/)?.[1] ?? ''
  ok(abierta ? /^index\b/.test(robots) : /noindex/.test(robots), `${fichero}: robots «${robots || 'sin meta'}» casa con la puerta`)
}

console.log(fallos ? `\n❌ ${fallos} de ${hechos} comprobaciones fallan` : `\n✅ ${hechos} de ${hechos}: el sitemap sigue a la puerta del explorador`)
process.exit(fallos ? 1 : 0)
