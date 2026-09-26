#!/usr/bin/env node
// Frases sobre el caso que ya se cotejaron contra la fuente y resultaron falsas.
// Si vuelven al copy (por un copia-pega o un PR viejo), este test falla.
//
// - SSTR2 afirmado del tumor: ningún informe dice SSTR2. El PET 68Ga-DOTATOC
//   (26-may-2026) habla de «receptores de somatostatina» y la IHQ de SSTR2 está
//   pendiente. SSTR2 como concepto (literatura, qué mide el trazador, panel de
//   IHQ, definición de PRRT) sí se permite: los patrones solo pillan la
//   afirmación sobre el tumor. PR #141 y #243, 26-sep-2026.
// - Rareza «menos de 1 de cada 1.000» atribuida al paper SEER de 2023: ese
//   paper da 0,1–5 % (dato de fondo) y su propio SEER, 1,07 %. PR #141.
// - «Metástasis exclusivamente óseas» en presente: hay afectación hepática desde
//   julio de 2026. Las entradas fechadas de la cronología cuentan el pasado y no
//   se revisan aquí.
//
// Uso: pnpm test:afirmaciones-clinicas   (CI: .github/workflows/lint.yml)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const DIRS = ['app', 'i18n', 'content']
const EXT = new Set(['.vue', '.ts', '.json', '.yml', '.yaml', '.md'])
// La cronología narra hechos fechados («hasta entonces, solo óseas»).
const SALTAR_OSEAS = /content\/(es|en)\/timeline\.yml$/

const PROHIBIDO = [
  { re: /SSTR2\+/, por: 'SSTR2+ afirmado del tumor (usa SSTR+)' },
  { re: /subtipo 2, SSTR2|subtype 2, SSTR2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /somatostatina de subtipo 2 \(SSTR2\) (confirmada|—)|sobreexpresión de receptores de somatostatina de subtipo 2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /somatostatin receptor subtype 2 \(SSTR2\) overexpression/, por: 'subtype 2 asserted for the tumour' },
  { re: /demuestra expresión de receptores de somatostatina de subtipo 2|shows somatostatin-receptor subtype 2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /SSTR2 \((PET|Ga-68|somatostat)/, por: 'SSTR2 en tabla de perfil del tumor' },
  { re: /(expresión|sobreexpresión) de SSTR2 en (PET|las metástasis)|SSTR2 expression on|confirmed SSTR2/, por: 'SSTR2 afirmado del tumor' },
  { re: /\(SSTR2\) del tumor|tumor’s somatostatin receptors \(SSTR2\)|lesiones SSTR2|SSTR2\+? lesions/, por: 'SSTR2 afirmado del tumor' },
  { re: /menos de 1 de cada 1\.000|fewer than 1 in 1,000/, por: 'cifra de rareza que no sostiene su fuente' },
  { re: /Metástasis exclusivamente óseas|Bone-only metastases\./, por: 'hay afectación hepática desde jul-2026', saltar: SALTAR_OSEAS },
]

function* ficheros(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) yield* ficheros(p)
    else if (EXT.has(extname(n))) yield p
  }
}

const fallos = []
for (const d of DIRS) {
  for (const f of ficheros(join(ROOT, d))) {
    const rel = relative(ROOT, f)
    readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
      for (const { re, por, saltar } of PROHIBIDO) {
        if (saltar?.test(rel)) continue
        const m = linea.match(re)
        if (m) fallos.push(`${rel}:${i + 1}  «${m[0]}»  → ${por}`)
      }
    })
  }
}

if (fallos.length) {
  console.error(`✗ ${fallos.length} afirmación(es) ya refutada(s) han vuelto al copy:\n  ${fallos.join('\n  ')}`)
  process.exit(1)
}
console.log('✓ afirmaciones clínicas: ninguna refutada en el copy')
