/**
 * One-time migration: backfill hiddenByTier: false on existing Recipe and Cookbook documents.
 *
 * Idempotent — only updates documents where the field is missing ($exists: false).
 * Safe to run on production: touches no data beyond adding the missing field.
 *
 * Collection names match Mongoose model plurals: 'recipes', 'cookbooks'.
 *
 * Usage: npm run db:migrate-hidden-by-tier
 */

import { MongoClient } from "mongodb"
import { config } from "dotenv"

config({ path: ".env.local" })
config()

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error("Error: MONGODB_URI environment variable is not set.")
  process.exit(1)
}

const client = new MongoClient(uri)

async function backfill(db: ReturnType<typeof client.db>, collection: string) {
  const result = await db.collection(collection).updateMany(
    { hiddenByTier: { $exists: false } },
    { $set: { hiddenByTier: false } },
  )
  console.log(`${collection}: ${result.modifiedCount} document(s) updated with hiddenByTier=false`)
}

async function migrate() {
  try {
    await client.connect()
    const db = client.db()
    await backfill(db, "recipes")
    await backfill(db, "cookbooks")
    console.log("Migration complete.")
  } finally {
    await client.close()
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
