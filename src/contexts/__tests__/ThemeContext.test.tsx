import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme, THEMES } from '../ThemeContext'

const mockUseSession = vi.fn<() => { data: { user: { theme: string } } | null }>(() => ({ data: null }))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

function TestConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => setTheme(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function renderWithTheme(children: React.ReactNode) {
  return render(<ThemeProvider>{children}</ThemeProvider>)
}

function LightLegacySetter() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light' as string)}>set-light-legacy</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    mockUseSession.mockReturnValue({ data: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('session reconciliation', () => {
    it('reconciles to session theme when it differs from localStorage on a new device', async () => {
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark-greens' } } })
      renderWithTheme(<TestConsumer />)
      await act(async () => {})
      expect(screen.getByTestId('theme').textContent).toBe('dark-greens')
      expect(document.documentElement.className).toBe('dark-greens')
      expect(localStorage.getItem('cookbook-theme')).toBe('dark-greens')
    })

    it('does not change theme when session matches localStorage', async () => {
      localStorage.setItem('cookbook-theme', 'light-cool')
      mockUseSession.mockReturnValue({ data: { user: { theme: 'light-cool' } } })
      renderWithTheme(<TestConsumer />)
      await act(async () => {})
      expect(screen.getByTestId('theme').textContent).toBe('light-cool')
      expect(document.documentElement.className).toBe('light-cool')
    })

    it('does not overwrite a manual theme pick with a stale session value on session refetch', async () => {
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark' } } })
      const { rerender } = renderWithTheme(<TestConsumer />)
      await act(async () => {})

      act(() => {
        screen.getByText('Dark (greens)').click()
      })
      expect(document.documentElement.className).toBe('dark-greens')

      // Session revalidates with a new object reference but the same (now-stale) theme value —
      // must not clobber the user's just-made manual pick.
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark' } } })
      rerender(<ThemeProvider><TestConsumer /></ThemeProvider>)
      await act(async () => {})

      expect(document.documentElement.className).toBe('dark-greens')
      expect(screen.getByTestId('theme').textContent).toBe('dark-greens')
    })

    it('is unaffected when there is no session (anonymous)', async () => {
      mockUseSession.mockReturnValue({ data: null })
      renderWithTheme(<TestConsumer />)
      await act(async () => {})
      expect(screen.getByTestId('theme').textContent).toBe('dark')
      expect(document.documentElement.className).toBe('dark')
    })

    it('reconciles again after logout and re-login with the same server theme', async () => {
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark-greens' } } })
      const { rerender } = renderWithTheme(<TestConsumer />)
      await act(async () => {})
      expect(document.documentElement.className).toBe('dark-greens')

      // Log out — reconciliation must not misfire, and must forget the last-seen value.
      mockUseSession.mockReturnValue({ data: null })
      rerender(<ThemeProvider><TestConsumer /></ThemeProvider>)
      await act(async () => {})

      // A different device set the local theme to 'dark' while logged out.
      act(() => {
        screen.getByText('Dark (blues)').click()
      })
      expect(document.documentElement.className).toBe('dark')

      // Log back in with the SAME server theme as before ('dark-greens'). Without the
      // logout reset, lastSeenServerThemeRef would still hold 'dark-greens' and this
      // reconciliation would be incorrectly skipped, leaving the stale 'dark' applied.
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark-greens' } } })
      rerender(<ThemeProvider><TestConsumer /></ThemeProvider>)
      await act(async () => {})

      expect(document.documentElement.className).toBe('dark-greens')
    })

    it('does not block first paint on session resolution', () => {
      mockUseSession.mockReturnValue({ data: { user: { theme: 'dark-greens' } } })
      // Reconciliation must not require awaiting a network/session promise before
      // render() returns — no synchronous wait is introduced by this effect.
      expect(() =>
        renderWithTheme(<TestConsumer />),
      ).not.toThrow()
    })
  })

  it('returns dark as default theme when localStorage is empty', () => {
    renderWithTheme(<TestConsumer />)
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('THEMES has four entries with correct labels', () => {
    expect(THEMES.length).toBe(4)
    const ids = THEMES.map((t) => t.id)
    expect(ids).toContain('dark')
    expect(ids).toContain('dark-greens')
    expect(ids).toContain('light-cool')
    expect(ids).toContain('light-warm')
    expect(THEMES.find((t) => t.id === 'dark')?.label).toBe('Dark (blues)')
    expect(THEMES.find((t) => t.id === 'dark-greens')?.label).toBe('Dark (greens)')
    expect(THEMES.find((t) => t.id === 'light-cool')?.label).toBe('Light (cool)')
    expect(THEMES.find((t) => t.id === 'light-warm')?.label).toBe('Light (warm)')
  })

  it('THEMES contains light-cool and not light', () => {
    const ids = THEMES.map((t) => t.id)
    expect(ids).toContain('light-cool')
    expect(ids).not.toContain('light')
    const lightCool = THEMES.find((t) => t.id === 'light-cool')
    expect(lightCool?.label).toBe('Light (cool)')
  })

  it('THEMES contains light-warm with correct label', () => {
    const lightWarm = THEMES.find((t) => t.id === 'light-warm')
    expect(lightWarm).toBeDefined()
    expect(lightWarm?.label).toBe('Light (warm)')
  })

  it('restores stored theme from localStorage on mount', async () => {
    localStorage.setItem('cookbook-theme', 'light-cool')
    renderWithTheme(<TestConsumer />)
    // useEffect fires after render; wait for state update
    await act(async () => {})
    expect(screen.getByTestId('theme').textContent).toBe('light-cool')
    expect(document.documentElement.className).toBe('light-cool')
  })

  it('setTheme("dark-greens") sets className and localStorage', async () => {
    renderWithTheme(<TestConsumer />)
    await act(async () => {})
    act(() => {
      screen.getByText('Dark (greens)').click()
    })
    expect(document.documentElement.className).toBe('dark-greens')
    expect(localStorage.getItem('cookbook-theme')).toBe('dark-greens')
  })

  it('setTheme("light-cool") writes to localStorage', () => {
    renderWithTheme(<TestConsumer />)
    act(() => {
      screen.getByText('Light (cool)').click()
    })
    expect(localStorage.getItem('cookbook-theme')).toBe('light-cool')
  })

  it('setTheme("light-cool") sets document.documentElement.className', () => {
    renderWithTheme(<TestConsumer />)
    act(() => {
      screen.getByText('Light (cool)').click()
    })
    expect(document.documentElement.className).toBe('light-cool')
  })

  it('setTheme("light") is rejected — no class or localStorage change occurs', async () => {
    renderWithTheme(<LightLegacySetter />)
    // Wait for mount effect to set className to 'dark'
    await act(async () => {})
    act(() => {
      screen.getByText('set-light-legacy').click()
    })
    expect(localStorage.getItem('cookbook-theme')).toBeNull()
    // className should remain 'dark' (set by mount effect), not changed to 'light'
    expect(document.documentElement.className).toBe('dark')
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('returns dark without error when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    expect(() =>
      renderWithTheme(<TestConsumer />),
    ).not.toThrow()
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('ignores unknown theme values from setTheme', () => {
    function BadSetter() {
      const { theme, setTheme } = useTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('rainbow' as string)}>bad</button>
        </div>
      )
    }
    renderWithTheme(<BadSetter />)
    act(() => {
      screen.getByText('bad').click()
    })
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})
