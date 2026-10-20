// Test del visor /laminillas sin build: contrato del manifest, privacidad, orden de filas, grupos
// de paneo, que una 4.ª columna entra sin tocar código, y el alta/redirección de la ruta.
//
// Por qué: el manifest (app/data/laminillas.json) es la única fuente del visor y se publica tal
// cual. Una sigla de muestra, un número de bloque o un dato clínico sin sello en él sale a la web.
//
// Uso:  pnpm test:laminillas
import { existsSync, readFileSync } from 'node:fs'
import { filas, grupoPaneo, heDe, deMuestra, reglaRedonda, type Manifest } from '../app/utils/laminillas'

const M = JSON.parse(readFileSync('app/data/laminillas.json', 'utf-8')) as Manifest
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

console.log('Contrato del manifest')
ok(M.version === 1 && /^https:\/\/[a-z0-9.-]+\/v1\/$/.test(M.teselas), `teselas en https y con versión (${M.teselas})`)
ok(Number.isInteger(M.tile) && M.tile > 0 && Number.isInteger(M.overlap), 'tile y overlap enteros')
const idsMuestra = new Set(M.muestras.map((m) => m.id))
const idsMarcador = new Set(M.marcadores.map((m) => m.id))
ok(idsMuestra.size === M.muestras.length && idsMarcador.size === M.marcadores.length, 'ids de muestra y de marcador únicos')
for (const m of M.muestras) {
  ok(m.mpp > 0.1 && m.mpp < 1 && !!m.escaner && !!m.aumento && !!m.grupo_paneo, `${m.id}: µm/px, escáner, aumento y grupo de paneo`)
}
const SELLOS = new Set(['verificado', 'inferido', 'sin-verificar'])
const ids = new Set<string>()
for (const l of M.laminillas) {
  ok(!ids.has(l.id), `${l.id} no está repetida`); ids.add(l.id)
  ok(idsMuestra.has(l.muestra) && idsMarcador.has(l.marcador), `${l.id}: muestra y marcador existen`)
  ok(l.id.startsWith(l.muestra + '/') && /^[a-z0-9-]+\/[a-z0-9-]+\.dzi$/.test(l.dzi), `${l.id}: id y ruta DZI con forma`)
  ok(l.ancho > 0 && l.alto > 0 && l.mpp > 0.1 && l.mpp < 1, `${l.id}: tamaño y µm/px plausibles`)
  ok(existsSync('public' + l.miniatura), `${l.id}: su miniatura existe`)
  ok(SELLOS.has(l.ficha.sello), `${l.id}: sello válido (${l.ficha.sello})`)
  if (l.ficha.resultado) ok(!!l.ficha.fuente, `${l.id}: un resultado lleva su fuente`)
  else ok(l.ficha.sello === 'sin-verificar' && !!l.ficha.nota, `${l.id}: sin resultado → «sin verificar» y explica por qué`)
  if (l.ficha.sello === 'inferido') ok(!!l.ficha.nota, `${l.id}: lo inferido dice qué se infiere`)
  if (l.ficha.sello === 'inferido') ok(!!l.ficha.resultado, `${l.id}: «inferido» solo con resultado del informe (lo deducido es la atribución)`)
}

const ficha = readFileSync('app/components/laminillas/LaminillasFicha.vue', 'utf-8')
ok(!/inferido[^\n]*no confirmado en un informe/i.test(ficha), 'el sello «inferido» no dice que el resultado no está en un informe')

console.log('Privacidad (lo que se publica)')
const publicado = [
  readFileSync('app/data/laminillas.json', 'utf-8'),
  readFileSync('app/pages/laminillas.vue', 'utf-8'),
  readFileSync('app/components/laminillas/LaminillasVisor.vue', 'utf-8'),
  readFileSync('app/components/laminillas/LaminillasFicha.vue', 'utf-8'),
].join('\n')
const VETADOS: [RegExp, string][] = [
  [/vacuna|vaccine/i, '«vacuna»'], [/olune/i, '«Olune»'], [/cient[ií]fica/i, '«científica»'],
  [/\bDNI\b|\bNHC\b|nacimiento|date of birth|\bDOB\b/i, 'DNI, NHC o fecha de nacimiento'],
  [/\b\d{2}B\d{3,}/, 'número de bloque (24B…/26B…)'], [/\bVH-?\d{2}/i, 'número de revisión (VH…)'],
  [/\bB20\d\d\.\d+/, 'número de Zúrich (B2026.…)'], [/\b\d{2}-\d{4,5}-[A-Z]\b/, 'nº de bloque externo'],
]
for (const [re, que] of VETADOS) ok(!re.test(publicado), `sin ${que}`)
// Las etiquetas «ultralow» y «null» de HER2 no son literales de ningún informe: no van en los textos.
const textos: string[] = []
const recoge = (x: unknown) => { if (typeof x === 'string') textos.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(recoge) }
recoge(M)
ok(!textos.some((t) => /ultra-?low|\bnull\b/i.test(t)), 'ningún texto usa «ultralow» ni «null» para HER2')

