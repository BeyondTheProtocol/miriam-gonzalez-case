// Fuente de datos compartida de "lo último" (entrada más reciente de la
// cronología). Antes vivía duplicada solo dentro de SectionHero.vue; se
// extrae aquí para que la barra global (LatestUpdateBar.vue) reuse EXACTAMENTE
// la misma consulta y la misma clave de caché (`hero-latest-${locale}`), así
// Nuxt deduplica la petición cuando ambos componentes conviven en la misma
// página (el hero en el home + la barra en el layout).
export function useLatestUpdate() {
  const { locale, t } = useI18n()

  const { data: latest } = useAsyncData(
    `hero-latest-${locale.value}`,
    async () => {
      if (locale.value === 'en') {
        const en = await queryCollection('timeline_en').first()
        if (en?.entries?.length) return en.entries[en.entries.length - 1]
      }
      const es = await queryCollection('timeline_es').first()
      const entries = es?.entries ?? []
      return entries.length ? entries[entries.length - 1] : null
    },
    { watch: [locale] }
  )

  const ES_MONTHS: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
  }
  function parseTimelineDate(s?: string): Date | null {
    if (!s) return null
    const m = s.toLowerCase().match(/(\d{1,2})?\s*([a-zñ]{3,})\.?\s*(\d{4})/)
    if (m) {
      const mon = ES_MONTHS[(m[2] ?? '').slice(0, 3)]
      if (mon !== undefined) return new Date(Number(m[3]), mon, m[1] ? Number(m[1]) : 1)
    }
    const y = s.match(/^\s*(\d{4})\s*$/)
    if (y) return new Date(Number(y[1]), 0, 1)
    const d = new Date(s)
    return isNaN(+d) ? null : d
  }
  const latestAgo = computed(() => {
    const d = parseTimelineDate((latest.value as { date?: string } | null)?.date)
    if (!d) return null
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (days < 0) return null
    if (days === 0) return t('hero.updated_today')
    if (days === 1) return t('hero.updated_ago_one')
    return t('hero.updated_ago', { n: days })
  })

  return { latest, latestAgo }
}
