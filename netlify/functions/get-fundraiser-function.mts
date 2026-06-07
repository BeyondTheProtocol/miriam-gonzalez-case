import type { Config } from '@netlify/functions'
import { saveFundraiser } from '../../utils/fundraiser'

export default async (req: Request) => {
  const { next_run } = await req.json()

  await saveFundraiser(true)

  console.log('Received event! Next invocation at:', next_run)
}

export const config: Config = {
  schedule: '@hourly',
}
