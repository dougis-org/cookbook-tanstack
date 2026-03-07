import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is not set. Ensure .env.local or .env is configured with a valid MongoDB connection string.",
  );
}

mongoose.set("strict", true);

if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGODB_URI);
}

export function getMongoClient() {
  return mongoose.connection.getClient();
}

export default mongoose;
