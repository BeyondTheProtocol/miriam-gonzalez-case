/**
 * ¿Puede existir la barra de apoyo móvil (MobileSupportBar) en ESTA ruta?
 *
 * Fuente única de las rutas donde la barra está silenciada. La usan:
 * · MobileSupportBar, para no mostrarse nunca en ellas.
 * · El layout, para poner `has-support-bar` en <main> y reservar abajo la
 *   altura real de la barra SOLO donde puede aparecer (main.css).
 *
 * Depende de la RUTA y no de la visibilidad a propósito: la barra entra y sale
 * con el scroll, y atar el padding a eso haría saltar el layout. Por ruta, el
 * padding queda fijo desde el SSR. Todo por path, robusto entre locales.
 */
export function useSupportBarRoute() {
  const route = useRoute()

  const path = computed(() => route.path.replace(/\/+$/, '') || '/')

  // /marcas (· /en/brands) negocia colaboración, no donativo: el layout no monta
  // la barra.
  const isBrandsRoute = computed(
    () => path.value === '/marcas' || path.value === '/en/brands'
  )

  // SUB-página de Ciencia (lectura técnica de inmersión): /ciencia/evidencia y
  // /ciencia/[slug] en ES, /en/science/... en EN. El índice (/ciencia ·
  // /en/science) queda FUERA a propósito: tiene sus propios cierres de apoyo y
  // muchos llegan en modo simple, no son médicos.
  const isDeepScience = computed(() =>
    /^\/(?:en\/)?(?:ciencia|science)\/.+/.test(path.value)
  )

  // Herramientas clínicas de inmersión: el mapa de metástasis (esqueleto,
  // timeline, ficha lesión a lesión, visor 3D) y /lesiones (19-sep: con dos
  // visores 3D, la barra tapaba el pie de ambos en móvil). Un sticky coral
  // persiguiendo por encima resta credibilidad y tapa contenido; el header coral
  // global ya cubre la conversión. /datos igual (25-sep): bajo sus pestañas
  // sticky, los 99px de la barra tapaban al hacer scroll el final de las
  // analíticas y de las tarjetas de tejido. En EN es /en/data.
  const isDeepTool = computed(
    () =>
      /^\/(?:en\/)?(?:mapa-metastasis|lesiones)$/.test(path.value) ||
      /^\/(?:datos|en\/data)$/.test(path.value)
  )

  const isThanks = computed(() => route.path.includes('gracias'))

  const hasSupportBar = computed(
    () =>
      !isBrandsRoute.value &&
      !isThanks.value &&
      !isDeepScience.value &&
      !isDeepTool.value
  )

  return { isBrandsRoute, hasSupportBar }
}
