/**
 * POST /.netlify/functions/verify-turnstile
 * Verifica un token de Cloudflare Turnstile antes de enviar formularios Netlify.
 * Requiere TURNSTILE_SECRET_KEY en variables de entorno de Netlify.
 */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders(req) })
  }

  const secret = Netlify.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) {
    return Response.json(
      { success: false, error: 'not_configured' },
      { status: 503, headers: corsHeaders(req) }
    )
  }

  let token = ''
  try {
    const body = (await req.json()) as { token?: string }
    token = body.token?.trim() ?? ''
  } catch {
    return Response.json(
      { success: false, error: 'invalid_body' },
      { status: 400, headers: corsHeaders(req) }
    )
  }

  if (!token) {
    return Response.json(
      { success: false, error: 'missing_token' },
      { status: 400, headers: corsHeaders(req) }
    )
  }

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (remoteIp) form.append('remoteip', remoteIp)

  const verifyRes = await fetch(VERIFY_URL, { method: 'POST', body: form })
  const result = (await verifyRes.json()) as { success?: boolean }

  return Response.json(
    { success: Boolean(result.success) },
    { status: result.success ? 200 : 403, headers: corsHeaders(req) }
  )
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  const allowed = allowedOrigins()
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function allowedOrigins(): string[] {
  return [
    'https://helpmiriam.com',
    'https://www.helpmiriam.com',
    'http://localhost:3000',
    'http://localhost:8888',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8888',
  ]
}