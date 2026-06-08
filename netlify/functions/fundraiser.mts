import { getFundraiser } from '../../utils/fundraiser'
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
 */
const CDN = 'public, durable, s-maxage=900, stale-while-revalidate=86400, stale-if-error=86400'

export default async () => {
  try {
    const fundraiser = await getFundraiser()
    if (!fundraiser || typeof fundraiser.donationCount !== 'number') throw new Error('bad payload')
    return Response.json(fundraiser, {
      headers: {
        'Netlify-CDN-Cache-Control': CDN,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch {
    const seed = await readSeed<GoFundMeFundraiser>('fundraiser.json')
    if (seed) {
      return Response.json(seed, {
        headers: { 'Netlify-CDN-Cache-Control': 'public, s-maxage=120, stale-if-error=86400' },
      })
    }
    return new Response('fundraiser unavailable', { status: 502 })
  }
}
