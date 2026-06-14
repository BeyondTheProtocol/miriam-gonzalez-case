// Tracking de eventos de Umami (analytics). Seguro en SSR y si el script aún
// no ha cargado (defer): si `window.umami` no existe, no hace nada. Convive con
// Plausible (ver useSupport.ts) — cada acción puede disparar ambos.
export function trackUmami(event: string, data?: Record<string, string | number | boolean>) {
  if (!import.meta.client) return
  const w = window as unknown as {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
  w.umami?.track(event, data)
}
