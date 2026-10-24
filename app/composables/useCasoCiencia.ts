import { leerCasoCiencia, type CasoCiencia } from '~/utils/casoCiencia'

/**
 * Lo que /ciencia lee de app/data/caso.json (tanda 2, T2c, 24-oct-2026): la ficha, el material, la fecha de actualización, las peticiones
 * y «en cuarta línea desde…». Nada de esto se escribe a mano en la página (ver utils/casoCiencia.ts).
 *
 * Mismo patrón que `useCasoHome`: import DINÁMICO dentro de useAsyncData, no `import caso from '~/data/caso.json'`. El JSON pesa
 * ~230 KB (las analíticas son casi todo) y un import estático lo metería en el JS de /ciencia; así solo viaja en el payload lo que
 * la página pinta, y en el cliente el import no se ejecuta mientras el payload traiga el dato.
 */
export function useCasoCiencia() {
  const { locale } = useI18n()
  return useAsyncData<CasoCiencia>(
    `ciencia-caso-${locale.value}`,
    async () => {
      const caso = (await import('~/data/caso.json')).default
      return leerCasoCiencia(caso, locale.value === 'en' ? 'en' : 'es')
    },
    { watch: [locale] },
  )
}
