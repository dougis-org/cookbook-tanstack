import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option {
  id: string
  name: string
}

interface SingleSelectDropdownProps {
  options: Option[]
  value: string
  selectedName?: string
  onChange: (id: string, name: string) => void
  placeholder?: string
  emptyMessage?: string
  onOpenChange?: (open: boolean) => void
}

export default function SingleSelectDropdown({
  options,
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select an option…',
  emptyMessage = 'No items found',
  onOpenChange,
}: SingleSelectDropdownProps) {
  const [open, setOpenState] = useState(false)
  const setOpen = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setOpenState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      onOpenChange?.(next)
      return next
    })
  }, [onOpenChange])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debounceSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300)
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

  const displayedOptions = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase()
    
    const filtered = debouncedSearch.length > 0 
      ? options.filter(opt => opt.name.toLowerCase().includes(searchLower))
      : options

    // Sort options: selected value pinned to top, then alphabetical
    return [...filtered].sort((a, b) => {
      if (a.id === value) return -1
      if (b.id === value) return 1
      return a.name.localeCompare(b.name)
    })
  }, [options, debouncedSearch, value])

  function selectOption(id: string, name: string) {
    onChange(id, name)
    setOpen(false)
    setSearch('')
    setDebouncedSearch('')
  }

  function clearOption(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('', '')
  }

  const isActive = !!value && !!selectedName

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-1 w-full">
        <button
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
          <span className="truncate">{isActive ? selectedName : placeholder}</span>
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

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {displayedOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[var(--theme-fg-subtle)]">{emptyMessage}</li>
            ) : (
              displayedOptions.map((option) => (
                <li key={option.id} role="option" aria-selected={option.id === value}>
                  <button
                    type="button"
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
