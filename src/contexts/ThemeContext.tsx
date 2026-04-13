import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light-cool', label: 'Light (cool)' },
  { id: 'light-warm', label: 'Light (warm)' },
] as const

type ThemeId = (typeof THEMES)[number]['id']

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem('cookbook-theme')
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored as ThemeId
    }
  } catch {
    // localStorage unavailable — fall through to default
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with 'dark' to match server-rendered HTML. React's hydration sees
  // no mismatch. The effects below correct both the DOM class and React state
  // from localStorage after mounting on the client.
  const [theme, setThemeState] = useState<ThemeId>('dark')

  useEffect(() => {
    // The inline <script> in __root.tsx sets the DOM class before first paint (no flash).
    // This effect corrects both the DOM class and React state from localStorage after
    // mount, ensuring consumers (aria-pressed, conditional classNames) reflect the
    // stored theme and avoiding SSR useLayoutEffect warnings.
    const storedTheme = readStoredTheme()
    document.documentElement.className = storedTheme
    setThemeState(storedTheme)
  }, [])

  function setTheme(id: string) {
    if (!THEMES.some((t) => t.id === id)) return
    const validId = id as ThemeId
    document.documentElement.className = validId
    try {
      localStorage.setItem('cookbook-theme', validId)
    } catch {
      // localStorage unavailable — ignore
    }
    setThemeState(validId)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
