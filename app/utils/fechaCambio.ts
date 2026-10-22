// La fecha del pie («Última actualización»): el día del último cambio de la web.
//
// Por qué: el pie decía «junio de 2026» escrito a mano y nadie lo tocaba al publicar (seguía así el
// 22-oct-2026). Regla de Miriam: cada vez que la web cambia, el pie lo dice. La fecha sale del
// último commit en el build (nuxt.config.ts → runtimeConfig.public.ultimoCambio), así que cada
// despliegue la trae sola. Es una fecha absoluta: hornearla en el HTML es verdad hasta el
// siguiente cambio (al revés que el «hace N días», que caducaba al día siguiente).
//
// Hora de Madrid: un cambio a las 00:30 en España es del día de España, no del de UTC.
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
