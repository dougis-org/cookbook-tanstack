import { describe, it, expect } from 'vitest'
import { TIER_RANK, hasAtLeastTier } from '@/types/user'

describe('TIER_RANK', () => {
  it("assigns rank 0 to 'home-cook'", () => {
    expect(TIER_RANK['home-cook']).toBe(0)
  })

  it("assigns rank 1 to 'prep-cook'", () => {
    expect(TIER_RANK['prep-cook']).toBe(1)
  })

  it("assigns rank 2 to 'sous-chef'", () => {
    expect(TIER_RANK['sous-chef']).toBe(2)
  })

  it("assigns rank 3 to 'executive-chef'", () => {
    expect(TIER_RANK['executive-chef']).toBe(3)
  })
})

describe('hasAtLeastTier()', () => {
  it('returns true for exact tier match', () => {
    expect(hasAtLeastTier({ tier: 'sous-chef', isAdmin: false }, 'sous-chef')).toBe(true)
  })

  it('returns true when user tier is higher than required', () => {
    expect(hasAtLeastTier({ tier: 'executive-chef', isAdmin: false }, 'prep-cook')).toBe(true)
  })

  it('returns false when user tier is below required', () => {
    expect(hasAtLeastTier({ tier: 'home-cook', isAdmin: false }, 'sous-chef')).toBe(false)
  })

  it('returns true when home-cook meets home-cook requirement', () => {
    expect(hasAtLeastTier({ tier: 'home-cook', isAdmin: false }, 'home-cook')).toBe(true)
  })

  it('returns true for admin user regardless of tier (admin bypass)', () => {
    expect(hasAtLeastTier({ tier: 'home-cook', isAdmin: true }, 'executive-chef')).toBe(true)
  })

  it('returns true for undefined tier meeting home-cook requirement', () => {
    expect(hasAtLeastTier({ tier: undefined, isAdmin: false }, 'home-cook')).toBe(true)
  })

  it('returns false for undefined tier against elevated requirement', () => {
    expect(hasAtLeastTier({ tier: undefined, isAdmin: false }, 'prep-cook')).toBe(false)
  })

  it('does not throw when tier is undefined', () => {
    expect(() => hasAtLeastTier({ tier: undefined, isAdmin: false }, 'sous-chef')).not.toThrow()
  })
})
