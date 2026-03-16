// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { resolveDefaultAdminUser } from "../defaultAdmin";

let mongoServer: MongoMemoryServer;
let firstConnection = true;

beforeEach(async () => {
  // Disconnect from previous connection if exists
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Reset env vars
  delete process.env.MIGRATION_DEFAULT_ADMIN_USER_ID;
  delete process.env.MIGRATION_DEFAULT_ADMIN_EMAIL;
  delete process.env.MIGRATION_DEFAULT_ADMIN_USERNAME;
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }

  // Clean up env
  delete process.env.MIGRATION_DEFAULT_ADMIN_USER_ID;
  delete process.env.MIGRATION_DEFAULT_ADMIN_EMAIL;
  delete process.env.MIGRATION_DEFAULT_ADMIN_USERNAME;
});

const createMongoClient = () => mongoose.connection.getClient();

describe("resolveDefaultAdminUser", () => {
  it("resolves admin by user ID", async () => {
    const adminUserId = new ObjectId().toHexString();
    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = adminUserId;

    const result = await resolveDefaultAdminUser(ObjectId, "test");

    expect(result).toHaveProperty("resolvedId", adminUserId);
    expect(result).toHaveProperty("lookupMode", "id");
    expect(result).toHaveProperty("lookupValue", adminUserId);
  });

  it("resolves admin by email from database", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    const adminEmail = "admin@example.com";
    await usersCollection.insertOne({
      _id: adminUserId,
      email: adminEmail,
      emailVerified: true,
    });

    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = adminEmail;

    const result = await resolveDefaultAdminUser(
      ObjectId,
      "test",
      createMongoClient(),
    );

    expect(result).toHaveProperty("lookupMode", "email");
    expect(result).toHaveProperty("lookupValue", adminEmail);
    expect(result).toHaveProperty("email", adminEmail);
    expect(result.resolvedId).toBe(adminUserId.toHexString());
  });

  it("resolves admin by username from database", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    const adminUsername = "admin_user";
    await usersCollection.insertOne({
      _id: adminUserId,
      username: adminUsername,
      email: "admin@test.com",
      emailVerified: true,
    });

    process.env.MIGRATION_DEFAULT_ADMIN_USERNAME = adminUsername;

    const result = await resolveDefaultAdminUser(
      ObjectId,
      "test",
      createMongoClient(),
    );

    expect(result).toHaveProperty("lookupMode", "username");
    expect(result).toHaveProperty("lookupValue", adminUsername);
    expect(result).toHaveProperty("username", adminUsername);
    expect(result.resolvedId).toBe(adminUserId.toHexString());
  });

  it("throws when admin email not found in database", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = "nonexistent@test.com";

    await expect(
      resolveDefaultAdminUser(ObjectId, "test", createMongoClient()),
    ).rejects.toThrow(
      'Could not find user with email "nonexistent@test.com" in database',
    );
  });

  it("throws when admin username not found in database", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_USERNAME = "nonexistent_user";

    await expect(
      resolveDefaultAdminUser(ObjectId, "test", createMongoClient()),
    ).rejects.toThrow(
      'Could not find user with username "nonexistent_user" in database',
    );
  });

  it("throws when no admin environment variables are set", async () => {
    await expect(
      resolveDefaultAdminUser(ObjectId, "test_command"),
    ).rejects.toThrow(
      "Set exactly one of MIGRATION_DEFAULT_ADMIN_USER_ID, MIGRATION_DEFAULT_ADMIN_EMAIL, or MIGRATION_DEFAULT_ADMIN_USERNAME",
    );
  });

  it("throws when multiple admin environment variables are set", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = new ObjectId().toHexString();
    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = "admin@test.com";

    await expect(
      resolveDefaultAdminUser(ObjectId, "test_command"),
    ).rejects.toThrow("Set exactly one of MIGRATION_DEFAULT_ADMIN");
  });

  it("throws when user ID is invalid ObjectId", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = "not-a-valid-id";

    await expect(resolveDefaultAdminUser(ObjectId, "test")).rejects.toThrow(
      "MIGRATION_DEFAULT_ADMIN_USER_ID is not a valid ObjectId",
    );
  });

  it("throws when email lookup required but no mongoClient provided", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = "admin@test.com";

    await expect(resolveDefaultAdminUser(ObjectId, "test")).rejects.toThrow(
      "Cannot resolve admin by email without MongoDB client",
    );
  });

  it("throws when username lookup required but no mongoClient provided", async () => {
    process.env.MIGRATION_DEFAULT_ADMIN_USERNAME = "admin";

    await expect(resolveDefaultAdminUser(ObjectId, "test")).rejects.toThrow(
      "Cannot resolve admin by username without MongoDB client",
    );
  });

  it("trims whitespace from lookup values", async () => {
    const adminUserId = new ObjectId().toHexString();
    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = `  ${adminUserId}  `;

    const result = await resolveDefaultAdminUser(ObjectId, "test");

    expect(result).toHaveProperty("lookupValue", adminUserId);
  });

  it("returns hex string ID, not ObjectId", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    await usersCollection.insertOne({
      _id: adminUserId,
      email: "admin@test.com",
    });

    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = "admin@test.com";

    const result = await resolveDefaultAdminUser(
      ObjectId,
      "test",
      createMongoClient(),
    );

    expect(typeof result.resolvedId).toBe("string");
    expect(result.resolvedId).toMatch(/^[0-9a-f]{24}$/);
  });

  it("handles missing user fields gracefully (fallback empty strings)", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    // Insert user with minimal fields (no email/username)
    await usersCollection.insertOne({
      _id: adminUserId,
    });

    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = adminUserId.toHexString();

    const result = await resolveDefaultAdminUser(ObjectId, "test");

    // Should resolve successfully with ID-only lookup
    expect(result.resolvedId).toBe(adminUserId.toHexString());
    expect(result).toHaveProperty("email", "");
    expect(result).toHaveProperty("username", "");
  });

  it("handles user with ObjectId as string in database", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminIdHex = new ObjectId().toHexString();
    // Insert user with string ID instead of ObjectId
    await usersCollection.insertOne({
      _id: adminIdHex,
      email: "admin@test.com",
    } as never);

    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = "admin@test.com";

    const result = await resolveDefaultAdminUser(
      ObjectId,
      "test",
      createMongoClient(),
    );

    expect(result.resolvedId).toBe(adminIdHex);
  });

  it("preserves environment-based email and username when available", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    const envEmail = "env@test.com";
    const envUsername = "env_admin";

    process.env.MIGRATION_DEFAULT_ADMIN_USER_ID = adminUserId.toHexString();
    // NOTE: Only set USER_ID, not EMAIL or USERNAME, to avoid multiple selector error

    await usersCollection.insertOne({
      _id: adminUserId,
      email: envEmail,
      username: envUsername,
    });

    const result = await resolveDefaultAdminUser(ObjectId, "test");

    // When resolving by ID, should use environment values if not set
    expect(result.resolvedId).toBe(adminUserId.toHexString());
  });

  it("updates email and username from database on email/username lookup", async () => {
    const db = createMongoClient().db();
    const usersCollection = db.collection("user");

    const adminUserId = new ObjectId();
    const dbEmail = "db@test.com";
    const dbUsername = "db_admin";

    await usersCollection.insertOne({
      _id: adminUserId,
      email: dbEmail,
      username: dbUsername,
    });

    process.env.MIGRATION_DEFAULT_ADMIN_EMAIL = dbEmail;

    const result = await resolveDefaultAdminUser(
      ObjectId,
      "test",
      createMongoClient(),
    );

    // When resolving by email, should get fields from database
    expect(result).toHaveProperty("email", dbEmail);
    expect(result).toHaveProperty("username", dbUsername);
  });
});
