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

  it('restores stored theme from localStorage on mount', async () => {
    localStorage.setItem('cookbook-theme', 'light')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    // useEffect fires after render; wait for state update
    await act(async () => {})
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.className).toBe('light')
  })

  it('setTheme writes to localStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    act(() => {
      screen.getByText('Light').click()
    })
    expect(localStorage.getItem('cookbook-theme')).toBe('light')
  })

  it('setTheme sets document.documentElement.className', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )
    act(() => {
      screen.getByText('Light').click()
    })
    expect(document.documentElement.className).toBe('light')
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
