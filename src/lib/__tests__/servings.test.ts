import { describe, it, expect } from "vitest";
import { scaleQuantity } from "@/lib/servings";

describe("scaleQuantity", () => {
  it("scales numeric values up", () => {
    expect(scaleQuantity("2 cups flour", 1.5)).toBe("3 cups flour");
  });

  it("scales numeric values down", () => {
    expect(scaleQuantity("4 tbsp sugar", 0.5)).toBe("2 tbsp sugar");
  });

  it("passes through non-numeric quantities unchanged", () => {
    expect(scaleQuantity("to taste", 2)).toBe("to taste");
  });

  it("rounds irrational decimals to at most 2 dp", () => {
    expect(scaleQuantity("1 cup milk", 1 / 3)).toBe("0.33 cup milk");
  });
});
