import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockUseSession = vi.fn()
const mockUseRouteContext = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useRouteContext: () => mockUseRouteContext(),
  }),
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

import { useAuth } from '../useAuth'

describe('useAuth', () => {
  it('returns isLoggedIn: true and userId when authenticated', () => {
    mockUseRouteContext.mockReturnValue({ session: null })
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test User' } },
      isPending: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.userId).toBe('user-1')
    expect(result.current.isPending).toBe(false)
    expect(result.current.session).toEqual({ user: { id: 'user-1', name: 'Test User' } })
  })

  it('returns isLoggedIn: false and userId: null when unauthenticated', () => {
    mockUseRouteContext.mockReturnValue({ session: null })
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
    expect(result.current.isPending).toBe(false)
    expect(result.current.session).toBe(null)
  })

  it('returns isPending: true when session is loading', () => {
    mockUseRouteContext.mockReturnValue({ session: null })
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isPending).toBe(true)
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
  })

  it('falls back to the server session while the client session is still loading', () => {
    mockUseRouteContext.mockReturnValue({
      session: { user: { id: 'user-1', name: 'Server User' } },
    })
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.session).toEqual({
      user: { id: 'user-1', name: 'Server User' },
    })
    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.userId).toBe('user-1')
    expect(result.current.isPending).toBe(false)
  })

  it('prefers the resolved client null session over the server session fallback', () => {
    mockUseRouteContext.mockReturnValue({
      session: { user: { id: 'user-1', name: 'Server User' } },
    })
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.session).toBe(null)
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
    expect(result.current.isPending).toBe(false)
  })
})
