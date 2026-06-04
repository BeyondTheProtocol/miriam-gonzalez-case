import type { Config } from '@netlify/functions'
import { GoFundMeResponse } from '../../types/fundraiser'
import fs from 'node:fs/promises'

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
const headers = {
  'Content-Type': 'application/json',
  'Graphql-Client-Name': 'SSR Frontend Client',
  'Graphql-Client-Version': '1.0.0',
  Origin: 'https://www.gofundme.com',
  Referer: 'https://www.gofundme.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
}

export const getGoFundMeFundraiser = (slug: string) =>
  fetch(request, {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables: { slug },
    }),
    headers,
  })
    .then((res) => res.json())
    .then(({ data }: GoFundMeResponse) => data.fundraiser)

export default async (req: Request) => {
  const { next_run } = await req.json()

  const fundraiser = await getGoFundMeFundraiser(
    'biopsia-molecular-que-puede-cambiar-su-tratamiento'
  )
  await fs.writeFile('public/fundraiser.json', JSON.stringify(fundraiser))

  console.log('Received event! Next invocation at:', next_run)
}

export const config: Config = {
  schedule: '@hourly',
}
