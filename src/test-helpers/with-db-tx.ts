/**
 * Per-test transaction isolation for Testcontainers-based tests.
 *
 * Each `withDbTx` call acquires a PoolClient, opens a transaction, creates a
 * Drizzle instance bound to that client, runs the test, then always rolls back.
 * This keeps the database clean between tests without truncating tables.
 *
 * Usage:
 *   it("does something", async () => {
 *     await withDbTx(async (db) => {
 *       await db.insert(schema.meals).values({ name: "Breakfast", slug: "breakfast" })
 *       const rows = await db.select().from(schema.meals)
 *       expect(rows).toHaveLength(1)
 *     })
 *   })
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/db/schema"

export type TestDb = NodePgDatabase<typeof schema>

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL not set — ensure db-global-setup runs before DB tests")
    }
    pool = new Pool({ connectionString: url })
  }
  return pool
}

/** Run `fn` inside a transaction that always rolls back on completion. */
export async function withDbTx<T>(fn: (db: TestDb) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  await client.query("BEGIN")
  try {
    const db = drizzle(client, { schema })
    return await fn(db)
  } finally {
    await client.query("ROLLBACK")
    client.release()
  }
}

/** Close the shared pool. Call from afterAll in each test suite that uses withDbTx. */
export async function closeTestPool(): Promise<void> {
  await pool?.end()
  pool = null
}
