// Lint del sistema de diseño (sistema v3, fases S0 y S6). Cuenta, por regla y por fichero, lo que se aparta del sistema
// y lo compara con scripts/diseno-baseline.json: un recuento puede BAJAR, nunca subir.
//
//   pnpm test:diseno                 verde si ningún recuento sube ni baja respecto a la baseline
//   pnpm test:diseno --actualizar    reescribe la baseline SOLO si nada sube (la deuda saldada queda en el diff)
//   pnpm test:diseno --lista R3      imprime cada hallazgo de una regla (o de todas, sin argumento)
//   pnpm test:diseno --archivo X     solo los ficheros cuya ruta contiene X (para trabajar; no comprueba la baseline)
//
// Por qué un ratchet y no «cero»: el sitio nació con tres vocabularios de diseño y se corrige por páginas (fases P1 a P13).
// Un cero obligatorio habría bloqueado todo. Con la baseline, lo viejo está anotado y cualquier cosa NUEVA que se aparte
// del sistema falla en CI, también en una página que aún no se ha migrado.
//
// Excepciones: un hallazgo se admite con `/* ds-exc: motivo */` (o `<!-- ds-exc: motivo -->`, `// ds-exc: motivo`) en la
// misma línea o en la anterior. El test las cuenta y la baseline guarda el tope por fichero: una excepción nueva sube el
// tope y eso se ve en el diff (y se defiende en la revisión). `--actualizar --subir-excepciones` es el único modo de subirlo.
//
// Qué NO hace: juzgar jerarquía o gusto, ni detectar duplicados con otro nombre. Eso sigue en la auditoría humana.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = join(import.meta.dirname, '..')
const RUTA_BASELINE = join(import.meta.dirname, 'diseno-baseline.json')
/** El canon de color y tipo: aquí SÍ viven los hex (y los px de los tokens). */
const CANON = 'app/assets/css/design-system-v2/btp-tokens.css'

export type Hallazgo = { regla: string; archivo: string; linea: number; texto: string }
type Region = { tipo: 'template' | 'script' | 'style' | 'css' | 'ts'; texto: string; desde: number }
type Bloque = { selector: string; contexto: string[]; decls: { prop: string; valor: string; linea: number }[]; linea: number }

export const REGLAS: Record<string, string> = {
  R1: 'color: hex, rgb()/hsl() con números y familias de color o sombras de Tailwind fuera de la paleta',
  R2: 'tamaño: texto por debajo de 13 px (12 px solo en mono y mayúsculas)',
  R3: 'radio: border-radius literal o rounded-* fuera del puente (sm, md, btn, card, pill)',
  R4: 'movimiento: transition-all, cubic-bezier literal, ease-in, scale(<.95) y :hover sin @media (hover:hover)',
}

/* ───────────────────────────── lectura y regiones ───────────────────────────── */

const EXT = new Set(['.vue', '.ts', '.css'])
function listar(dir: string, salida: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) listar(p, salida)
    else if (EXT.has(p.slice(p.lastIndexOf('.')))) salida.push(p)
  }
  return salida
}

/** Cambia por espacios (conservando los saltos de línea) lo que casa, para que las líneas sigan cuadrando. */
const enBlanco = (s: string, re: RegExp) => s.replace(re, (m) => m.replace(/[^\n]/g, ' '))

function sinComentariosJs(src: string): string {
  src = enBlanco(src, /\/\*[\s\S]*?\*\//g)
  return src
    .split('\n')
    .map((linea) => {
      let q = ''
      for (let i = 0; i < linea.length; i++) {
        const c = linea[i]
        if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue }
        if (c === '"' || c === "'" || c === '`') { q = c; continue }
        if (c === '/' && linea[i + 1] === '/' && linea[i - 1] !== ':') return linea.slice(0, i)
      }
      return linea
    })
    .join('\n')
}

