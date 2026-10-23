// Test de las fechas de «Actualizado el…»: cada página dice SU fecha (rediseño de arquitectura, F3, 23-oct-2026);
// el pie ya no dice una global.
//
// Historia: el 22-oct-2026 el pie pasó de «junio de 2026» escrito a mano al día del último commit del sitio entero
// (regla de Miriam: cada vez que cambia la web, el pie lo dice). El rediseño quitó esa fecha del pie: decía «actualizado»
// de páginas que no habían cambiado, una frescura falsa. Ahora la dice cada página que tiene una fecha fiable en su código
// o en sus datos (componente ActualizadoEl, con la voz de Nota ✱), y solo esas. Si Miriam prefiere el pie como estaba,
// es una decisión suya: fechaCambio.ts y runtimeConfig.public.ultimoCambio siguen ahí.
//
// Qué mira:
//   1. El formato, por idioma y en hora de Madrid, para un instante y para un día suelto.
//   2. El pie NO lleva fecha: ni en el código, ni en lo generado, ni «month_updated».
//   3. ActualizadoEl pinta solo una fecha AAAA-MM-DD válida (nada si no), y nunca la del build.
//   4. Lo generado: /datos dice la de caso.json y /prensa la de caseData.pressAsOf, en los dos idiomas, con su `<time>`;
//      y las páginas sin fecha propia no inventan ninguna.
//
// Uso:  pnpm exec nuxt generate && pnpm test:pie-fecha
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { diaCambio, formatearFechaCambio } from '../app/utils/fechaCambio'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

// 1
ok(formatearFechaCambio('2026-10-22T10:00:00+02:00', 'es') === '22 de octubre de 2026', 'español: «22 de octubre de 2026»')
ok(formatearFechaCambio('2026-10-22T10:00:00+02:00', 'en') === '22 October 2026', 'inglés: «22 October 2026»')
ok(formatearFechaCambio('2026-10-21T22:30:00Z', 'es') === '22 de octubre de 2026', 'hora de Madrid: las 00:30 del 22 son el 22')
ok(formatearFechaCambio('2026-10-21', 'es') === '21 de octubre de 2026' && formatearFechaCambio('2026-10-21', 'en') === '21 October 2026', 'un día suelto (AAAA-MM-DD) cae en ese mismo día, en los dos idiomas')
ok(formatearFechaCambio('no es fecha', 'es') === '' && formatearFechaCambio(undefined, 'es') === '', 'sin fecha válida no pinta nada')
ok(formatearFechaCambio('2026-13-45', 'es') === '', 'un día imposible tampoco')
ok(diaCambio('2026-10-21T22:30:00Z') === '2026-10-22', 'datetime: solo el día, en hora de Madrid')
ok(diaCambio('2026-10-21') === '2026-10-21', 'datetime de un día suelto: el mismo día')

// 2
const pie = readFileSync('app/components/SiteFooter.vue', 'utf-8')
ok(!/month_updated|\b20\d\d\s*<\/p>/.test(pie), 'el pie no lleva un mes ni un año escritos a mano')
ok(!/ultimoCambio|fechaCambio|data-pie-fecha|footer\.updated|<time\b/.test(pie), 'el pie no lleva fecha ninguna: ni la del build, ni <time>, ni «footer.updated»')
for (const l of ['es', 'en']) {
  const footer = JSON.parse(readFileSync(`i18n/locales/${l}.json`, 'utf-8')).footer as Record<string, string>
  ok(!('month_updated' in footer), `i18n/${l}: sin «month_updated»`)
}

