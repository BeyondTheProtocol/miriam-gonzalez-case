/**
 * Rutas con datos clínicos sensibles o marcadas noindex que no deben exportarse
 * a llms.txt, llms-full.txt ni endpoints .md (auditoría de seguridad §1).
 */
export const AI_EXPORT_BLOCKLIST = [
  '/mapa-metastasis',
  '/en/mapa-metastasis',
] as const

export function normalizeAiRoute(route: string): string {
  let r = route.split('?')[0].replace(/\.md$/, '').replace(/\/$/, '') || '/'
  if (r === '/index') r = '/'
  return r
}

export function isAiExportBlocked(route: string): boolean {
  const normalized = normalizeAiRoute(route)
  return AI_EXPORT_BLOCKLIST.some(
    (blocked) => normalized === blocked || normalized.startsWith(`${blocked}/`)
  )
}