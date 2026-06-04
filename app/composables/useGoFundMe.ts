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
    launchDate
  }
}`

// Fallback launch date — usada si la API no devuelve launchDate.
// Ajustar a la fecha real de inicio de la campaña.
export const CAMPAIGN_LAUNCH_DATE = '2026-02-15'

/**
 * Devuelve el tiempo transcurrido desde el lanzamiento de la campaña
 * en una forma legible y localizada (p. ej. "3 meses", "5 días").
 */
export function getCampaignElapsed(
  launchDate: string | undefined,
  locale: string,
  now: Date = new Date()
): string {
  const start = new Date(launchDate || CAMPAIGN_LAUNCH_DATE)
  const ms = Math.max(0, now.getTime() - start.getTime())
  const day = 1000 * 60 * 60 * 24
  const days = Math.floor(ms / day)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const is = locale.startsWith('es')
  if (years >= 1) return `${years} ${is ? (years === 1 ? 'año' : 'años') : years === 1 ? 'year' : 'years'}`
  if (months >= 1) return `${months} ${is ? (months === 1 ? 'mes' : 'meses') : months === 1 ? 'month' : 'months'}`
  return `${days} ${is ? (days === 1 ? 'día' : 'días') : days === 1 ? 'day' : 'days'}`
}
const headers = {
  'Content-Type': 'application/json',
  'Graphql-Client-Name': 'SSR Frontend Client',
  'Graphql-Client-Version': '1.0.0',
  Origin: 'https://www.gofundme.com',
  Referer: 'https://www.gofundme.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
}

interface GoFundMeAmount {
  amount: number
  currencyCode: string
}

interface GoFundMeFundraiser {
  currentAmount: GoFundMeAmount
  goalAmount: GoFundMeAmount
  donationCount: number
  donationsEnabled: boolean
  launchDate?: string
}

interface GoFundMeResponse {
  data: {
    fundraiser: GoFundMeFundraiser
  }
}

export const useGoFundMe = (slug: string) =>
  useFetch(request, {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables: { slug },
    }),
    headers,
    transform: ({ data }: GoFundMeResponse) => data.fundraiser,
  })
