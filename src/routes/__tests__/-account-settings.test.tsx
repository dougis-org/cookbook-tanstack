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

import { useAuth } from '@/hooks/useAuth'
import { SettingsPage, Route } from '@/routes/account_.settings'

function authState(theme: string | undefined, isPending = false) {
  return {
    session: { user: { id: 'u1', theme } },
    isPending,
    isLoggedIn: true,
  }
}

type UpdateUserOpts = { onSuccess?: () => void; onError?: (ctx: { error: { message?: string } }) => void }

function mockUpdateUserSuccess() {
  mockUpdateUser.mockImplementation((_body: unknown, opts: UpdateUserOpts) => {
    opts.onSuccess?.()
    return Promise.resolve({ data: {} })
  })
}

function mockUpdateUserError(message = 'Something went wrong') {
  mockUpdateUser.mockImplementation((_body: unknown, opts: UpdateUserOpts) => {
    opts.onError?.({ error: { message } })
    return Promise.resolve({ error: { message } })
  })
}

function renderSettingsWithTheme(theme: string | undefined, isPending = false) {
  mockUseAuth.mockReturnValue(authState(theme, isPending))
  return render(<SettingsPage />)
}

function clickThemeRadio(name: RegExp) {
  act(() => {
    screen.getByRole('radio', { name }).click()
  })
}

async function clickSave() {
  await act(async () => {
    screen.getByRole('button', { name: /save/i }).click()
  })
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
    renderSettingsWithTheme(undefined, true)
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument()
  })

  it('renders the current theme as selected', () => {
    renderSettingsWithTheme('dark-greens')
    expect(screen.getByRole('radio', { name: /dark \(greens\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('syncs the selection once a late-arriving session resolves', () => {
    mockUseAuth.mockReturnValue(authState(undefined, true))
    const { rerender } = render(<SettingsPage />)
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument()

    mockUseAuth.mockReturnValue(authState('light-warm', false))
    rerender(<SettingsPage />)

    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not clobber an in-progress manual pick when the session value changes', () => {
    const { rerender } = renderSettingsWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')

    mockUseAuth.mockReturnValue(authState('dark-greens'))
    rerender(<SettingsPage />)

    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('ignores an invalid session theme value and falls back to the default', () => {
    renderSettingsWithTheme('not-a-real-theme')
    expect(screen.getByRole('radio', { name: /dark \(blues\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('calls authClient.updateUser with the newly selected theme on save', async () => {
    mockUpdateUserSuccess()
    renderSettingsWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    await clickSave()

    expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    expect(mockUpdateUser).toHaveBeenCalledWith(
      { theme: 'light-warm' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('shows a success state after a successful save', async () => {
    mockUpdateUserSuccess()
    renderSettingsWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-success')).toBeInTheDocument()
  })

  it('resets a stale success/error message when a new theme is picked', async () => {
    mockUpdateUserSuccess()
    renderSettingsWithTheme('dark')

    await clickSave()
    expect(screen.getByTestId('settings-success')).toBeInTheDocument()

    clickThemeRadio(/light \(warm\)/i)

    expect(screen.queryByTestId('settings-success')).not.toBeInTheDocument()
  })

  it('shows an inline error and keeps the selection when the API rejects the update (no thrown exception)', async () => {
    mockUpdateUserError('Your session has expired')
    renderSettingsWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    await clickSave()

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByTestId('settings-error').textContent).toBe('Your session has expired')
    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('shows an inline error when authClient.updateUser rejects outright (not just via onError)', async () => {
    mockUpdateUser.mockRejectedValue(new Error('network exception'))
    renderSettingsWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByTestId('settings-error').textContent).toBe('Unable to save. Try again.')
  })

  it('falls back to a generic error message when the API error has none', async () => {
    mockUpdateUser.mockImplementation((_body: unknown, opts: UpdateUserOpts) => {
      opts.onError?.({ error: {} })
      return Promise.resolve({ error: {} })
    })
    renderSettingsWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-error').textContent).toBe('Unable to save. Try again.')
  })

  it('replaces the error state with success on a successful retry, without reloading', async () => {
    mockUpdateUserError()
    renderSettingsWithTheme('dark')

    await clickSave()
    expect(screen.getByTestId('settings-error')).toBeInTheDocument()

    mockUpdateUserSuccess()
    await clickSave()

    expect(screen.queryByTestId('settings-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-success')).toBeInTheDocument()
  })

  it('reflects the new theme in a sibling useAuth()/useSession() consumer right after save, without a manual refetch', async () => {
    mockUseAuth.mockReturnValue(authState('dark'))

    function SiblingThemeConsumer() {
      const { session } = useAuth()
      return <span data-testid="sibling-theme">{session?.user?.theme}</span>
    }

    const { rerender } = render(
      <>
        <SettingsPage />
        <SiblingThemeConsumer />
      </>,
    )
    expect(screen.getByTestId('sibling-theme').textContent).toBe('dark')

    // Simulates Better-Auth's default signal-based session refresh: a successful
    // updateUser call updates what useAuth()/useSession() returns immediately,
    // without the caller needing to invoke refetch() itself.
    mockUpdateUser.mockImplementation((body: { theme: string }, opts: UpdateUserOpts) => {
      mockUseAuth.mockReturnValue(authState(body.theme))
      opts.onSuccess?.()
      return Promise.resolve({ data: {} })
    })

    clickThemeRadio(/light \(warm\)/i)
    await clickSave()
    rerender(
      <>
        <SettingsPage />
        <SiblingThemeConsumer />
      </>,
    )

    expect(screen.getByTestId('sibling-theme').textContent).toBe('light-warm')
  })
})
