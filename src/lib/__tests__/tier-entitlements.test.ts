import { describe, it, expect } from 'vitest'
import {
  TIER_LIMITS,
  getRecipeLimit,
  getCookbookLimit,
  showUserAds,
  canCreatePrivate,
  canImport,
} from '@/lib/tier-entitlements'

describe('TIER_LIMITS', () => {
  it('anonymous: 0 recipes, 0 cookbooks', () => {
    expect(TIER_LIMITS['anonymous']).toEqual({ recipes: 0, cookbooks: 0 })
  })
  it('home-cook: 10 recipes, 1 cookbook', () => {
    expect(TIER_LIMITS['home-cook']).toEqual({ recipes: 10, cookbooks: 1 })
  })
  it('prep-cook: 100 recipes, 10 cookbooks', () => {
    expect(TIER_LIMITS['prep-cook']).toEqual({ recipes: 100, cookbooks: 10 })
  })
  it('sous-chef: 500 recipes, 25 cookbooks', () => {
    expect(TIER_LIMITS['sous-chef']).toEqual({ recipes: 500, cookbooks: 25 })
  })
  it('executive-chef: 2500 recipes, 200 cookbooks', () => {
    expect(TIER_LIMITS['executive-chef']).toEqual({ recipes: 2500, cookbooks: 200 })
  })
})

describe('getRecipeLimit', () => {
  it.each([
    ['anonymous', 0],
    ['home-cook', 10],
    ['prep-cook', 100],
    ['sous-chef', 500],
    ['executive-chef', 2500],
  ] as const)('%s → %i', (tier, expected) => {
    expect(getRecipeLimit(tier)).toBe(expected)
  })
})

describe('getCookbookLimit', () => {
  it.each([
    ['anonymous', 0],
    ['home-cook', 1],
    ['prep-cook', 10],
    ['sous-chef', 25],
    ['executive-chef', 200],
  ] as const)('%s → %i', (tier, expected) => {
    expect(getCookbookLimit(tier)).toBe(expected)
  })
})

describe('showUserAds', () => {
  it.each([
    ['anonymous', true],
    ['home-cook', true],
    ['prep-cook', false],
    ['sous-chef', false],
    ['executive-chef', false],
  ] as const)('%s → %s', (tier, expected) => {
    expect(showUserAds(tier)).toBe(expected)
  })
})

describe('canCreatePrivate', () => {
  it.each([
    ['anonymous', false],
    ['home-cook', false],
    ['prep-cook', false],
    ['sous-chef', true],
    ['executive-chef', true],
  ] as const)('%s → %s', (tier, expected) => {
    expect(canCreatePrivate(tier)).toBe(expected)
  })
})

describe('canImport', () => {
  it.each([
    ['anonymous', false],
    ['home-cook', false],
    ['prep-cook', false],
    ['sous-chef', true],
    ['executive-chef', true],
  ] as const)('%s → %s', (tier, expected) => {
    expect(canImport(tier)).toBe(expected)
  })
})
