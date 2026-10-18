/**
 * ¿Hay WebGL? Se mira UNA vez por página y se guarda: sin él Vitessce deja una caja vacía sin avisar, así que el mapa lo
 * comprueba antes de montarse. Una vez por página porque Chrome limita los contextos vivos: repetida en cada remontaje del
 * mapa, la prueba acababa diciendo «sin WebGL» con WebGL (18-oct).
 */
let hay: boolean | null = null
export function hayWebGl(): boolean {
  if (hay !== null) return hay
  try {
    const c = document.createElement('canvas')
    const g = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    hay = !!g
    g?.getExtension('WEBGL_lose_context')?.loseContext()
  }
  catch { hay = false }
  return hay
}
