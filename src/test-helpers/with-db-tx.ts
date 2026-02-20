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

// Promise-based singleton prevents multiple concurrent callers from each
// creating their own Pool before the first one is stored. Even though
// `new Pool()` is synchronous today, using a promise ensures the pattern
// remains race-safe if getPool() ever needs to do async work.
let poolPromise: Promise<Pool> | null = null

async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL not set — ensure db-global-setup runs before DB tests")
    }
    poolPromise = Promise.resolve(new Pool({ connectionString: url }))
  }
  return poolPromise
}

/** Run `fn` inside a transaction that always rolls back on completion. */
export async function withDbTx<T>(fn: (db: TestDb) => Promise<T>): Promise<T> {
  const client = await (await getPool()).connect()
  await client.query("BEGIN")
  try {
    const db = drizzle(client, { schema })
    return await fn(db)
  } finally {
    try {
      await client.query("ROLLBACK")
    } finally {
      client.release()
    }
  }
}

/** Close the shared pool. Call from afterAll in each test suite that uses withDbTx. */
export async function closeTestPool(): Promise<void> {
  const p = poolPromise
  poolPromise = null
  if (p) {
    await (await p).end()
  }
}
