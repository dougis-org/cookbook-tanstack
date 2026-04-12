import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  Home,
  Menu,
  BookOpen,
  ChefHat,
  Plus,
  Search,
  X,
  LogIn,
  UserPlus,
  LogOut,
  User,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, THEMES } from '@/contexts/ThemeContext'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { session, isPending } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locationSearch = useRouterState({ select: (s) => s.location.search })

  // Sync header input from URL ?search= param whenever route changes.
  // Cancel any pending debounce first to prevent stale navigations.
  // Preserve trailing spaces mid-typing: only update if trimmed values differ.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const search = (locationSearch as Record<string, unknown>).search
    const urlValue = typeof search === 'string' ? search : ''
    setInputValue((prev) => (urlValue === prev.trim() ? prev : urlValue))
  }, [locationSearch])

  // Cancel debounce on unmount to prevent navigation on an unmounted component
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [])

  async function handleSignOut() {
    try {
      await signOut()
      navigate({ to: '/auth/login' })
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsOpen(false)
    }
  }

  function debouncedNavigate(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ to: '/recipes', search: (prev) => ({ ...prev, page: undefined, search: value.trim() || undefined }) })
    }, 300)
  }

  return (
    <>
      <header className="site-header print:hidden p-4 flex items-center justify-between bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] shadow-lg">
        {mobileSearchOpen ? (
          <div className="flex items-center w-full gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-fg-subtle)] pointer-events-none"
                size={16}
              />
              <input
                autoFocus
                data-testid="header-search-input"
                type="search"
                value={inputValue}
                onChange={(e) => debouncedNavigate(e.target.value)}
                placeholder="Search recipes…"
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] rounded-lg text-sm placeholder-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onKeyDown={(e) => { if (e.key === 'Escape') setMobileSearchOpen(false) }}
              />
            </div>
            <button
              data-testid="header-search-close-btn"
              aria-label="Close search"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="ml-4 flex items-center gap-3">
                <ChefHat className="w-8 h-8 text-cyan-400" />
                <h1 className="text-xl font-semibold">CookBook</h1>
              </Link>
            </div>

            {/* Desktop search: always visible on md+ */}
            <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    <Search className="text-[var(--theme-fg-subtle)]" size={16} />
                    {inputValue.trim() && (
                      <span
                        data-testid="header-search-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400"
                      />
                    )}
                  </div>
                </div>
                <input
                  data-testid="header-search-input"
                  type="search"
                  value={inputValue}
                  onChange={(e) => debouncedNavigate(e.target.value)}
                  placeholder="Search recipes…"
                  className="w-full pl-9 pr-4 py-1.5 bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] rounded-lg text-sm placeholder-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile search icon button */}
              <div className="relative md:hidden">
                <button
                  data-testid="header-search-icon-btn"
                  aria-label="Search recipes"
                  onClick={() => setMobileSearchOpen(true)}
                  className="p-2 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors"
                >
                  <Search size={20} />
                </button>
                {inputValue.trim() && (
                  <span
                    data-testid="header-search-dot"
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none"
                  />
                )}
              </div>

              {isPending ? null : session ? (
                <>
                  <Link
                    to="/auth/profile"
                    className="flex items-center gap-2 text-sm text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-sm text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)]"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="flex items-center gap-1.5 text-sm text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)]"
                  >
                    <LogIn size={16} />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  <Link
                    to="/auth/register"
                    className="flex items-center gap-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[var(--theme-bg)] text-[var(--theme-fg)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold">CookBook</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/recipes"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
            }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Recipes</span>
          </Link>

          <Link
            to="/categories"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
            }}
          >
            <ChefHat size={20} />
            <span className="font-medium">Categories</span>
          </Link>

          <Link
            to="/cookbooks"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
            }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Cookbooks</span>
          </Link>

          {session && (
            <Link
              to="/recipes/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
              }}
            >
              <Plus size={20} />
              <span className="font-medium">New Recipe</span>
            </Link>
          )}

          {session && (
            <Link
              to="/import"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors mb-2',
              }}
            >
              <Plus size={20} />
              <span className="font-medium">Import Recipe</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-[var(--theme-border)] p-4">
          <p className="text-xs font-medium text-[var(--theme-fg-subtle)] mb-2 uppercase tracking-wider">
            Theme
          </p>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  theme === t.id
                    ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)]'
                    : 'bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
