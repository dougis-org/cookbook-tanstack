import { config } from 'dotenv'
import { pool } from '../index'

config({ path: '.env.local' })
config() // fallback to .env

async function main() {
  try {
    console.log('Starting database seed...\n')

    const { seedMeals } = await import('./meals')
    const { seedCourses } = await import('./courses')
    const { seedPreparations } = await import('./preparations')

    await seedMeals()
    await seedCourses()
    await seedPreparations()

    console.log('\nSeed complete!')
  } finally {
    // Gracefully close the database connection pool
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
