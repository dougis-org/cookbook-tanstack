import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

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
import PreferencesSection from '@/components/account/PreferencesSection'

function authState(
  theme: string | undefined,
  isPending = false,
  printPrefs: Partial<Record<string, boolean>> = {},
) {
  return {
    session: { user: { id: 'u1', theme, ...printPrefs } },
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

function renderPreferencesWithTheme(theme: string | undefined, isPending = false) {
  mockUseAuth.mockReturnValue(authState(theme, isPending))
  return render(<PreferencesSection />)
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

describe('PreferencesSection — theme selection', () => {
  beforeEach(() => {
    mockUpdateUser.mockReset()
  })

  it('shows a loading state while the session is pending', () => {
    renderPreferencesWithTheme(undefined, true)
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument()
  })

  it('renders the current theme as selected', () => {
    renderPreferencesWithTheme('dark-greens')
    expect(screen.getByRole('radio', { name: /dark \(greens\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('syncs the selection once a late-arriving session resolves', () => {
    mockUseAuth.mockReturnValue(authState(undefined, true))
    const { rerender } = render(<PreferencesSection />)
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument()

    mockUseAuth.mockReturnValue(authState('light-warm', false))
    rerender(<PreferencesSection />)

    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not clobber an in-progress manual pick when the session value changes (unsaved edit survives a session refresh)', () => {
    const { rerender } = renderPreferencesWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')

    mockUseAuth.mockReturnValue(authState('dark-greens'))
    rerender(<PreferencesSection />)

    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('ignores an invalid session theme value and falls back to the default', () => {
    renderPreferencesWithTheme('not-a-real-theme')
    expect(screen.getByRole('radio', { name: /dark \(blues\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('calls authClient.updateUser with the newly selected theme on save', async () => {
    mockUpdateUserSuccess()
    renderPreferencesWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    await clickSave()

    expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    expect(mockUpdateUser).toHaveBeenCalledWith(
      {
        theme: 'light-warm',
        printShowMeta: true,
        printShowIngredients: true,
        printShowInstructions: true,
        printShowNotes: true,
        printShowPersonalNotes: true,
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('shows a success state after a successful save', async () => {
    mockUpdateUserSuccess()
    renderPreferencesWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-success')).toBeInTheDocument()
  })

  it('resets a stale success/error message when a new theme is picked', async () => {
    mockUpdateUserSuccess()
    renderPreferencesWithTheme('dark')

    await clickSave()
    expect(screen.getByTestId('settings-success')).toBeInTheDocument()

    clickThemeRadio(/light \(warm\)/i)

    expect(screen.queryByTestId('settings-success')).not.toBeInTheDocument()
  })

  it('shows an inline error and keeps the selection when the API rejects the update (no thrown exception)', async () => {
    mockUpdateUserError('Your session has expired')
    renderPreferencesWithTheme('dark')

    clickThemeRadio(/light \(warm\)/i)
    await clickSave()

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByTestId('settings-error').textContent).toBe('Your session has expired')
    expect(screen.getByRole('radio', { name: /light \(warm\)/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('shows an inline error when authClient.updateUser rejects outright (not just via onError)', async () => {
    mockUpdateUser.mockRejectedValue(new Error('network exception'))
    renderPreferencesWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByTestId('settings-error').textContent).toBe('Unable to save. Try again.')
  })

  it('falls back to a generic error message when the API error has none', async () => {
    mockUpdateUser.mockImplementation((_body: unknown, opts: UpdateUserOpts) => {
      opts.onError?.({ error: {} })
      return Promise.resolve({ error: {} })
    })
    renderPreferencesWithTheme('dark')

    await clickSave()

    expect(screen.getByTestId('settings-error').textContent).toBe('Unable to save. Try again.')
  })

  it('replaces the error state with success on a successful retry, without reloading', async () => {
    mockUpdateUserError()
    renderPreferencesWithTheme('dark')

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
        <PreferencesSection />
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
        <PreferencesSection />
        <SiblingThemeConsumer />
      </>,
    )

    expect(screen.getByTestId('sibling-theme').textContent).toBe('light-warm')
  })
})

describe('PreferencesSection — print preferences', () => {
  beforeEach(() => {
    mockUpdateUser.mockReset()
  })

  it('renders a switch for each print preference, defaulting to on', () => {
    renderPreferencesWithTheme('dark')
    for (const name of [
      /prep\/cook time, servings, difficulty/i,
      /ingredients/i,
      /instructions/i,
      /^notes$/i,
      /personal notes/i,
    ]) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked()
    }
  })

  it('reflects an off preference from the session', () => {
    mockUseAuth.mockReturnValue(authState('dark', false, { printShowIngredients: false }))
    render(<PreferencesSection />)
    expect(screen.getByRole('checkbox', { name: /ingredients/i })).not.toBeChecked()
  })

  it('toggling one preference does not affect the others', () => {
    renderPreferencesWithTheme('dark')
    act(() => {
      screen.getByRole('checkbox', { name: /instructions/i }).click()
    })
    expect(screen.getByRole('checkbox', { name: /instructions/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /ingredients/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /^notes$/i })).toBeChecked()
  })

  it('saves toggled print preferences alongside theme', async () => {
    mockUpdateUserSuccess()
    renderPreferencesWithTheme('dark')

    act(() => {
      screen.getByRole('checkbox', { name: /personal notes/i }).click()
    })
    await clickSave()

    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ printShowPersonalNotes: false }),
      expect.anything(),
    )
  })

  it('a failed save keeps the toggle state as the user left it', async () => {
    mockUpdateUserError()
    renderPreferencesWithTheme('dark')

    act(() => {
      screen.getByRole('checkbox', { name: /^notes$/i }).click()
    })
    await clickSave()

    expect(screen.getByTestId('settings-error')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /^notes$/i })).not.toBeChecked()
  })
})
