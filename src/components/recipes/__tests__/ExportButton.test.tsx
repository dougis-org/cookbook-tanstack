import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExportButton from "@/components/recipes/ExportButton";

const { getQueryData, downloadBlob } = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  downloadBlob: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ getQueryData }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    recipes: {
      byId: {
        queryOptions: (input: { id: string }) => ({
          queryKey: ["recipes.byId", input.id],
        }),
      },
    },
  },
}));

vi.mock("@/lib/download", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

describe("ExportButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports cached recipe JSON with a slugified filename", () => {
    getQueryData.mockReturnValue({
      id: "recipe-123",
      name: "Best Chili Ever!",
      userId: "user-1",
    });

    render(<ExportButton recipeId="recipe-123" />);
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

  it("does nothing when recipe is not present in cache", () => {
    getQueryData.mockReturnValue(undefined);

    render(<ExportButton recipeId="missing" />);
    fireEvent.click(screen.getByRole("button", { name: /export/i }));

    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