// 3 — el componente es fail-closed: sin fecha AAAA-MM-DD válida no pinta ni la Nota
const comp = readFileSync('app/components/ActualizadoEl.vue', 'utf-8')
ok(/<Nota v-if="dia">/.test(comp), 'ActualizadoEl no pinta la Nota si no hay día válido')
ok(/\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(props\.fecha/.test(comp), 'ActualizadoEl exige AAAA-MM-DD exacto (ni hora, ni texto libre)')
ok(!/ultimoCambio|new Date\(\)|Date\.now/.test(comp), 'ActualizadoEl no lee la fecha del build ni la de hoy')
const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8'))
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8'))
ok(typeof es.page?.updated === 'string' && es.page.updated.includes('{date}') && typeof en.page?.updated === 'string' && en.page.updated.includes('{date}'), 'page.updated existe en ES y EN y lleva {date}')
ok(typeof es.press.updated_label === 'string' && es.press.updated_label.includes('{date}') && en.press.updated_label.includes('{date}'), 'press.updated_label (la frase propia de /prensa) lleva {date} en los dos idiomas')

// 4
const PUB = '.output/public'
if (!existsSync(PUB)) {
  console.error(`❌ no existe ${PUB}: ejecuta antes \`pnpm exec nuxt generate\``)
  process.exit(1)
}
const limpio = (ruta: string) => readFileSync(join(PUB, ruta), 'utf-8').replace(/<!--[\s\S]*?-->/g, '')
const caso = JSON.parse(readFileSync('app/data/caso.json', 'utf-8')) as { actualizado: string }
const pressAsOf = readFileSync('app/utils/caseData.ts', 'utf-8').match(/pressAsOf:\s*'(\d{4}-\d{2}-\d{2})'/)?.[1] ?? ''
ok(/^\d{4}-\d{2}-\d{2}$/.test(caso.actualizado) && !!pressAsOf, `las dos fuentes existen (caso.json ${caso.actualizado}, caseData.pressAsOf ${pressAsOf})`)

type Notas = { dia: string; texto: string; frase: string }[]
// Las Notas de «actualizado» de un HTML: el texto que va antes del <time>, su datetime y lo que muestra.
const notasFecha = (html: string): Notas =>
  [...html.matchAll(/<p\b[^>]*class="[^"]*\bnota\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => m[1]!.match(/([^<>]*)<time\b[^>]*datetime="([^"]+)"[^>]*>([^<]*)<\/time>/))
    .filter((t): t is RegExpMatchArray => !!t)
    .map((t) => ({ frase: t[1]!.trim(), dia: t[2]!, texto: t[3]!.trim() }))

const PAGINAS = [
  { pagina: 'datos.html', locale: 'es', dia: caso.actualizado, clave: (d: any) => d.page.updated },
  { pagina: 'en/data.html', locale: 'en', dia: caso.actualizado, clave: (d: any) => d.page.updated },
  { pagina: 'prensa.html', locale: 'es', dia: pressAsOf, clave: (d: any) => d.press.updated_label },
  { pagina: 'en/press.html', locale: 'en', dia: pressAsOf, clave: (d: any) => d.press.updated_label },
] as const
for (const { pagina, locale, dia, clave } of PAGINAS) {
  const notas = notasFecha(limpio(pagina))
  ok(notas.length === 1, `${pagina}: exactamente una Nota con fecha (${notas.length}); como mucho una por página`)
  const n = notas[0]
  if (!n) continue
  const d = locale === 'es' ? es : en
  const frase = String(clave(d)).split('{date}')[0]!.trim()
  ok(n.dia === dia, `${pagina}: <time datetime="${n.dia}"> es la de su fuente (${dia})`)
  ok(n.texto === formatearFechaCambio(dia, locale), `${pagina}: dice «${n.texto}»`)
  ok(n.frase === frase, `${pagina}: la frase es la de i18n («${n.frase}»)`)
}

// El día del build no se cuela en ninguna página: ni en el pie ni en una Nota que no sea de su fuente.
for (const pagina of ['index.html', 'en.html', 'colabora.html', 'equipo.html', 'contacto.html', 'timeline.html', 'lesiones.html', 'links.html', 'gracias.html']) {
  const h = limpio(pagina)
  ok(notasFecha(h).length === 0, `${pagina}: ninguna fecha de «actualizado» inventada (esta página no tiene una fiable)`)
  ok(!/data-pie-fecha/.test(h), `${pagina}: sin <time data-pie-fecha> en el pie`)
}

if (fallos) {
  console.error(`\n❌ ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('\n✅ CADA PÁGINA DICE SU FECHA, Y EL PIE NINGUNA')
