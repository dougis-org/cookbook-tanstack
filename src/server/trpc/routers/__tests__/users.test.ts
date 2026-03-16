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
  });
});
