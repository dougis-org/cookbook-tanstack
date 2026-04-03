// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useScrollSentinel } from "@/hooks/useScrollSentinel";

// Build a minimal IntersectionObserver mock
type IntersectCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: IntersectCallback | null = null;
let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;
let originalIntersectionObserver: typeof IntersectionObserver;

beforeEach(() => {
  originalIntersectionObserver = globalThis.IntersectionObserver;
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
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

function fireIntersect(isIntersecting: boolean) {
  observerCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
}

function Sentinel({
  onIntersect,
  enabled,
}: {
  onIntersect: () => void;
  enabled: boolean;
}) {
  const ref = useScrollSentinel(onIntersect, enabled);
  return <div ref={ref} data-testid="sentinel" />;
}

describe("useScrollSentinel", () => {
  it("observes the sentinel DOM element when enabled", () => {
    render(<Sentinel onIntersect={vi.fn()} enabled={true} />);
    const el = screen.getByTestId("sentinel");
    expect(mockObserve).toHaveBeenCalledWith(el);
  });

  it("does NOT call onIntersect when enabled=false, even if element intersects", () => {
    const onIntersect = vi.fn();
    render(<Sentinel onIntersect={onIntersect} enabled={false} />);
    expect(mockObserve).not.toHaveBeenCalled();
    fireIntersect(true);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("calls onIntersect when enabled=true and element enters viewport", () => {
    const onIntersect = vi.fn();
    render(<Sentinel onIntersect={onIntersect} enabled={true} />);
    expect(mockObserve).toHaveBeenCalledOnce();
    fireIntersect(true);
    expect(onIntersect).toHaveBeenCalledOnce();
  });

  it("does NOT call onIntersect when element leaves viewport (isIntersecting=false)", () => {
    const onIntersect = vi.fn();
    render(<Sentinel onIntersect={onIntersect} enabled={true} />);
    fireIntersect(false);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("does NOT call onIntersect multiple times for repeated intersection events", () => {
    const onIntersect = vi.fn();
    render(<Sentinel onIntersect={onIntersect} enabled={true} />);
    fireIntersect(true);
    fireIntersect(true);
    expect(onIntersect).toHaveBeenCalledOnce();
  });

  it("disconnects observer on unmount", () => {
    const onIntersect = vi.fn();
    const { unmount } = render(<Sentinel onIntersect={onIntersect} enabled={true} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it("re-connects observer when enabled toggles true→false→true", () => {
    const onIntersect = vi.fn();
    const { rerender } = render(<Sentinel onIntersect={onIntersect} enabled={true} />);

    // Disable: sentinel should not fire
    rerender(<Sentinel onIntersect={onIntersect} enabled={false} />);
    fireIntersect(true);
    expect(onIntersect).not.toHaveBeenCalled();

    // Re-enable and fire
    rerender(<Sentinel onIntersect={onIntersect} enabled={true} />);
    fireIntersect(true);
    expect(onIntersect).toHaveBeenCalledOnce();
  });
});
