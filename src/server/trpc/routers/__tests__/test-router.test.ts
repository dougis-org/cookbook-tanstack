// @vitest-environment node
import { describe, it, expect } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { makeAnonCaller, seedUserWithBetterAuth } from "./test-helpers";

describe("test.verifyEmail", () => {
  it("marks a user's email as verified", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const caller = await makeAnonCaller();

      const result = await caller.test.verifyEmail({ email: user.email });
      expect(result).toEqual({ success: true });
    });
  });

  it("throws NOT_FOUND for an unknown email", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.test.verifyEmail({ email: "nobody@example.com" }),
      ).rejects.toThrow("User not found");
    });
  });

  it("rejects an invalid email format", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.test.verifyEmail({ email: "not-an-email" }),
      ).rejects.toThrow();
    });
  });
});
