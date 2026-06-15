import { getFundraiser, getDonationsFast } from '../../utils/fundraiser'
import type { PublicDonation } from '../../utils/fundraiser'
import { sanitizeDonations } from '../../utils/donationsPublic'
import { readSeed } from '../../utils/seed'

/**
 * GET /donations.json (vía redirect en netlify.toml).
 *
 * Lista pública de donantes para el muro de gracias. Respuesta endurecida:
 * nombres enmascarados, IDs opacos, fechas sin hora, cabeceras anti-indexación
 * y comprobación de origen (solo helpmiriam.com y dev local).
 */
const CDN = 'public, durable, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400'
const MAX_PUBLIC_ITEMS = 500

const ALLOWED_ORIGINS = [
  'https://helpmiriam.com',
  'https://www.helpmiriam.com',
  'http://localhost:3000',
  'http://localhost:8888',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8888',
]

function isAllowedRequest(req: Request): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  if (!origin && !referer) return true
  if (origin && ALLOWED_ORIGINS.includes(origin)) return true
  if (referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o))) return true
  return false
}

function securityHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://helpmiriam.com'
  return {
    'Netlify-CDN-Cache-Control': CDN,
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
  }
}

function forbidden(req: Request) {
  return new Response('Forbidden', { status: 403, headers: securityHeaders(req) })
}

export default async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!isAllowedRequest(req)) {
    return forbidden(req)
  }

  try {
    let total: number | undefined
    try {
      total = (await getFundraiser())?.donationCount
    } catch {
      /* sin total → getDonationsFast cae al barrido secuencial */
    }
    const donations = await getDonationsFast(total, MAX_PUBLIC_ITEMS)
    if (donations.length === 0) throw new Error('empty feed')
    const safe = sanitizeDonations(donations)
    return Response.json(safe, { headers: securityHeaders(req) })
  } catch {
    const seed = await readSeed<PublicDonation[]>('donations.json')
    if (seed) {
      const safe = sanitizeDonations(seed.slice(0, MAX_PUBLIC_ITEMS))
      return Response.json(safe, {
        headers: {
          ...securityHeaders(req),
          'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-if-error=86400',
        },
      })
    }
    return new Response('donations unavailable', { status: 502 })
  }
}