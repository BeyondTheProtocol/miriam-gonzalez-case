/**
 * Paleta del mapa del explorador, DERIVADA de los tokens (btp-tokens.css): ni un hex nuevo.
 * Una sola nota de acento: el violeta es el grupo de interés (o «los dos» en co-expresión). El resto
 * son tres pasos de luminosidad de la tinta sobre el fondo del tema, y «otras» queda como contexto.
 * Tres escalones no identifican ocho categorías: la identidad la dan las etiquetas sobre el mapa y la
 * leyenda de debajo, no el color (auditoría de `diseno`, 17-oct-2026).
 */
import type { Coexp } from '~/utils/celulaExplorador'

export type RGB = [number, number, number]
export interface Paleta { interes: RGB; ref: RGB[]; otras: RGB; coexp: Record<Coexp, RGB> }

const mezcla = (a: RGB, b: RGB, p: number): RGB => a.map((x, i) => Math.round(x * p + b[i]! * (1 - p))) as RGB

/** `leer(nombre)` devuelve el valor de una variable CSS «r g b» (p. ej. --color-text-rgb). */
export function paleta(tema: 'light' | 'dark', leer: (v: string) => string): Paleta {
  const rgb = (v: string) => leer(v).trim().split(/\s+/).map(Number) as RGB
  const osc = tema === 'dark'
  const tinta = rgb(osc ? '--color-bg-rgb' : '--color-text-rgb')
  const lienzo = rgb(osc ? '--color-text-rgb' : '--color-bg-rgb')
  const interes = rgb(osc ? '--color-miriam-claro-rgb' : '--color-miriam-rgb')
  const ref = [0.85, 0.62, 0.5].map((p) => mezcla(tinta, lienzo, p))
  const otras = mezcla(tinta, lienzo, 0.35)
  return { interes, ref, otras, coexp: { ambos: interes, solo_a: mezcla(interes, lienzo, 0.45), solo_b: ref[0]!, ninguno: otras } }
}

export const cssRgb = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`
