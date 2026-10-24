/**
 * Los medios de la tira «Han contado su caso» de la home, leídos de content/<idioma>/press.yml (rediseño F5, 23-oct-2026;
 * ajustes de la home, 24-oct-2026). Antes eran siete enlaces escritos a mano en index.vue que se desincronizaban de la sala de
 * prensa; ahora la fuente es una: press.yml.
 *
 * La home enseña SOLO cuatro medios y en el orden que dice el campo `home: N` de cada pieza (1 primero), que no es el orden
 * curado de la sala de prensa. Los demás medios siguen en press.yml y en /prensa; un medio sin `home` no sale en la home.
 *
 * Un medio sale UNA vez, con el enlace de su pieza marcada. El nombre se limpia de paréntesis: en inglés la pieza marcada de
 * El País es su edición inglesa («El País (English)») y en la tira es el mismo medio que la columna en español.
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
      const enHome = (doc?.articles ?? [])
        .filter((a) => typeof a.home === 'number')
        .sort((a, b) => (a.home as number) - (b.home as number))
      const vistos = new Set<string>()
      const medios: MedioPrensa[] = []
      for (const a of enHome) {
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
