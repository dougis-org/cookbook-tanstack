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
  ChevronDown,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, THEMES } from '@/contexts/ThemeContext'

type ThemeId = (typeof THEMES)[number]['id']

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [previewId, setPreviewId] = useState<ThemeId | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const { session, isPending } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locationSearch = useRouterState({ select: (s) => s.location.search })
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<ThemeId>(theme)
  const previewIdRef = useRef<ThemeId | null>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Keep refs in sync with state
  useEffect(() => { themeRef.current = theme }, [theme])
  useEffect(() => { previewIdRef.current = previewId }, [previewId])

  // Revert any pending preview on unmount (e.g. navigating away mid-preview)
  useEffect(() => {
    return () => {
      if (previewIdRef.current !== null) {
        document.documentElement.className = themeRef.current
      }
    }
  }, [])

  // When dropdown opens, focus the option matching the current display theme
  useEffect(() => {
    if (!dropdownOpen) return
    const idx = THEMES.findIndex((t) => t.id === (previewId ?? theme))
    setActiveIndex(idx >= 0 ? idx : 0)
  }, [dropdownOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the active option whenever activeIndex changes while dropdown is open
  useEffect(() => {
    if (dropdownOpen) {
      optionRefs.current[activeIndex]?.focus()
    }
  }, [dropdownOpen, activeIndex])

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

  // Click-outside: treat as Cancel if preview is pending, otherwise just close dropdown
  useEffect(() => {
    if (!dropdownOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
        if (previewId !== null) {
          document.documentElement.className = theme
          setPreviewId(null)
        }
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [dropdownOpen, previewId, theme])

  // Document-level Escape: close dropdown and revert preview from anywhere on the page
  useEffect(() => {
    if (!dropdownOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (previewId !== null) {
          document.documentElement.className = theme
          setPreviewId(null)
        }
        setDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dropdownOpen, previewId, theme])

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

  function handleSelect(id: ThemeId) {
    // Selecting the committed theme clears any pending preview
    if (id === theme) {
      setPreviewId(null)
    } else {
      setPreviewId(id)
    }
    document.documentElement.className = id
  }

  function handleOk() {
    if (previewId !== null) {
      setTheme(previewId)
      setPreviewId(null)
    }
    setDropdownOpen(false)
    setIsOpen(false)
  }

  function handleCancel() {
    document.documentElement.className = theme
    setPreviewId(null)
    setDropdownOpen(false)
    setIsOpen(false)
  }

  function handleContainerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && dropdownOpen) {
      e.preventDefault()
      if (previewId !== null) {
        document.documentElement.className = theme
        setPreviewId(null)
      }
      setDropdownOpen(false)
    }
  }

  function handleListboxKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % THEMES.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + THEMES.length) % THEMES.length)
        break
      case 'Enter':
        e.preventDefault()
        handleSelect(THEMES[activeIndex].id)
        break
    }
  }

  const displayTheme = previewId ?? theme
  const displayLabel = THEMES.find((t) => t.id === displayTheme)?.label ?? displayTheme

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
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] rounded-lg text-sm placeholder-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
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
                <ChefHat className="w-8 h-8 text-[var(--theme-accent)]" />
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
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--theme-accent)]"
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
                  className="w-full pl-9 pr-4 py-1.5 bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] rounded-lg text-sm placeholder-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
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
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--theme-accent)] pointer-events-none"
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
                    className="flex items-center gap-1.5 text-sm bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white px-3 py-1.5 rounded-lg transition-colors"
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

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--theme-overlay)] print:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[var(--theme-bg)] text-[var(--theme-fg)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-[var(--theme-accent)]" />
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
                'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
                'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
                'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
                'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
                  'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
                  'flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white transition-colors mb-2',
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
          <div ref={dropdownContainerRef} className="relative" onKeyDown={handleContainerKeyDown}>
            {/* Dropdown trigger */}
            <button
              data-testid="theme-dropdown-trigger"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--theme-surface-hover)] text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] transition-colors text-sm font-medium"
            >
              <span>{displayLabel}</span>
              <ChevronDown
                size={16}
                className={`text-[var(--theme-fg-subtle)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown options panel */}
            {dropdownOpen && (
              <div
                role="listbox"
                aria-label="Select theme"
                onKeyDown={handleListboxKeyDown}
                className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-lg overflow-hidden z-10"
              >
                {THEMES.map((t, i) => (
                  <div
                    key={t.id}
                    ref={(el) => { optionRefs.current[i] = el }}
                    role="option"
                    tabIndex={i === activeIndex ? 0 : -1}
                    aria-selected={t.id === (previewId ?? theme)}
                    onClick={() => { handleSelect(t.id); setActiveIndex(i) }}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors text-sm ${
                      t.id === (previewId ?? theme)
                        ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)]'
                        : 'text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)]'
                    }`}
                  >
                    <span
                      data-theme={t.id}
                      style={{ background: 'var(--theme-bg)' }}
                      className="w-4 h-4 rounded-full border border-[var(--theme-border)] flex-shrink-0"
                    />
                    {t.label}
                  </div>
                ))}
              </div>
            )}

            {/* OK / Cancel — only when a different theme is previewed */}
            {previewId !== null && previewId !== theme && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleOk}
                  className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-[var(--theme-accent)] text-[var(--theme-bg)] hover:bg-[var(--theme-accent-hover)] transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
