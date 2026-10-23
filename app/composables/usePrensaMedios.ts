/**
 * Los medios de la tira «Caso en prensa» de la home, leídos de content/<idioma>/press.yml (rediseño F5, 23-oct-2026).
 * Antes eran siete enlaces escritos a mano en index.vue que se desincronizaban de la sala de prensa; ahora la fuente es
 * una: el orden curado de press.yml (el más importante primero).
 *
 * Un medio sale UNA vez, con el enlace de su primera pieza. El nombre se limpia de paréntesis: en inglés la primera pieza
 * de El País es su edición inglesa («El País (English)») y la segunda es una columna de El País en español; en la tira son
 * el mismo medio y gana el primer enlace (la edición que lee ese idioma).
 */
export interface MedioPrensa {
  medio: string
  url: string
}

export function usePrensaMedios() {
  const { locale } = useI18n()
  return useAsyncData<MedioPrensa[]>(
    `home-prensa-${locale.value}`,
    async () => {
      const col = locale.value === 'en' ? 'press_en' : 'press_es'
      const doc = await queryCollection(col).first()
      const vistos = new Set<string>()
      const medios: MedioPrensa[] = []
      for (const a of doc?.articles ?? []) {
        const medio = a.outlet.replace(/\s*\([^)]*\)\s*$/, '').trim()
        if (!medio || !a.url || vistos.has(medio)) continue
        vistos.add(medio)
        medios.push({ medio, url: a.url })
      }
      return medios
    },
    { watch: [locale] },
  )
}
