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

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  } else if (mongoose.connection.readyState === 2) {
    // Already connecting — wait for the event rather than calling connect again
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once("connected", resolve)
      mongoose.connection.once("error", reject)
    })
  }
}, 30_000)
