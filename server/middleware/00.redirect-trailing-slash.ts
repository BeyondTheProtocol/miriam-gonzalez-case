/**
 * P7 · Normaliza la barra final: 301 de cualquier ruta con `/` final a la
 * versión sin barra (excepto la raíz). Evita que Plausible/SEO cuenten
 * `/ciencia` y `/ciencia/` como dos páginas. Convención: sin barra final
 * (coincide con el canonical). Funciona en dev y en prod (SSR/Nitro).
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // No tocar: la raíz, rutas con extensión (assets), ni rutas internas de Nuxt.
  if (
    path === '/' ||
    !path.endsWith('/') ||
    path.includes('.') ||
    path.startsWith('/_') ||
    path.startsWith('/api/')
  ) {
    return
  }

  const target = path.replace(/\/+$/, '') + url.search
  return sendRedirect(event, target || '/', 301)
})
