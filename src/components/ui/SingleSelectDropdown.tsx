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
}

export default function SingleSelectDropdown({
  options,
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select an option…',
  emptyMessage = 'No items found',
}: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false)
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
      ? options.filter(opt => {
          const name = opt.name.toLowerCase()
          let searchIdx = 0
          for (let i = 0; i < name.length; i++) {
            if (name[i] === searchLower[searchIdx]) {
              searchIdx++
            }
            if (searchIdx === searchLower.length) return true
          }
          return false
        })
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
            onClick={clearOption}
            aria-label="Clear option"
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
              placeholder="Search..."
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
            {displayedOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--theme-fg-subtle)]">{emptyMessage}</li>
            ) : (
              displayedOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => selectOption(option.id, option.name)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--theme-surface-hover)] transition-colors ${
                      option.id === value ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-fg-muted)]'
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
