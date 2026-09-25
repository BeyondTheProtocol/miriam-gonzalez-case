/**
 * useAlVer — anima cuando el bloque entra en pantalla, una sola vez.
 *
 * Devuelve dos refs: `armado` (ya hay JS y se puede esconder el estado final para animarlo) y
 * `visto` (entró en pantalla: dispara la animación). Sin JS, o en el HTML estático, nada se
 * esconde: se ve el estado final. Con «movimiento reducido», `visto` llega a la vez que
 * `armado` y las animaciones CSS se anulan en cada componente.
 */
export function useAlVer(el: Ref<HTMLElement | null>, umbral = 0.3) {
  const armado = ref(false)
  const visto = ref(false)
  let io: IntersectionObserver | null = null
  let reserva: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    armado.value = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !el.value) { visto.value = true; return }
    io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) { visto.value = true; io?.disconnect() } }, { threshold: umbral })
    io.observe(el.value)
    // Red de seguridad: si el observador no llega a disparar (pestaña oculta, navegadores raros),
    // nunca se queda un gráfico en su estado inicial (p. ej. el globo en julio): a los 10 s, final.
    reserva = setTimeout(() => { visto.value = true; io?.disconnect() }, 10000)
  })
  onBeforeUnmount(() => { io?.disconnect(); clearTimeout(reserva) })
  return { armado, visto }
}

/** Interpola 0→1 con frenada, durante `ms`, llamando a `cb` en cada fotograma. */
export function tween(ms: number, cb: (f: number) => void) {
  // En una pestaña oculta requestAnimationFrame no corre: sin esto el gráfico se quedaría en su
  // estado inicial (el globo en julio). Oculta o con movimiento reducido: directo al final.
  if (document.visibilityState === 'hidden' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cb(1); return }
  const t0 = performance.now()
  const paso = (t: number) => {
    // la marca del fotograma puede ser ANTERIOR a t0: sin acotar, el globo bajaba de su valor de julio
    const f = Math.min(1, Math.max(0, (t - t0) / ms))
    cb(1 - Math.pow(1 - f, 3))
    if (f < 1) requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}
