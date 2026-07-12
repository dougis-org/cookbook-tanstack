import { describe, it, expect } from "vitest";
import {
  titleSortKey,
  compareByTitle,
  sortIdsByTitle,
} from "@/lib/recipeTitleSort";

describe("recipeTitleSort", () => {
  describe("titleSortKey", () => {
    it("is case-insensitive", () => {
      expect(titleSortKey("banana Bread").localeCompare(titleSortKey("Apple Pie"))).toBeGreaterThan(0);
    });

    it("strips a leading 'The '", () => {
      expect(titleSortKey("The Best Chili")).toBe("best chili");
    });

    it("strips a leading 'A '", () => {
      expect(titleSortKey("A Great Soup")).toBe("great soup");
    });

    it("strips a leading 'An '", () => {
      expect(titleSortKey("An Amazing Cake")).toBe("amazing cake");
    });

    it("does not strip 'The' when it is the entire title", () => {
      expect(titleSortKey("The")).toBe("the");
    });

    it("does not strip 'A' or 'An' when they are the entire title", () => {
      expect(titleSortKey("A")).toBe("a");
      expect(titleSortKey("An")).toBe("an");
    });

    it("does not mistake an article-like word prefix for an article", () => {
      expect(titleSortKey("Apple Pie")).toBe("apple pie");
      expect(titleSortKey("Theodore")).toBe("theodore");
    });

    it("normalizes multiple internal spaces after an article", () => {
      expect(titleSortKey("The  Best Chili")).toBe("best chili");
    });

    it("trims leading and trailing whitespace before normalizing", () => {
      expect(titleSortKey("  The Best Chili  ")).toBe("best chili");
      expect(titleSortKey("   Apple Pie")).toBe("apple pie");
    });
  });

  describe("compareByTitle", () => {
    it("orders titles correctly ignoring articles and case", () => {
      const titles = ["The Best Chili", "A Great Soup", "An Amazing Cake"];
      const sorted = [...titles].sort(compareByTitle);
      expect(sorted).toEqual(["An Amazing Cake", "The Best Chili", "A Great Soup"]);
    });
  });

  describe("sortIdsByTitle", () => {
    it("returns ids in the same order as sorting the corresponding titles", () => {
      const items = [
        { id: "1", title: "The Best Chili" },
        { id: "2", title: "A Great Soup" },
        { id: "3", title: "An Amazing Cake" },
      ];
      const sortedIds = sortIdsByTitle(items, (item) => item.id, (item) => item.title);
      expect(sortedIds).toEqual(["3", "1", "2"]);
    });

    it("returns a stable order for two items with identical normalized titles", () => {
      const items = [
        { id: "1", title: "The Best Chili" },
        { id: "2", title: "the best chili" },
      ];
      // Should preserve the original relative order (1 before 2)
      const sortedIds = sortIdsByTitle(items, (item) => item.id, (item) => item.title);
      expect(sortedIds).toEqual(["1", "2"]);
    });
  });
});
