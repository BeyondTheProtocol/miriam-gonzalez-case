/**
 * useSonido — sonificación del CA 15-3 durante «Reproducir la evolución».
 *
 * Técnica: sonificación de datos (Highcharts Sonification; NASA Chandra, 2025). Aquí el tono
 * codifica la POSICIÓN RESPECTO AL LÍMITE NORMAL del informe de ese día, no el valor en bruto:
 * escala logarítmica de ×LSN (0,25× → grave, 16× → agudo). Dentro de rango suena una onda
 * suave (seno); fuera, una más brillante (triángulo). Cada progresión con fecha, un golpe grave.
 * Solo suena si la persona lo activa con un toque (los navegadores lo exigen, y así debe ser).
 * WebAudio nativo, sin librerías.
 */
export function useSonido() {
  let ctx: AudioContext | null = null
  const activo = ref(false)
  function alternar() {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    activo.value = !activo.value
  }
  function nota(freq: number, dur: number, tipo: OscillatorType, vol = 0.18) {
    if (!activo.value || !ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = tipo
    o.frequency.value = freq
    const t = ctx.currentTime
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + dur + 0.02)
  }
  /** Un valor: tono por veces el LSN (log), timbre por dentro/fuera de rango. */
  function valor(xLsn: number, fuera: boolean) {
    const f = Math.min(1, Math.max(0, (Math.log2(xLsn) + 2) / 6)) // 0,25× → 0 · 16× → 1
    nota(220 * Math.pow(4, f), 0.16, fuera ? 'triangle' : 'sine')
  }
  function progresion() { nota(82, 0.5, 'sine', 0.3) }
  onBeforeUnmount(() => { ctx?.close() })
  return { activo, alternar, valor, progresion }
}
