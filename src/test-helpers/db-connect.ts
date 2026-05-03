/**
 * Vitest setupFiles entry — runs in every worker process before any tests.
 *
 * globalSetup only runs in the main process, so Mongoose is NOT connected in
 * workers. This file awaits mongoose.connect() in each worker using beforeAll,
 * ensuring the DB is ready before the first test executes.
 *
 * Each worker connects to its own database (test_worker_<id>) so that parallel
 * workers don't interfere with each other's data — critical for withCleanDb
 * which calls deleteMany on all collections.
 *
 * Some test files import @/db which calls mongoose.connect(baseUri) at module
 * load time — before this beforeAll runs. We detect that case by checking
 * whether the active connection's database name matches the expected worker
 * database, and disconnect/reconnect if not.
 */
import { beforeAll } from "vitest"
import mongoose from "mongoose"

beforeAll(async () => {
  const baseUri = process.env.MONGODB_URI
  if (!baseUri) return

  // Give each worker an isolated database to prevent parallel test interference
  const workerId = process.env.VITEST_POOL_ID ?? "0"
  const url = new URL(baseUri)
  url.pathname = `/test_worker_${workerId}`
  const uri = url.toString()
  const expectedDb = `test_worker_${workerId}`

  const state = mongoose.connection.readyState
  if (state === 0) {
    await mongoose.connect(uri)
  } else if (state === 2) {
    // Already connecting (likely from @/db module-load auto-connect to base URI).
    // Wait for it to complete, then check if it landed on the right database.
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once("connected", resolve)
      mongoose.connection.once("error", reject)
    })
    if (mongoose.connection.name !== expectedDb) {
      await mongoose.disconnect()
      await mongoose.connect(uri)
    }
  } else if (state === 1) {
    // Already connected — reconnect to worker-specific DB if on the wrong one.
    if (mongoose.connection.name !== expectedDb) {
      await mongoose.disconnect()
      await mongoose.connect(uri)
    }
  }
}, 30_000)
