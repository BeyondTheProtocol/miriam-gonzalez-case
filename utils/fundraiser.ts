import fs from 'node:fs/promises'

export interface GoFundMeAmount {
  amount: number
  currencyCode: string
}

export interface GoFundMeFundraiser {
  currentAmount: GoFundMeAmount
  goalAmount: GoFundMeAmount
  donationCount: number
  donationsEnabled: boolean
}

export interface GoFundMeResponse {
  data: {
    fundraiser: GoFundMeFundraiser
  }
}

const path = 'public/fundraiser.json'
const request = 'https://graphql.gofundme.com/graphql'
const operationName = 'GetFundraiser'
const query = `query GetFundraiser($slug: ID!) {
  fundraiser(slug: $slug) {
    currentAmount {
      amount
      currencyCode
    }
    goalAmount {
      amount
      currencyCode
    }
    donationCount
    donationsEnabled
  }
}`
const variables = { slug: 'biopsia-molecular-que-puede-cambiar-su-tratamiento' }

const headers = {
  'Content-Type': 'application/json',
  'Graphql-Client-Name': 'SSR Frontend Client',
  'Graphql-Client-Version': '1.0.0',
  Origin: 'https://www.gofundme.com',
  Referer: 'https://www.gofundme.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
}

export const getFundraiser = () =>
  fetch(request, {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables,
    }),
    headers,
  })
    .then((res) => res.json())
    .then(({ data }: GoFundMeResponse) => data.fundraiser)

async function fileExists(path: string) {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

export async function saveFundraiser(overwrite = false) {
  const exists = await fileExists(path)
  if (exists) {
    if (overwrite) {
      console.log('Updating fundraiser...')
    } else {
      console.log(`Fundraiser file already exists: ${path}.`)
      return
    }
  }
  try {
    const fundraiser = await getFundraiser()
    await fs.writeFile(path, JSON.stringify(fundraiser))
    console.log(`✔ Fundraiser saved to: ${path}`)
  } catch (error) {
    // Si GoFundMe no responde (p. ej. ECONNRESET por su anti-bot), no bloqueamos
    // el build/dev: conservamos el fundraiser.json existente —igual que hace
    // saveDonations—. Solo fallamos si no hay datos previos a los que recurrir.
    if (exists) {
      console.warn(`Fundraiser fetch failed; keeping existing file (${path}).`, error)
      return
    }
    throw error
  }
}

// ── Donaciones públicas (muro de gracias · paridad con GoFundMe) ─────────────
// El feed público de GoFundMe ya muestra nombre + importe + anónimo + fecha.
// Re-publicamos lo mismo. OPT_OUT: nombres (no anónimos) a excluir si alguien
// pide quitarse (red de seguridad RGPD). Los anónimos salen como "Anónimo".
const donationsPath = 'public/donations.json'
const donationsFeed = `https://gateway.gofundme.com/web-gateway/v1/feed/${variables.slug}/donations`
const OPT_OUT: string[] = []

export interface PublicDonation {
  id: number
  name: string
  amount: number
  currencyCode: string
  createdAt: string
  anonymous: boolean
}

// Normaliza nombres a Título (GoFundMe los devuelve en MAYÚS/minús irregular).
// Unicode-aware (respeta acentos). Primera letra de cada palabra en mayúscula.
function titleCase(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('es-ES')
    .replace(/(^|[\s\-'’.])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es-ES'))
}

// Partículas que no cuentan como apellido al sacar iniciales (de la Cruz → C.).
const NAME_PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'i', 'da', 'das', 'do', 'dos', 'van', 'von', 'di', 'lo',
])

