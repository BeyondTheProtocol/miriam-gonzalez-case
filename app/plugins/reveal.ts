/**
 * Directiva v-reveal — despliegue suave al hacer scroll (mobile-first).
 *
 * Mejora progresiva y accesible:
 * · Solo actúa en cliente (el hook mounted no corre en SSR) → el HTML llega
 *   visible: sin JS o con buscadores, el contenido se ve siempre.
 * · Respeta prefers-reduced-motion: si se pide menos movimiento, no hace nada.
 * · Solo oculta lo que está BAJO el pliegue al montar; lo que ya se ve en
 *   pantalla no se toca (cero parpadeo en el contenido inicial).
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement) {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

      // Si ya está (casi) en pantalla, no lo ocultamos: se muestra tal cual.
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.9) return

      el.classList.add('reveal-init')
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add('reveal-in')
              io.disconnect()
              break
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
      )
      io.observe(el)
    },
  })
})
