/**
 * datosCaso — tipos y ayudas del panel clínico público /datos.
 *
 * El dato llega YA validado desde Polaris (`tools/caso_publico.py` → app/data/caso.json):
 * cada cifra con su fuente y su sello, y las fechas de la cronología con su precisión.
 * Aquí solo se dibuja: ninguna cifra se calcula ni se redondea más allá de lo que se dice.
 */

export type Lang = 'es' | 'en'
export type Texto = string | { es: string; en?: string }

export interface Punto {
  f: string // fecha ISO
  v: number
  lo: number | null
  hi: number | null
  ref_de: 'informe' | 'banda'
  fuera: 'alto' | 'bajo' | 'fuera' | null
}
export interface Analito {
  key: string
  nombre: string
  unidad: string
  ref: { low: number; high: number } | null
  puntos: Punto[]
}
export interface Evento {
  id: string
  fecha_texto: string
  desde: string
  hasta: string
  precision: 'dia' | 'mes' | 'anio'
  etiqueta: string
  clase: string | null
  dibujar: boolean
  destacado: boolean
  titulo: { es: string; en?: string }
  enlace?: string | null
}

export const txtCaso = (v: Texto | null | undefined, lang: Lang): string => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return (lang === 'en' ? v.en : undefined) ?? v.es
}

/** Día → milisegundos UTC (sin zona: una fecha clínica no tiene hora). */
export const msFecha = (iso: string): number => {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, (m || 1) - 1, d || 1)
}

/** Fecha ISO parcial de fuente.json («2024», «2024-02», «2024-02-15») → [desde, hasta]. */
export const rangoParcial = (iso: string | null | undefined): [number, number] | null => {
  if (!iso) return null
  const p = String(iso).split('-').map(Number)
  if (p.length === 1) return [Date.UTC(p[0], 0, 1), Date.UTC(p[0], 11, 31)]
  if (p.length === 2) return [Date.UTC(p[0], p[1] - 1, 1), Date.UTC(p[0], p[1], 0)]
  const x = Date.UTC(p[0], p[1] - 1, p[2])
  return [x, x]
}

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fechaCorta = (iso: string, lang: Lang): string => {
  const [a, m, d] = iso.split('-').map(Number)
  const mes = (lang === 'en' ? MESES_EN : MESES_ES)[(m || 1) - 1]
  if (!d) return lang === 'en' ? `${mes} ${a}` : `${mes} ${a}`
  return lang === 'en' ? `${mes} ${d}, ${a}` : `${d} ${mes} ${a}`
}
export const mesCorto = (mes0: number, lang: Lang) => (lang === 'en' ? MESES_EN : MESES_ES)[mes0]

/** Número con coma decimal en español; sin inventar decimales. */
export const numCaso = (v: number, lang: Lang, dec?: number): string => {
  const s = dec == null ? String(v) : v.toFixed(dec)
  return lang === 'es' ? s.replace('.', ',') : s
}

/** Veces el límite superior normal del informe de ESE punto (null si no hay LSN). */
export const xlsn = (p: Punto): number | null => (p.hi && p.hi > 0 ? p.v / p.hi : null)

export const buscarAnalito = (grupos: Record<string, { analitos: Analito[] }>, key: string) => {
  for (const g of Object.values(grupos)) {
    const a = g.analitos.find((x) => x.key === key)
    if (a) return a
  }
  return null
}

/** Coordenada redondeada a centésimas: Node y el navegador no dan el mismo último decimal en
 *  log10, y esa diferencia rompía la hidratación del SVG (atributos distintos servidor/cliente). */
export const rc = (v: number) => Math.round(v * 100) / 100

/** Escala logarítmica acotada (×LSN). */
export const logEscala = (min: number, max: number, y0: number, y1: number) => {
  const l0 = Math.log10(min)
  const l1 = Math.log10(max)
  return (v: number) => rc(y0 + ((Math.log10(Math.min(Math.max(v, min), max)) - l0) / (l1 - l0)) * (y1 - y0))
}
export const linEscala = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  rc(r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0))

/** Marcadores por forma (la regla del sitio: el color nunca es la única señal). */
export type Forma = 'circulo' | 'cuadrado' | 'triangulo' | 'rombo' | 'aspa' | 'estrella'
export const pathForma = (forma: Forma, x0: number, y0: number, r0: number): string =>
  _pathForma(forma, rc(x0), rc(y0), rc(r0)).replace(/-?\d+\.\d{3,}/g, (m) => String(rc(Number(m))))
const _pathForma = (forma: Forma, x: number, y: number, r: number): string => {
  switch (forma) {
    case 'cuadrado':
      return `M${x - r},${y - r}h${2 * r}v${2 * r}h${-2 * r}Z`
    case 'triangulo':
      return `M${x},${y - r * 1.15}L${x + r * 1.1},${y + r * 0.8}L${x - r * 1.1},${y + r * 0.8}Z`
    case 'rombo':
      return `M${x},${y - r * 1.3}L${x + r * 1.1},${y}L${x},${y + r * 1.3}L${x - r * 1.1},${y}Z`
    case 'aspa':
      return `M${x - r},${y - r}L${x + r},${y + r}M${x + r},${y - r}L${x - r},${y + r}`
    case 'estrella': {
      let d = ''
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.5 : r * 1.25
        const a = (Math.PI / 5) * i - Math.PI / 2
        d += `${i ? 'L' : 'M'}${rc(x + rr * Math.cos(a))},${rc(y + rr * Math.sin(a))}`
      }
      return d + 'Z'
    }
    default:
      return `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`
  }
}
