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

interface GoFundMeAmount {
  amount: number
  currencyCode: string
}

interface GoFundMeFundraiser {
  currentAmount: GoFundMeAmount
  goalAmount: GoFundMeAmount
  donationCount: number
  donationsEnabled: boolean
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
