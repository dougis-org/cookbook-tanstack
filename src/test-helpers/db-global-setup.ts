/**
 * Vitest global setup: starts an in-process MongoDB instance once for the
 * entire test suite using mongodb-memory-server, connects Mongoose, and
 * exposes the connection URI via MONGODB_URI so test workers can reach it.
 *
 * Workers inherit process.env from the parent process, so setting
 * MONGODB_URI here makes it visible to every test file.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server"
import mongoose from "mongoose"

let mongod: MongoMemoryReplSet

export async function setup() {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)
}

export async function teardown() {
  try {
    await mongoose.disconnect()
    await mongod?.stop()
  } catch (err) {
    console.error("Failed to stop mongodb-memory-server:", err)
  }
}
