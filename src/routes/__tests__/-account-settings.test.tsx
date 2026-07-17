import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUpdateUser = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  },
}))

import { SettingsPage, Route } from '@/routes/account_.settings'

function authState(theme: string | undefined, isPending = false) {
  return {
    session: { user: { id: 'u1', theme } },
    isPending,
    isLoggedIn: true,
  }
}

describe('/account/settings — beforeLoad', () => {
  it('redirects unauthenticated visitors to /auth/login', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({ context: { session: null }, location: { href: '/account/settings' } } as never)
      throw new Error('Should have thrown')
    } catch (err: unknown) {
      const e = err as { type?: string; options?: { to?: string; search?: { reason?: string } } }
      expect(e.type).toBe('redirect')
      expect(e.options?.to).toBe('/auth/login')
      expect(e.options?.search).toMatchObject({ reason: 'auth-required' })
    }
  })

  it('allows authenticated users', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) return
    expect(() => {
      beforeLoad({ context: { session: { user: { id: 'u1' } } }, location: { href: '/account/settings' } } as never)
    }).not.toThrow()
  })
})

describe('/account/settings — form', () => {
  beforeEach(() => {
    mockUpdateUser.mockReset()
  })

  it('shows a loading state while the session is pending', () => {
    mockUseAuth.mockReturnValue(authState(undefined, true))
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument()
  })

  it('renders the current theme as selected', () => {
    mockUseAuth.mockReturnValue(authState('dark-greens'))
    render(<SettingsPage />)
    expect(screen.getByRole('radio', { name: /dark \(greens\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('calls authClient.updateUser with the newly selected theme on save', async () => {
    mockUseAuth.mockReturnValue(authState('dark'))
    mockUpdateUser.mockResolvedValue({ data: {} })
    render(<SettingsPage />)

    act(() => {
      screen.getByRole('radio', { name: /light \(warm\)/i }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: /save/i }).click()
    })

    expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    expect(mockUpdateUser).toHaveBeenCalledWith({ theme: 'light-warm' })
  })

  it('shows a success state after a successful save', async () => {
    mockUseAuth.mockReturnValue(authState('dark'))
    mockUpdateUser.mockResolvedValue({ data: {} })
    render(<SettingsPage />)

    await act(async () => {
      screen.getByRole('button', { name: /save/i }).click()
    })

    expect(screen.getByTestId('settings-success')).toBeInTheDocument()
  })

  it('shows an inline error and keeps the selection when save fails', async () => {
    mockUseAuth.mockReturnValue(authState('dark'))
    mockUpdateUser.mockRejectedValue(new Error('network error'))
    render(<SettingsPage />)

    act(() => {
      screen.getByRole('radio', { name: /light \(warm\)/i }).click()
    })
    await act(async () => {
      screen.getByRole('button', { name: /save/i }).click()
    })

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('replaces the error state with success on a successful retry, without reloading', async () => {
    mockUseAuth.mockReturnValue(authState('dark'))
    mockUpdateUser.mockRejectedValueOnce(new Error('network error'))
    mockUpdateUser.mockResolvedValueOnce({ data: {} })
    render(<SettingsPage />)

    await act(async () => {
      screen.getByRole('button', { name: /save/i }).click()
    })
    expect(screen.getByTestId('settings-error')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: /save/i }).click()
    })

    expect(screen.queryByTestId('settings-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-success')).toBeInTheDocument()
  })
})
