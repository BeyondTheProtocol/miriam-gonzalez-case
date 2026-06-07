/**
 * Medición de conversión (plan §D.5).
 * Dispara el goal de Plausible `Apoyar` en cada clic de un CTA de apoyo/donar,
 * con `props.location` para saber QUÉ botón convierte (home_hero, cabecera,
 * barra_movil, colabora…). Sin esto, cada donante exitoso solo cuenta como
 * una "salida" hacia GoFundMe y no se distingue de un rebote.
 *
 * Un único nombre de goal (`Apoyar`) para todo el sitio → se marca una vez en
 * Plausible y el desglose por botón vive en la propiedad `location`.
 */
export const GOFUNDME_URL = 'https://gofund.me/3e25cae99'

export function useSupport() {
  const nuxtApp = useNuxtApp()

  function trackSupport(location: string) {
    if (!import.meta.client) return
    // $plausible lo inyecta @nuxtjs/plausible (solo en cliente).
    const plausible = nuxtApp.$plausible as
      | { trackEvent?: (name: string, opts?: { props?: Record<string, string> }) => void }
      | undefined
    plausible?.trackEvent?.('Apoyar', { props: { location } })
  }

  return { GOFUNDME_URL, trackSupport }
}
