import { saveFundraiser } from './utils/fundraiser'

try {
  const overwrite = process.argv.includes('--force')
  await saveFundraiser(overwrite)
} catch (error) {
  console.error('Error updating fundraiser:', error)
  process.exit(1)
}
