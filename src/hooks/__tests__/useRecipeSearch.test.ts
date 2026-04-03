// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import { trpc } from "@/lib/trpc";

// ── Mock tRPC ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/trpc", () => ({
  trpc: {
    recipes: {
      list: {
        infiniteQueryOptions: vi.fn((_input: unknown, _opts: unknown) => ({
          queryKey: ["recipes.list.infinite"],
        })),
      },
    },
  },
}));

// ── Mock useInfiniteQuery ──────────────────────────────────────────────────────
const buildMockData = (
  pages: Array<{ items: { id: string }[]; nextCursor?: number }>,
) => ({
  pages,
  pageParams: pages.map((_, i) => i + 1),
});

const mockFetchNextPage = vi.fn();
let mockUseInfiniteQueryResult = {
  data: buildMockData([{ items: [{ id: "r1" }] }]),
  hasNextPage: false,
  fetchNextPage: mockFetchNextPage,
  isFetchingNextPage: false,
  isLoading: false,
};

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useInfiniteQuery: () => mockUseInfiniteQueryResult,
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(trpc.recipes.list.infiniteQueryOptions).mockClear();
  mockUseInfiniteQueryResult = {
    data: buildMockData([{ items: [{ id: "r1" }] }]),
    hasNextPage: false,
    fetchNextPage: mockFetchNextPage,
    isFetchingNextPage: false,
    isLoading: false,
  };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useRecipeSearch", () => {
  it("returns initial data on mount", () => {
    const { result } = renderHook(() => useRecipeSearch());

    expect(result.current.recipes).toEqual([{ id: "r1" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes inputValue as empty string initially", () => {
    const { result } = renderHook(() => useRecipeSearch());
    expect(result.current.inputValue).toBe("");
  });

  it("updates inputValue immediately on typing", () => {
    const { result } = renderHook(() => useRecipeSearch());

    act(() => {
      result.current.onSearchChange("chi");
    });

    expect(result.current.inputValue).toBe("chi");
  });

  it("passes search=undefined when input is empty (not empty string)", () => {
    renderHook(() => useRecipeSearch());

    const spy = vi.mocked(trpc.recipes.list.infiniteQueryOptions);
    const firstCallInput = spy.mock.calls[0]?.[0] as { search?: string };
    expect(firstCallInput?.search).toBeUndefined();
  });

  it("fires the infinite query with the new search term after 300 ms", () => {
    const { result } = renderHook(() => useRecipeSearch());
    const spy = vi.mocked(trpc.recipes.list.infiniteQueryOptions);

    act(() => {
      result.current.onSearchChange("pasta");
    });

    const callCountBefore = spy.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(spy.mock.calls.length).toBeGreaterThan(callCountBefore);
    const lastCallInput = spy.mock.calls.at(-1)?.[0] as { search?: string };
    expect(lastCallInput?.search).toBe("pasta");
  });

  it("does NOT query with search term before 300 ms elapses", () => {
    const { result } = renderHook(() => useRecipeSearch());
    const spy = vi.mocked(trpc.recipes.list.infiniteQueryOptions);
    const countAfterMount = spy.mock.calls.length;

    act(() => {
      result.current.onSearchChange("pasta");
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    const callsWithPasta = spy.mock.calls
      .slice(countAfterMount)
      .filter((c) => (c[0] as { search?: string })?.search === "pasta");
    expect(callsWithPasta).toHaveLength(0);
  });

  it("exposes hasNextPage, fetchNextPage, isFetchingNextPage from useInfiniteQuery", () => {
    mockUseInfiniteQueryResult = {
      data: buildMockData([{ items: [{ id: "r1" }], nextCursor: 2 }]),
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      isFetchingNextPage: false,
      isLoading: false,
    };

    const { result } = renderHook(() => useRecipeSearch());

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(false);
    expect(result.current.fetchNextPage).toBe(mockFetchNextPage);
  });

  it("flattens pages into a single recipes array", () => {
    mockUseInfiniteQueryResult = {
      ...mockUseInfiniteQueryResult,
      data: buildMockData([
        { items: [{ id: "a" }, { id: "b" }], nextCursor: 2 },
        { items: [{ id: "c" }] },
      ]),
    };

    const { result } = renderHook(() => useRecipeSearch());

    expect(result.current.recipes).toEqual([
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
  });

  it("returns empty array when data is undefined", () => {
    mockUseInfiniteQueryResult = {
      ...mockUseInfiniteQueryResult,
      data: undefined as unknown as typeof mockUseInfiniteQueryResult["data"],
    };

    const { result } = renderHook(() => useRecipeSearch());

    expect(result.current.recipes).toEqual([]);
  });
});
