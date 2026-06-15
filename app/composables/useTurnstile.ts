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
      const res = await $fetch<{ success: boolean }>('/.netlify/functions/verify-turnstile', {
        method: 'POST',
        body: { token },
      })
      return Boolean(res.success)
    } catch {
      return false
    }
  }

  return { siteKey, enabled, verifyToken }
}