/**
 * Publica la altura REAL de la cabecera fija en `--cabecera-alto` (sistema v3, S3).
 *
 * La cabecera es pegajosa (`[data-cabecera-fija]` en el layout) y su alto no es fijo: 65 px en móvil, 73 desde 640 px,
 * y +38 px cuando está la barra «lo último». Con la altura exacta, main.css puede dejar `scroll-padding-top` para que
 * el elemento que recibe el foco con el teclado no quede tapado por la cabecera (WCAG 2.4.11). Sin JS (o antes de
 * hidratar) vale el valor por defecto de btp-tokens.css, que es el de la cabecera sola.
 *
 * Solo cliente, nada de red ni de almacenamiento. Se engancha a la cabecera en cada cambio de página por si el layout
 * la recrea.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const raiz = document.documentElement
  let observador: ResizeObserver | null = null

  const enganchar = () => {
    observador?.disconnect()
    observador = null
    const cabecera = document.querySelector('[data-cabecera-fija]')
    if (!cabecera || typeof ResizeObserver === 'undefined') {
      raiz.style.removeProperty('--cabecera-alto')
      return
    }
    observador = new ResizeObserver(() => {
      raiz.style.setProperty('--cabecera-alto', `${Math.ceil(cabecera.getBoundingClientRect().height)}px`)
    })
    observador.observe(cabecera)
  }

  nuxtApp.hook('app:mounted', enganchar)
  nuxtApp.hook('page:finish', enganchar)
})
