/**
 * One-time migration: assign default tier and admin flag to existing users.
 *
 * IMPORTANT: Run this only once after deploying the tier feature. The script is
 * idempotent — re-running after tier-change endpoints are live will NOT overwrite
 * intentionally set tiers because the first step only updates documents where
 * the `tier` field is missing.
 *
 * Usage: npm run db:migrate-tiers
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

async function migrate() {
  try {
    await client.connect()
    const db = client.db()
    const users = db.collection("user")

    // Step 1: Set tier and isAdmin defaults only on documents missing a tier field.
    // This is intentionally conservative: documents with an existing tier are untouched.
    const tierResult = await users.updateMany(
      { tier: { $exists: false } },
      { $set: { tier: "executive-chef", isAdmin: false } },
    )
    console.log(
      `Tier migration: ${tierResult.modifiedCount} document(s) updated with tier='executive-chef' and isAdmin=false`,
    )

    // Step 2: Flag the admin account regardless of whether tier was just set.
    const adminResult = await users.updateOne(
      { email: "doug@dougis.com" },
      { $set: { isAdmin: true } },
    )
    if (adminResult.matchedCount === 1) {
      console.log("Admin flag: doug@dougis.com set to isAdmin=true")
    } else {
      console.log("Admin flag: doug@dougis.com not found in database — skipped")
    }

    console.log("Migration complete.")
  } finally {
    await client.close()
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
