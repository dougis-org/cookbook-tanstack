/**
 * Test helper for seeding users via MongoDB.
 * Creates user documents directly in the BetterAuth "user" collection.
 * Uses the Mongoose connection to ensure we're on the same database as tests.
 */
import mongoose, { Types } from "mongoose";
import { type UserTier } from "@/types/user";

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

  const usersCollection = db.collection("user");

  const user = {
    _id: userId,
    email,
    emailVerified: false,
    name: `Test User ${uniqueId}`,
    image: null,
    createdAt: now,
    updatedAt: now,
  };

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

// Shared test helpers for TRPC router tests.
const RUN_ID = Date.now();
let seq = 0;

export function uid() {
  return `${RUN_ID}-${++seq}`;
}

export async function makeAnonCaller() {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({ session: null, user: null, collabCookbookIds: [] });
}

export async function makeAuthCaller(
  userId: string,
  opts: { email?: string; tier?: string; isAdmin?: boolean; emailVerified?: boolean; collabCookbookIds?: string[] } = {},
) {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({
    session: { id: "s1" } as never,
    user: {
      id: userId,
      email: opts.email ?? "test@test.com",
      emailVerified: opts.emailVerified ?? true,
      tier: opts.tier,
      isAdmin: opts.isAdmin ?? false,
    } as never,
    collabCookbookIds: opts.collabCookbookIds ?? [],
  });
}

export async function makeTieredCaller(tier: UserTier, isAdmin = false) {
  return makeAuthCaller(new Types.ObjectId().toHexString(), { tier, isAdmin });
}

export async function withSeededUser<TReturn>(
  fn: (
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    caller: Awaited<ReturnType<typeof makeAuthCaller>>,
  ) => Promise<TReturn>,
): Promise<TReturn> {
  const user = await seedUserWithBetterAuth();
  const caller = await makeAuthCaller(user.id, { email: user.email });
  return fn(user, caller);
}
