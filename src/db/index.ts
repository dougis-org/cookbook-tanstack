import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is not set. Ensure .env.local or .env is configured with a valid MongoDB connection string.",
  );
}

// Set strict mode if the mongoose instance supports it
// (In some test environments, mongoose may be mocked without this method)
if (typeof mongoose.set === "function") {
  mongoose.set("strict", true);
}

if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGODB_URI).catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
}

export function getMongoClient(): ReturnType<
  typeof mongoose.connection.getClient
> {
  return mongoose.connection.getClient();
}

type BetterAuthCollectionName = "user" | "session" | "account" | "verification";

export function getBetterAuthCollection(
  name: BetterAuthCollectionName,
  client: any = getMongoClient().db(),
) {
  return client.collection(name) as any;
}

export function toHexString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toHexString" in value &&
    typeof (value as { toHexString?: () => string }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof (value as { toString?: () => string }).toString === "function"
  ) {
    return (value as { toString: () => string }).toString();
  }

  return null;
}

export default mongoose;
