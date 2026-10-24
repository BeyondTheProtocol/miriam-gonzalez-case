/**
 * useUmamiVisto: manda un evento de Umami UNA vez por vista de página, cuando el bloque se ha visto.
 *
 * Es el denominador de los clics: «Hero-visto», «Campana-visible» y «Prensa-visible» (nombres y reglas en
 * utils/umamiVistas.ts). Solo mide; no toca lo que se ve ni lo que se anima, y sin cookies.
 *
 * - El bloque puede no existir al montar (la tarjeta de la campaña se pinta cuando llegan las cifras): se
 *   engancha cuando el ref pasa de null a un elemento, y se suelta si desaparece.
 * - Una vez por vista aunque haya varios bloques con el mismo evento (/colabora lleva dos tarjetas).
 * - Si el script de Umami (defer) aún no ha cargado, se espera unos segundos antes de rendirse: el hero se
 *   ve antes de que cargue, y sin esa espera ese aviso se perdería siempre.
 * - `extra` se evalúa al verse (no al montar): `conEuros` dice si en ese momento había cifra en euros.
 */
export function useUmamiVisto(
  el: Ref<HTMLElement | null>,
  evento: string,
  extra: () => DatosUmami = () => ({})
) {
  if (!import.meta.client) return
  const route = useRoute()
  let io: IntersectionObserver | null = null
  const soltar = () => {
    io?.disconnect()
    io = null
  }
  watch(
    el,
    (nodo) => {
      soltar()
      if (!nodo || typeof IntersectionObserver === 'undefined') return
      io = new IntersectionObserver(
        (entradas) => {
          const e = entradas[entradas.length - 1]
          if (!e || !esVisto(e.intersectionRect.height, e.boundingClientRect.height, window.innerHeight)) return
          soltar()
          if (!avisarUnaVezPorVista(evento)) return
          const datos: DatosUmami = { pagina: paginaBase(route.name), ...extra() }
          enviarCuandoHaya(
            () => trackUmami(evento, datos),
            () => !!(window as unknown as { umami?: unknown }).umami
          )
        },
        { threshold: UMBRALES_VISTO }
      )
      io.observe(nodo)
    },
    { flush: 'post', immediate: true }
  )
  onBeforeUnmount(soltar)
}
