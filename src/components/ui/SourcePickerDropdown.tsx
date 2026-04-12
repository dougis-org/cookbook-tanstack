import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'

interface SourcePickerDropdownProps {
  value: string
  selectedName?: string
  onChange: (id: string, name: string) => void
  placeholder?: string
}

export default function SourcePickerDropdown({
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select a source…',
}: SourcePickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debounceSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 0)

    function handleMouseDown(e: MouseEvent) {
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

  const { data: allSources = [] } = useQuery({
    ...trpc.sources.list.queryOptions(),
    enabled: open && debouncedSearch.length === 0,
  })

  const { data: searchResults = [] } = useQuery({
    ...trpc.sources.search.queryOptions({ query: debouncedSearch }),
    enabled: open && debouncedSearch.length > 0,
  })

  const displayedSources = debouncedSearch.length > 0 ? searchResults : allSources

  function selectSource(id: string, name: string) {
    onChange(id, name)
    setOpen(false)
    setSearch('')
    setDebouncedSearch('')
  }

  function clearSource(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('', '')
  }

  const isActive = !!value && !!selectedName

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            isActive
              ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)] text-[var(--theme-accent)]'
              : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:border-[var(--theme-accent)]'
          }`}
        >
          <span>{isActive ? selectedName : placeholder}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <button
            type="button"
            onClick={clearSource}
            aria-label="Clear source"
            className="p-1 text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-64 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[var(--theme-shadow-md)]">
          <div className="p-2 border-b border-[var(--theme-border)]">
            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              placeholder="Search sources…"
              value={search}
              onChange={(e) => {
                const val = e.target.value
                setSearch(val)
                debounceSearch(val)
              }}
              className="w-full px-2 py-1 text-sm bg-[var(--theme-surface-raised)] border border-[var(--theme-border)] rounded text-[var(--theme-fg)] placeholder:text-[var(--theme-fg-subtle)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {displayedSources.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--theme-fg-subtle)]">No sources found</li>
            ) : (
              displayedSources.map((source) => (
                <li key={source.id}>
                  <button
                    type="button"
                    onClick={() => selectSource(source.id, source.name)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--theme-surface-hover)] transition-colors ${
                      source.id === value ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-fg-muted)]'
                    }`}
                  >
                    {source.name}
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
