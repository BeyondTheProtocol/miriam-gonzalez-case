/**
 * Paleta del mapa del explorador, DERIVADA de los tokens (btp-tokens.css), con UNA excepción acotada.
 * Una sola nota de acento: el violeta es el grupo de interés (o «los dos» en co-expresión). «Otras» queda como
 * contexto; el modo gen y la co-expresión salen de los pasos de luminosidad de la tinta y del violeta. Nada de eso cambia.
 * Excepción (Miriam, 19-oct-2026, sobre el canon «ni un hex nuevo»): los GRUPOS DE REFERENCIA del mapa («Por grupo»)
 * llevan siete tokens `--viz-cat-*` (claro y -osc), solo para datos NOMINALES de este mapa; nunca para niveles ni estados.
 * Reglas de esos colores (comités médico y diseño, 19-oct): sin rojo, verde ni amarillo (ni violeta, rosa o coral: son del
 * interés y de la acción); dos familias por matiz, fría (inmune) y tierra (estructural); croma OKLCH ≤ 0,07 (comité médico, 19-oct:
 * con deuteranopía y protanopía el violeta del interés se vuelve azul y una referencia más saturada lo alcanza; con
 * 0,07 el croma del interés es ≥ 2,5 veces el de cualquier referencia en claro y ≥ 2,0 en oscuro); ≥ 3:1 con el fondo
 * y por debajo del contraste del violeta; el mismo color por tipo celular en todas las biopsias (casilla por `g.id`).
 * «Otras» en oscuro es un gris NEUTRO (misma luminancia que la mezcla de tinta 0,24, croma ≈ 0): teñido de la tinta se leía como «interés diluido».
 * El color nunca es la única señal: las etiquetas sobre el mapa y la leyenda dan la identidad (auditoría de `diseno`, 17-oct).
 * Lo vigila scripts/test-celula-explorador.ts.
 */
import type { Coexp } from '~/utils/celulaExplorador'

export type RGB = [number, number, number]
export interface Paleta { interes: RGB; ref: RGB[]; refsPorId: (ids: string[]) => RGB[]; otras: RGB; coexp: Record<Coexp, RGB>; nivel: RGB[]; cero: RGB }

/** Casillas de la categórica nominal (`--viz-cat-<casilla>[-osc]-rgb`): la familia fría (inmune) y la de tierra (estructural). */
export const CASILLAS = ['frio-1', 'frio-2', 'frio-3', 'frio-4', 'tierra-1', 'tierra-2', 'tierra-3'] as const
export type Casilla = (typeof CASILLAS)[number]
/** Tipo celular (`g.id` del fichero) → casilla: mismo tipo, mismo color en el hígado y en el hueso. T, B y mastocito existen
 * como rótulo pero aún no en los datos: sin casilla propia toman una libre (el test avisa si un fichero real trae un tipo sin casilla). */
export const CASILLA_DE_TIPO: Record<string, Casilla> = {
  NK: 'frio-1', mieloide: 'frio-2', neutrofilo: 'frio-3', plasmatica: 'frio-4',
  hepatocito: 'tierra-1', endotelio: 'tierra-2', fibroblasto_estelar: 'tierra-3',
}

const mezcla = (a: RGB, b: RGB, p: number): RGB => a.map((x, i) => Math.round(x * p + b[i]! * (1 - p))) as RGB

/** Gris neutro (R=G=B) con la MISMA luminancia relativa que `c`: croma OKLCH ≈ 0 y el mismo contraste con el fondo. Se calcula
 * desde los tokens (ningún hex nuevo): en oscuro, «Otras» es el gris de la mezcla de tinta 0,24 (la mezcla en sí lleva el tinte del fondo). */
const gris = (c: RGB): RGB => {
  const lin = (v: number) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  const y = 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  const g = Math.round(255 * (y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055))
  return [g, g, g]
}

/** `leer(nombre)` devuelve el valor de una variable CSS «r g b» (p. ej. --color-text-rgb). */
export function paleta(tema: 'light' | 'dark', leer: (v: string) => string): Paleta {
  const rgb = (v: string) => leer(v).trim().split(/\s+/).map(Number) as RGB
  const osc = tema === 'dark'
  const tinta = rgb(osc ? '--color-bg-rgb' : '--color-text-rgb')
  const lienzo = rgb(osc ? '--color-text-rgb' : '--color-bg-rgb')
  const interes = rgb(osc ? '--color-miriam-claro-rgb' : '--color-miriam-rgb')
  const ref = [0.85, 0.62, 0.5].map((p) => mezcla(tinta, lienzo, p))
  // «Otras» en «Por grupo»: en oscuro, el GRIS neutro de la mezcla 0,24 (2,11:1 con el fondo, como el 2,12:1 del claro; croma 0:
  // la mezcla teñida, C 0,042 a 311°, quedaba en la familia del violeta y se leía como «interés diluido»). En claro, la mezcla 0,35
  // (C 0,015, ya neutra). El «Ninguno» de co-expresión conserva 0,35 en los dos temas: no se toca.
  const otras = osc ? gris(mezcla(tinta, lienzo, 0.24)) : mezcla(tinta, lienzo, 0.35)
  const ninguno = mezcla(tinta, lienzo, 0.35)
  const cat = Object.fromEntries(CASILLAS.map((c) => [c, rgb(`--viz-cat-${c}${osc ? '-osc' : ''}-rgb`)])) as Record<Casilla, RGB>
  /** Un color por tipo celular, alineado con `ids`: el suyo si tiene casilla; si no, una libre (primero las frías). */
  const refsPorId = (ids: string[]): RGB[] => {
    const usadas = new Set(ids.map((id) => CASILLA_DE_TIPO[id]).filter(Boolean))
    const libres = CASILLAS.filter((c) => !usadas.has(c))
    const reserva = libres.length ? libres : CASILLAS
    let k = 0
    return ids.map((id) => cat[CASILLA_DE_TIPO[id] ?? reserva[k++ % reserva.length]!])
  }
  // gen elegido (simulador, 18-oct): lo no detectado casi del color del fondo, como en Loupe; lo detectado, del violeta
  // claro al intenso en cuatro pasos (más nivel, más tinta)
  // diseño (18-oct, con los tokens): en oscuro el primer tramo tenía la misma luminosidad que «no detectado» (1,07:1).
  // Proporciones para ΔL* ≥ 8 entre pasos y el tercer tramo ≥ 3:1 con el fondo; lo vigila scripts/test-celula-explorador.ts
  const nivel = (osc ? [0.46, 0.63, 0.81, 1] : [0.4, 0.62, 0.82, 1]).map((p) => mezcla(interes, lienzo, p))
  const cero = mezcla(tinta, lienzo, osc ? 0.12 : 0.16)
  return { interes, ref, refsPorId, otras, coexp: { ambos: interes, solo_a: mezcla(interes, lienzo, 0.45), solo_b: ref[0]!, ninguno }, nivel, cero }
}

export const cssRgb = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`
