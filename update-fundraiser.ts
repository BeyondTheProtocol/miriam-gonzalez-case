import { saveFundraiser } from './utils/fundraiser'

try {
  console.log('Updating fundraiser...')
  await saveFundraiser()
  console.log('Fundraiser updated successfully')
} catch (error) {
  console.error('Error updating fundraiser:', error)
  process.exit(1)
}
