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

      const found1 = await usersCollection.findOne({ _id: mongoose.Types.ObjectId.createFromHexString(user1.id) });
      const found2 = await usersCollection.findOne({ _id: mongoose.Types.ObjectId.createFromHexString(user2.id) });

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

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });
});
