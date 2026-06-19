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

  // Si Cloudflare no responde (red/caída), devolvemos un error de infraestructura
  // distinguible de un rechazo real, para que el cliente NO bloquee un contacto
  // legítimo por un fallo ajeno al usuario (fail-open ante infra, no ante bot).
  let result: { success?: boolean } = {}
  try {
    const verifyRes = await fetch(VERIFY_URL, { method: 'POST', body: form })
    result = (await verifyRes.json()) as { success?: boolean }
  } catch {
    return Response.json(
      { success: false, error: 'verify_error' },
      { status: 502, headers: corsHeaders(req) }
    )
  }

  // `error: 'failed'` = Cloudflare RECHAZA el token (bot/expirado): bloqueo real.
  // Cualquier otro fallo (not_configured, verify_error) NO debe bloquear.
  if (result.success) {
    return Response.json({ success: true }, { status: 200, headers: corsHeaders(req) })
  }
  return Response.json(
    { success: false, error: 'failed' },
    { status: 403, headers: corsHeaders(req) }
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