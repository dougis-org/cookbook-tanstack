import { useEffect, useRef } from "react"

/**
 * Fires `onIntersect` once when the returned ref element enters the viewport,
 * but only while `enabled` is true. Resets after the element leaves the
 * viewport or when `enabled` flips off, so scroll-back-and-re-enter works.
 */
export function useScrollSentinel(
  onIntersect: () => void,
  enabled: boolean,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      hasFiredRef.current = false
      return
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      if (entry.isIntersecting) {
        if (!hasFiredRef.current) {
          hasFiredRef.current = true
          onIntersect()
        }
      } else {
        hasFiredRef.current = false
      }
    })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [enabled, onIntersect])

  return ref
}