// Privacidad del muro: deja el nombre de pila y abrevia cada apellido a su
// inicial. "María González Pérez" → "María G. P."; "Juan Pérez" → "Juan P.";
// un solo token (o un nombre sin apellido) se deja igual. Las partículas no
// generan inicial. Los anónimos no pasan por aquí.
function maskSurnames(fullName: string): string {
  const tokens = fullName.split(/\s+/).filter(Boolean)
  if (tokens.length <= 1) return fullName
  const initials = tokens
    .slice(1)
    .filter((t) => !NAME_PARTICLES.has(t.toLocaleLowerCase('es-ES')))
    .map((t) => `${t.charAt(0).toLocaleUpperCase('es-ES')}.`)
  return initials.length ? `${tokens[0]} ${initials.join(' ')}` : tokens[0]
}

// Una página del feed (por offset) → donaciones normalizadas. Devuelve [] si la
// página falla (timeout / !ok), para no romper el barrido completo.
async function fetchDonationsPage(offset: number, limit = 20): Promise<PublicDonation[]> {
  try {
    const res = await fetch(`${donationsFeed}?limit=${limit}&sort=recent&offset=${offset}`, {
      headers: { 'User-Agent': headers['User-Agent'] },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      references?: { donations?: Array<Record<string, unknown>> }
    }
    const list = json.references?.donations ?? []
    const out: PublicDonation[] = []
    for (const d of list) {
      const anonymous = Boolean(d.is_anonymous)
      const fullName = titleCase(String(d.name || 'Anónimo')) || 'Anónimo'
      if (!anonymous && OPT_OUT.includes(fullName)) continue
      const name = anonymous ? 'Anónimo' : maskSurnames(fullName)
      out.push({
        id: Number(d.donation_id),
        name,
        amount: Number(d.amount),
        currencyCode: String(d.currencycode || 'EUR'),
        createdAt: String(d.created_at),
        anonymous,
      })
    }
    return out
  } catch {
    return []
  }
}

// Barrido SECUENCIAL (para el build/semilla). El feed no manda un has_next
// fiable (viene null), así que paramos al llegar una página incompleta o vacía.
export async function getDonations(maxItems = 1500): Promise<PublicDonation[]> {
  const out: PublicDonation[] = []
  const limit = 20
  for (let offset = 0, guard = 0; guard < 120 && out.length < maxItems; guard++, offset += limit) {
    const list = await fetchDonationsPage(offset, limit)
    if (list.length === 0) break
    out.push(...list)
    if (list.length < limit) break
  }
  return out
}

// Barrido en PARALELO acotado por el total de donaciones (lo da el fundraiser),
// para el endpoint EN VIVO, donde el tiempo de respuesta importa: lanza las
// páginas en oleadas de baja concurrencia, deduplica por id y ordena por fecha.
// Sin total conocido, cae al barrido secuencial.
export async function getDonationsFast(total?: number, maxItems = 1500): Promise<PublicDonation[]> {
  const limit = 20
  if (!total || total <= 0) return getDonations(maxItems)
  const pages = Math.min(Math.ceil(total / limit), Math.ceil(maxItems / limit), 120)
  const offsets = Array.from({ length: pages }, (_, i) => i * limit)
  const concurrency = 6
  const all: PublicDonation[] = []
  for (let i = 0; i < offsets.length; i += concurrency) {
    const wave = offsets.slice(i, i + concurrency)
    const lists = await Promise.all(wave.map((o) => fetchDonationsPage(o, limit)))
    for (const l of lists) all.push(...l)
  }
  const seen = new Set<number>()
  const dedup: PublicDonation[] = []
  for (const d of all) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    dedup.push(d)
  }
  dedup.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  return dedup.slice(0, maxItems)
}

export async function saveDonations() {
  try {
    const donations = await getDonations()
    if (donations.length === 0) {
      console.log('No donations fetched; keeping existing file.')
      return
    }
    await fs.writeFile(donationsPath, JSON.stringify(donations))
    console.log(`✔ Donations saved (${donations.length}) to: ${donationsPath}`)
  } catch (error) {
    // No bloquear el build/dev ni sobrescribir con vacío si el feed falla.
    console.warn('Donations fetch failed; keeping existing file.', error)
  }
}