export function regiones(archivo: string, src: string): Region[] {
  if (archivo.endsWith('.css')) return [{ tipo: 'css', texto: enBlanco(src, /\/\*[\s\S]*?\*\//g), desde: 1 }]
  if (archivo.endsWith('.ts') || archivo.endsWith('.js')) return [{ tipo: 'ts', texto: sinComentariosJs(src), desde: 1 }]
  const out: Region[] = []
  const re = /^<(template|script|style)\b[^>]*>/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const tag = m[1]
    const ini = m.index + m[0].length
    const fin = src.indexOf(`\n</${tag}>`, ini)
    if (fin < 0) continue
    const texto = src.slice(ini, fin)
    const desde = src.slice(0, ini).split('\n').length
    out.push({
      tipo: tag as Region['tipo'],
      texto: tag === 'style' ? enBlanco(texto, /\/\*[\s\S]*?\*\//g) : tag === 'script' ? sinComentariosJs(texto) : enBlanco(texto, /<!--[\s\S]*?-->/g),
      desde,
    })
    re.lastIndex = fin
  }
  return out
}

const lineaDe = (texto: string, idx: number, desde: number) => desde + texto.slice(0, idx).split('\n').length - 1

/* ───────────────────────────── escáner de CSS ───────────────────────────── */

/** Recorre CSS y devuelve cada regla con su cadena de at-rules (@media, @layer…) y sus declaraciones. */
export function bloquesCss(css: string, desde = 1): Bloque[] {
  const out: Bloque[] = []
  const pila: string[] = []
  let ini = 0
  const L = (i: number) => lineaDe(css, i, desde)
  const cierre = (i: number): number => {
    let prof = 0, q = ''
    for (let j = i; j < css.length; j++) {
      const c = css[j]
      if (q) { if (c === '\\') j++; else if (c === q) q = ''; continue }
      if (c === '"' || c === "'") { q = c; continue }
      if (c === '{') prof++
      else if (c === '}' && --prof === 0) return j
    }
    return css.length
  }
  const decls = (cuerpo: string, base: number) => {
    const res: Bloque['decls'] = []
    let prof = 0, q = '', ini2 = 0
    const push = (fin: number) => {
      const t = cuerpo.slice(ini2, fin)
      const k = t.indexOf(':')
      const esApply = /^\s*@apply\b/.test(t)
      if (esApply) res.push({ prop: '@apply', valor: t.replace(/^\s*@apply\s*/, '').trim(), linea: L(base + ini2 + t.search(/\S/)) })
      else if (k > 0) res.push({ prop: t.slice(0, k).trim().toLowerCase(), valor: t.slice(k + 1).trim(), linea: L(base + ini2 + Math.max(0, t.search(/\S/))) })
      ini2 = fin + 1
    }
    for (let i = 0; i < cuerpo.length; i++) {
      const c = cuerpo[i]
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue }
      if (c === '"' || c === "'") { q = c; continue }
      if (c === '(') prof++
      else if (c === ')') prof--
      else if (c === ';' && prof === 0) push(i)
    }
    if (cuerpo.slice(ini2).trim()) push(cuerpo.length)
    return res
  }
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === ';') { ini = i + 1; continue }
    if (c === '}') { pila.pop(); ini = i + 1; continue }
    if (c !== '{') continue
    const prelude = css.slice(ini, i).trim()
    if (prelude.startsWith('@') && !/^@(font-face|page)\b/.test(prelude)) {
      pila.push(prelude) // @media, @layer, @supports, @keyframes, @container: contexto, se sigue dentro
      ini = i + 1
      continue
    }
    const fin = cierre(i)
    out.push({ selector: prelude, contexto: [...pila], decls: decls(css.slice(i + 1, fin), i + 1), linea: L(i) })
    i = fin
    ini = fin + 1
  }
  return out
}

/* ───────────────────────────── las reglas ───────────────────────────── */

