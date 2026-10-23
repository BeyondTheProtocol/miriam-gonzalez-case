import type { LineaCaso } from '~/utils/datosCaso'
import { msFecha, tratamientoHoy } from '~/utils/datosCaso'
import type { PeticionFuente } from '~/utils/peticiones'
import { peticionesPublicas } from '~/utils/peticiones'

/**
 * Lo que la home lee de app/data/caso.json (rediseño F5, 23-oct-2026): las peticiones que ya son públicas
 * («Qué buscamos») y la línea «Ahora» (el tratamiento de hoy, calculado por el mismo `tratamientoHoy` que la
 * cifra «Tratamiento» de /datos). Nada de esto se escribe a mano en la home.
 *
 * Por qué un import DINÁMICO dentro de useAsyncData y no `import caso from '~/data/caso.json'` como en /datos: el JSON
 * pesa ~230 KB (las analíticas son casi todo) y un import estático lo metería en el JS de la home. Aquí solo viaja en el
 * payload lo que la home pinta (5 peticiones y una línea), y en el cliente el import no se ejecuta mientras el payload
 * traiga el dato (el prerender lo escribe; QueBuscamos ya avisa de lo mismo).
 *
 * `peticiones` va YA filtrado por la lista blanca de utils/peticiones.ts: la 6.ª y la 7.ª de `se_busca` (FoundationOne y
 * anemia) esperan su gate y no deben salir ni en el payload de la home.
 * `ahora` es null si no hay una línea sistémica en curso: sin dato, no hay línea (no se escribe a mano).
 */
export interface AhoraCaso {
  detalle: string
  fecha: string
  sello: string | null
}
export interface CasoHome {
  peticiones: PeticionFuente[]
  ahora: AhoraCaso | null
}

export function useCasoHome() {
  const { locale } = useI18n()
  return useAsyncData<CasoHome>(
    `home-caso-${locale.value}`,
    async () => {
      const caso = (await import('~/data/caso.json')).default as unknown as {
        generado: string
        lineas?: LineaCaso[]
        se_busca?: PeticionFuente[]
      }
      const lang = locale.value === 'en' ? 'en' : 'es'
      const hoy = tratamientoHoy(caso.lineas ?? [], msFecha(String(caso.generado).slice(0, 10)), lang)
      return {
        peticiones: peticionesPublicas(caso.se_busca ?? []),
        ahora: hoy.enCurso ? { detalle: hoy.detalle, fecha: hoy.fecha, sello: hoy.sello ?? null } : null,
      }
    },
    { watch: [locale] },
  )
}
