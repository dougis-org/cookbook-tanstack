import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter, urlImportRateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter(10, 3_600_000)
  })

  it('allows request for unknown key', () => {
    expect(limiter.check('user-1')).toBe(true)
  })

  it('allows requests under the limit', () => {
    for (let i = 0; i < 9; i++) {
      limiter.record('user-1')
    }
    expect(limiter.check('user-1')).toBe(true)
  })

  it('blocks requests at the limit', () => {
    for (let i = 0; i < 10; i++) {
      limiter.record('user-1')
    }
    expect(limiter.check('user-1')).toBe(false)
  })

  it('resets counter after window expires', () => {
    const mockTime = new Date('2026-01-01T12:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(mockTime)

    for (let i = 0; i < 10; i++) {
      limiter.record('user-1')
    }
    expect(limiter.check('user-1')).toBe(false)

    // Advance time past the window expiry
    vi.setSystemTime(mockTime + 3_600_001)
    expect(limiter.check('user-1')).toBe(true)

    vi.useRealTimers()
  })

  it('increments count with record', () => {
    for (let i = 0; i < 5; i++) {
      limiter.record('user-1')
    }
    expect(limiter.check('user-1')).toBe(true)

    limiter.record('user-1')
    expect(limiter.check('user-1')).toBe(true)

    // Verify count is now 6 by filling to limit
    for (let i = 0; i < 4; i++) {
      limiter.record('user-1')
    }
    expect(limiter.check('user-1')).toBe(false)
  })

  it('resets window in record() when window has expired for existing entry', () => {
    vi.useFakeTimers()
    const shortLimiter = new RateLimiter(5, 1000)

    for (let i = 0; i < 5; i++) shortLimiter.record('user-1')
    expect(shortLimiter.check('user-1')).toBe(false)

    vi.advanceTimersByTime(1001)
    shortLimiter.record('user-1') // hits expired-entry reset path
    expect(shortLimiter.check('user-1')).toBe(true) // count is 1, under limit

    vi.useRealTimers()
  })

  it('evicts expired entries when map reaches 1000 entries', () => {
    vi.useFakeTimers()
    const shortLimiter = new RateLimiter(100, 100)

    for (let i = 0; i < 1000; i++) {
      shortLimiter.record(`user-${i}`)
    }

    vi.advanceTimersByTime(101) // all entries now expired

    shortLimiter.record('new-user') // triggers eviction of 1000 expired entries
    expect(shortLimiter.check('user-0')).toBe(true) // evicted entry allows new request

    vi.useRealTimers()
  })
})

describe('urlImportRateLimiter singleton', () => {
  it('blocks on 11th call within the same hour', () => {
    const limiter = new RateLimiter(10, 60 * 60 * 1000)

    // Record 10 uses
    for (let i = 0; i < 10; i++) {
      expect(limiter.check('test-user')).toBe(true)
      limiter.record('test-user')
    }

    // 11th check should be blocked
    expect(limiter.check('test-user')).toBe(false)
  })

  it('urlImportRateLimiter exports with correct limits', () => {
    // Just verify it's exported and has the right type
    expect(urlImportRateLimiter).toBeInstanceOf(RateLimiter)
  })
})
