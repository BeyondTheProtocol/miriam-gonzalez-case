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
    // Doble evento: «Apoyar» = total de conversiones (un solo número), y
    // «Apoyar: <botón>» = desglose por ubicación sin custom properties (de
    // pago en Plausible). Cada nombre tiene su goal en el panel. El props se
    // mantiene por si algún día se activa el plan con propiedades.
    plausible?.trackEvent?.('Apoyar', { props: { location } })
    plausible?.trackEvent?.(`Apoyar: ${location}`)
    // Marca para el aviso suave al volver de GoFundMe (DonationReturnPrompt).
    try {
      sessionStorage.setItem('hm_support_ts', String(Date.now()))
    } catch {
      /* sin sessionStorage */
    }
  }

  return { GOFUNDME_URL, trackSupport }
}
