/**
 * Test helper for seeding users via MongoDB.
 * Creates user documents directly in the BetterAuth "user" collection.
 * Uses the Mongoose connection to ensure we're on the same database as tests.
 */
import mongoose, { Types } from "mongoose";
import { getMongoClient } from "@/db";

let seedCounter = 0;

/**
 * Create a new test user in the BetterAuth user collection.
 * Returns the created user object with id as a hex string.
 */
export async function seedUserWithBetterAuth() {
  const uniqueId = `${Date.now()}-${++seedCounter}`;
  const userId = new Types.ObjectId();
  const email = `user-${uniqueId}@recipe.test`;
  const now = new Date();

  // Ensure Mongoose connection is ready
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection not ready");
  }

  // Get the database name from the Mongoose URI to ensure test worker isolation
  // Each worker gets test_worker_${VITEST_POOL_ID} as described in db-connect.ts
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI not set");
  }
  const url = new URL(mongoUri);
  const dbName = url.pathname.slice(1); // Remove leading slash

  // Use the MongoDB client from the Mongoose connection, requesting the correct database
  const mongoClient = getMongoClient();
  const db = mongoClient.db(dbName);

  const user = {
    _id: userId,
    email,
    emailVerified: false,
    name: `Test User ${uniqueId}`,
    image: null,
    createdAt: now,
    updatedAt: now,
  };

  const usersCollection = db.collection("user");
  const insertResult = await usersCollection.insertOne(user);

  // Verify the insert was successful
  if (!insertResult.acknowledged) {
    throw new Error(`Failed to insert user: ${email}`);
  }

  // Verify we can query it back immediately
  const queriedUser = await usersCollection.findOne({ _id: userId });
  if (!queriedUser) {
    // Silently fail without leaking database implementation details
    throw new Error(`Failed to create user in database`);
  }

  return {
    id: userId.toHexString(),
    email,
    emailVerified: false,
    name: `Test User ${uniqueId}`,
    image: null,
    createdAt: now,
    updatedAt: now,
  };
}
