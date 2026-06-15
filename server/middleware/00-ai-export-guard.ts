import { createError, getHeader } from 'h3'
import { isAiExportBlocked, normalizeAiRoute } from '../../utils/aiExportBlocklist'

/**
 * Bloquea la exportación markdown/AI de rutas en la blocklist (p. ej.
 * /mapa-metastasis.md o negociación Accept: text/markdown).
 */
export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  const base = normalizeAiRoute(path)
  if (!isAiExportBlocked(base)) return

  if (path.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const accept = getHeader(event, 'accept') || ''
  if (accept.includes('text/markdown') && !accept.includes('text/html')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
})