import { createElement } from 'react'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockUseSession = vi.fn()
const mockUseRouteContext = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMockForHooks } = await import('@/test-helpers/mocks')
  return createRouterMockForHooks(() => mockUseRouteContext())
})

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

import { AuthProvider, useAuth } from '../useAuth'

function authProviderWrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children)
}

function renderUseAuth() {
  return renderHook(() => useAuth(), { wrapper: authProviderWrapper })
}

function setServerSession(session: unknown) {
  mockUseRouteContext.mockReturnValue({ session })
}

function setClientSession(data: unknown, isPending = false) {
  mockUseSession.mockReturnValue({ data, isPending })
}

describe('useAuth', () => {
  it('returns isLoggedIn: true and userId when authenticated', () => {
    setServerSession(null)
    setClientSession({ user: { id: 'user-1', name: 'Test User' } })

    const { result } = renderUseAuth()

    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.userId).toBe('user-1')
    expect(result.current.isPending).toBe(false)
    expect(result.current.session).toEqual({ user: { id: 'user-1', name: 'Test User' } })
  })

  it('returns isLoggedIn: false and userId: null when unauthenticated', () => {
    setServerSession(null)
    setClientSession(null)

    const { result } = renderUseAuth()

    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
    expect(result.current.isPending).toBe(false)
    expect(result.current.session).toBe(null)
  })

  it('returns isPending: true when session is loading', () => {
    setServerSession(null)
    setClientSession(null, true)

    const { result } = renderUseAuth()

    expect(result.current.isPending).toBe(true)
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
  })

  it('falls back to the server session while the client session is still loading', () => {
    setServerSession({ user: { id: 'user-1', name: 'Server User' } })
    setClientSession(null, true)

    const { result } = renderUseAuth()

    expect(result.current.session).toEqual({
      user: { id: 'user-1', name: 'Server User' },
    })
    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.userId).toBe('user-1')
    expect(result.current.isPending).toBe(false)
  })

  it('prefers the resolved client null session over the server session fallback', () => {
    setServerSession({ user: { id: 'user-1', name: 'Server User' } })
    setClientSession(null)

    const { result } = renderUseAuth()

    expect(result.current.session).toBe(null)
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.userId).toBe(null)
    expect(result.current.isPending).toBe(false)
  })
})
