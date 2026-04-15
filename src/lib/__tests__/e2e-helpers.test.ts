import { describe, expect, it, vi } from "vitest";
import { getUniqueSuffix } from "@/e2e/helpers/utils";

describe("e2e utils helper", () => {
  describe("getUniqueSuffix", () => {
    it("returns a string matching the expected format", () => {
      const suffix = getUniqueSuffix();
      // Format: ${Date.now()}${crypto.randomUUID().slice(0, 8)} — no separator, safe for usernames
      expect(suffix).toMatch(/^\d+[0-9a-f]{8}$/);
    });

    it("incorporates timestamp and first 8 chars of randomUUID deterministically", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("abcdef12-3456-7890-abcd-ef1234567890");
      vi.spyOn(Date, "now").mockReturnValueOnce(1700000000000);
      expect(getUniqueSuffix()).toBe("1700000000000abcdef12");
    });
  });
});