console.log('La nota de discordancia de la página casa con las fichas')
// Espacio duro entre cifra y «%»: en la ficha va el carácter; en el código de la página, la secuencia \u00a0.
const pagina = readFileSync('app/pages/laminillas.vue', 'utf-8').replaceAll('\\u00a0', ' ').replaceAll('\u00a0', ' ')
const fichaDe = (id: string) => (M.laminillas.find((l) => l.id === id)?.ficha.resultado?.es ?? '').replaceAll('\u00a0', ' ')
for (const [id, cifra] of [['mama-2024/re', '95 %'], ['mama-reeval/re', '85 %'], ['mama-2024/rp', '5 %'], ['mama-reeval/rp', '20 %'], ['mama-2024/ki67', '60 %'], ['mama-reeval/ki67', '40 %']] as const) {
  if (!M.laminillas.some((l) => l.id === id)) continue
  ok(fichaDe(id).includes(cifra) && pagina.includes(cifra), `${id}: «${cifra}» está en su ficha y en la nota`)
}

console.log('Orden de filas y paneo')
const F = filas(M)
const n = M.muestras.length
const comunes = F.filter((f) => f.n === n).map((f) => f.marcador.id)
ok(F.every((f, i) => i === 0 || F[i - 1]!.n >= f.n), 'las filas van de más a menos muestras')
if (n === 3 && M.laminillas.length === 32) {
  ok(JSON.stringify(comunes) === JSON.stringify(['he', 're', 'rp', 'her2', 'cromogranina', 'sinaptofisina']), `arriba, las 6 comunes en su orden (${comunes.join(', ')})`)
  ok(JSON.stringify(F.filter((f) => f.n === 2).map((f) => f.marcador.id)) === JSON.stringify(['ki67', 'ck19']), 'después Ki-67 y CK19')
  ok(grupoPaneo(M, 'mama-2024') === grupoPaneo(M, 'mama-reeval') && grupoPaneo(M, 'mama-2024') !== grupoPaneo(M, 'higado-2026'),
    'paneo enlazado entre las dos de mama y libre con el hígado')
}
for (const m of M.muestras) ok(!!heDe(M, m.id), `${m.id}: tiene HE de referencia`)
ok(M.muestras.every((m) => deMuestra(M, m.id).length === M.laminillas.filter((l) => l.muestra === m.id).length), 'el recorrido de cada columna pasa por todas sus laminillas')

console.log('Una 4.ª columna entra sin tocar código')
const M4: Manifest = structuredClone(M)
M4.muestras.push({ id: 'hueso-zurich', corto: { es: 'Hueso', en: 'Bone' }, largo: { es: 'Hueso', en: 'Bone' }, grupo_paneo: 'hueso', escaner: 'x', mpp: 0.25, aumento: '40x' })
for (const marcador of ['he', 'sinaptofisina'])
  M4.laminillas.push({ id: `hueso-zurich/${marcador}`, muestra: 'hueso-zurich', marcador, dzi: `hueso-zurich/${marcador}.dzi`, ancho: 10, alto: 10, mpp: 0.25, miniatura: '', ficha: { laboratorio: null, fecha: null, resultado: null, fuente: null, sello: 'sin-verificar' } })
const F4 = filas(M4)
const esperadas = comunes.filter((id) => id === 'he' || id === 'sinaptofisina').sort().join()
ok(F4.filter((f) => f.n === M4.muestras.length).map((f) => f.marcador.id).sort().join() === esperadas && F4[0]!.n === M4.muestras.length,
  'las filas con todas las columnas (también la nueva) suben arriba')
ok(grupoPaneo(M4, 'hueso-zurich') !== grupoPaneo(M4, 'mama-2024'), 'la columna nueva tiene su propio grupo de paneo')
ok(heDe(M4, 'hueso-zurich')?.id === 'hueso-zurich/he', 'y su propia HE de referencia')

console.log('Regla')
for (const um of [0.05, 0.25, 1, 7.3, 40]) {
  const r = reglaRedonda(um)
  const mant = Math.round(r.um / 10 ** Math.floor(Math.log10(r.um)))
  ok(r.px >= 64 && r.px <= 160 && [1, 2, 5].includes(mant), `${um} µm/px → ${r.texto} en ${r.px.toFixed(0)} px`)
}

console.log('Alta de la ruta y redirección de /biopsia-osea')
const cfg = readFileSync('nuxt.config.ts', 'utf-8')
ok(/'\/biopsia-osea':\s*\{\s*redirect:\s*\{\s*to:\s*'\/laminillas',\s*statusCode:\s*301/.test(cfg), '/biopsia-osea → /laminillas con 301')
ok(/'\/en\/bone-biopsy':\s*\{\s*redirect:\s*\{\s*to:\s*'\/en\/slides',\s*statusCode:\s*301/.test(cfg), '/en/bone-biopsy → /en/slides con 301')
ok(!existsSync('app/pages/biopsia-osea.vue'), 'la página vieja ya no existe (no sombrea la redirección)')
ok(/'laminillas':\s*\{\s*en:\s*'\/slides'\s*\}/.test(cfg), 'ruta inglesa /en/slides')
const sitemapExclude = cfg.match(/sitemap:\s*\{[\s\S]*?exclude:\s*\[([\s\S]*?)\]/)?.[1] ?? ''
ok(!/laminillas|slides/.test(sitemapExclude), 'la página entra en el sitemap')
ok(!/laminillas|slides/.test(readFileSync('public/_robots.txt', 'utf-8')), 'robots.txt no la bloquea')
const nav = readFileSync('app/utils/navegacion.ts', 'utf-8')
ok(/slides:\s*e\('slides',\s*'laminillas'\)/.test(nav) && /HERRAMIENTAS[^\n]*NAV\.slides/.test(nav), 'está en la navegación y en el índice de herramientas')

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ laminillas en verde')
process.exit(fallos ? 1 : 0)
