/**
 * Geometría del esquema del tumor de /ciencia (componente TumorEsquema, fase «esquema» de la tanda 3, 25-oct-2026).
 *
 * Funciones puras y deterministas: la misma entrada da el mismo dibujo, así el HTML estático y el cliente coinciden (nada de Math.random).
 * Aquí NO hay ni una palabra ni una cifra clínica: todo el texto de la figura vive en `esquemaTumor.*` del i18n y se cotejó contra los informes.
 * Los números de este fichero son coordenadas del dibujo; ni la célula, ni el número de puntos, ni su posición son datos (lo dice la nota de la figura).
 */

export type PuntoDibujo = { x: number; y: number }

/** Generador pseudoaleatorio con semilla (el de TwoFaces, que ya no existe). */
export function mulberry32(semilla: number): () => number {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Curva cerrada y suave (Catmull-Rom a Bézier) que pasa por todos los puntos. */
export function suavizaCerrado(pts: PuntoDibujo[]): string {
  const n = pts.length
  const P = (i: number) => pts[((i % n) + n) % n]!
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(P(0).x)} ${f(P(0).y)}`
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    d += ` C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)}, ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)}, ${f(p2.x)} ${f(p2.y)}`
  }
  return d + ' Z'
}

/** `n` puntos sobre una elipse, cada uno movido hasta ±`ruido` (relativo) de su radio: una membrana orgánica, no un óvalo de compás. */
export function puntosElipse(cx: number, cy: number, rx: number, ry: number, n: number, ruido: number, semilla: number): PuntoDibujo[] {
  const azar = mulberry32(semilla)
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = 1 + (azar() * 2 - 1) * ruido
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r }
  })
}

/** Espiral áurea dentro de una elipse (la fórmula de CelulaLesion): reparte `n` puntos sin que se encimen y sin azar. */
export function espiralEnElipse(n: number, cx: number, cy: number, rx: number, ry: number): PuntoDibujo[] {
  return Array.from({ length: n }, (_, i) => {
    const r = Math.sqrt((i + 0.6) / n)
    const a = i * 2.399963
    return { x: +(cx + Math.cos(a) * r * rx).toFixed(2), y: +(cy + Math.sin(a) * r * ry).toFixed(2) }
  })
}

/* ───────────── Panel B · una célula, de cerca (viewBox 0 0 320 232) ───────────── */

/** `alto` deja 40 unidades sobre la membrana para el receptor que asoma por arriba. */
export const CELULA = { ancho: 320, alto: 250, cx: 160, cy: 134, rx: 138, ry: 92, vertices: 20, ruido: 0.03, semilla: 99 }
/** Vértice de la membrana donde asoma el receptor: el de arriba (270°), así el glifo va derecho y se lee igual que en la leyenda. */
export const VERTICE_ARRIBA = 15
/** Núcleo: elipse concéntrica. Dentro van el receptor de estrógeno y las dos marcas de copias de más del ADN. */
export const NUCLEO = { cx: 160, cy: 134, rx: 62, ry: 50 }
/** Centros de los glifos de dentro del núcleo. */
export const EN_NUCLEO = {
  receptor: { x: 142, y: 124 },
  copias: [{ x: 176, y: 118 }, { x: 146, y: 152 }] as PuntoDibujo[],
}

export const membranaPuntos = (): PuntoDibujo[] => puntosElipse(CELULA.cx, CELULA.cy, CELULA.rx, CELULA.ry, CELULA.vertices, CELULA.ruido, CELULA.semilla)
export const membranaPath = (): string => suavizaCerrado(membranaPuntos())

/**
 * Dónde y cómo va el receptor de la membrana (el que esta célula no tiene): sobre el vértice nº `vertice` de la membrana, mirando hacia fuera
 * (la normal de la elipse en ese punto), con la base `hundido` unidades dentro. `escala` es el tamaño del glifo (su caja es de 24 unidades).
 * Devuelve el `transform` que se pone a un grupo, y la caja donde dibujar el glifo para que su base caiga en el origen.
 */
export function receptorDeMembrana(vertice: number, escala: number, hundido = 2): { transform: string; caja: { x: number; y: number; lado: number } } {
  const p = membranaPuntos()[vertice]!
  const a = (vertice / CELULA.vertices) * Math.PI * 2
  const nx0 = Math.cos(a) / CELULA.rx, ny0 = Math.sin(a) / CELULA.ry
  const norma = Math.hypot(nx0, ny0)
  const nx = nx0 / norma, ny = ny0 / norma
  const grados = (Math.atan2(nx, -ny) * 180) / Math.PI // el glifo «mira» hacia arriba: se gira para que mire hacia fuera
  const lado = 24 * escala
  return {
    transform: `translate(${(p.x - nx * hundido).toFixed(1)} ${(p.y - ny * hundido).toFixed(1)}) rotate(${grados.toFixed(1)})`,
    caja: { x: -12 * escala, y: -21 * escala, lado }, // la base del glifo (12, 21) cae en el origen
  }
}

/* ───────────── Panel C · en la sangre (viewBox 0 0 160 112) ───────────── */

export const SANGRE = { ancho: 160, alto: 112 }
/** Una gota con la punta arriba: dos tangentes que bajan a un arco ancho. */
export const GOTA_PATH = 'M80 6 C80 6 28 44 28 72 A52 38 0 0 0 132 72 C132 44 80 6 80 6 Z'
const GOTA_ELIPSE = { cx: 80, cy: 74, rx: 42, ry: 29 }
const FRAGMENTOS = 74
/** Posiciones (en la espiral) de los dos fragmentos con cambios; las demás son fragmentos normales. */
const CON_CAMBIO = [38, 42] // uno a cada lado de la gota, a 60 unidades uno de otro
/** Distancia mínima entre un fragmento con cambio y un punto normal, para que no se pisen. */
const AIRE = 11

export function gota(): { puntos: PuntoDibujo[]; arcos: PuntoDibujo[] } {
  const todos = espiralEnElipse(FRAGMENTOS, GOTA_ELIPSE.cx, GOTA_ELIPSE.cy, GOTA_ELIPSE.rx, GOTA_ELIPSE.ry)
  const arcos = CON_CAMBIO.map((i) => todos[i]!)
  const puntos = todos.filter((p, i) => !CON_CAMBIO.includes(i) && arcos.every((a) => Math.hypot(a.x - p.x, a.y - p.y) >= AIRE))
  return { puntos, arcos }
}

/* ───────────── Las cifras del desplegable ───────────── */

/**
 * Parte una fila de `esquemaTumor.cifras` para pintar su cabeza en negrita. La cabeza llega hasta el primer « · »; sin él, hasta el primer
 * « (»; sin él, es toda la frase. Cabeza + separador + resto vuelve a dar la fila EXACTA: aquí no se reescribe ni una letra del texto cotejado.
 */
export function partirCifra(fila: string): { cabeza: string; sep: string; resto: string } {
  const punto = fila.indexOf(' · ')
  if (punto > 0) return { cabeza: fila.slice(0, punto), sep: ' · ', resto: fila.slice(punto + 3) }
  const parentesis = fila.indexOf(' (')
  if (parentesis > 0) return { cabeza: fila.slice(0, parentesis), sep: ' ', resto: fila.slice(parentesis + 1) }
  return { cabeza: fila, sep: '', resto: '' }
}
