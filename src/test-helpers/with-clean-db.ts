/**
 * Per-test collection isolation for MongoDB integration tests.
 * Clears all collections (Mongoose-managed and BetterAuth) before running `fn`.
 * This ensures a clean slate for each test, preventing state leakage between tests.
 *
 * Both Mongoose collections and BetterAuth collections (user, session, account, verification)
 * are cleared to maintain proper test isolation, especially after removing the redundant
 * Mongoose auth models.
 */
import mongoose from "mongoose";
import { getMongoClient } from "@/db";

export async function withCleanDb<T>(fn: () => Promise<T>): Promise<T> {
  // Clear Mongoose-managed collections
  const mongooseCollections = Object.values(mongoose.connection.collections);
  await Promise.all(mongooseCollections.map((c) => c.deleteMany({})));

  // Also clear BetterAuth collections directly via Mongoose connection
  // These are not managed by Mongoose models after the refactoring.
  const mongooseDb = mongoose.connection.db;
  if (mongooseDb) {
    const db = mongooseDb;

    // Clear BetterAuth collections that are not managed by Mongoose models.
    const betterAuthCollections = [
      "user",
      "session",
      "account",
      "verification",
    ];
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map((c) => c.name);

    await Promise.all(
      betterAuthCollections
        .filter((name) => existingNames.includes(name))
        .map(async (collName) => {
          try {
            await db.collection(collName).deleteMany({});
          } catch (error: unknown) {
            const err = error as { code?: number; codeName?: string };
            if (err.code === 26 || err.codeName === "NamespaceNotFound") {
              return;
            }
            throw error;
          }
        }),
    );
  }

  return fn();
}
