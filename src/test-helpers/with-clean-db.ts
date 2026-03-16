/**
 * Per-test collection isolation for MongoDB integration tests.
 * Clears all Mongoose collections before running `fn` to ensure a clean slate.
 */
import mongoose from "mongoose";

export async function withCleanDb<T>(fn: () => Promise<T>): Promise<T> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
  return fn();
}
