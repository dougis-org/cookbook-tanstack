import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExportButton from "@/components/recipes/ExportButton";
import type { Recipe } from "@/types/recipe";

const { downloadBlob } = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
}));

vi.mock("@/lib/download", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

const mockRecipe: Recipe = {
  id: "recipe-123",
  name: "Best Chili Ever!",
  userId: "user-1",
  ingredients: null,
  instructions: null,
  notes: null,
  servings: null,
  prepTime: null,
  cookTime: null,
  difficulty: null,
  sourceId: null,
  classificationId: null,
  dateAdded: null,
  calories: null,
  fat: null,
  cholesterol: null,
  sodium: null,
  protein: null,
  imageUrl: null,
  isPublic: true,
  marked: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("ExportButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports recipe JSON with a slugified filename", () => {
    render(<ExportButton recipe={mockRecipe} />);
    fireEvent.click(screen.getByRole("button", { name: /export/i }));

    expect(downloadBlob).toHaveBeenCalledTimes(1);

    const [json, filename, mimeType] = downloadBlob.mock.calls[0];
    expect(JSON.parse(json)).toMatchObject({
      id: "recipe-123",
      name: "Best Chili Ever!",
      _version: "1",
    });
    expect(filename).toBe("best-chili-ever.json");
    expect(mimeType).toBe("application/json");
  });

  it("logs an error and does not throw when downloadBlob fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    downloadBlob.mockImplementation(() => {
      throw new Error("blob error");
    });

    render(<ExportButton recipe={mockRecipe} />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /export/i }))
    ).not.toThrow();

    expect(consoleError).toHaveBeenCalledWith("Export failed", expect.any(Error));
  });
});
