interface RateLimiterEntry {
  count: number
  windowStart: number
}

const EVICTION_THRESHOLD = 1000

export class RateLimiter {
  private limit: number
  private windowMs: number
  private records: Map<string, RateLimiterEntry> = new Map()

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
  }

  check(key: string): boolean {
    const now = Date.now()
    const entry = this.records.get(key)

    if (!entry) {
      return true
    }

    if (now >= entry.windowStart + this.windowMs) {
      this.records.delete(key)
      return true
    }

    return entry.count < this.limit
  }

  record(key: string): void {
    const now = Date.now()
    const entry = this.records.get(key)

    if (!entry) {
      if (this.records.size >= EVICTION_THRESHOLD) {
        this.evictExpired(now)
      }
      this.records.set(key, { count: 1, windowStart: now })
      return
    }

    if (now >= entry.windowStart + this.windowMs) {
      this.records.set(key, { count: 1, windowStart: now })
      return
    }

    entry.count++
  }

  tryConsume(key: string): boolean {
    const now = Date.now()
    const entry = this.records.get(key)

    if (!entry) {
      if (this.records.size >= EVICTION_THRESHOLD) {
        this.evictExpired(now)
      }
      this.records.set(key, { count: 1, windowStart: now })
      return true
    }

    if (now >= entry.windowStart + this.windowMs) {
      this.records.set(key, { count: 1, windowStart: now })
      return true
    }

    if (entry.count >= this.limit) {
      return false
    }

    entry.count++
    return true
  }

  private evictExpired(now: number): void {
    for (const [k, v] of this.records) {
      if (now >= v.windowStart + this.windowMs) {
        this.records.delete(k)
      }
    }
  }
}

export const urlImportRateLimiter = new RateLimiter(10, 60 * 60 * 1000)
