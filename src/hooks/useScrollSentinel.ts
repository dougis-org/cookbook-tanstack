import { useEffect, useRef } from "react";

/**
 * Fires `onIntersect` when the returned ref element enters the viewport,
 * but only while `enabled` is true.
 */
export function useScrollSentinel(
  onIntersect: () => void,
  enabled: boolean,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onIntersect();
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled, onIntersect]);

  return ref;
}
