import type { RouterConfig } from '@nuxt/schema'
import { START_LOCATION, type LocationQuery } from 'vue-router'

/**
 * Reset de scroll fiable en cada cambio de ruta.
 * · Navegación normal → arriba del todo ({ top: 0 }); antes podías aterrizar
 *   a mitad de página o en el footer.
 * · Atrás/adelante → restaura la posición guardada (savedPosition).
 * · Enlaces con #hash → al elemento, justo bajo la cabecera pegajosa. El hueco se MIDE:
 *   era un 80 fijo, de cuando la cabecera era solo el nav; al montarse encima la barra
 *   «lo último» (26-sep-2026) el destino quedaba con su primera línea tapada.
 *   Si el #hash está en OTRA página, se espera a que esa página esté pintada: devolver
 *   el elemento antes dejaba el scroll arriba (el ancla aún no existía en el DOM), y por
 *   eso «Lo último» del hero no aterrizaba en su hito.
 * El smooth lo gobierna la CSS `scroll-behavior` (gated por reduced-motion),
 * así que aquí no forzamos `behavior`.
 */
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // /celula-a-celula/explorar: abrir un gen o cambiar de biopsia (?gen=&biopsia=) solo cambia la query; la página no
    // se mueve, tampoco con Atrás (el explorador cambia de estado en su sitio)
    if (to.path === from.path && to.hash === from.hash && soloCambia(to.query, from.query, ['gen', 'biopsia'])) return false
    if (savedPosition) return savedPosition
    // /datos: abrir, cerrar o mover «la película» (?peli=1&t=) solo cambia la query; la página no se mueve
    if (to.path === from.path && (to.query.peli === '1' || from.query.peli === '1')) return false
    if (to.hash) {
      const alAncla = () => ({ el: to.hash, top: bajoLaCabecera() })
      if (from === START_LOCATION || to.path === from.path) return alAncla()
      // Mismo gancho que usa el scrollBehavior de serie de Nuxt.
      const nuxtApp = useNuxtApp()
      return new Promise((resolve) => {
        nuxtApp.hooks.hookOnce('page:loading:end', () => {
          requestAnimationFrame(() => resolve(alAncla()))
        })
      })
    }
    return { top: 0 }
  },
}

// ¿Las claves de la query que cambian están todas en `claves` (y cambia alguna)?
function soloCambia(a: LocationQuery, b: LocationQuery, claves: string[]): boolean {
  const distintas = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
  return distintas.length > 0 && distintas.every((k) => claves.includes(k))
}

// Alto real de la cabecera pegajosa (barra «lo último» + nav, ver layouts/default.vue) más
// un respiro. 80 de reserva si no está (p. ej. en la página de error, que no usa el layout).
function bajoLaCabecera(): number {
  const cabecera = document.querySelector<HTMLElement>('[data-cabecera-fija]')
  return cabecera ? cabecera.offsetHeight + 16 : 80
}
