import { estampar, getFundraiser } from '../../utils/fundraiser'
import type { GoFundMeFundraiser } from '../../utils/fundraiser'
import { readSeed } from '../../utils/seed'

/**
 * GET /fundraiser.json (vía redirect en netlify.toml).
 *
 * Total recaudado EN VIVO desde GoFundMe (una sola llamada GraphQL → rápida).
 * Se cachea en la CDN de Netlify ~15 min con stale-while-revalidate: el usuario
 * recibe siempre la copia cacheada al instante y la revalidación ocurre en
 * segundo plano, sin machacar a GoFundMe. `stale-if-error` mantiene la última
 * copia buena si GoFundMe falla. Fallback final: la semilla generada en build.
 *
 * La respuesta lleva `origen` («vivo» o «semilla») y `actualizado` (cuándo se trajo la cifra): la web enseña la fecha
 * cuando la cifra es de la semilla (rediseño T2b, 24-oct-2026).
 */
const CDN = 'public, durable, s-maxage=900, stale-while-revalidate=86400, stale-if-error=86400'

export default async () => {
  try {
    const fundraiser = await getFundraiser()
    if (!fundraiser || typeof fundraiser.donationCount !== 'number') throw new Error('bad payload')
    return Response.json(estampar(fundraiser, 'vivo'), {
      headers: {
        'Netlify-CDN-Cache-Control': CDN,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch {
    const seed = await readSeed<GoFundMeFundraiser>('fundraiser.json')
    if (seed) {
      // La copia de seguridad conserva SU fecha (la del build): decir `vivo` o ponerle la de ahora sería mentir sobre la cifra.
      return Response.json({ ...seed, origen: 'semilla' }, {
        headers: { 'Netlify-CDN-Cache-Control': 'public, s-maxage=120, stale-if-error=86400' },
      })
    }
    return new Response('fundraiser unavailable', { status: 502 })
  }
}
