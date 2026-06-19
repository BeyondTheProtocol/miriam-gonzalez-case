// ════════════════════════════════════════════════════════════════════════
//  Regenera public/dossier-marcas-deck.pdf desde la fuente imprimible
//  scripts/dossier-marcas-deck.print.html, usando Google Chrome headless
//  (mismo motor —Skia/PDF— con el que se generó el deck original del #102).
//
//  Uso:   node scripts/render-dossier-deck.mjs
//  Requisitos: Google Chrome instalado (macOS).
//
//  · Sustituye {{BRAND}} por «tu marca» (versión genérica para repartir).
//  · Imprime 1 página por slide a 1280×720 (lo fija @page en el HTML).
// ════════════════════════════════════════════════════════════════════════
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const srcHtml = join(here, 'dossier-marcas-deck.print.html')
const outPdf = join(root, 'public', 'dossier-marcas-deck.pdf')

const CHROME =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Versión genérica: el placeholder de marca queda como «tu marca».
const html = readFileSync(srcHtml, 'utf8').replaceAll('{{BRAND}}', 'tu marca')

const work = mkdtempSync(join(tmpdir(), 'dossier-deck-'))
const tmpHtml = join(work, 'deck.html')
writeFileSync(tmpHtml, html)

try {
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--no-margins',
      `--print-to-pdf=${outPdf}`,
      // Da tiempo a que carguen las webfonts (Fraunces / JetBrains Mono).
      '--virtual-time-budget=10000',
      `file://${tmpHtml}`,
    ],
    { stdio: 'inherit' },
  )
  console.log(`✓ PDF regenerado → ${outPdf}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
