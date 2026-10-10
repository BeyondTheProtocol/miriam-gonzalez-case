import type { RouterConfig } from '@nuxt/schema'

/**
 * Reset de scroll fiable en cada cambio de ruta.
 * · Navegación normal → arriba del todo ({ top: 0 }); antes podías aterrizar
 *   a mitad de página o en el footer.
 * · Atrás/adelante → restaura la posición guardada (savedPosition).
 * · Enlaces con #hash → al elemento, con un offset por el header sticky.
 * El smooth lo gobierna la CSS `scroll-behavior` (gated por reduced-motion),
 * así que aquí no forzamos `behavior`.
 */
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // /datos: abrir, cerrar o mover «la película» (?peli=1&t=) solo cambia la query; la página no se mueve
    if (to.path === from.path && (to.query.peli === '1' || from.query.peli === '1')) return false
    if (to.hash) {
      return { el: to.hash, top: 80 }
    }
    return { top: 0 }
  },
}
