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

/**
 * useQuieto — misma forma que useAlVer, pero el bloque se ve directamente en su estado final:
 * ni se esconde (`armado`) ni se anima al entrar (`visto`). Para los datos que se LEEN en /datos
 * (Miriam + diseno, 26-sep-2026, skill `movimiento-movil`): un gráfico se anima si lo pide quien
 * mira (reproducir), no porque entra en pantalla. La vitrina («otra vista») sigue con useAlVer.
 */
export function useQuieto(_el?: Ref<HTMLElement | null>, _umbral?: number) {
  return { armado: ref(false), visto: ref(false) }
}

/**
 * useEntradaViva — los gráficos de /datos se dibujan al entrar en pantalla, pero SOLO la primera
 * vez que alguien abre la página en esa sesión (Miriam, 10-oct-2026: «quiero que sea dinámico para
 * la gente que entra»; comité `diseno`: primera visita sí, el resto quieto). Matiza la decisión del
 * 26-sep (`useQuieto`), no la deroga: al volver a la página, al recargar, al cambiar de pestaña de
 * analíticas, con la pestaña oculta o con «movimiento reducido», todo se ve en su estado final.
 *
 * Qué NO pasa por aquí: las cuatro cifras de «Hoy» (se leen de un vistazo, siguen con useQuieto) y
 * cualquier número: lo que se anima es el trazo, nunca la cifra.
 *
 * La marca de «ya la vio» se escribe cuando arranca la primera animación, no antes: una recarga a
 * medio cargar no deja a nadie sin su entrada ni gráficos a medio hacer. Los gráficos montados
 * antes de esa marca conservan su entrada aunque se vean más abajo. Si sessionStorage falla, quieto.
 */
const CLAVE_VISTA = 'datos-entrada-vista'
let enCola = 0
export function useEntradaViva(el: Ref<HTMLElement | null>, umbral = 0.3, activa: () => boolean = () => true) {
  const armado = ref(false)
  const visto = ref(false)
  let io: IntersectionObserver | null = null
  let reserva: ReturnType<typeof setTimeout> | undefined
  let turno: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    let primera = false
    try { primera = sessionStorage.getItem(CLAVE_VISTA) == null } catch { primera = false }
    if (!primera || !activa() || !el.value || document.visibilityState === 'hidden'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    armado.value = true
    const entra = () => {
      io?.disconnect(); clearTimeout(reserva)
      // varios gráficos que entran a la vez arrancan escalonados, 60 ms entre uno y otro
      turno = setTimeout(() => {
        visto.value = true
        try { sessionStorage.setItem(CLAVE_VISTA, '1') } catch { /* sin almacenamiento: nada que recordar */ }
      }, 60 * enCola++)
      setTimeout(() => { enCola = 0 }, 400)
    }
    io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) entra() }, { threshold: umbral })
    io.observe(el.value)
    // red de seguridad corta: un dato escondido que nadie consigue ver es peor que uno sin entrada
    reserva = setTimeout(entra, 3000)
  })
  onBeforeUnmount(() => { io?.disconnect(); clearTimeout(reserva); clearTimeout(turno) })
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

/**
 * Arranca algo UNA vez, cuando el elemento se acerca a la pantalla.
 *
 * Los visores 3D pausaban el render fuera de pantalla, pero descargaban sus mallas al montarse:
 * abrir /lesiones en el móvil bajaba ~6,4 MB de PLY (mama + hígado) aunque solo se viera la
 * cabecera (auditoría del comité de diseño, 27-sep-2026). Con esto cada visor pide sus mallas
 * cuando le faltan `margen` px (150) para entrar en pantalla. Con 600 el hígado ya contaba como «cerca»
 * al abrir la página en un móvil de 812 px (medido en Chrome headless) y no se ahorraba nada.
 * Sin IntersectionObserver (navegador viejo), arranca en el acto: nunca se queda sin cargar.
 */
export function cargaCercana(el: Element, arranca: () => void, margen = '150px'): () => void {
  if (typeof IntersectionObserver === 'undefined') { arranca(); return () => {} }
  let hecho = false
  const io = new IntersectionObserver((entradas) => {
    if (hecho || !entradas.some((e) => e.isIntersecting)) return
    hecho = true
    io.disconnect()
    arranca()
  }, { rootMargin: `${margen} 0px` })
  io.observe(el)
  return () => io.disconnect()
}

/**
 * La rueda del ratón hace scroll de la PÁGINA, no zoom del visor; para acercar, Ctrl o ⌘ + rueda
 * (el pellizco del trackpad ya llega con Ctrl). Es el patrón de los mapas embebidos.
 *
 * Por qué: OrbitControls se quedaba con toda rueda que pasara por encima del visor, y quien bajaba
 * por /lesiones con el trackpad se quedaba «pegado» en cada visor (auditoría del comité de diseño,
 * 27-sep-2026, verificado en vivo). El listener va en CAPTURA sobre el contenedor: la rueda sin
 * modificador no llega al canvas (OrbitControls no la ve y la página baja) y se enseña un aviso
 * breve de cómo acercar. El táctil no pasa por aquí: el pellizco son eventos de puntero.
 */
export function ruedaConModificador(host: HTMLElement, aviso: () => string): () => void {
  let tapa: HTMLDivElement | null = null
  let t: ReturnType<typeof setTimeout> | undefined
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return
    e.stopPropagation()
    if (!tapa) {
      tapa = document.createElement('div')
      tapa.setAttribute('aria-hidden', 'true')
      tapa.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'
        + 'pointer-events:none;padding:6px 12px;border-radius:9999px;font:600 12px/1.3 system-ui,sans-serif;'
        + 'color:#f5efe6;background:rgba(18,11,26,0.82);transition:opacity .25s;opacity:0;white-space:nowrap;z-index:5'
      host.appendChild(tapa)
    }
    tapa.textContent = aviso()
    tapa.style.opacity = '1'
    clearTimeout(t)
    t = setTimeout(() => { if (tapa) tapa.style.opacity = '0' }, 1200)
  }
  host.addEventListener('wheel', onWheel, { capture: true, passive: true })
  return () => { host.removeEventListener('wheel', onWheel, { capture: true }); clearTimeout(t); tapa?.remove() }
}
