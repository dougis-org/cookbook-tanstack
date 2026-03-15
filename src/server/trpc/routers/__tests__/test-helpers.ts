/**
 * Test helper for seeding users via MongoDB.
 * Creates user documents directly in the BetterAuth "user" collection.
 */
import { Types } from "mongoose"
import { getMongoClient } from "@/db"

let seedCounter = 0

/**
 * Create a new test user in the BetterAuth user collection.
 * Returns the created user object with id, email, name, etc.
 */
export async function seedUserWithBetterAuth() {
  const uniqueId = `${Date.now()}-${++seedCounter}`
  const userId = new Types.ObjectId()
  const email = `user-${uniqueId}@recipe.test`
  const now = new Date()

  const db = getMongoClient().db()
  
  const user = {
    _id: userId,
    email,
    emailVerified: false,
    name: `Test User ${uniqueId}`,
    image: null,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection("user").insertOne(user)

  return {
    id: userId.toHexString(),
    email,
    emailVerified: false,
    name: `Test User ${uniqueId}`,
    image: null,
    createdAt: now,
    updatedAt: now,
  }
}
