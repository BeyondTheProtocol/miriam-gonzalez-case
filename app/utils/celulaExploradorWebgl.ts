/**
 * ¿Hay WebGL? Sin él Vitessce deja una caja vacía sin avisar, así que el mapa lo comprueba antes de montarse.
 * Se guarda el «sí» para toda la página (Chrome limita los contextos vivos: repetida en cada remontaje del mapa, la prueba
 * acababa diciendo «sin WebGL» con WebGL, 18-oct). Un «no» se reintenta una vez tras una pausa corta antes de darlo por
 * bueno: tras muchas cargas en el mismo navegador, un contexto puede tardar en liberarse y la primera prueba fallar.
 */
let hay = false
function prueba(): boolean {
  try {
    const c = document.createElement('canvas')
    const g = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    g?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!g
  }
  catch { return false }
}
export async function hayWebGl(): Promise<boolean> {
  if (hay) return true
  hay = prueba()
  if (!hay) {
    await new Promise((r) => setTimeout(r, 400))
    hay = prueba()
  }
  return hay
}
