// Fuente única de las cifras de dinero y norma de transparencia (rediseño T2b, 24-oct-2026).
//
// Norma de Miriam, a fuego: «somos transparentes: no detallamos ciertas cosas, pero sí mostramos algunas cifras y el desglose de
// gastos por categorías». De ahí salen cinco cosas que se rompen en silencio y que ningún otro test mira:
//
// 1. Ninguna cifra en € escrita a mano. Las cifras de dinero viven en app/data/dinero.json (con su fecha de corte) y se pintan desde
//    ahí; si una aparece en una clave de i18n (ES o EN), en una plantilla o en un comentario de app/, utils/, server/ o content/, el
//    próximo corte dejaría dos versiones de la verdad. El comentario también cuenta: el que había en gastos.vue nombraba bancos y un
//    saldo en un repo público.
// 2. El JSON cuadra y no lleva nada privado: las partidas suman el total, las tres líneas de la rebiopsia suman lo ejecutado, la fecha
//    de corte es una fecha real que no es futura, y no aparecen bancos, saldos ni cuentas. Las fases de la campaña se declaran ahí.
// 3. La tarjeta de la campaña y el hero no tienen objetivo, porcentaje, barra, «Faltan» ni importes en las fases (ni en el fuente ni
//    en las claves de i18n). El HTML generado lo mira test-salud-estatica §6.
// 4. Las frases retiradas no vuelven: «cada euro», «transparencia radical / total», «100 % al caso», «recibo disponible»,
//    «presupuestos abiertos», «cada gasto está documentado», «nada se desvía» y sus equivalentes en inglés. Se miran TODAS las claves
//    (también las muertas: alguien las rescata) salvo el texto visible de /marcas, que es copy ya enviado y espera a Miriam.
// 5. La frase única `money.transparencia` y la del precio de los laboratorios son las pedidas y viven en UNA sola clave; la cifra de
//    la campaña lleva `origen` y `actualizado`.
// 6. Los exports de app/utils/dinero.ts no se repiten en otro fichero de app/utils ni de app/composables: Nuxt los auto-importa y, si
//    hay dos con el mismo nombre, descarta uno sin avisar (pasó con `fechaCorta`: /en/data mezcló dos formatos de fecha).
// 7. Lo que se DESCARGA tampoco: los PDF de public/ (se leen con pdftotext) y las fuentes imprimibles de scripts/*.html no llevan cifras
//    de dinero ni «% del objetivo». El dossier de marcas decía «38.897 € recaudados» y «~39% del objetivo» y ningún otro test lo veía.
//
// Las frases retiradas se vigilan por CONCEPTO y no solo por frase exacta (§4): «el destino de cada gasto», «cada importe se
// publicará» o «where every expense goes» dicen lo mismo que «cada gasto está documentado» y la regex por frase no las cogía.
//
// Uso:  pnpm test:dinero-fuente   (no necesita build)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { estampar } from '../utils/fundraiser.ts'
import { fechaDeCifra, fechaDeCorte } from '../app/utils/dinero.ts'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }
const lee = (f: string) => readFileSync(f, 'utf-8')

const es = JSON.parse(lee('i18n/locales/es.json')) as Record<string, any>
const en = JSON.parse(lee('i18n/locales/en.json')) as Record<string, any>
const dinero = JSON.parse(lee('app/data/dinero.json')) as {
  corte: string
  moneda: string
  comprometido: number
  disponible: number
  partidas: { clave: string; importe: number }[]
  rebiopsia: { ejecutado: number; biopsia: number; secuenciacion: number; imagen: number }
  fases: { clave: string; estado: string }[]
}

/** Recorre un JSON de i18n y devuelve [ruta, texto] de cada cadena. */
function cadenas(o: unknown, ruta = ''): [string, string][] {
  if (typeof o === 'string') return [[ruta, o]]
  if (Array.isArray(o)) return o.flatMap((v, i) => cadenas(v, `${ruta}[${i}]`))
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => cadenas(v, ruta ? `${ruta}.${k}` : k))
  return []
}
/** Ficheros de texto bajo `dir` (sin node_modules, .nuxt, .output, dist). */
function ficheros(dir: string, exts: string[], salida: string[] = []): string[] {
  if (!existsSync(dir)) return salida
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (['node_modules', '.nuxt', '.output', 'dist'].includes(f)) continue
    if (statSync(p).isDirectory()) ficheros(p, exts, salida)
    else if (exts.some((e) => p.endsWith(e))) salida.push(p)
  }
  return salida
}

