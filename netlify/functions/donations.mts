import { getFundraiser, getDonationsFast } from '../../utils/fundraiser'
import type { PublicDonation } from '../../utils/fundraiser'
import { readSeed } from '../../utils/seed'

/**
 * GET /donations.json (vía redirect en netlify.toml).
 *
 * Lista pública de donantes EN VIVO (las estrellas del mapa + la tabla). Se baja
 * en paralelo, acotada por el nº total de donaciones, para entrar en el límite de
 * tiempo de la función. Se cachea en la CDN ~1 h con stale-while-revalidate: tras
 * la primera carga el usuario recibe siempre la copia cacheada al instante y la
 * revalidación es en segundo plano. Fallback: la semilla generada en build.
 */
const CDN = 'public, durable, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400'

export default async () => {
  try {
    let total: number | undefined
    try {
      total = (await getFundraiser())?.donationCount
    } catch {
      /* sin total → getDonationsFast cae al barrido secuencial */
    }
    const donations = await getDonationsFast(total)
    if (donations.length === 0) throw new Error('empty feed')
    return Response.json(donations, {
      headers: {
        'Netlify-CDN-Cache-Control': CDN,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch {
    const seed = await readSeed<PublicDonation[]>('donations.json')
    if (seed) {
      return Response.json(seed, {
        headers: { 'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-if-error=86400' },
      })
    }
    return new Response('donations unavailable', { status: 502 })
  }
}
