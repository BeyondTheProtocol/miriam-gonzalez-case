import type { GoFundMeFundraiser } from '../../utils/fundraiser'

/**
 * Solo los campos que la web usa. Una semilla vieja o una copia de la CDN anterior a T2b todavía puede traer `goalAmount`: aquí se
 * descarta, para que el objetivo no llegue al payload de Nuxt ni al estado del cliente (decisión de Miriam, 24-oct-2026).
 */
function soloCifras(v: GoFundMeFundraiser, origen: 'vivo' | 'semilla', actualizado?: string): GoFundMeFundraiser {
  return { currentAmount: v.currentAmount, donationCount: v.donationCount, donationsEnabled: v.donationsEnabled, origen, actualizado }
}

/**
 * Total de la campaña de GoFundMe, para pintarlo YA en el HTML prerenderizado y refrescarlo en vivo.
 *
 * Antes la tarjeta (GoFundMeProgress) se cargaba en `onMounted`: buscadores, lectores de IA y quien
 * llegaba sin JS veían un bloque «Estado de la campaña» vacío (rediseño F0, 23-oct-2026). Ahora hay
 * dos cifras y se enseña la más fresca:
 * · `sembrada`: la del build. En el prerender se lee de `seed/fundraiser.json`, la semilla que
 *   `pnpm update-fundraiser` escribe antes de `nuxt generate`; viaja en el payload y llega ya
 *   hidratada. NO se pide `/fundraiser.json`: es un redirect a la función de Netlify y en el
 *   prerender no existe. Sin semilla (p. ej. `nuxt generate` a secas en el CI) el HTML sale sin tarjeta,
 *   como antes, y la rellena el cliente.
 * · `viva`: la de `/fundraiser.json` (la función viva, cacheada en la CDN), una vez por vista de página
 *   y ya hidratada la app. Se queda guardada mientras dure la sesión: al volver a una página con la
 *   tarjeta se enseña la última viva y no la del build mientras llega la nueva. Si la petición falla,
 *   nada cambia: una cifra horneada vale más que un bloque en blanco.
 *
 * Una sola clave para toda la página: el hero de la home y la tarjeta comparten una petición.
 *
 * Cada cifra lleva `origen` y `actualizado` (rediseño T2b, 24-oct-2026; los pone `estampar`, utils/fundraiser.ts):
 * · La sembrada es SIEMPRE `semilla`, con la fecha en que se escribió el fichero. Si el fichero es de antes de este cambio y no
 *   la trae, se usa la de modificación del fichero; si ni eso se puede leer, no se enseña fecha (nunca una inventada).
 * · La que llega de `/fundraiser.json` es `vivo`, salvo que la función diga `semilla` (GoFundMe no respondió y contestó con su
 *   copia de seguridad). Una respuesta sin `origen` (una copia vieja de la CDN, anterior a este cambio) se toma por `vivo`: la
 *   pidió esta misma visita.
 * La web enseña la fecha solo cuando la cifra es `semilla`: ver GoFundMeProgress y SectionHero.
 *
 * Por qué no `useAsyncData` (la primera versión lo usaba), medido en el build con el fetch
 * interceptado el 23-oct-2026: su `refresh()` dentro de `onMounted` devuelve el payload sin pedir
 * nada mientras la app hidrata, y al navegar a una ruta prerenderizada Nuxt vuelve a escribir en la
 * misma clave la cifra de ese payload (la del build) por encima de la viva. Ambas dejaban la cifra del
 * build para siempre y ningún test lo veía mientras el servidor del arnés no tuviera /fundraiser.json.
 * Además, un `onMounted` registrado tras un `await` se pierde en silencio: aquí el único hook
 * (`onNuxtReady`) se registra antes de cualquier `await`.
 *
 * Uso, con `await` en el nivel superior de `<script setup>`:  const data = await useFundraiser()
 */
let vivaEnEstaVista = false // ¿ya se trajo la viva en ESTA vista de página? (solo cliente)
let enVuelo: Promise<void> | null = null // la petición en curso, compartida entre quienes la piden
let reinicioRegistrado = false

export async function useFundraiser() {
  const sembrada = useState<GoFundMeFundraiser | null>('fundraiser-build', () => null)
  const viva = useState<GoFundMeFundraiser | null>('fundraiser-viva', () => null)

  if (import.meta.client) {
    if (!reinicioRegistrado) {
      reinicioRegistrado = true
      useNuxtApp().hook('page:start', () => {
        vivaEnEstaVista = false
      })
    }
    // `onNuxtReady` y no `onMounted`: durante la hidratación aún no es seguro pedir (ver arriba).
    onNuxtReady(() => {
      if (vivaEnEstaVista) return
      enVuelo ??= $fetch<GoFundMeFundraiser>('/fundraiser.json')
        .then((v) => {
          viva.value = soloCifras(v, v.origen ?? 'vivo', v.actualizado)
          vivaEnEstaVista = true
        })
        .catch(() => {
          /* se conserva lo que ya había */
        })
        .finally(() => {
          enVuelo = null
        })
    })
  }

  if (import.meta.server && !sembrada.value) {
    try {
      const { readFile, stat } = await import('node:fs/promises')
      const semilla = JSON.parse(await readFile('seed/fundraiser.json', 'utf-8')) as GoFundMeFundraiser
      const actualizado = semilla.actualizado ?? (await stat('seed/fundraiser.json').then((f) => f.mtime.toISOString()).catch(() => undefined))
      sembrada.value = soloCifras(semilla, 'semilla', actualizado)
    } catch {
      /* sin semilla: el HTML sale sin tarjeta */
    }
  }

  return computed(() => viva.value ?? sembrada.value)
}
