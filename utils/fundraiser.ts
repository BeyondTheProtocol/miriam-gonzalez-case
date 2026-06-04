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

export async function saveFundraiser() {
  const fundraiser = await getFundraiser()
  await fs.writeFile('public/fundraiser.json', JSON.stringify(fundraiser))
}
