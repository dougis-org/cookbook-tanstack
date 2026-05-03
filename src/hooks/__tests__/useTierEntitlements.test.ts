import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockUseAuth = vi.fn()

vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { useTierEntitlements } from '../useTierEntitlements'

function withTier(tier: string | null | undefined) {
  mockUseAuth.mockReturnValue({
    session: tier !== null ? { user: { id: 'u1', tier } } : null,
    isPending: false,
    isLoggedIn: tier !== null,
    userId: tier !== null ? 'u1' : null,
  })
}

describe('useTierEntitlements', () => {
  it('returns correct entitlements for home-cook', () => {
    withTier('home-cook')
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'home-cook',
      canCreatePrivate: false,
      canImport: false,
      recipeLimit: 10,
      cookbookLimit: 1,
    })
  })

  it('returns correct entitlements for prep-cook', () => {
    withTier('prep-cook')
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'prep-cook',
      canCreatePrivate: false,
      canImport: false,
      recipeLimit: 100,
      cookbookLimit: 10,
    })
  })

  it('returns elevated entitlements for sous-chef', () => {
    withTier('sous-chef')
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'sous-chef',
      canCreatePrivate: true,
      canImport: false,
      recipeLimit: 500,
      cookbookLimit: 25,
    })
  })

  it('returns max entitlements for executive-chef', () => {
    withTier('executive-chef')
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'executive-chef',
      canCreatePrivate: true,
      canImport: true,
      recipeLimit: 2500,
      cookbookLimit: 200,
    })
  })

  it('returns home-cook fallback when session is null', () => {
    withTier(null)
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'home-cook',
      canCreatePrivate: false,
      canImport: false,
      recipeLimit: 10,
      cookbookLimit: 1,
    })
  })

  it('returns home-cook fallback when tier is undefined on session user', () => {
    withTier(undefined)
    const { result } = renderHook(() => useTierEntitlements())
    expect(result.current).toEqual({
      tier: 'home-cook',
      canCreatePrivate: false,
      canImport: false,
      recipeLimit: 10,
      cookbookLimit: 1,
    })
  })
})
