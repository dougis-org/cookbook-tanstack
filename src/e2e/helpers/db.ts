import { MongoClient, type Db } from "mongodb";

export async function withMongoDb<T>(callback: (db: Db) => Promise<T>) {
  const mongoUri =
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/cookbook";
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    return await callback(client.db());
  } finally {
    await client.close();
  }
}