// Una cifra de dinero escrita: «4.476,28 €», «€4,476.28», «40 000 euros», «EUR 40», «$12», «40k€». Sin cifra pegada no cuenta («Gastos (€)»).
const CIFRA_DE_DINERO = /(\d[\d.,\s]*\s?(€|EUR\b|euros?\b))|(€\s?\d)|(\b(EUR|USD)\s?\d)|(\d\s?k\s?€)|([$£]\s?\d)/i
// Un importe metido en el código: `amount: 5`, `formatCurrency(40000…`, `money(12…`, `euros(3…`.
const IMPORTE_EN_CODIGO = /\bamount:\s*\d|\bimporte:\s*\d|formatCurrency\(\s*\d|\bmoney\(\s*\d|\beuros\(\s*\d/

console.log('1. Ninguna cifra en € escrita a mano')
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  const hallazgos = cadenas(d).filter(([, t]) => CIFRA_DE_DINERO.test(t))
  ok(hallazgos.length === 0, `i18n ${loc}: ninguna clave lleva una cifra en € (${hallazgos.map(([r]) => r).join(', ') || 'ninguna'})`)
}
const fuentes = [
  ...ficheros('app', ['.vue', '.ts']).filter((f) => !f.startsWith(join('app', 'data'))),
  ...ficheros('utils', ['.ts']),
  ...ficheros('server', ['.ts']),
  ...ficheros('netlify', ['.mts', '.ts']),
  ...ficheros('content', ['.yml', '.yaml', '.md']),
]
const conCifra = fuentes.filter((f) => lee(f).split('\n').some((l) => CIFRA_DE_DINERO.test(l)))
ok(fuentes.length > 100, `se leen los ficheros de app/, utils/, server/, netlify/ y content/ (${fuentes.length})`)
ok(conCifra.length === 0, `ni plantillas, ni código, ni comentarios, ni contenido llevan una cifra en € (fuera de app/data/): ${conCifra.join(', ') || 'ninguno'}`)
const conImporte = fuentes.filter((f) => lee(f).split('\n').some((l) => IMPORTE_EN_CODIGO.test(l)))
ok(conImporte.length === 0, `ni un importe metido en el código (amount: 5, formatCurrency(40000…)): ${conImporte.join(', ') || 'ninguno'}`)
// («iban» sin más es un verbo: «ya iban esos contactos»; un IBAN de verdad empieza por el país y dos cifras, ES12 3456…)
// Los bancos: una lista GENÉRICA de entidades españolas y europeas. Nombrar solo las de la casa sería señalarlas en un repo público, así
// que esta lista es deliberadamente larga y no incluye (ni delata) las de nadie. «Santander» y «Sabadell» van con «banco»: también son ciudades.
const BANCOS = /\b(banco (santander|sabadell)|bbva|caixabank|openbank|n26|abanca|unicaja|ibercaja|kutxabank|bankia|cajamar|deutsche bank|bnp paribas|commerzbank|barclays|hsbc|lloyds|monzo|bunq)\b/i
const PRIVADO = new RegExp(`${BANCOS.source}|\\b[A-Z]{2}\\d{2}\\s?(\\d{4}\\s?){2,}`, 'i')
const conBanco = [...fuentes, 'app/data/dinero.json', 'i18n/locales/es.json', 'i18n/locales/en.json'].filter((f) => PRIVADO.test(lee(f)))
ok(conBanco.length === 0, `repo público: ningún banco ni cuenta por su nombre (${conBanco.join(', ') || 'ninguno'})`)

console.log('2. app/data/dinero.json cuadra y no lleva nada privado')
const centimos = (n: number) => Math.round(n * 100)
const suma = (xs: number[]) => xs.reduce((a, n) => a + centimos(n), 0)
ok(suma(dinero.partidas.map((p) => p.importe)) === centimos(dinero.comprometido), `las ${dinero.partidas.length} partidas suman el total comprometido (en céntimos: ${suma(dinero.partidas.map((p) => p.importe))} = ${centimos(dinero.comprometido)})`)
const r = dinero.rebiopsia
ok(suma([r.biopsia, r.secuenciacion, r.imagen]) === centimos(r.ejecutado), 'las tres líneas de la rebiopsia suman lo ejecutado')
ok(dinero.partidas.every((p) => p.importe > 0 && typeof es.expenses[`report_item_${p.clave}`] === 'string' && typeof en.expenses[`report_item_${p.clave}`] === 'string'), 'cada partida es positiva y tiene su rótulo en ES y EN')
ok(new Set(dinero.partidas.map((p) => p.clave)).size === dinero.partidas.length, 'las claves de las partidas no se repiten')
ok(/^\d{4}-\d{2}-\d{2}$/.test(dinero.corte) && !Number.isNaN(Date.parse(dinero.corte)) && Date.parse(dinero.corte) <= Date.now(), `el corte (${dinero.corte}) es una fecha real y no es futura`)
ok(dinero.moneda === 'EUR', 'la moneda es EUR')
ok(!/banc|saldo|cuenta|account|balance|extracto|factura|invoice/i.test(JSON.stringify(dinero)), 'el JSON no nombra bancos, saldos, cuentas ni facturas (repo público)')
ok(JSON.stringify(Object.keys(dinero).sort()) === JSON.stringify(['comprometido', 'corte', 'disponible', 'fases', 'moneda', 'partidas', 'rebiopsia']), 'el JSON tiene los campos previstos y ninguno más (un campo nuevo se piensa antes de publicarlo)')
const ESTADOS = ['hecha', 'hecho', 'en_curso', 'presupuesto']
ok(JSON.stringify(dinero.fases.map((f) => f.clave)) === JSON.stringify(['rebiopsy', 'bank', 'treatment']), 'las fases son tres y van en este orden: rebiopsia, banco de tejido, terapia personalizada')
ok(dinero.fases.every((f) => ESTADOS.includes(f.estado)), `cada fase tiene un estado de los previstos (${ESTADOS.join(', ')})`)
ok(dinero.fases[0]!.estado === 'hecha' && dinero.fases[2]!.estado === 'presupuesto', 'la rebiopsia está hecha y la terapia personalizada es «presupuesto en curso» (decisión de Miriam, 24-oct-2026)')
// El banco de tejido NO es decisión de Miriam (dijo «las cubiertas, hecho»): `en_curso` es inferencia del constructor y `hecho` lo refuta
// app/data/caso.json («Sin fresco ni congelado»). Si ella o el comité médico lo cambian, se edita esto a propósito.
ok(!['hecha', 'hecho'].includes(dinero.fases[1]!.estado), 'el banco de tejido no se marca «hecho» sin que Miriam o el comité médico lo validen contra caso.json (ver el aviso en app/utils/dinero.ts)')
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(dinero.fases.every((f) => typeof d.gofundme.estado?.[f.estado] === 'string' && typeof d.gofundme.phases?.[f.clave]?.label === 'string' && typeof d.gofundme.phases?.[f.clave]?.desc === 'string'), `${loc}: cada fase tiene su rótulo, su descripción y la palabra de su estado`)
}
// La rebiopsia y su desglose: las tres sublíneas se quedan (decisión de Miriam) y se rellenan desde el JSON.
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(['{biopsia}', '{secuenciacion}', '{imagen}'].every((p) => d.expenses.rebiopsy_now_desc.includes(p)), `${loc}: las tres sublíneas de la rebiopsia siguen en la frase y se rellenan desde el JSON`)
  ok(d.expenses.phase1_desc.includes('{gastado}'), `${loc}: la fase 1 de /gastos toma lo gastado del JSON`)
  ok(['report_eyebrow', 'report_intro', 'note'].every((k) => d.expenses[k].includes('{fecha}')), `${loc}: las tres fechas de corte de /gastos salen del JSON`)
}

