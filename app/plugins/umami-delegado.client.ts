/**
 * Medición de Umami que mira el documento entero (rediseño F0, 23-oct-2026).
 *
 * Los eventos de siempre (Donar, Contacto, Pathway…) los emite cada enlace con su `trackX` de
 * useSupport.ts. Este plugin añade cuatro eventos nuevos SIN tocar enlace por enlace, porque los
 * dos huecos de la analítica (cuánto baja la gente y a dónde van de verdad los clics) no se
 * arreglan enlace por enlace, y porque así también miden los enlaces que añadan las fases
 * siguientes del rediseño:
 *
 *   Clic-gofundme · VerPeticion · Contacto-clic · Scroll   (qué manda cada uno: app/utils/umami.ts)
 *
 * Solo cliente. Sin cookies ni identificadores: Umami cuenta, de forma agregada, un clic y un
 * umbral alcanzado (25 · 50 · 75 · 100) por vista de página, nada más.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  // Nombre base de la ruta, sin el sufijo de idioma que añade i18n (`ciencia___es` → `ciencia`).
  const pagina = () => String(router.currentRoute.value.name ?? '').split('___')[0] || 'desconocida'

  // ── Clics ──
  // El manejador del enlace corre antes que este (el evento sube hasta el documento), así que
  // `trackSupport` ya dejó la etiqueta del botón cuando lo leemos. `auxclick`: el botón central
  // abre en pestaña nueva y no dispara `click`.
  const alClic = (e: MouseEvent) => {
    if (e.type === 'auxclick' && e.button !== 1) return
    const enlace = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!enlace) return
    const medido = clasificarClic(enlace.href, location.origin, pagina(), apoyoReciente())
    if (medido) trackUmami(medido.evento, medido.datos)
  }
  document.addEventListener('click', alClic)
  document.addEventListener('auxclick', alClic)

  // ── Scroll ──
  // Cada umbral se envía una vez por vista de página. Cambiar de página dentro del sitio es otra vista:
  // empieza de cero. Solo cuenta el scroll que mueve quien lee (ver scrollDeUsuario en utils/umami.ts):
  // los gestos se anotan aquí y el scroll programático del sitio, que también emite 'scroll', no suma.
  let enviados = new Set<number>()
  let ultimoGesto = 0
  let arrastrandoBarra = false
  let cuadro = 0
  const gesto = () => {
    ultimoGesto = performance.now()
  }
  const TECLAS_DE_SCROLL = new Set([' ', 'PageDown', 'PageUp', 'End', 'Home', 'ArrowDown', 'ArrowUp'])
  const opciones = { passive: true, capture: true } as const
  window.addEventListener('wheel', gesto, opciones)
  // Un toque sin arrastre (pulsar un enlace) no es scroll: solo el dedo que se ha movido, y su inercia al soltar.
  let dedoMovido = false
  window.addEventListener(
    'touchmove',
    () => {
      dedoMovido = true
      gesto()
    },
    opciones
  )
  window.addEventListener(
    'touchend',
    () => {
      if (dedoMovido) gesto()
      dedoMovido = false
    },
    opciones
  )
  window.addEventListener('touchcancel', () => (dedoMovido = false), opciones)
  window.addEventListener('keydown', (e) => TECLAS_DE_SCROLL.has(e.key) && gesto(), opciones)
  // Arrastrar la barra de scroll con el ratón: el puntero se apoya fuera del área de contenido.
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse' && e.clientX >= document.documentElement.clientWidth) {
        arrastrandoBarra = true
        gesto()
      }
    },
    opciones
  )
  const sueltaBarra = () => {
    if (arrastrandoBarra) gesto()
    arrastrandoBarra = false
  }
  window.addEventListener('pointerup', sueltaBarra, opciones)
  window.addEventListener('pointercancel', sueltaBarra, opciones)

  const medir = () => {
    cuadro = 0
    if (!scrollDeUsuario(performance.now(), ultimoGesto, arrastrandoBarra)) return
    const alto = document.documentElement.scrollHeight
    const pct = profundidadScroll(window.scrollY, window.innerHeight, alto)
    for (const umbral of umbralesNuevos(pct, enviados)) {
      enviados.add(umbral)
      trackUmami(EVENTO_SCROLL, { pct: umbral, pagina: pagina() })
    }
  }
  window.addEventListener(
    'scroll',
    () => {
      // Un scroll que ya es del usuario renueva su permiso mientras no pare: la tecla Fin o un salto de
      // página lanzan una animación de más de un segundo que, si no, perdería justo su tramo final.
      const ahora = performance.now()
      if (scrollDeUsuario(ahora, ultimoGesto, arrastrandoBarra)) ultimoGesto = ahora
      if (!cuadro) cuadro = requestAnimationFrame(medir)
    },
    { passive: true }
  )
  // Otra página: vista nueva. Los gestos de la anterior no valen para la que llega.
  nuxtApp.hook('page:start', () => {
    enviados = new Set()
    ultimoGesto = 0
    arrastrandoBarra = false
    if (cuadro) cancelAnimationFrame(cuadro)
    cuadro = 0
  })
})
