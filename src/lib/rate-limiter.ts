interface RateLimiterEntry {
  count: number
  windowStart: number
}

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

    // Check if window has expired
    if (now >= entry.windowStart + this.windowMs) {
      // Window expired, reset and allow
      this.records.delete(key)
      return true
    }

    // Window is active, check if under limit
    return entry.count < this.limit
  }

  record(key: string): void {
    const now = Date.now()
    const entry = this.records.get(key)

    if (!entry) {
      this.records.set(key, { count: 1, windowStart: now })
      return
    }

    // Check if window has expired
    if (now >= entry.windowStart + this.windowMs) {
      // Window expired, start new one
      this.records.set(key, { count: 1, windowStart: now })
      return
    }

    // Window is active, increment
    entry.count++
  }
}

export const urlImportRateLimiter = new RateLimiter(10, 60 * 60 * 1000)