const RE_HEX = /(?<![\w&#/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g
const RE_RGB = /\b(?:rgba?\(\s*\d|hsla?\()/g
const FAMILIAS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PREFIJOS = 'text|bg|border|border-[xytblr]|ring|ring-offset|fill|stroke|from|to|via|divide|outline|decoration|accent|caret|placeholder|shadow'
const RE_TW_COLOR = new RegExp(
  `(?<![\\w-])(?:(?:${PREFIJOS})-(?:${FAMILIAS})-\\d{2,3}|(?:text|bg|border|ring|fill|stroke|divide|outline)-(?:white|black)|shadow-(?:sm|md|lg|xl|2xl|inner)|(?:text|bg|border|ring|fill|stroke)-coral-deep)(?![\\w-])`,
  'g',
)

/** Tamaños efectivos de las utilidades de Tailwind, leídos de tailwind.config.js (resuelve var(--texto-*) contra el canon). */
function tamanosTailwind(): Record<string, number> {
  const base: Record<string, number> = { xs: 12, sm: 14, '2xs': 10.4 }
  try {
    const cfg = readFileSync(join(RAIZ, 'tailwind.config.js'), 'utf8')
    const canon = readFileSync(join(RAIZ, CANON), 'utf8')
    const token = (n: string) => {
      const m = canon.match(new RegExp(`${n}\\s*:\\s*([\\d.]+)px`))
      return m ? Number(m[1]) : null
    }
    const bloque = cfg.match(/fontSize:\s*\{([\s\S]*?)\n\s{6}\}/)
    if (bloque) {
      for (const m of bloque[1].matchAll(/['"]?(2xs|xs|sm)['"]?\s*:\s*\[\s*['"]([^'"]+)['"]/g)) {
        const v = m[2].match(/^var\((--[a-z0-9-]+)\)$/)
        const lit = m[2].match(/^([\d.]+)(rem|px)$/)
        const px = v ? token(v[1]) : lit ? Number(lit[1]) * (lit[2] === 'rem' ? 16 : 1) : null
        if (px !== null) base[m[1]] = px
      }
    }
  } catch { /* sin config: valores por defecto */ }
  return base
}
const TW_TAM = tamanosTailwind()

const aPx = (n: string, u: string) => Number(n) * (u === 'rem' ? 16 : 1)

function esMonoMayus(decls: { prop: string; valor: string }[]): boolean {
  const mono = decls.some((d) => /mono|jetbrains|monospace/i.test(d.valor) && /^(font|font-family|@apply)$/.test(d.prop))
  const mayus = decls.some((d) => (d.prop === 'text-transform' && /uppercase/.test(d.valor)) || (d.prop === '@apply' && /\buppercase\b/.test(d.valor)))
  return mono && mayus
}

/** Primer tamaño literal de un `font:` abreviado (`600 11px/1.4 var(--font-mono)`) o de un `font-size:`. */
function tamanoLiteral(prop: string, valor: string): number | null {
  if (prop === 'font-size') {
    const m = valor.match(/^([\d.]+)(px|rem)\s*(?:!important)?$/)
    return m ? aPx(m[1], m[2]) : null
  }
  if (prop === 'font') {
    const m = valor.match(/(?:^|\s)([\d.]+)(px|rem)(?:\/|\s|$)/)
    return m ? aPx(m[1], m[2]) : null
  }
  return null
}

function reglasCss(archivo: string, bloques: Bloque[], salida: Hallazgo[]) {
  const H = (regla: string, linea: number, texto: string) => salida.push({ regla, archivo, linea, texto: texto.trim().split('\n')[0].slice(0, 110) })
  for (const b of bloques) {
    const enKeyframes = b.contexto.some((c) => /^@(-webkit-)?keyframes/.test(c))
    const monoMayus = esMonoMayus(b.decls)
    for (const d of b.decls) {
      // R1 · color (en declaraciones; las líneas de utilidades @apply se miran como clases)
      for (const _ of d.valor.matchAll(RE_HEX)) H('R1', d.linea, `${d.prop}: ${d.valor}`)
      for (const _ of d.valor.matchAll(RE_RGB)) H('R1', d.linea, `${d.prop}: ${d.valor}`)
      if (d.prop === '@apply') for (const _ of d.valor.matchAll(RE_TW_COLOR)) H('R1', d.linea, `@apply ${d.valor}`)
      // R2 · tamaño
      const t = tamanoLiteral(d.prop, d.valor)
      if (t !== null && (t < 12 || (t < 13 && !monoMayus))) H('R2', d.linea, `${d.prop}: ${d.valor}`)
      if (d.prop === '@apply') claseTam(d.valor, monoMayus || (/\buppercase\b/.test(d.valor) && /\bfont-mono\b/.test(d.valor)), (x) => H('R2', d.linea, `@apply ${x}`))
      // R3 · radio
      if (d.prop === 'border-radius' || /^border-(top|bottom)-(left|right)-radius$/.test(d.prop)) {
        const v = d.valor.replace(/!important/, '').trim()
        const literales = v.split(/\s+|\//).filter((p) => p && !/^(0|0px|50%|inherit|unset|initial)$/.test(p) && !p.startsWith('var(') && !p.startsWith(')'))
        if (literales.length) H('R3', d.linea, `${d.prop}: ${d.valor}`)
      }
      if (d.prop === '@apply') for (const m of d.valor.matchAll(RE_RADIO)) H('R3', d.linea, `@apply ${m[0]}`)
      // R4 · movimiento
      if (d.prop === 'transition' || d.prop === 'transition-property') {
        if (/(^|[\s,])all(\s|,|$)/.test(d.valor)) H('R4', d.linea, `${d.prop}: ${d.valor}`)
      }
      if (/cubic-bezier\(/.test(d.valor)) H('R4', d.linea, `${d.prop}: ${d.valor}`)
      if (/\bease-in\b(?!-out)/.test(d.valor)) H('R4', d.linea, `${d.prop}: ${d.valor}`)
      for (const m of d.valor.matchAll(/scale\(\s*(0?\.\d+|0)\s*[,)]/g)) if (Number(m[1]) < 0.95) H('R4', d.linea, `${d.prop}: ${d.valor}`)
      if (d.prop === '@apply') {
        if (/(^|\s)transition-all(\s|$)/.test(d.valor)) H('R4', d.linea, `@apply ${d.valor}`)
        if (/(^|\s)ease-in(\s|$)/.test(d.valor)) H('R4', d.linea, `@apply ${d.valor}`)
      }
    }
    // R4 · :hover fuera de @media (hover: hover). Los reinicios de reduced-motion y los keyframes no cuentan.
    if (!enKeyframes && /:hover/.test(b.selector)) {
      const protegido = b.contexto.some((c) => /\(\s*hover\s*:\s*hover\s*\)/.test(c) || /prefers-reduced-motion\s*:\s*reduce/.test(c))
      if (!protegido) H('R4', b.linea, b.selector)
    }
  }
}

const RE_RADIO = /(?<![\w-])rounded(?:-[a-z]{1,2})?-(?:lg|xl|2xl|3xl)(?![\w-])|(?<![\w-])rounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g

/** `text-[11px]`, `text-xs`, `text-2xs` dentro de una cadena de clases. `monoMayus`: si la cadena es mono y en mayúsculas. */
function claseTam(clases: string, monoMayus: boolean, avisar: (x: string) => void) {
  for (const m of clases.matchAll(/(?<![\w-])((?:[a-z0-9]+:)*)text-\[([\d.]+)(px|rem)\]/g)) {
    const t = aPx(m[2], m[3])
    if (t < 12 || (t < 13 && !monoMayus)) avisar(`${m[1]}text-[${m[2]}${m[3]}]`)
  }
  for (const m of clases.matchAll(/(?<![\w-])((?:[a-z0-9]+:)*)text-(xs|2xs)(?![\w-])/g)) {
    const t = TW_TAM[m[2]]
    if (t < 12 || (t < 13 && !monoMayus)) avisar(`${m[1]}text-${m[2]}`)
  }
}

/** Reglas sobre texto con clases de Tailwind y atributos (plantillas y cadenas de script). */
function reglasPlantilla(archivo: string, r: Region, salida: Hallazgo[]) {
  const H = (regla: string, idx: number, texto: string) => salida.push({ regla, archivo, linea: lineaDe(r.texto, idx, r.desde), texto: texto.trim().split('\n')[0].slice(0, 110) })
  const tx = r.texto
  // R1
  for (const m of tx.matchAll(RE_HEX)) {
    const antes = tx.slice(Math.max(0, m.index! - 14), m.index!)
    if (/(href=|to=|hash[:=]|url\(|xlink:href=)\s*["'`]?$/.test(antes)) continue
    H('R1', m.index!, m[0])
  }
  for (const m of tx.matchAll(RE_RGB)) H('R1', m.index!, tx.slice(m.index!, m.index! + 40))
  for (const m of tx.matchAll(RE_TW_COLOR)) H('R1', m.index!, m[0])
  // R2: por atributo class para saber si la cadena es mono y en mayúsculas
  for (const m of tx.matchAll(/(?::|v-bind:)?class\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    const clases = m[2] ?? m[3] ?? ''
    claseTam(clases, /\bfont-mono\b/.test(clases) && /\buppercase\b/.test(clases), (x) => H('R2', m.index!, x))
  }
  for (const m of tx.matchAll(/\bstyle\s*=\s*"([^"]*)"/g)) {
    for (const d of m[1].split(';')) {
      const k = d.indexOf(':')
      if (k < 0) continue
      const prop = d.slice(0, k).trim().toLowerCase()
      const t = tamanoLiteral(prop, d.slice(k + 1).trim())
      if (t !== null && t < 13) H('R2', m.index!, d.trim())
      if (prop === 'border-radius') H('R3', m.index!, d.trim())
    }
  }
  // R3
  for (const m of tx.matchAll(RE_RADIO)) H('R3', m.index!, m[0])
  // R4
  for (const m of tx.matchAll(/(?<![\w-])((?:[a-z0-9]+:)*)transition-all(?![\w-])/g)) H('R4', m.index!, m[0])
  for (const m of tx.matchAll(/cubic-bezier\(/g)) H('R4', m.index!, 'cubic-bezier(')
  for (const m of tx.matchAll(/(?<![\w-])((?:[a-z0-9]+:)*)ease-in(?![\w-])/g)) H('R4', m.index!, m[0])
  for (const m of tx.matchAll(/(?<![\w-])((?:[a-z0-9]+:)*)scale-(0|50|75|90)(?![\w-])/g)) H('R4', m.index!, m[0])
  for (const m of tx.matchAll(/scale\(\s*(0?\.\d+|0)\s*[,)]/g)) if (Number(m[1]) < 0.95) H('R4', m.index!, m[0])
}

/* ───────────────────────────── análisis de un fichero ───────────────────────────── */

export type Analisis = { hallazgos: Hallazgo[]; excepciones: { linea: number; motivo: string }[] }

export function analizar(archivo: string, src: string): Analisis {
  const bruto: Hallazgo[] = []
  for (const r of regiones(archivo, src)) {
    if (r.tipo === 'css' || r.tipo === 'style') reglasCss(archivo, bloquesCss(r.texto, r.desde), bruto)
    else reglasPlantilla(archivo, r, bruto) // template, script y .ts: cadenas con clases y literales
  }
  // Excepciones firmadas: `ds-exc: motivo` en la misma línea o en la anterior.
  const exc = new Map<number, string>()
  src.split('\n').forEach((l, i) => {
    const m = l.match(/ds-exc:\s*(.+?)\s*(?:\*\/|-->|$)/)
    if (m) exc.set(i + 1, m[1])
  })
  const hallazgos: Hallazgo[] = []
  const usadas = new Set<number>()
  for (const h of bruto) {
    const l = exc.has(h.linea) ? h.linea : exc.has(h.linea - 1) ? h.linea - 1 : 0
    if (l) usadas.add(l)
    else hallazgos.push(h)
  }
  return { hallazgos, excepciones: [...usadas].map((linea) => ({ linea, motivo: exc.get(linea)! })) }
}

/* ───────────────────────────── baseline y comparación ───────────────────────────── */

type Baseline = { version: number; nota: string; reglas: Record<string, Record<string, number>>; excepciones: Record<string, number> }
type Recuentos = { reglas: Record<string, Record<string, number>>; excepciones: Record<string, number>; hallazgos: Hallazgo[]; motivos: Record<string, string[]> }

export function ficheros(): string[] {
  const lista = listar(join(RAIZ, 'app')).map((p) => relative(RAIZ, p))
  lista.push('tailwind.config.js')
  return lista.filter((f) => f !== CANON).sort()
}

function contar(filtroArchivo?: string): Recuentos {
  const reglas: Recuentos['reglas'] = Object.fromEntries(Object.keys(REGLAS).map((r) => [r, {}]))
  const excepciones: Recuentos['excepciones'] = {}
  const motivos: Recuentos['motivos'] = {}
  const hallazgos: Hallazgo[] = []
  for (const f of ficheros()) {
    if (filtroArchivo && !f.includes(filtroArchivo)) continue
    const a = analizar(f, readFileSync(join(RAIZ, f), 'utf8'))
    for (const h of a.hallazgos) {
      reglas[h.regla][f] = (reglas[h.regla][f] ?? 0) + 1
      hallazgos.push(h)
    }
    if (a.excepciones.length) {
      excepciones[f] = a.excepciones.length
      motivos[f] = a.excepciones.map((e) => `L${e.linea}: ${e.motivo}`)
    }
  }
  return { reglas, excepciones, hallazgos, motivos }
}

const ordenar = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))

function escribirBaseline(rec: Recuentos, previa: Baseline | null, subirExc: boolean) {
  const reglas: Baseline['reglas'] = {}
  for (const r of Object.keys(rec.reglas)) reglas[r] = ordenar(rec.reglas[r])
  const excepciones: Record<string, number> = { ...previa?.excepciones }
  for (const f of Object.keys(excepciones)) excepciones[f] = Math.min(excepciones[f], rec.excepciones[f] ?? 0)
  for (const [f, n] of Object.entries(rec.excepciones)) if (subirExc) excepciones[f] = n
  for (const f of Object.keys(excepciones)) if (!excepciones[f]) delete excepciones[f]
  const nota = 'Generado por scripts/test-diseno.ts (pnpm test:diseno --actualizar). Un recuento puede bajar, nunca subir. No se edita a mano.'
  writeFileSync(RUTA_BASELINE, JSON.stringify({ version: 1, nota, reglas, excepciones: ordenar(excepciones) }, null, 2) + '\n')
}

/* ───────────────────────────── autotest del escáner ───────────────────────────── */
// Los propios detectores se prueban con trozos sintéticos: si una regex se rompe, esto se pone rojo antes que el sitio.

function autotest(): string[] {
  const fallos: string[] = []
  const cuenta = (archivo: string, src: string, regla: string) => analizar(archivo, src).hallazgos.filter((h) => h.regla === regla).length
  const eq = (nombre: string, obtenido: number, esperado: number) => { if (obtenido !== esperado) fallos.push(`autotest «${nombre}»: ${obtenido} en vez de ${esperado}`) }
  const vue = (tpl: string, css = '') => `<template>\n${tpl}\n</template>\n<style scoped>\n${css}\n</style>\n`
  // R1
  eq('R1 hex en css', cuenta('x.vue', vue('<p/>', '.a { color: #ff0000; background: #fff }'), 'R1'), 2)
  eq('R1 hex en atributo', cuenta('x.vue', vue('<path fill="#2d1b3d"/>'), 'R1'), 1)
  eq('R1 ancla no es hex', cuenta('x.vue', vue('<a href="#bad">x</a><a to="#cafe">y</a><use href="url(#abc)"/>'), 'R1'), 0)
  eq('R1 rgb con números', cuenta('x.vue', vue('<p/>', '.a { color: rgba(255, 107, 71, .5) }'), 'R1'), 1)
  eq('R1 rgb con token no cuenta', cuenta('x.vue', vue('<p/>', '.a { color: rgb(var(--color-text-rgb) / 0.08) }'), 'R1'), 0)
  eq('R1 familia de Tailwind', cuenta('x.vue', vue('<p class="text-green-600 hover:bg-red-50 shadow-md text-berenjena"/>'), 'R1'), 3)
  eq('R1 comentario no cuenta', cuenta('x.vue', vue('<p/>', '/* #ff0000 */ .a { color: var(--texto-1) }'), 'R1'), 0)
  eq('R1 excepción firmada', cuenta('x.vue', vue('<p/>', '/* ds-exc: prueba */\n.a { color: #ff0000 }'), 'R1'), 0)
  // R2
  eq('R2 font-size 11px', cuenta('x.vue', vue('<p/>', '.a { font-size: 11px }'), 'R2'), 1)
  eq('R2 12px suelto', cuenta('x.vue', vue('<p/>', '.a { font-size: 12px }'), 'R2'), 1)
  eq('R2 12px mono mayúsculas', cuenta('x.vue', vue('<p/>', '.a { font: 500 12px/1.3 var(--font-mono); text-transform: uppercase }'), 'R2'), 0)
  eq('R2 13px vale', cuenta('x.vue', vue('<p/>', '.a { font-size: 13px } .b { font-size: 0.8125rem }'), 'R2'), 0)
  eq('R2 font abreviado 11px', cuenta('x.vue', vue('<p/>', '.a { font: 600 11px/1.4 var(--font-mono) }'), 'R2'), 1)
  eq('R2 text-[10px]', cuenta('x.vue', vue('<p class="text-[10px] md:text-[11.5px] text-[13px]"/>'), 'R2'), 2)
  eq('R2 style inline', cuenta('x.vue', vue('<p style="font-size: 11px"/>'), 'R2'), 1)
  // R3
  eq('R3 radio literal', cuenta('x.vue', vue('<p/>', '.a { border-radius: 14px } .b { border-radius: 999px } .c { border-radius: var(--radius-card) } .d { border-radius: 50% }'), 'R3'), 2)
  eq('R3 rounded', cuenta('x.vue', vue('<p class="rounded-xl rounded-[10px] rounded-card rounded-full rounded-t-2xl"/>'), 'R3'), 3)
  // R4
  eq('R4 transition-all', cuenta('x.vue', vue('<p class="transition-all hover:transition-all"/>', '.a { transition: all .2s }'), 'R4'), 3)
  eq('R4 cubic-bezier', cuenta('x.vue', vue('<p/>', '.a { transition: transform .2s cubic-bezier(.2,.8,.2,1) }'), 'R4'), 1)
  eq('R4 ease-in vs ease-in-out', cuenta('x.vue', vue('<p/>', '.a { transition: opacity .2s ease-in } .b { transition: opacity .2s ease-in-out }'), 'R4'), 1)
  eq('R4 scale', cuenta('x.vue', vue('<p/>', '.a { transform: scale(0.5) } .b { transform: scale(0.97) }'), 'R4'), 1)
  eq('R4 hover sin guarda', cuenta('x.vue', vue('<p/>', '.a:hover { color: red }'), 'R4'), 1)
  eq('R4 hover con guarda', cuenta('x.vue', vue('<p/>', '@media (hover: hover) and (pointer: fine) { .a:hover { color: red } }'), 'R4'), 0)
  eq('R4 hover en reduced-motion no cuenta', cuenta('x.vue', vue('<p/>', '@media (prefers-reduced-motion: reduce) { .a:hover { transform: none } }'), 'R4'), 0)
  return fallos
}

/* ───────────────────────────── ejecución ───────────────────────────── */

function main() {
  const args = process.argv.slice(2)
  const flag = (n: string) => args.includes(n)
  const valor = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)

  const fallosAuto = autotest()
  if (fallosAuto.length) {
    console.log(fallosAuto.map((f) => `✘ ${f}`).join('\n'))
    process.exit(1)
  }

  if (flag('--lista') || flag('--archivo')) {
    const filtro = valor('--archivo')
    const rec = contar(filtro)
    const regla = flag('--lista') && args[args.indexOf('--lista') + 1]?.startsWith('R') ? args[args.indexOf('--lista') + 1] : null
    for (const h of rec.hallazgos) if (!regla || h.regla === regla) console.log(`${h.regla} ${h.archivo}:${h.linea}  ${h.texto}`)
    for (const [r, por] of Object.entries(rec.reglas)) if (!regla || r === regla) console.log(`# ${r}: ${Object.values(por).reduce((a, b) => a + b, 0)} en ${Object.keys(por).length} ficheros`)
    return
  }

  const rec = contar()
  const previa: Baseline | null = existsSync(RUTA_BASELINE) ? JSON.parse(readFileSync(RUTA_BASELINE, 'utf8')) : null
  const fallos: string[] = []
  const lineas = (r: string, f: string) => rec.hallazgos.filter((h) => h.regla === r && h.archivo === f).slice(0, 6).map((h) => `      L${h.linea}: ${h.texto}`).join('\n')

  if (flag('--actualizar')) {
    let sube = false
    if (previa) {
      for (const r of Object.keys(rec.reglas)) {
        if (!previa.reglas[r]) continue // regla nueva: se inicializa
        for (const f of Object.keys(rec.reglas[r])) {
          if ((rec.reglas[r][f] ?? 0) > (previa.reglas[r][f] ?? 0)) { sube = true; console.log(`✘ ${r} ${f}: ${previa.reglas[r][f] ?? 0} → ${rec.reglas[r][f]} (sube)\n${lineas(r, f)}`) }
        }
      }
      if (!flag('--subir-excepciones')) {
        for (const [f, n] of Object.entries(rec.excepciones)) if (n > (previa.excepciones[f] ?? 0)) { sube = true; console.log(`✘ excepciones ${f}: ${previa.excepciones[f] ?? 0} → ${n} (usa --subir-excepciones si de verdad hace falta)`) }
      }
    }
    if (sube) { console.log('\nLa baseline no se actualiza: solo puede bajar. Arregla lo nuevo o firma una excepción.'); process.exit(1) }
    escribirBaseline(rec, previa, flag('--subir-excepciones') || !previa)
    console.log('Baseline actualizada.')
  } else {
    if (!previa) { console.log('✘ No existe scripts/diseno-baseline.json. Créala con: pnpm test:diseno --actualizar'); process.exit(1) }
    for (const r of Object.keys(rec.reglas)) {
      if (!previa.reglas[r]) { fallos.push(`${r} no tiene baseline: pnpm test:diseno --actualizar`); continue }
      const archivos = new Set([...Object.keys(rec.reglas[r]), ...Object.keys(previa.reglas[r])])
      for (const f of [...archivos].sort()) {
        const a = rec.reglas[r][f] ?? 0, b = previa.reglas[r][f] ?? 0
        if (a > b) fallos.push(`${r} ${f}: ${b} → ${a} (SUBE: algo nuevo se aparta del sistema)\n${lineas(r, f)}`)
        else if (a < b) fallos.push(`${r} ${f}: ${b} → ${a} (BAJA: bien; regenera la baseline con pnpm test:diseno --actualizar)`)
      }
    }
    for (const [f, n] of Object.entries(rec.excepciones)) {
      const tope = previa.excepciones[f] ?? 0
      if (n > tope) fallos.push(`excepciones ${f}: ${n} ds-exc con tope ${tope}\n${(rec.motivos[f] ?? []).map((m) => `      ${m}`).join('\n')}`)
    }
  }

  const resumen = Object.entries(rec.reglas).map(([r, por]) => `${r} ${Object.values(por).reduce((a, b) => a + b, 0)} en ${Object.keys(por).length} ficheros`).join(' · ')
  const nExc = Object.values(rec.excepciones).reduce((a, b) => a + b, 0)
  if (fallos.length) {
    console.log(fallos.map((f) => `✘ ${f}`).join('\n'))
    console.log(`\n${fallos.length} fallo(s). ${resumen}`)
    process.exit(1)
  }
  console.log(`✔ test:diseno  ${resumen}${nExc ? ` · ${nExc} excepciones firmadas` : ''}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
