// Test de privacidad: ninguna sigla de muestra (número de biopsia, bloque o revisión) publicada.
//
// Por qué: el 27-sep-2026 Miriam pidió que la web cuente qué es cada muestra, no su código. Se
// quitaron de /datos (el generador de Polaris ya no los exporta) y quedaba uno en las fuentes de
// /ciencia, que además viajaba a ciencia.md y a llms-full.txt. Este test es el freno del lado web.
//
// Qué mira: los datos y textos fuente (app/data, app/pages, app/components, public, i18n, content)
// y, si existe, lo generado por `nuxt generate` (.output/public), que es lo que de verdad se sirve.
//
// Uso:  pnpm test:siglas-muestra
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAX_BYTES = 5 * 1024 * 1024
const EXT = /\.(json|html|md|txt|ts|vue)$/i

// Mismas formas que tools/caso_publico.py (_RE_CODIGO_AP) en Polaris.
const SIGLA = new RegExp(
  [
    String.raw`\b(?:e-)?B20\d\d\.\d{3,}`, // B2026.22813 / e-B2026.22813
    String.raw`\bVH-?\d{2}-?B(?:-?\s?\d{3,})?`, // VH26B 17664 / VH-26-B-20538
    String.raw`\b\d{2}B-?\d{3,}`, // 24B-1043 / 24B0001043 / 26B0008505
    String.raw`\b\d{2}-\d{5}\b`, // 26-28381
  ].join('|'),
  'g',
)

export function hallazgos(texto: string): string[] {
  return [...texto.matchAll(SIGLA)].map((m) => m[0])
}

function* ficheros(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const n of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, n.name)
    if (n.isDirectory()) {
      if (n.name === 'node_modules' || n.name.startsWith('.git')) continue
      yield* ficheros(p)
    }
    else if (EXT.test(n.name) && statSync(p).size <= MAX_BYTES) yield p
  }
}

// ── autotest de la lógica ──
let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }
ok(hallazgos('Anatomía Patológica VH-26-B-17664 · VHIO').length === 1, 'detecta VH-26-B-17664')
ok(hallazgos('Revisado bajo el número VH26B 17664').length === 1, 'detecta VH26B 17664')
ok(hallazgos('bloque 24B-1043 A1 (= 24B0001043-A1)').length === 2, 'detecta 24B-1043 y 24B0001043')
ok(hallazgos('Hueso, e-B2026.22813 A').length === 1, 'detecta e-B2026.22813')
ok(hallazgos('Hígado 26-28381-B').length === 1, 'detecta 26-28381')
ok(hallazgos('Biopsia 18-ago-2026 · 2026-09-16 · 16G × 23 mm · FGFR1 ×13').length === 0, 'fechas y medidas no cuentan')

// ── el repo ──
const raices = ['app/data', 'app/pages', 'app/components', 'public', 'i18n', 'content', '.output/public']
let vistos = 0
for (const r of raices) {
  for (const f of ficheros(r)) {
    vistos++
    for (const h of hallazgos(readFileSync(f, 'utf-8'))) ok(false, `${f}: «${h}»`)
  }
}
ok(vistos > 0, `se revisaron ${vistos} ficheros (${raices.filter(existsSync).join(', ')})`)

console.log(fallos ? `\n❌ ${fallos} fallo(s): una muestra se cuenta, su sigla no se publica` : '\n✅ ninguna sigla de muestra publicada')
process.exit(fallos ? 1 : 0)
