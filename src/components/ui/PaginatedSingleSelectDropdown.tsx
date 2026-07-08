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

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestSeqRef = useRef(0)
  const loadingNextPageRef = useRef(false)

  const isSearchActive = debouncedSearch.length > 0

  useEffect(() => {
    onOpenChange?.(open)
    if (!open) {
      setSearch('')
      setDebouncedSearch('')
      setSearchResults(null)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [open, onOpenChange])

  useEffect(() => {
    onSearchChange?.(search)
  }, [search, onSearchChange])

  // Fetch the first browsing-mode page once, the first time the dropdown opens.
  useEffect(() => {
    if (!open || hasFetchedFirstPage) return
    setHasFetchedFirstPage(true)
    const seq = ++requestSeqRef.current
    fetchPage(0).then((result) => {
      if (seq !== requestSeqRef.current) return
      setBrowseItems(result.items)
      setBrowseCursor(result.nextCursor)
    })
  }, [open, hasFetchedFirstPage, fetchPage])

  const debounceSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), SEARCH_DEBOUNCE_MS)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Search-mode fetch: starting a search bumps the request sequence so any
  // in-flight browsing-mode page fetch is discarded when it resolves.
  useEffect(() => {
    if (!open) return
    if (debouncedSearch.length === 0) {
      setSearchResults(null)
      return
    }
    const seq = ++requestSeqRef.current
    fetchSearch(debouncedSearch).then((results) => {
      if (seq !== requestSeqRef.current) return
      setSearchResults(results)
    })
  }, [debouncedSearch, open, fetchSearch])

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
    const seq = ++requestSeqRef.current
    fetchPage(browseCursor).then((result) => {
      loadingNextPageRef.current = false
      if (seq !== requestSeqRef.current) return
      setBrowseItems((prev) => [...prev, ...result.items])
      setBrowseCursor(result.nextCursor)
    })
  }

  function handleListScroll(e: UIEvent<HTMLUListElement>) {
    if (isSearchActive) return
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
              placeholder="Search..."
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
            {displayedOptions.length === 0 ? (
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
          </ul>
        </div>
      )}
    </div>
  )
}
