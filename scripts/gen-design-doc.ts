// Genera lo que se DERIVA del canon de tokens (sistema v3). Hoy: la copia byte a byte para agencias,
// public/design-system/tokens.css. En S5 se suma DESIGN-SYSTEM.md (sus tablas de tokens van entre marcadores).
//
//   pnpm gen:design-doc              escribe lo generado
//   pnpm gen:design-doc --comprobar  no escribe: sale con código 1 si algo generado está desfasado (lo usa test:diseno, R9)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = join(import.meta.dirname, '..')
export const CANON = join(RAIZ, 'app/assets/css/design-system-v2/btp-tokens.css')
export const COPIA_PUBLICA = join(RAIZ, 'public/design-system/tokens.css')

/** Cada entrada: ruta absoluta y contenido esperado. */
export function generados(): { ruta: string; contenido: string }[] {
  return [{ ruta: COPIA_PUBLICA, contenido: readFileSync(CANON, 'utf8') }]
}

export function desfasados(): string[] {
  return generados()
    .filter((g) => !existsSync(g.ruta) || readFileSync(g.ruta, 'utf8') !== g.contenido)
    .map((g) => g.ruta.replace(RAIZ + '/', ''))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--comprobar')) {
    const malos = desfasados()
    if (malos.length) {
      console.log(`✘ desfasado: ${malos.join(', ')}. Corre: pnpm gen:design-doc`)
      process.exit(1)
    }
    console.log('✔ lo generado del canon está al día')
  } else {
    for (const g of generados()) {
      writeFileSync(g.ruta, g.contenido)
      console.log(`escrito ${g.ruta.replace(RAIZ + '/', '')}`)
    }
  }
}
