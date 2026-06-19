/**
 * Verificación Cloudflare Turnstile antes de enviar formularios Netlify.
 * Si no hay claves configuradas (dev local), devuelve success: true para no bloquear.
 */
export function useTurnstile() {
  const config = useRuntimeConfig()
  const siteKey = computed(() => String(config.public.turnstileSiteKey || ''))
  const enabled = computed(() => Boolean(siteKey.value))

  async function verifyToken(token: string): Promise<boolean> {
    if (!enabled.value) return true
    if (!token) return false
    try {
      // `ignoreResponseError`: leemos el cuerpo aunque el estado sea 4xx/5xx,
      // para distinguir un rechazo real del token (error: 'failed') de un fallo
      // de infraestructura (not_configured / verify_error).
      const res = await $fetch<{ success?: boolean; error?: string }>(
        '/.netlify/functions/verify-turnstile',
        { method: 'POST', body: { token }, ignoreResponseError: true }
      )
      if (res?.success) return true
      // Fail-open ante problemas de infraestructura del captcha (no configurado
      // o caído): nunca bloqueamos un contacto legítimo por un fallo ajeno al
      // usuario. Netlify Forms mantiene honeypot + antispam como red de seguridad.
      // Solo bloqueamos cuando Cloudflare RECHAZA el token de verdad.
      return res?.error !== 'failed'
    } catch {
      // No se pudo ni llamar a la función de verificación → fail-open por lo mismo.
      return true
    }
  }

  return { siteKey, enabled, verifyToken }
}