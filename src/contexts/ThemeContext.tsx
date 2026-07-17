import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth-client'

export const THEMES = [
  { id: 'dark', label: 'Dark (blues)' },
  { id: 'dark-greens', label: 'Dark (greens)' },
  { id: 'light-cool', label: 'Light (cool)' },
  { id: 'light-warm', label: 'Light (warm)' },
] as const

type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'dark'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function isValidThemeId(id: unknown): id is ThemeId {
  return typeof id === 'string' && THEMES.some((t) => t.id === id)
}

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem('cookbook-theme')
    if (isValidThemeId(stored)) {
      return stored
    }
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with 'dark' to match server-rendered HTML. React's hydration sees
  // no mismatch. The effects below correct both the DOM class and React state
  // from localStorage after mounting on the client.
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME)
  const { data: session } = useSession()
  // Tracks the current theme outside React state so the session-reconciliation effect
  // (below) can compare against the latest value without racing the async setThemeState
  // update or re-running every time `theme` changes. Every path that changes the theme
  // (mount, setTheme, reconciliation) must keep this ref in sync.
  const currentThemeRef = useRef<ThemeId>(DEFAULT_THEME)
  // Tracks the last server theme value the reconciliation effect has processed, so a
  // session refetch that returns the same (already-applied-or-superseded) value doesn't
  // re-fire reconciliation and clobber a manual pick made since. Only a genuinely new
  // server theme value triggers reconciliation.
  const lastSeenServerThemeRef = useRef<ThemeId | undefined>(undefined)

  function applyTheme(id: ThemeId) {
    currentThemeRef.current = id
    document.documentElement.className = id
    try {
      localStorage.setItem('cookbook-theme', id)
    } catch {
      // localStorage unavailable — ignore
    }
    setThemeState(id)
  }

  useEffect(() => {
    // The inline <script> in __root.tsx sets the DOM class before first paint (no flash).
    // This effect corrects both the DOM class and React state from localStorage after
    // mount, ensuring consumers (aria-pressed, conditional classNames) reflect the
    // stored theme and avoiding SSR useLayoutEffect warnings.
    const storedTheme = readStoredTheme()
    currentThemeRef.current = storedTheme
    document.documentElement.className = storedTheme
    setThemeState(storedTheme)
  }, [])

  useEffect(() => {
    // Post-hydration reconciliation only — localStorage remains authoritative for the
    // pre-hydration, flash-avoidance first paint. A mismatch here is expected to cause a
    // brief visible correction on a new/second device (accepted trade-off, see design.md).
    const serverTheme = session?.user?.theme
    if (!isValidThemeId(serverTheme)) return
    if (serverTheme === lastSeenServerThemeRef.current) return
    lastSeenServerThemeRef.current = serverTheme
    if (serverTheme === currentThemeRef.current) return

    applyTheme(serverTheme)
  }, [session])

  function setTheme(id: string) {
    if (!isValidThemeId(id)) return
    applyTheme(id)
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
