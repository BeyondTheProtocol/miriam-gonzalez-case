// Genera lo que se DERIVA del canon de tokens (sistema v3):
//   1. public/design-system/tokens.css: copia byte a byte del canon, para agencias.
//   2. Las tablas de DESIGN-SYSTEM.md entre los marcadores `<!-- GENERADO:TOKENS -->` y `<!-- GENERADO:PUENTE -->`:
//      cada token del canon con su valor, su valor en banda oscura y su nota; y las utilidades de Tailwind que apuntan
//      a un token. El resto del documento (prosa, contratos, excepciones) es a mano.
//
//   pnpm gen:design-doc              escribe lo generado
//   pnpm gen:design-doc --comprobar  no escribe: sale con código 1 si algo generado está desfasado (lo usa test:diseno, R9)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// tailwind.config.js es ESM pero llama a require() para el plugin de tipografía: se le presta uno.
;(globalThis as { require?: NodeRequire }).require ??= createRequire(import.meta.url)
const { default: config } = await import('../tailwind.config.js')

const RAIZ = join(import.meta.dirname, '..')
export const CANON = join(RAIZ, 'app/assets/css/design-system-v2/btp-tokens.css')
export const COPIA_PUBLICA = join(RAIZ, 'public/design-system/tokens.css')
export const DOC = join(RAIZ, 'app/assets/css/design-system-v2/DESIGN-SYSTEM.md')

export type Token = { nombre: string; valor: string; nota: string; grupo: string; tema: 'raiz' | 'oscuro' | 'ambos' }

/* ───────────────────────────── lectura del canon ───────────────────────────── */

