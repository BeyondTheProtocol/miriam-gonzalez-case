/**
 * Medición de Umami, tercera parte: «Visor» { herramienta, accion } (T2d, 24-oct-2026). Qué es, para qué y qué cuenta como tocarlo:
 * app/utils/umamiVisor.ts. Aquí solo se enchufa al documento, como plugins/umami-delegado.client.ts hace con los clics y el scroll:
 * un oyente para toda la página que busca el contenedor con `data-visor`, así que cubre también los visores que se añadan después sin
 * tocar sus componentes.
 *
 * Solo cliente. Sin cookies ni identificadores: una vez por herramienta y por sesión del navegador, y nada más que el nombre de la
 * herramienta y la parte que se tocó primero.
 */
export default defineNuxtPlugin(() => {
  const alTocar = (e: PointerEvent | KeyboardEvent) => {
    const objetivo = e.target instanceof Element ? e.target : null
    const visor = objetivo?.closest<HTMLElement>('[data-visor]')
    if (!objetivo || !visor) return
    // Un clic o un toque con el botón principal; o una tecla de uso. Tabular o escribir no es tocar el visor.
    if (e instanceof KeyboardEvent ? !esTeclaDeUso(e.key) : !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    // Sobre algo con lo que se pueda hacer algo, y dentro del propio visor (no un ancestro con el mismo selector).
    const tocable = objetivo.closest<HTMLElement>(SELECTOR_TOCABLE)
    if (!tocable || !visor.contains(tocable)) return
    const herramienta = nombreDeVisor(visor.dataset.visor)
    if (!herramienta || !registrarVisor(herramienta)) return
    // La parte del visor, si el contenedor la declara; el atributo puede estar en un ancestro del objetivo dentro del visor.
    const parte = objetivo.closest<HTMLElement>('[data-visor-accion]')
    const accion = accionDeVisor(parte && visor.contains(parte) ? parte.dataset.visorAccion : null, tocable.tagName)
    // El script de Umami es `defer`: si aún no ha cargado, se espera unos segundos en vez de perder el aviso para siempre.
    enviarCuandoHaya(
      () => trackUmami(EVENTO_VISOR, { herramienta, accion }),
      () => !!(window as unknown as { umami?: unknown }).umami
    )
  }
  // `capture`: el visor puede parar la propagación de sus propios gestos (arrastrar un lienzo); aquí se ve igual.
  document.addEventListener('pointerdown', alTocar, { capture: true, passive: true })
  document.addEventListener('keydown', alTocar, { capture: true, passive: true })
})
