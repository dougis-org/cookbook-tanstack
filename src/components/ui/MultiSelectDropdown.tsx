import { useRef, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  id: string
  name: string
}

interface MultiSelectDropdownProps {
  options: Option[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder: string
  label: string
  labelPlural?: string
  counts?: Record<string, number>
  dataTestId?: string
  ariaLabel?: string
}

export function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder,
  label,
  labelPlural,
  counts,
  dataTestId,
  ariaLabel,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
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

  function buttonLabel() {
    if (selectedIds.length === 0) return placeholder
    if (selectedIds.length === 1) {
      return options.find((o) => o.id === selectedIds[0])?.name ?? placeholder
    }
    return `${selectedIds.length} ${labelPlural ?? `${label}s`}`
  }

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((v) => v !== id)
      : [...selectedIds, id]
    onChange(next)
  }

  const isActive = selectedIds.length > 0

  const sortedOptions = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    return [...options].sort((a, b) => {
      const aSelected = selectedSet.has(a.id)
      const bSelected = selectedSet.has(b.id)
      if (aSelected !== bSelected) return aSelected ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [options, selectedIds])

  return (
    <div ref={containerRef} className="relative" data-testid={dataTestId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={ariaLabel ? `${buttonLabel()} ${ariaLabel}` : undefined}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          isActive
            ? 'bg-[color:var(--theme-accent-subtle-bg)] border-[color:var(--theme-accent-subtle-border)] text-[var(--theme-accent-subtle-text)]'
            : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg-subtle)] hover:border-[var(--theme-border-muted)]'
        }`}
      >
        <span>{buttonLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-testid="dropdown-panel"
          className="absolute z-20 mt-1 min-w-[180px] max-h-64 overflow-y-auto rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--theme-fg-subtle)]">No options</p>
          ) : (
            <ul className="py-1">
              {sortedOptions.map((opt) => {
                const checked = selectedIds.includes(opt.id)
                const count = counts?.[opt.id]
                return (
                  <li key={opt.id}>
                    <label className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-[var(--theme-surface-hover)] transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.id)}
                        className="accent-cyan-500 w-3.5 h-3.5" /* theme-intentional: native checkbox accent-color, no CSS custom property equivalent */
                      />
                      <span className={checked ? 'text-[var(--theme-accent-subtle-text)]' : 'text-[var(--theme-fg)]'}>
                        {opt.name}
                        {count !== undefined && (
                          <span className="ml-1 text-[var(--theme-fg-subtle)]">({count})</span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelectDropdown
