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

export async function withCleanDb<T>(fn: () => Promise<T>): Promise<T> {
  // Clear Mongoose-managed collections
  const mongooseCollections = Object.values(mongoose.connection.collections);
  await Promise.all(mongooseCollections.map((c) => c.deleteMany({})));

  // Also clear other collections directly via the active Mongoose connection.
  // This covers BetterAuth collections and any non-Mongoose collections that may be written
  // by the app or tests, ensuring full isolation and avoiding cross-test leakage.
  const mongooseDb = mongoose.connection.db;
  if (mongooseDb) {
    const db = mongooseDb;

    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map((c) => c.name);
    const mongooseNames = Object.keys(mongoose.connection.collections);

    // Clear every collection not already cleaned by Mongoose and avoid system collections.
    await Promise.all(
      existingNames
        .filter((name) => !name.startsWith("system."))
        .filter((name) => !mongooseNames.includes(name))
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
