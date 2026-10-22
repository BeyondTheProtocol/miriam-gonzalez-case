// Test del pie: «Última actualización» es el día del último cambio de la web, no un mes a mano.
//
// Por qué (22-oct-2026): el pie decía «junio de 2026» escrito en i18n y nadie lo cambiaba al
// publicar; en octubre seguía igual. Regla de Miriam: cada vez que cambia la web, el pie lo dice.
// Ahora la fecha sale del último commit en el build (nuxt.config.ts → ultimoCambio).
//
// Qué mira:
//   1. El formato, por idioma y en hora de Madrid (un cambio a las 00:30 de España es de ese día).
//   2. Lo generado (.output/public): la home en español y en inglés pinta la fecha del último
//      commit dentro de <time data-pie-fecha>, con ese día (sin hora) en `datetime`.
//   3. Que no vuelva el mes escrito a mano.
//
// Uso:  pnpm exec nuxt generate && pnpm test:pie-fecha
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { diaCambio, formatearFechaCambio } from '../app/utils/fechaCambio'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// 1
ok(formatearFechaCambio('2026-10-22T10:00:00+02:00', 'es') === '22 de octubre de 2026', 'español: «22 de octubre de 2026»')
ok(formatearFechaCambio('2026-10-22T10:00:00+02:00', 'en') === '22 October 2026', 'inglés: «22 October 2026»')
ok(formatearFechaCambio('2026-10-21T22:30:00Z', 'es') === '22 de octubre de 2026', 'hora de Madrid: las 00:30 del 22 son el 22')
ok(formatearFechaCambio('no es fecha', 'es') === '' && formatearFechaCambio(undefined, 'es') === '', 'sin fecha válida no pinta nada')
ok(diaCambio('2026-10-21T22:30:00Z') === '2026-10-22', 'datetime: solo el día, en hora de Madrid')

// 3
const pie = readFileSync('app/components/SiteFooter.vue', 'utf-8')
ok(!/month_updated|\b20\d\d\s*<\/p>/.test(pie), 'el pie no lleva un mes ni un año escritos a mano')
for (const l of ['es', 'en']) {
  const footer = JSON.parse(readFileSync(`i18n/locales/${l}.json`, 'utf-8')).footer as Record<string, string>
  ok(!('month_updated' in footer), `i18n/${l}: sin «month_updated»`)
}

// 2
const PUB = '.output/public'
if (!existsSync(PUB)) {
  console.error(`❌ no existe ${PUB}: ejecuta antes \`pnpm exec nuxt generate\``)
  process.exit(1)
}
const iso = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim()
for (const [idioma, pagina] of [['es', 'index.html'], ['en', 'en.html']] as const) {
  const h = readFileSync(join(PUB, pagina), 'utf-8')
  const t = h.match(/<time[^>]*data-pie-fecha[^>]*>([^<]*)<\/time>/)
  ok(!!t, `${pagina}: el pie pinta <time data-pie-fecha>`)
  if (!t) continue
  const esperada = formatearFechaCambio(iso, idioma)
  ok(t[1]!.trim() === esperada, `${pagina}: «${t[1]!.trim()}» es el día del último commit («${esperada}»)`)
  const dt = t[0].match(/datetime="([^"]+)"/)?.[1]
  ok(dt === diaCambio(iso), `${pagina}: datetime = día del último commit, sin hora (${dt})`)
}

if (fallos) {
  console.error(`\n❌ ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('\n✅ PIE CON LA FECHA DEL ÚLTIMO CAMBIO')
