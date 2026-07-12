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

  // Doble evento: «<Nombre>» = total (un solo número) y «<Nombre>: <botón>» =
  // desglose por ubicación sin custom properties (de pago en Plausible). Cada
  // nombre tiene su goal en el panel; el props se mantiene por si algún día se
  // activa el plan con propiedades.
  function fire(name: string, location: string) {
    if (!import.meta.client) return
    // $plausible lo inyecta @nuxtjs/plausible (solo en cliente).
    const plausible = nuxtApp.$plausible as
      | {
          trackEvent?: (
            name: string,
            opts?: { props?: Record<string, string> }
          ) => void
        }
      | undefined
    plausible?.trackEvent?.(name, { props: { location } })
    plausible?.trackEvent?.(`${name}: ${location}`)
  }

  function trackSupport(location: string) {
    fire('Apoyar', location)
    // Umami (convivencia con Plausible): «Donar» con el botón como propiedad.
    trackUmami('Donar', { location })
    // Marca para el aviso suave al volver de GoFundMe (DonationReturnPrompt).
    try {
      sessionStorage.setItem('hm_support_ts', String(Date.now()))
    } catch {
      /* sin sessionStorage */
    }
  }

  // P6 · mide quién elige LEER la ciencia (vs donar) para ver el reparto del
  // embudo más allá del clic del héroe. No toca el goal «Apoyar».
  function trackScience(location: string) {
    fire('VerCiencia', location)
    // Umami (convivencia con Plausible): mismo evento «VerCiencia», con el botón
    // como propiedad. Mismo patrón que «Donar» en trackSupport.
    trackUmami('VerCiencia', { location })
  }

  function trackPress(outlet: string) {
    trackUmami('Clic-prensa', { medio: outlet })
  }

  function trackContact(role: string) {
    trackUmami('Contacto', { rol: role })
  }

  function trackPathway(route: string) {
    trackUmami('Pathway', { ruta: route })
  }

  // Mide quién abre el mapa de metástasis y desde dónde (teaser de la home,
  // /ciencia, /links…). Mismo patrón que trackScience: un evento, el origen como
  // propiedad → se ve si el acceso «al primer vistazo» en la home convierte.
  function trackMapa(location: string) {
    fire('VerMapa', location)
    trackUmami('VerMapa', { location })
  }

  function trackShare(method: string, from?: string) {
    trackUmami('Compartir', {
      metodo: method,
      ...(from ? { desde: from } : {}),
    })
  }

  // Hub de enlaces (link-in-bio, /links): qué destino clica quien llega desde
  // la bio de Instagram/redes. Un único evento «Bio-link» con el destino como
  // propiedad (mismo patrón que «Clic-prensa»/«Contacto»: un goal, desglose por
  // prop) → en Umami se ve cuál convierte sin crear un evento por enlace.
  function trackBioLink(destination: string) {
    trackUmami('Bio-link', { destino: destination })
  }

  return {
    GOFUNDME_URL,
    trackSupport,
    trackScience,
    trackPress,
    trackContact,
    trackPathway,
    trackShare,
    trackBioLink,
    trackMapa,
  }
}
