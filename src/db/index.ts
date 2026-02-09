import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Ensure .env.local or .env is configured with a valid PostgreSQL connection string.',
  )
}

const pool = new Pool({
  connectionString: DATABASE_URL,
})

export const db = drizzle({ client: pool, schema })
export { pool }
