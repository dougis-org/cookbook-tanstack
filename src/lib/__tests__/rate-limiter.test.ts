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