/** «── Paleta: 5 colores (disciplina máxima) ────» → «Paleta». */
function nombreGrupo(linea: string): string | null {
  const m = linea.match(/\/\*\s*(?:──|══)\s*(.+?)(?:\s*[─═]{3,}|\s*\*\/|$)/)
  if (!m) return null
  return m[1].split(/[:(.—]/)[0].replace(/\s+/g, ' ').trim()
}

export function leerTokens(css: string): Token[] {
  const lineas = css.split('\n')
  const out: Token[] = []
  let selector = ''
  let pendiente = ''
  let grupo = 'Sin grupo'
  let enComentario = false
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i]
    if (enComentario) {
      if (l.includes('*/')) enComentario = false
      continue
    }
    const g = nombreGrupo(l)
    if (g) grupo = g
    // selectores en varias líneas (`:root,` + `[data-tema="oscuro"] {`): se acumulan hasta la llave
    if (/^[^\s/@][^{}]*,\s*$/.test(l)) { pendiente += l.trim() + ' '; continue }
    const abre = l.match(/^([^\s/][^{]*)\{\s*$/) // selector de primer nivel o @media
    if (abre) { selector = (pendiente + abre[1]).trim(); pendiente = ''; continue }
    if (l.startsWith('}')) { selector = ''; continue }
    if (/^\s*\/\*/.test(l) && !l.includes('*/')) { enComentario = true; continue }
    // @media en una línea: `@media (...) { :root { --x: y; } }`
    const enLinea = l.match(/^(@media[^{]+)\{\s*(:root|\[data-tema="oscuro"\])\s*\{(.*)\}\s*\}\s*$/)
    if (enLinea) {
      for (const d of enLinea[3].split(';')) {
        const m = d.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*$/)
        if (m) out.push({ nombre: m[1], valor: m[2], nota: `solo ${enLinea[1].trim().replace(/@media /, '')}`, grupo, tema: 'raiz' })
      }
      continue
    }
    const t = l.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.*)$/)
    if (!t) continue
    // el valor puede seguir en las líneas de abajo hasta el `;`
    let resto = t[2]
    let j = i
    while (!/;\s*(\/\*.*\*\/)?\s*$/.test(resto) && j + 1 < lineas.length) { j++; resto += ' ' + lineas[j].trim() }
    i = j
    const nota = (resto.match(/\/\*\s*(.*?)\s*\*\//) ?? [])[1] ?? ''
    const valor = resto.replace(/\/\*.*?\*\//g, '').replace(/;\s*$/, '').replace(/\s+/g, ' ').trim()
    const oscuro = selector.includes('data-tema="oscuro"')
    const raiz = selector.includes(':root')
    out.push({ nombre: t[1], valor, nota, grupo, tema: oscuro && raiz ? 'ambos' : oscuro ? 'oscuro' : 'raiz' })
  }
  return out
}

/* ───────────────────────────── tablas ───────────────────────────── */

const celda = (s: string) => s.replace(/\|/g, '\\|')
const cod = (s: string) => (s ? `\`${celda(s)}\`` : '')

export function tablaTokens(css: string): string {
  const tokens = leerTokens(css)
  const oscuros = new Map(tokens.filter((t) => t.tema === 'oscuro').map((t) => [t.nombre, t.valor]))
  const grupos: string[] = []
  for (const t of tokens) if (t.tema !== 'oscuro' && !grupos.includes(t.grupo)) grupos.push(t.grupo)
  const bloques: string[] = []
  for (const g of grupos) {
    const filas = tokens.filter((t) => t.grupo === g && t.tema !== 'oscuro')
    if (!filas.length) continue
    bloques.push(`#### ${g}\n\n| Token | Valor | En banda oscura | Nota |\n|---|---|---|---|`)
    for (const t of filas) {
      const osc = t.tema === 'ambos' ? 'igual, resuelto con los roles de la banda' : oscuros.has(t.nombre) ? cod(oscuros.get(t.nombre)!) : ''
      bloques.push(`| \`${t.nombre}\` | ${cod(t.valor)} | ${osc} | ${celda(t.nota)} |`)
    }
    bloques.push('')
  }
  return bloques.join('\n').trimEnd()
}

const PREFIJO: Record<string, string> = {
  fontSize: 'text-', borderRadius: 'rounded-', boxShadow: 'shadow-', transitionDuration: 'duration-',
  transitionTimingFunction: 'ease-', maxWidth: 'max-w-', borderColor: 'border-', divideColor: 'divide-', ringColor: 'ring-',
}

const ETIQUETA_DEFECTO: Record<string, string> = {
  borderColor: 'color de borde por defecto (`border`, `border-t`…)',
  divideColor: 'color de divisor por defecto (`divide-x`, `divide-y`)',
  ringColor: 'color de anillo por defecto (`ring`)',
}

export function tablaPuente(): string {
  const ext = (config as { theme: { extend: Record<string, Record<string, unknown>> } }).theme.extend
  const filas: string[] = ['| Utilidad | Valor |', '|---|---|']
  for (const [clave, prefijo] of Object.entries(PREFIJO)) {
    const mapa = ext[clave]
    if (!mapa) continue
    for (const [k, v] of Object.entries(mapa)) {
      const valor = Array.isArray(v) ? String(v[0]) : String(v)
      const nombre = k === 'DEFAULT' ? ETIQUETA_DEFECTO[clave] : `\`${prefijo}${k}\``
      filas.push(`| ${nombre} | \`${valor}\` |`)
    }
  }
  const sp = ext.spacing ?? {}
  if (sp.control) filas.push(`| \`h-control\`, \`min-h-control\`, \`w-control\`… | \`${sp.control}\` |`)
  if (sp.gutter) filas.push(`| \`px-gutter\`, \`mx-gutter\`… | \`${sp.gutter}\` |`)
  return filas.join('\n')
}

/* ───────────────────────────── documento ───────────────────────────── */

const MARCAS = {
  tokens: { ini: '<!-- GENERADO:TOKENS:INICIO', fin: '<!-- GENERADO:TOKENS:FIN -->' },
  puente: { ini: '<!-- GENERADO:PUENTE:INICIO', fin: '<!-- GENERADO:PUENTE:FIN -->' },
} as const

function rellenar(doc: string, marca: { ini: string; fin: string }, cuerpo: string): string {
  const a = doc.indexOf(marca.ini)
  const b = doc.indexOf(marca.fin)
  if (a < 0 || b < 0 || b < a) throw new Error(`DESIGN-SYSTEM.md no tiene los marcadores ${marca.ini}`)
  const finDeLineaIni = doc.indexOf('\n', a)
  return doc.slice(0, finDeLineaIni + 1) + '\n' + cuerpo + '\n\n' + doc.slice(b)
}

export function docEsperado(): string {
  const doc = readFileSync(DOC, 'utf8')
  const css = readFileSync(CANON, 'utf8')
  return rellenar(rellenar(doc, MARCAS.tokens, tablaTokens(css)), MARCAS.puente, tablaPuente())
}

/** Cada entrada: ruta absoluta y contenido esperado. */
export function generados(): { ruta: string; contenido: string }[] {
  const lista = [{ ruta: COPIA_PUBLICA, contenido: readFileSync(CANON, 'utf8') }]
  if (existsSync(DOC)) lista.push({ ruta: DOC, contenido: docEsperado() })
  return lista
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
