import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme, THEMES } from '../ThemeContext'

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns dark as default theme when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
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
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    // useEffect fires after render; wait for state update
    await act(async () => {})
    expect(screen.getByTestId('theme').textContent).toBe('light-cool')
    expect(document.documentElement.className).toBe('light-cool')
  })

  it('setTheme("dark-greens") sets className and localStorage', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    await act(async () => {})
    act(() => {
      screen.getByText('Dark (greens)').click()
    })
    expect(document.documentElement.className).toBe('dark-greens')
    expect(localStorage.getItem('cookbook-theme')).toBe('dark-greens')
  })

  it('setTheme("light-cool") writes to localStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    act(() => {
      screen.getByText('Light (cool)').click()
    })
    expect(localStorage.getItem('cookbook-theme')).toBe('light-cool')
  })

  it('setTheme("light-cool") sets document.documentElement.className', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    act(() => {
      screen.getByText('Light (cool)').click()
    })
    expect(document.documentElement.className).toBe('light-cool')
  })

  it('setTheme("light") is rejected — no class or localStorage change occurs', async () => {
    render(
      <ThemeProvider>
        <LightLegacySetter />
      </ThemeProvider>,
    )
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
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
      ),
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
    render(
      <ThemeProvider>
        <BadSetter />
      </ThemeProvider>,
    )
    act(() => {
      screen.getByText('bad').click()
    })
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})
