// Fuente única de los datos del caso que se repiten en varias páginas e idiomas.
// Centralizarlos evita que la edad, el nº de especialistas o de países se
// desincronicen al editar los textos i18n (auditoría · «fuente única de verdad»).
//
// Las cifras de recaudación (recaudado / objetivo / nº de donantes) NO van aquí:
// son dinámicas y se sirven en vivo desde /fundraiser.json (función de Netlify).
//
// Auto-importado por Nuxt desde app/utils — usable en cualquier <script>/template
// sin import. Para inyectarlo en textos i18n usar interpolación con nombre, p. ej.:
//   $t('hero.subtitle_lead', { age: caseData.currentAge })
//   $t('hero.stat_specialists_label', { countries: caseData.countries })
// Edad: sube sola cada 1 de enero, sin que nadie edite nada. Se calcula por AÑO a propósito:
// con la fecha exacta, el código (repo público) publicaría su cumpleaños, que no es público.
// Coste asumido: unos días al año, entre su cumpleaños y el 1 de enero, dice un año menos.
// En el HTML prerenderizado vale el año del build; en el navegador se recalcula al cargar.
const ANIO_NACIMIENTO_MAS_UNO = 1991

export const caseData = {
  /** Edad de Miriam (años), por año natural. */
  currentAge: new Date().getFullYear() - ANIO_NACIMIENTO_MAS_UNO,
  /** Nº de especialistas implicados (etiqueta «5+»). */
  specialists: '5+',
  /** Nº de países de la red de especialistas. */
  countries: 3,
} as const
