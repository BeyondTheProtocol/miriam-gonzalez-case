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
  if (await fileExists(path)) {
    if (overwrite) {
      console.log('Updating fundraiser...')
    } else {
      console.log(`Fundraiser file already exists: ${path}.`)
      return
    }
  }
  const fundraiser = await getFundraiser()
  await fs.writeFile(path, JSON.stringify(fundraiser))
  console.log(`✔ Fundraiser saved to: ${path}`)
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

export async function getDonations(maxItems = 400): Promise<PublicDonation[]> {
  const out: PublicDonation[] = []
  const limit = 20
  let offset = 0
  // Paginación por offset (verificada contra el feed); para en has_next=false.
  for (let guard = 0; guard < 20 && out.length < maxItems; guard++) {
    const res = await fetch(
      `${donationsFeed}?limit=${limit}&sort=recent&offset=${offset}`,
      { headers: { 'User-Agent': headers['User-Agent'] }, signal: AbortSignal.timeout(8000) }
    )
    const json = (await res.json()) as {
      references?: { donations?: Array<Record<string, unknown>> }
      meta?: { meta?: { has_next?: boolean } }
    }
    const list = json.references?.donations ?? []
    if (list.length === 0) break
    for (const d of list) {
      const anonymous = Boolean(d.is_anonymous)
      const name = anonymous ? 'Anónimo' : titleCase(String(d.name || 'Anónimo')) || 'Anónimo'
      if (!anonymous && OPT_OUT.includes(name)) continue
      out.push({
        id: Number(d.donation_id),
        name,
        amount: Number(d.amount),
        currencyCode: String(d.currencycode || 'EUR'),
        createdAt: String(d.created_at),
        anonymous,
      })
    }
    if (!json.meta?.meta?.has_next) break
    offset += limit
  }
  return out
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
