// ════════════════════════════════════════════════════════════════════════
//  Regenera public/dossier-marcas-deck.pdf desde la fuente imprimible
//  scripts/dossier-marcas-deck.print.html, usando Google Chrome headless
//  (mismo motor —Skia/PDF— con el que se generó el deck original del #102).
//
//  Uso:   node scripts/render-dossier-deck.mjs
//  Requisitos: Google Chrome instalado (macOS).
//
//  · Sustituye {{BRAND}} por «tu marca» (versión genérica para repartir).
//  · Sustituye {{RECAUDADO}}, {{DONANTES}} y {{FECHA_CIFRA}} (slide 06) por la cifra de la
//    campaña que lee de seed/fundraiser.json, la misma que enseña la web, con su fecha. La
//    fuente HTML no lleva ninguna cifra en € escrita a mano (lo vigila test-dinero-fuente §7):
//    si la semilla falta o no tiene fecha, el script se detiene y no se genera un PDF sin ella.
//    Refrescar la semilla antes de regenerar: `pnpm update-fundraiser --force`.
//  · Imprime 1 página por slide a 1280×720 (lo fija @page en el HTML).
// ════════════════════════════════════════════════════════════════════════
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// El mismo formateador de moneda que la web (sin JSON ni Nuxt dentro: Node lo importa tal cual).
import { formatCurrency } from '../app/utils/currency.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const srcHtml = join(here, 'dossier-marcas-deck.print.html')
const outPdf = join(root, 'public', 'dossier-marcas-deck.pdf')

const CHROME =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// ── La cifra de la campaña: importe y donantes, con la fecha en que se trajo ──────────────────────────
const semillaPath = join(root, 'seed', 'fundraiser.json')
if (!existsSync(semillaPath)) {
  console.error(`✗ Falta ${semillaPath}: ejecuta \`pnpm update-fundraiser\` y vuelve a lanzar este script.`)
  process.exit(1)
}
const semilla = JSON.parse(readFileSync(semillaPath, 'utf8'))
const importe = semilla?.currentAmount?.amount
const donantes = semilla?.donationCount
const cuando = new Date(semilla?.actualizado)
if (!Number.isFinite(importe) || !Number.isInteger(donantes) || Number.isNaN(cuando.getTime())) {
  console.error('✗ seed/fundraiser.json no trae importe, donantes y fecha («actualizado»): `pnpm update-fundraiser --force`.')
  process.exit(1)
}
const cifras = {
  '{{RECAUDADO}}': formatCurrency(importe, semilla.currentAmount.currencyCode, 'es'),
  // Agrupa también las cuatro cifras («2.335»), como el resto del deck («3.845 clics»); es-ES omitiría el punto.
  '{{DONANTES}}': new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(donantes),
  // Día entero y mes en letra, en la zona de Madrid (la web usa la misma): «24 de octubre de 2026».
  '{{FECHA_CIFRA}}': new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }).format(cuando),
}

// Versión genérica: el placeholder de marca queda como «tu marca».
let html = readFileSync(srcHtml, 'utf8').replaceAll('{{BRAND}}', 'tu marca')
for (const [marca, valor] of Object.entries(cifras)) html = html.replaceAll(marca, valor)
const sinRellenar = html.match(/\{\{[A-Z_]+\}\}/g)
if (sinRellenar) {
  console.error(`✗ Quedan marcadores sin rellenar en la fuente imprimible: ${[...new Set(sinRellenar)].join(', ')}`)
  process.exit(1)
}
console.log(`Cifra de la campaña: ${cifras['{{RECAUDADO}}']} · ${cifras['{{DONANTES}}']} donantes · a ${cifras['{{FECHA_CIFRA}}']}`)

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
