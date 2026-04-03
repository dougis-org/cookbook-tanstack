// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollSentinel } from "@/hooks/useScrollSentinel";

// Build a minimal IntersectionObserver mock
type IntersectCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: IntersectCallback | null = null;
let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockObserve = vi.fn();
  mockDisconnect = vi.fn(() => {
    observerCallback = null;
  });

  class MockIntersectionObserver {
    constructor(cb: IntersectCallback) {
      observerCallback = cb;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  observerCallback = null;
});

function fireIntersect(isIntersecting: boolean) {
  observerCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
}

describe("useScrollSentinel", () => {
  it("returns a ref object", () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useScrollSentinel(onIntersect, false));
    expect(result.current).toHaveProperty("current");
  });

  it("does NOT call onIntersect when enabled=false, even if element intersects", () => {
    const onIntersect = vi.fn();
    renderHook(() => useScrollSentinel(onIntersect, false));
    fireIntersect(true);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("calls onIntersect when enabled=true and element enters viewport", () => {
    const onIntersect = vi.fn();
    renderHook(() => useScrollSentinel(onIntersect, true));
    fireIntersect(true);
    expect(onIntersect).toHaveBeenCalledOnce();
  });

  it("does NOT call onIntersect when element leaves viewport (isIntersecting=false)", () => {
    const onIntersect = vi.fn();
    renderHook(() => useScrollSentinel(onIntersect, true));
    fireIntersect(false);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("disconnects observer on unmount", () => {
    const onIntersect = vi.fn();
    const { unmount } = renderHook(() => useScrollSentinel(onIntersect, true));
    unmount();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it("re-connects observer when enabled toggles true→false→true", () => {
    const onIntersect = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useScrollSentinel(onIntersect, enabled),
      { initialProps: { enabled: true } },
    );

    // Disable: sentinel should not fire
    rerender({ enabled: false });
    fireIntersect(true);
    expect(onIntersect).not.toHaveBeenCalled();

    // Re-enable and fire
    rerender({ enabled: true });
    fireIntersect(true);
    expect(onIntersect).toHaveBeenCalledOnce();
  });
});
