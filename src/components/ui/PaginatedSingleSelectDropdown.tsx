import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, UIEvent } from 'react'
import { ChevronDown, X } from 'lucide-react'

export interface PaginatedOption {
  id: string
  name: string
  slug?: string | null
  url?: string | null
}

export interface PageResult {
  items: PaginatedOption[]
  nextCursor: number | null
}

interface PaginatedSingleSelectDropdownProps {
  id?: string
  value: string
  selectedName?: string
  onChange: (id: string, name: string) => void
  placeholder?: string
  emptyMessage?: string
  onOpenChange?: (open: boolean) => void
  onSearchChange?: (query: string) => void
  fetchPage: (cursor: number) => Promise<PageResult>
  fetchSearch: (query: string) => Promise<PaginatedOption[]>
}

const SCROLL_BOTTOM_THRESHOLD = 4
const SEARCH_DEBOUNCE_MS = 300

function RetryRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <li className="px-4 py-2 text-sm text-[var(--theme-fg-subtle)]">
      {message}{' '}
      <button
        type="button"
        onClick={onRetry}
        className="text-[var(--theme-accent)] hover:underline"
      >
        Retry
      </button>
    </li>
  )
}

// skipcq: JS-0067 -- ES module default export, not a global scope function; same
// suppression rationale as RecipeForm.tsx
export default function PaginatedSingleSelectDropdown({
  id,
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select an option…',
  emptyMessage = 'No items found',
  onOpenChange,
  onSearchChange,
  fetchPage,
  fetchSearch,
}: PaginatedSingleSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [browseItems, setBrowseItems] = useState<PaginatedOption[]>([])
  const [browseCursor, setBrowseCursor] = useState<number | null>(0)
  const [searchResults, setSearchResults] = useState<PaginatedOption[] | null>(null)
  const [hasFetchedFirstPage, setHasFetchedFirstPage] = useState(false)
  const [browseError, setBrowseError] = useState(false)
  const [nextPageError, setNextPageError] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [isLoadingFirstPage, setIsLoadingFirstPage] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Search requests get their own sequence counter so only the latest of two
  // overlapping searches is applied; browse-mode fetches are already
  // serialized by hasFetchedFirstPage/loadingNextPageRef and don't need one
  // (their results are harmless to apply even if a search started meanwhile,
  // since displayedOptions hides browseItems while a search is active).
  const searchSeqRef = useRef(0)
  const loadingNextPageRef = useRef(false)
  const loadingFirstPageRef = useRef(false)

  const isSearchActive = debouncedSearch.length > 0

  useEffect(() => {
    onOpenChange?.(open)
    if (!open) {
      setSearch('')
      setDebouncedSearch('')
      setSearchResults(null)
      setSearchError(false)
      setNextPageError(false)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [open, onOpenChange])

  useEffect(() => {
    // Only report live user input, not the internal reset-to-empty that
    // happens when the dropdown closes.
    if (!open) return
    onSearchChange?.(search)
  }, [search, open, onSearchChange])

  const runFirstPage = useCallback(() => {
    if (loadingFirstPageRef.current) return
    loadingFirstPageRef.current = true
    setIsLoadingFirstPage(true)
    fetchPage(0)
      .then((result) => {
        setHasFetchedFirstPage(true)
        setBrowseError(false)
        setBrowseItems(result.items)
        setBrowseCursor(result.nextCursor)
      })
      .catch(() => {
        setBrowseError(true)
      })
      .finally(() => {
        loadingFirstPageRef.current = false
        setIsLoadingFirstPage(false)
      })
  }, [fetchPage])

  // Fetch the first browsing-mode page once, the first time the dropdown opens.
  // hasFetchedFirstPage is only set on success so a failure can be retried.
  useEffect(() => {
    if (!open || hasFetchedFirstPage || loadingFirstPageRef.current) return
    runFirstPage()
  }, [open, hasFetchedFirstPage, runFirstPage])

  const debounceSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), SEARCH_DEBOUNCE_MS)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const runSearch = useCallback((query: string) => {
    const seq = ++searchSeqRef.current
    setIsLoadingSearch(true)
    fetchSearch(query)
      .then((results) => {
        if (seq !== searchSeqRef.current) return
        setSearchError(false)
        setSearchResults(results)
      })
      .catch(() => {
        if (seq !== searchSeqRef.current) return
        setSearchError(true)
      })
      .finally(() => {
        if (seq !== searchSeqRef.current) return
        setIsLoadingSearch(false)
      })
  }, [fetchSearch])

  // Search-mode fetch: each call gets its own sequence number so only the
  // most recent of two overlapping searches is applied.
  useEffect(() => {
    if (!open) return
    if (debouncedSearch.length === 0) {
      setSearchResults(null)
      setSearchError(false)
      return
    }
    runSearch(debouncedSearch)
  }, [debouncedSearch, open, runSearch])

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 0)

    function handleMouseDown(e: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function loadNextPage() {
    if (loadingNextPageRef.current || browseCursor === null) return
    loadingNextPageRef.current = true
    fetchPage(browseCursor)
      .then((result) => {
        setNextPageError(false)
        setBrowseItems((prev) => [...prev, ...result.items])
        setBrowseCursor(result.nextCursor)
      })
      .catch(() => {
        setNextPageError(true)
      })
      .finally(() => {
        loadingNextPageRef.current = false
      })
  }

  function handleListScroll(e: UIEvent<HTMLUListElement>) {
    if (isSearchActive || !hasFetchedFirstPage) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD) {
      loadNextPage()
    }
  }

  function selectOption(optionId: string, name: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    onChange(optionId, name)
    setOpen(false)
    setSearch('')
    setDebouncedSearch('')
  }

  function clearOption(e: MouseEvent) {
    e.stopPropagation()
    onChange('', '')
  }

  const isActive = !!value
  const displayedOptions = isSearchActive ? (searchResults ?? []) : browseItems

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-1 w-full">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex w-full items-center justify-between px-4 py-2 text-sm rounded-lg border transition-colors ${
            isActive
              ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-accent)]'
              : 'bg-[var(--theme-bg)] border-[var(--theme-border)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)]'
          }`}
        >
          <span className="truncate">{isActive ? (selectedName || value) : placeholder}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <button
            type="button"
            onClick={clearOption}
            aria-label="Clear option"
            className="p-2 text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[var(--theme-shadow-md)]">
          <div className="p-2 border-b border-[var(--theme-border)]">
            <input
              ref={inputRef}
              type="search"
              aria-label="Search options"
              placeholder="Search…"
              value={search}
              onChange={(e) => {
                const val = e.target.value
                setSearch(val)
                debounceSearch(val)
              }}
              className="w-full px-3 py-2 text-sm bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-md text-[var(--theme-fg)] placeholder:text-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
            />
          </div>

          <ul
            role="listbox"
            onScroll={handleListScroll}
            className="max-h-60 overflow-y-auto py-1"
          >
            {(isSearchActive ? isLoadingSearch : isLoadingFirstPage) && displayedOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[var(--theme-fg-subtle)]">Loading…</li>
            ) : isSearchActive && searchError ? (
              <RetryRow message="Search failed." onRetry={() => runSearch(debouncedSearch)} />
            ) : !isSearchActive && browseError ? (
              <RetryRow message="Failed to load sources." onRetry={runFirstPage} />
            ) : displayedOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[var(--theme-fg-subtle)]">{emptyMessage}</li>
            ) : (
              displayedOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === value}
                    onClick={() => selectOption(option.id, option.name)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--theme-surface-hover)] transition-colors ${
                      option.id === value ? 'text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-fg)]'
                    }`}
                  >
                    {option.name}
                  </button>
                </li>
              ))
            )}
            {!isSearchActive && nextPageError && (
              <RetryRow message="Failed to load more." onRetry={loadNextPage} />
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
