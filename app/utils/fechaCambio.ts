// Fechas de «Actualizado el …» (ActualizadoEl.vue): el día en lenguaje llano y su `datetime`.
//
// Historia: nació el 22-oct-2026 para la «Última actualización» del PIE, que decía el día del último commit del sitio
// entero (regla de Miriam: cada vez que cambia la web, el pie lo dice). El rediseño de arquitectura (F3, 23-oct-2026)
// quitó esa fecha global del pie —decía «actualizado» de páginas que no habían cambiado— y cada página dice la suya donde
// tiene una fecha fiable. `nuxt.config.ts` sigue calculando `runtimeConfig.public.ultimoCambio` (sin lector desde F3):
// si Miriam quiere el pie como estaba, basta con volver a leerlo en SiteFooter.vue; estas funciones son las mismas.
//
// Admite un instante ISO o solo un día (AAAA-MM-DD). Hora de Madrid: un cambio a las 00:30 en España es del día de
// España, no del de UTC. Un día suelto se lee como medianoche UTC, que en Madrid sigue siendo ese mismo día (va por delante).
export function formatearFechaCambio(iso: string | undefined, locale: string): string {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(+d)) return ''
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
  }).format(d)
}

// El `datetime` del <time>: solo el día (AAAA-MM-DD, hora de Madrid). La hora y la zona exactas del
// merge no le dicen nada a quien lee y no hace falta publicarlas (revisión de `diseno`, 22-oct).
export function diaCambio(iso: string | undefined): string {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(+d)) return ''
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Madrid',
  }).format(d)
}
