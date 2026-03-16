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

  // Also clear BetterAuth collections directly via MongoDB driver
  // These are not managed by Mongoose models after the refactoring
  const mongoClient = getMongoClient();
  const mongooseDb = mongoose.connection.db;
  if (mongooseDb) {
    const db = mongoClient.db(mongooseDb.databaseName);
    const betterAuthCollections = [
      "user",
      "session",
      "account",
      "verification",
    ];
    await Promise.all(
      betterAuthCollections.map((collName) =>
        db
          .collection(collName)
          .deleteMany({})
          .catch(() => {
            // Collection might not exist yet, ignore
          }),
      ),
    );
  }

  return fn();
}
