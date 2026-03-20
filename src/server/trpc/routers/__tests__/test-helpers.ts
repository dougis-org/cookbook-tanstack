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

  // Use the active Mongoose connection database directly to ensure test writes/read use the same database.
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection has no active database");
  }

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
