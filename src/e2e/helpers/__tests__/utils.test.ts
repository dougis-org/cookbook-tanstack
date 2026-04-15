import { describe, expect, it } from "vitest";
import { getUniqueSuffix } from "../utils";

describe("e2e utils helper", () => {
  describe("getUniqueSuffix", () => {
    it("returns a string with a timestamp and 8-character random part", () => {
      const suffix = getUniqueSuffix();
      // Format: ${Date.now()}-${randomUUID().slice(0, 8)}
      const parts = suffix.split("-");
      expect(parts).toHaveLength(2);
      expect(Number(parts[0])).toBeGreaterThan(0);
      expect(parts[1]).toHaveLength(8);
    });

    it("generates unique values in a loop", () => {
      const suffixes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        suffixes.add(getUniqueSuffix());
      }
      expect(suffixes.size).toBe(100);
    });
  });
});
