import { config } from 'dotenv'

config({ path: '.env.local' })
config() // fallback to .env

async function main() {
  console.log('Starting database seed...\n')

  const { seedMeals } = await import('./meals')
  const { seedCourses } = await import('./courses')
  const { seedPreparations } = await import('./preparations')

  await seedMeals()
  await seedCourses()
  await seedPreparations()

  console.log('\nSeed complete!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
