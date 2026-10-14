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
// Uso:  pnpm exec nuxt generate && pnpm test:salud-estatica
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

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

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ ancla, «hace N días» y sitemap en verde')
process.exit(fallos ? 1 : 0)