console.log('3. Sin objetivo, porcentaje, barra, «Faltan» ni importes en las fases')
const card = lee('app/components/GoFundMeProgress.vue').replace(/<style[\s\S]*?<\/style>/, '')
const hero = lee('app/components/SectionHero.vue').replace(/<style[\s\S]*?<\/style>/, '')
const PROHIBIDO = /goalAmount|progressbar|aria-valuemax|aria-valuenow|goal_total|pct_raised|remaining|tap_hint|phase_count|progress_label|\bpct\b|milestone|INTERMEDIATE/
ok(!PROHIBIDO.test(card.replace(/\/\*\*[\s\S]*?\*\//, '').replace(/<!--[\s\S]*?-->/g, '')), 'GoFundMeProgress no lee el objetivo ni pinta barra, porcentaje, «faltan» ni hitos con importe')
ok(!PROHIBIDO.test(hero.replace(/<!--[\s\S]*?-->/g, '')), 'el hero no lee el objetivo ni pinta barra, porcentaje ni «faltan»')
ok(/data-gofundme-importe/.test(card) && /data-gofundme-importe/.test(hero), 'la tarjeta y el hero marcan su importe con data-gofundme-importe (así lo lee el test de la cifra viva)')
ok(/insigniaDe\(/.test(card) && /status-badge/.test(card), 'las fases usan las insignias del sistema (icono y palabra), no un color suelto')
const claves = ['goal_total', 'pct_raised', 'remaining', 'remaining_here', 'tap_hint', 'phase_count', 'progress_label', 'milestones', 'transparency_title', 'transparency_text']
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(claves.every((k) => !(k in d.gofundme)), `${loc}: gofundme.* ya no tiene ${claves.join(', ')}`)
  ok(!('proof_support' in d.hero) && typeof d.hero.proof_money === 'string' && d.hero.proof_money.includes('{importe}') && d.hero.proof_money.includes('{n}') && /GoFundMe/.test(d.hero.proof_money), `${loc}: hero.proof_money lleva {importe}, {n} y el rótulo «GoFundMe»`)
  ok(!/%|objetivo|goal|target|faltan|remaining/i.test(d.hero.proof_money), `${loc}: la línea del hero no dice porcentaje, objetivo ni «faltan»`)
  ok(!('cost_vs_goal' in d.expenses) && !('subtitle' in d.expenses) && !('rebiopsy_now_range' in d.expenses), `${loc}: /gastos no conserva «el primer objetivo de 40.000 €» ni sus cifras a mano`)
}

console.log('4. Las frases retiradas no vuelven (ES y EN, también las claves muertas)')
const RETIRADAS: [RegExp, string][] = [
  [/cada euro|every euro/i, '«cada euro»'],
  [/transparencia (radical|total)|(radical|full|total) transparency|m[aá]xima transparencia|maximum transparency/i, '«transparencia radical / total»'],
  [/100\s?%\s?(al caso|va |de lo|to (the )?(case|miriam)|goes)|(al caso|to the case)[^.]*100\s?%/i, '«100 % al caso»'],
  [/recibo disponible|receipt available/i, '«recibo disponible»'],
  [/presupuestos (abiertos|p[uú]blicos)|open budgets?|public budgets?/i, '«presupuestos abiertos»'],
  [/cada gasto (est[aá]|se)|every (expense|cost) (is|will)/i, '«cada gasto está documentado»'],
  [/nada se desv|nothing is diverted/i, '«nada se desvía»'],
  [/sin intermediarios|no middlem[ae]n/i, '«sin intermediarios»'],
  [/informe mensual|monthly (expense )?report/i, '«informe mensual»'],
]
// Copy de /marcas ya enviado a marcas: no se toca sin el OK de Miriam (el metadato `og_description` SÍ se corrigió). Si se edita, esta lista se vacía.
const MARCAS_PENDIENTE_DE_MIRIAM = ['marcas.hero_subtitle', 'marcas.pilares_cards[2].what']
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  const texto = cadenas(d).filter(([r]) => !MARCAS_PENDIENTE_DE_MIRIAM.includes(r))
  for (const [re, nombre] of RETIRADAS) {
    const donde = texto.filter(([, t]) => re.test(t)).map(([r]) => r)
    ok(donde.length === 0, `${loc}: ninguna clave dice ${nombre}${donde.length ? ` (${donde.join(', ')})` : ''}`)
  }
}
// La CLASE «prometo detallar cada gasto / cada importe», por concepto y no por frase exacta: «el destino de cada gasto», «cada importe se
// publicará», «where every expense goes», «each amount will be published». La norma es «no detallamos ciertas cosas».
const DETALLE_DE_CADA = /(cada|todo) (gasto|importe|factura|partida)|(destino|detalle) de cada|every (expense|amount|invoice|cost)|each amount/i
// Un agradecimiento no es una promesa de detalle: «every amount brings the next test closer». Si la clave deja de casar, se saca de aquí.
const AGRADECIMIENTO = ['thanksWall.subtitle']
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  const donde = cadenas(d).filter(([r, t]) => DETALLE_DE_CADA.test(t) && !AGRADECIMIENTO.includes(r)).map(([r]) => r)
  ok(donde.length === 0, `${loc}: ninguna clave promete detallar cada gasto o cada importe (${donde.join(', ') || 'ninguna'})`)
}
ok(AGRADECIMIENTO.every((r) => cadenas(en).some(([k, t]) => k === r && DETALLE_DE_CADA.test(t))), `la excepción de agradecimiento sigue siendo necesaria (${AGRADECIMIENTO.join(', ')}); si ya no casa, hay que quitarla de la lista`)
const pendientes = MARCAS_PENDIENTE_DE_MIRIAM.filter((r) => cadenas(es).some(([k, t]) => k === r && RETIRADAS.some(([re]) => re.test(t))))
ok(pendientes.length === MARCAS_PENDIENTE_DE_MIRIAM.length, `la lista de /marcas pendiente de Miriam es exacta: si ya no dice nada retirado, hay que sacarla de aquí (${pendientes.join(', ')})`)
ok(!/transparen/i.test(es.marcas.og_description) && !/transparen/i.test(en.marcas.og_description), 'los metadatos de /marcas (og_description) ya no dicen «transparencia total»')
const metadatos = [...cadenas(es), ...cadenas(en)].filter(([r]) => /(^|\.)(meta_description|meta_title|og_description|description)$/.test(r))
ok(metadatos.length >= 8 && metadatos.every(([, t]) => RETIRADAS.every(([re]) => !re.test(t))), `ningún metadato (${metadatos.length}) lleva una frase retirada`)

console.log('5. La frase única de transparencia, la del precio y la cifra con su origen')
const TRANSPARENCIA = {
  es: 'Somos transparentes: mostramos cifras y el gasto por categorías; no detallamos facturas ni datos personales.',
  en: 'We are transparent: we show figures and spending by category; we do not detail invoices or personal data.',
}
const PRECIO = {
  es: 'Si nos ofrecéis precio, no se publica: se suma dentro de su partida.',
  en: 'If you offer us a price, it is not published: it is added within its line item.',
}
// La tarjeta 01 de /colabora es para «profesional de la medicina o la investigación»: sin un rótulo, «precio» no tiene referente y la frase
// no dice a quién habla. El rótulo usa el mismo léxico que /herramientas («Para laboratorios» / «For labs») y va delante, aparte de la
// frase de Miriam, que queda literal.
const PARA_PRECIO = { es: 'Para laboratorios.', en: 'For labs.' }
for (const [loc, d] of [['es', es], ['en', en]] as const) {
  ok(d.money.transparencia === TRANSPARENCIA[loc], `${loc}: money.transparencia es la frase pedida (${d.money.transparencia})`)
  const donde = (frase: string) => cadenas(d).filter(([, t]) => t === frase).map(([r]) => r)
  ok(donde(d.money.transparencia).join() === 'money.transparencia', `${loc}: la frase de transparencia vive en UNA sola clave (${donde(d.money.transparencia).join(', ')})`)
  ok(d.collaborate.profile1_precio === PRECIO[loc] && donde(PRECIO[loc]).join() === 'collaborate.profile1_precio', `${loc}: /colabora dice, para laboratorios, «${PRECIO[loc]}» (una sola clave)`)
  ok(d.collaborate.profile1_precio_para === PARA_PRECIO[loc] && donde(PARA_PRECIO[loc]).join() === 'collaborate.profile1_precio_para', `${loc}: y la frase lleva delante el rótulo que dice a quién habla, «${PARA_PRECIO[loc]}» (una sola clave)`)
  ok(d.expenses.cuadre.includes('GoFundMe') && /bruta|gross/.test(d.expenses.cuadre) && /comisiones|fees/.test(d.expenses.cuadre), `${loc}: /gastos lleva la línea de cuadre (lo recaudado es la cifra bruta en directo; el próximo corte añade las comisiones)`)
  ok(!/[\d€$%]/.test(d.money.transparencia), `${loc}: la frase de transparencia no lleva cifras ni símbolos de dinero`)
}
const gastos = lee('app/pages/gastos.vue')
const colabora = lee('app/pages/colabora.vue')
const prensa = lee('app/pages/prensa.vue')
ok(gastos.includes("$t('money.transparencia')") && gastos.includes("$t('expenses.cuadre')"), '/gastos pinta money.transparencia y expenses.cuadre')
ok(colabora.includes("$t('money.transparencia')") && colabora.includes("$t('collaborate.profile1_precio')"), '/colabora pinta money.transparencia y el precio de los laboratorios')
ok(/<strong[^>]*>\{\{ \$t\('collaborate\.profile1_precio_para'\) \}\}<\/strong> \{\{ \$t\('collaborate\.profile1_precio'\) \}\}/.test(colabora), '/colabora pone el rótulo de los laboratorios, en negrita, justo delante de la frase del precio (no en otro sitio de la tarjeta)')
ok(prensa.includes("t('money.transparencia')"), '/prensa cierra la respuesta «¿de dónde sale el dinero?» con money.transparencia')
ok(/DINERO\.partidas/.test(gastos) && !/const REPORT\b/.test(gastos), '/gastos lee las partidas de app/data/dinero.json (ya no hay un REPORT escrito en la página)')

// La fecha corta no depende de la versión de ICU: septiembre es «sep» en el servidor y en el navegador, sea cual sea su ICU (medido el 24-oct-2026: Node 26.3.1, ICU 78.3, escribe «sept»).
ok(fechaDeCifra('2026-09-05T10:00:00.000Z', 'es') === '5 sep 2026' && fechaDeCifra('2026-09-05T10:00:00.000Z', 'en') === '5 Sep 2026' && fechaDeCifra('2026-12-31T23:30:00.000Z', 'es') === '1 ene 2027', 'fechaDeCifra: «5 sep 2026» / «5 Sep 2026», y a las 23:30 UTC del 31-dic ya es 1 ene en Madrid (zona fija, sin Intl en el mes)')
ok(fechaDeCorte('2026-08-17', 'es') === '17 de agosto de 2026' && fechaDeCorte('2026-08-17', 'en') === '17 August 2026', 'fechaDeCorte: «17 de agosto de 2026» / «17 August 2026» (el corte del informe, igual que estaba escrito)')

const ahora = '2026-10-24T10:00:00.000Z'
const viva = estampar({ currentAmount: { amount: 1, currencyCode: 'EUR' }, donationCount: 3, donationsEnabled: true }, 'vivo', ahora)
ok(viva.origen === 'vivo' && viva.actualizado === ahora && viva.currentAmount.amount === 1, 'estampar() marca la cifra con su origen y su fecha sin tocar los importes')
const funcion = lee('netlify/functions/fundraiser.mts')
ok(/estampar\(fundraiser, 'vivo'\)/.test(funcion) && /origen: 'semilla'/.test(funcion), 'la función de Netlify contesta «vivo» con la hora de ahora, y «semilla» (con SU fecha) si GoFundMe no responde')
const composable = lee('app/composables/useFundraiser.ts')
ok(/soloCifras\(semilla, 'semilla'/.test(composable) && /soloCifras\(v, v\.origen \?\? 'vivo'/.test(composable), 'useFundraiser da por «semilla» la del build y por «vivo» la que llega sin origen')
ok(!/goalAmount/.test(composable.replace(/\/\*\*[\s\S]*?\*\//g, '')) && /donationCount: v\.donationCount/.test(composable), 'useFundraiser se queda solo con los campos que la web usa: el objetivo no entra en el estado ni en el payload, venga de donde venga')
ok(!/goalAmount/.test(lee('utils/fundraiser.ts').replace(/\/\/.*$/gm, '')) && !/goalAmount/.test(funcion.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'ya no se le pide el objetivo a GoFundMe (ni la consulta ni el tipo ni la función lo llevan)')
ok(/fechaDeCifra\(/.test(card) && /fechaDeCifra\(/.test(hero) && /origen !== 'semilla'/.test(card) && /origen !== 'semilla'/.test(hero), 'la tarjeta y el hero enseñan la fecha SOLO cuando la cifra es de la semilla')

console.log('6. Los exports de dinero.ts no chocan con los auto-imports de app/utils ni de app/composables')
/** Nombres exportados por un fichero TS: `export const|function|class|type|interface|enum X` y `export { a, b as c }`. */
function exportados(f: string): string[] {
  const t = lee(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const nombres = [...t.matchAll(/^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]!)
  for (const m of t.matchAll(/^export\s*\{([^}]*)\}/gm)) nombres.push(...m[1]!.split(',').map((x) => x.trim().split(/\s+as\s+/).pop()!).filter(Boolean))
  return nombres
}
const propios = exportados('app/utils/dinero.ts')
ok(['DINERO', 'euros', 'fechaDeCorte', 'fechaDeCifra', 'EstadoFase'].every((n) => propios.includes(n)), `se leen los exports de dinero.ts (${propios.join(', ')})`)
const vecinos = [...ficheros(join('app', 'utils'), ['.ts']), ...ficheros(join('app', 'composables'), ['.ts'])].filter((f) => f !== join('app', 'utils', 'dinero.ts'))
ok(vecinos.length >= 5, `se leen los demás ficheros de app/utils y app/composables (${vecinos.length})`)
const chocan = vecinos.flatMap((f) => exportados(f).filter((n) => propios.includes(n)).map((n) => `${n} (${f})`))
ok(chocan.length === 0, `ningún export de dinero.ts se repite en otro fichero de app/utils ni de app/composables (${chocan.join(', ') || 'ninguno'})`)

console.log('7. Lo que se descarga (PDF y su fuente imprimible) tampoco lleva cifras de dinero ni objetivo')
// El PDF del dossier de marcas se enlaza desde /marcas y se baja tal cual: es una superficie pública que i18n/ y app/ no ven. Además de la
// cifra en €, se busca la forma «~39% del objetivo» / «la meta son…», que es el objetivo y el porcentaje que la norma retiró.
const OBJETIVO_EN_DESCARGAS = /\d\s?%\s*(del|de la|of the)?\s*(objetivo|meta|goal|target)|\b(la meta|el objetivo) (son|es|era)\b|\bthe (goal|target) (is|was)\b/i
const diceDinero = (t: string) => CIFRA_DE_DINERO.test(t) || OBJETIVO_EN_DESCARGAS.test(t)
// Material ya enviado a marcas: regenerarlo (slide 06 sin objetivo ni % o sin cifra, y volver a renderizar el PDF) lo decide Miriam. Mientras,
// queda aquí a la vista; en cuanto se regenere deja de decir nada retirado y el test obliga a sacarlo de la lista.
const DESCARGAS_PENDIENTES_DE_MIRIAM = ['public/dossier-marcas-deck.pdf', 'scripts/dossier-marcas-deck.print.html']
const hayPdftotext = spawnSync('pdftotext', ['-v']).error === undefined
// En local, sin pdftotext se avisa y se miran solo las fuentes imprimibles. En CI NO: allí es el único sitio donde este test corre solo, y un
// PDF que se salta en silencio haría el control decorativo (lint.yml instala poppler-utils justo antes).
if (!hayPdftotext) console.log('  ⚠️  sin pdftotext (poppler): se omiten los PDF; sus fuentes imprimibles (scripts/*.html) sí se miran')
ok(hayPdftotext || !process.env.CI, 'en CI está pdftotext (poppler-utils), para que los PDF se lean de verdad y no se salten')
const textoDeDescarga = (f: string): string | null => {
  if (!f.endsWith('.pdf')) return lee(f)
  if (!hayPdftotext) return null
  const r = spawnSync('pdftotext', [f, '-'], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
  return r.status === 0 ? r.stdout : null
}
const descargas = [...ficheros('public', ['.pdf']), ...ficheros('scripts', ['.html'])]
ok(descargas.length >= 3, `se leen los PDF de public/ y las fuentes imprimibles de scripts/ (${descargas.length})`)
const textos = new Map(descargas.map((f) => [f, textoDeDescarga(f)] as const))
const conDinero = descargas.filter((f) => { const t = textos.get(f); return t != null && diceDinero(t) })
const sinPermiso = conDinero.filter((f) => !DESCARGAS_PENDIENTES_DE_MIRIAM.includes(f))
ok(sinPermiso.length === 0, `ningún PDF ni fuente imprimible lleva una cifra en € ni «% del objetivo» (salvo lo que espera a Miriam): ${sinPermiso.join(', ') || 'ninguno'}`)
const yaLimpios = DESCARGAS_PENDIENTES_DE_MIRIAM.filter((f) => { const t = textos.get(f); return t != null && !diceDinero(t) })
ok(yaLimpios.length === 0, `la lista de descargas pendiente de Miriam es exacta: si ya no dicen nada retirado, hay que sacarlas de aquí (${yaLimpios.join(', ') || 'ninguna'})`)
ok(DESCARGAS_PENDIENTES_DE_MIRIAM.every((f) => existsSync(f)), 'y las que esperan a Miriam existen (si se borran o se renombran, se actualiza la lista)')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ las cifras de dinero tienen una sola fuente y la norma de transparencia se cumple')
process.exit(fallos ? 1 : 0)
