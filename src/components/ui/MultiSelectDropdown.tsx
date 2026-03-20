import { useRef, useEffect, useState } from 'react'
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

  return (
    <div ref={containerRef} className="relative" data-testid={dataTestId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={ariaLabel ? `${buttonLabel()} ${ariaLabel}` : undefined}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          isActive
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
            : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
        }`}
      >
        <span>{buttonLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-testid="dropdown-panel"
          className="absolute z-20 mt-1 min-w-[180px] max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No options</p>
          ) : (
            <ul className="py-1">
              {options.map((opt) => {
                const checked = selectedIds.includes(opt.id)
                const count = counts?.[opt.id]
                return (
                  <li key={opt.id}>
                    <label className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.id)}
                        className="accent-cyan-500 w-3.5 h-3.5"
                      />
                      <span className={checked ? 'text-cyan-300' : 'text-gray-300'}>
                        {opt.name}
                        {count !== undefined && (
                          <span className="ml-1 text-gray-500">({count})</span>
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
