import { describe, it, expect } from 'vitest'
import { isPageAdEligible, PageRole } from '@/lib/ad-policy'

describe('isPageAdEligible', () => {
  const rolesWithAds: PageRole[] = [
    'public-marketing',
    'public-content',
    'authenticated-home',
    'authenticated-task',
  ]
  const rolesWithoutAds: PageRole[] = ['auth', 'admin', 'account', 'print']

  describe('Anonymous viewers', () => {
    it('returns true on ad-enabled public roles', () => {
      rolesWithAds.forEach(role => {
        expect(isPageAdEligible(role, null)).toBe(true)
      })
    })

    it('returns false on restricted roles', () => {
      rolesWithoutAds.forEach(role => {
        expect(isPageAdEligible(role, null)).toBe(false)
      })
    })
  })

  describe('home-cook non-admin users', () => {
    const freeUser = { user: { tier: 'home-cook', isAdmin: false } }
    
    it('returns true on ad-enabled roles', () => {
      rolesWithAds.forEach(role => {
        expect(isPageAdEligible(role, freeUser as any)).toBe(true)
      })
    })

    it('returns false on restricted roles', () => {
      rolesWithoutAds.forEach(role => {
        expect(isPageAdEligible(role, freeUser as any)).toBe(false)
      })
    })
  })

  describe('Paid tiers', () => {
    const paidTiers = ['prep-cook', 'sous-chef', 'executive-chef']
    
    it('returns false even on public roles', () => {
      paidTiers.forEach(tier => {
        const paidUser = { user: { tier, isAdmin: false } }
        rolesWithAds.forEach(role => {
          expect(isPageAdEligible(role, paidUser as any)).toBe(false)
        })
      })
    })
  })

  describe('Admin users', () => {
    it('returns false even on free tier', () => {
      const adminUser = { user: { tier: 'home-cook', isAdmin: true } }
      rolesWithAds.forEach(role => {
        expect(isPageAdEligible(role, adminUser as any)).toBe(false)
      })
    })
  })

  describe('Missing or unknown tiers', () => {
    it('treats missing tier as home-cook (free/ad-supported)', () => {
      const unknownUser = { user: { tier: undefined, isAdmin: false } }
      expect(isPageAdEligible('public-content', unknownUser as any)).toBe(true)
    })

    it('treats unknown tier string as home-cook', () => {
      const unknownUser = { user: { tier: 'garbage', isAdmin: false } }
      expect(isPageAdEligible('public-content', unknownUser as any)).toBe(true)
    })

    it('treats prototype key (e.g. toString) as home-cook, not a valid tier', () => {
      const protoKeyUser = { user: { tier: 'toString', isAdmin: false } }
      expect(isPageAdEligible('public-content', protoKeyUser as any)).toBe(true)
    })
  })
})
