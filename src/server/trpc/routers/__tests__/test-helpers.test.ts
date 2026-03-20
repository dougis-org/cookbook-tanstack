// @vitest-environment node
import { describe, it, expect } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { seedUserWithBetterAuth } from "./test-helpers";
import mongoose from "mongoose";

describe("seedUserWithBetterAuth", () => {
  it("creates a user in the Better-Auth collection", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();

      expect(user).toBeDefined();
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("emailVerified");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
    });
  });

  it("creates a user with unique email", async () => {
    await withCleanDb(async () => {
      const user1 = await seedUserWithBetterAuth();
      const user2 = await seedUserWithBetterAuth();

      expect(user1.email).not.toEqual(user2.email);
      expect(user1.id).not.toEqual(user2.id);
    });
  });

  it("creates a user with required BetterAuth fields", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();

      // Verify essential BetterAuth fields
      expect(typeof user.id).toBe("string");
      expect(typeof user.email).toBe("string");
      expect(user.email).toMatch(/^.+@.+\..+$/); // Basic email format
      expect(typeof user.emailVerified).toBe("boolean");
    });
  });

  it("creates a user that can be queried from Better-Auth collection", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();

      // Verify the user was actually inserted by querying the collection
      const db = mongoose.connection.db;
      const usersCollection = db!.collection("user");
      const foundUser = await usersCollection.findOne({ email: user.email });

      expect(foundUser).toBeDefined();
      expect(foundUser).toHaveProperty("_id");
      expect(foundUser).toHaveProperty("email", user.email);
    });
  });

  it("creates a user with consistent ID format", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();

      // ID should be a valid MongoDB ObjectId (24 hex characters)
      expect(user.id).toMatch(/^[0-9a-f]{24}$/);
    });
  });

  it("persists user data across multiple calls in same transaction", async () => {
    await withCleanDb(async () => {
      const user1 = await seedUserWithBetterAuth();
      const user2 = await seedUserWithBetterAuth();

      // Both users should exist simultaneously
      const db = mongoose.connection.db;
      const usersCollection = db!.collection("user");

      const found1 = await usersCollection.findOne({
        _id: mongoose.Types.ObjectId.createFromHexString(user1.id),
      });
      const found2 = await usersCollection.findOne({
        _id: mongoose.Types.ObjectId.createFromHexString(user2.id),
      });

      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      expect(found1!.email).not.toEqual(found2!.email);
    });
  });

  it("creates a user with proper timestamps", async () => {
    await withCleanDb(async () => {
      const beforeCreation = new Date();
      const user = await seedUserWithBetterAuth();
      const afterCreation = new Date();

      const createdAt = new Date(user.createdAt!);
      const updatedAt = new Date(user.updatedAt!);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });
});

describe("withCleanDb cleanup function", () => {
  it("clears all Mongoose-managed collections before test", async () => {
    // First, seed some data
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      expect(user).toBeDefined();
    });

    // Then verify a new clean state
    await withCleanDb(async () => {
      const db = mongoose.connection.db;
      const usersCollection = db!.collection("user");
      const count = await usersCollection.countDocuments();

      // Should start with no users
      expect(count).toBe(0);
    });
  });

  it("clears BetterAuth collections when they exist", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const db = mongoose.connection.db;
      const userCollection = db!.collection("user");
      const sessionCollection = db!.collection("session");

      // Insert some data
      await userCollection.insertOne({
        email: "test@test.com",
        name: "Test",
      } as never);
      await sessionCollection.insertOne({
        userId: user.id,
        expires: new Date(),
      } as never);

      let userCount = await userCollection.countDocuments();
      let sessionCount = await sessionCollection.countDocuments();

      expect(userCount).toBeGreaterThan(0);
      expect(sessionCount).toBeGreaterThan(0);
    });

    // After cleanup, collections should be empty
    await withCleanDb(async () => {
      const db = mongoose.connection.db;
      const userCollection = db!.collection("user");
      const sessionCollection = db!.collection("session");

      const userCount = await userCollection.countDocuments();
      const sessionCount = await sessionCollection.countDocuments();

      expect(userCount).toBe(0);
      expect(sessionCount).toBe(0);
    });
  });

  it("handles missing BetterAuth collections gracefully", async () => {
    // This test verifies that withCleanDb doesn't throw
    // even if some BetterAuth collections don't exist yet
    await withCleanDb(async () => {
      // Just verify we can complete a test without errors
      expect(true).toBe(true);
    });
  });

  it("isolated tests do not share data", async () => {
    const user1Id = await new Promise<string>((resolve) => {
      withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        resolve(user.id);
      });
    });

    await withCleanDb(async () => {
      const user2 = await seedUserWithBetterAuth();

      // user2 should have a different ID than user1
      expect(user2.id).not.toEqual(user1Id);

      // And there should be no trace of user1 in this fresh database
      const db = mongoose.connection.db;
      const usersCollection = db!.collection("user");
      const foundUser1 = await usersCollection.findOne({
        _id: mongoose.Types.ObjectId.createFromHexString(user1Id),
      });

      expect(foundUser1).toBeNull();
    });
  });
});
