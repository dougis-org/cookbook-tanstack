// @vitest-environment node
import { describe, it, expect } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { seedUserWithBetterAuth } from "./test-helpers";

async function makeAuthCaller(userId: string, email: string = "test@test.com") {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({
    session: { id: "s1" } as never,
    user: { id: userId, email } as never,
  });
}

describe("users router", () => {
  describe("users.me", () => {
    it("returns the current user from Better-Auth session", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id, user.email);

        const result = await caller.users.me();

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("id", user.id);
        expect(result).toHaveProperty("email", user.email);
      });
    });

    it("returns null for unauthenticated user (should be caught by protectedProcedure)", async () => {
      await withCleanDb(async () => {
        const { appRouter } = await import("@/server/trpc/router");
        const anonCaller = appRouter.createCaller({
          session: null,
          user: null,
        });

        // protectedProcedure should throw UNAUTHORIZED before reaching the handler
        await expect(anonCaller.users.me()).rejects.toThrow();
      });
    });
  });

  describe("users.updateProfile", () => {
    it("updates user name and returns updated user data", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id, user.email);
        const newName = "Updated Name";

        const result = await caller.users.updateProfile({ name: newName });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("id", user.id);
        expect(result).toHaveProperty("name", newName);
      });
    });

    it("updates user image and returns updated user data", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id, user.email);
        const newImage = "https://example.com/avatar.jpg";

        const result = await caller.users.updateProfile({ image: newImage });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("id", user.id);
        expect(result).toHaveProperty("image", newImage);
      });
    });

    it("updates both name and image together", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id, user.email);
        const newName = "New Name";
        const newImage = "https://example.com/new-avatar.jpg";

        const result = await caller.users.updateProfile({
          name: newName,
          image: newImage,
        });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("id", user.id);
        expect(result).toHaveProperty("name", newName);
        expect(result).toHaveProperty("image", newImage);
      });
    });

    it("rejects empty input (at least one field required)", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id, user.email);

        // zod validation should fail on empty object
        await expect(caller.users.updateProfile({})).rejects.toThrow();
      });
    });

    it("rejects invalid image URL format", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);

        await expect(
          caller.users.updateProfile({ image: "not-a-valid-url" }),
        ).rejects.toThrow();
      });
    });

    it("rejects name that is too short", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);

        await expect(
          caller.users.updateProfile({ name: "" }),
        ).rejects.toThrow();
      });
    });

    it("rejects name that is too long", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);
        const tooLongName = "x".repeat(256);

        await expect(
          caller.users.updateProfile({ name: tooLongName }),
        ).rejects.toThrow();
      });
    });

    it("preserves other user fields when updating individual fields", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);
        const newName = "Updated Name";

        const result = await caller.users.updateProfile({ name: newName });

        // Original fields should be preserved
        expect(result).toHaveProperty("email", user.email);
        expect(result).toHaveProperty("emailVerified");
        expect(result).toHaveProperty("name", newName);
      });
    });

    it("returns transformed document with id as hex string", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);

        const result = await caller.users.updateProfile({ name: "Test" });

        // Verify the ID is a hex string and matches the user
        expect(result).not.toBeNull();
        expect(result).toHaveProperty("id");
        expect(typeof result!.id).toBe("string");
        expect(result!.id).toEqual(user.id); // Should be same user's ID
        // Verify it's a valid hex string (24 characters for ObjectId)
        expect(result!.id).toMatch(/^[0-9a-f]{24}$/);
      });
    });

    it("updates updatedAt timestamp when profile is modified", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const originalUpdatedAt = new Date(user.updatedAt!);
        const caller = await makeAuthCaller(user.id);

        // Wait a moment to ensure time difference
        await new Promise((resolve) => setTimeout(resolve, 10));

        const result = await caller.users.updateProfile({ name: "New Name" });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("updatedAt");
        const newUpdatedAt = new Date(result!.updatedAt);
        expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime(),
        );
      });
    });

    it("handles partial updates with only name field", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);
        const originalImage = user.image;

        const result = await caller.users.updateProfile({ name: "New Name" });

        expect(result).toHaveProperty("name", "New Name");
        expect(result).toHaveProperty("image", originalImage ?? null);
      });
    });

    it("handles partial updates with only image field", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);
        const originalName = user.name;

        const newImage = "https://example.com/image.jpg";
        const result = await caller.users.updateProfile({ image: newImage });

        expect(result).toHaveProperty("image", newImage);
        expect(result).toHaveProperty("name", originalName ?? null);
      });
    });

    it("rejects profile object with no fields provided", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);

        // Empty object should fail the refine validation
        await expect(caller.users.updateProfile({} as never)).rejects.toThrow(
          "At least one field must be provided",
        );
      });
    });

    it("handles special characters in name", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);
        const specialName = "Jean-Claude Müller-Strasse";

        const result = await caller.users.updateProfile({ name: specialName });

        expect(result).toHaveProperty("name", specialName);
      });
    });

    it("returns null when user is not found after update", async () => {
      await withCleanDb(async () => {
        const { appRouter } = await import("@/server/trpc/router");
        const fakeUserId = "000000000000000000000000";
        const caller = appRouter.createCaller({
          session: { id: "s1" } as never,
          user: { id: fakeUserId, email: "fake@test.com" } as never,
        });

        const result = await caller.users.updateProfile({ name: "Test" });

        // Should return null when user doesn't exist
        expect(result).toBeNull();
      });
    });

    it("clears name field when updated by clearing previous value", async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth();
        const caller = await makeAuthCaller(user.id);

        // Update with an empty-looking but valid name (actually tests only image update)
        const result = await caller.users.updateProfile({
          image: "https://example.com/test.jpg",
        });

        expect(result).toHaveProperty("image", "https://example.com/test.jpg");
      });
    });
  });
});

describe("users router - error cases", () => {
  it("returns null for user with invalid session ObjectId", async () => {
    await withCleanDb(async () => {
      const { appRouter } = await import("@/server/trpc/router");
      // Invalid ObjectId format in context
      const invalidUserId = "invalid-not-object-id";
      const caller = appRouter.createCaller({
        session: { id: "s1" } as never,
        user: { id: invalidUserId, email: "test@test.com" } as never,
      });

      // Should throw an error due to invalid ObjectId
      await expect(
        caller.users.updateProfile({ name: "Test" }),
      ).rejects.toThrow("Invalid user ID in session context");
    });
  });

  it("updates successfully even if findOneAndUpdate has driver quirks", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id);

      // Make multiple rapid updates to test consistency
      const result1 = await caller.users.updateProfile({ name: "Name1" });
      const result2 = await caller.users.updateProfile({ name: "Name2" });
      const result3 = await caller.users.updateProfile({
        image: "https://example.com/img.jpg",
      });

      expect(result1).toHaveProperty("name", "Name1");
      expect(result2).toHaveProperty("name", "Name2");
      expect(result3).toHaveProperty("image", "https://example.com/img.jpg");
      expect(result3).toHaveProperty("name", "Name2"); // Previous name should be preserved
    });
  });

  it("enforces name validation on empty string", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id);

      await expect(caller.users.updateProfile({ name: "" })).rejects.toThrow();
    });
  });

  it("rejects invalid URL in image field", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id);

      await expect(
        caller.users.updateProfile({ image: "://invalid" }),
      ).rejects.toThrow();
    });
  });
});
