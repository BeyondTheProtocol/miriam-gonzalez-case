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
export const caseData = {
  /** Edad de Miriam (años). */
  currentAge: 35,
  /** Nº de especialistas implicados (etiqueta «5+»). */
  specialists: '5+',
  /** Nº de países de la red de especialistas. */
  countries: 3,
} as const
