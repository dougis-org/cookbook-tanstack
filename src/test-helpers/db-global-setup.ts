/**
 * Vitest global setup: starts a real PostgreSQL 16 container once for the
 * entire test suite, applies all Drizzle migrations, and exposes the
 * connection URL via DATABASE_URL so test workers can reach it.
 *
 * Workers inherit process.env from the parent process, so setting
 * DATABASE_URL here makes it visible to every test file — including the
 * `// @vitest-environment node` files that use the real DB.
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import path from "path"

let container: StartedPostgreSqlContainer

export async function setup() {
  container = await new PostgreSqlContainer("postgres:16-alpine").start()
  const url = container.getConnectionUri()
  process.env.DATABASE_URL = url

  // Apply all migrations so every table exists before tests run
  const pool = new Pool({ connectionString: url })
  try {
    const db = drizzle(pool)
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") })
  } finally {
    await pool.end()
  }
}

export async function teardown() {
  await container?.stop()
}
