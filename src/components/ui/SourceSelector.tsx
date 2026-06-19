import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { trpc } from "@/lib/trpc"

interface CachedSource {
  id?: string
  _id?: string
  name: string
  slug: string
  url?: string | null
}

interface SourceSelectorProps {
  value: string
  initialName?: string
  onChange: (id: string) => void
  personalSourceName: string
  onPersonalSourceNameChange: (v: string) => void
}

export default function SourceSelector({
  value,
  initialName = "",
  onChange,
  personalSourceName,
  onPersonalSourceNameChange,
}: SourceSelectorProps) {
  const [inputText, setInputText] = useState("")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState(initialName)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const debouncedQuery = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(q), 300)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const { data: results = [] } = useQuery({
    ...trpc.sources.search.queryOptions({ query }),
    enabled: query.length > 0,
  })

  const { data: selectedSource } = useQuery({
    ...trpc.sources.byId.queryOptions({ id: value }),
    enabled: !!value,
  })

  // Synchronously scan cache to prevent visual flickering/layout jump
  const cachedSource = (() => {
    if (!value) return null
    
    // Check byId query data directly if present
    const byIdQueryKey = trpc.sources.byId.queryOptions({ id: value }).queryKey
    const cachedById = queryClient.getQueryData<CachedSource>(byIdQueryKey)
    if (cachedById) return cachedById

    // Scan all cached query arrays (e.g. search/list results) under sources
    const queries = queryClient.getQueryCache().getAll()
    for (const q of queries) {
      const firstKey = q.queryKey[0]
      const isSourcesQuery =
        (Array.isArray(firstKey) && firstKey.includes("sources")) ||
        firstKey === "sources"
      if (!isSourcesQuery) continue

      const data = q.state.data
      if (!data) continue
      
      if (Array.isArray(data)) {
        const found = data.find((item: unknown) => {
          const s = item as CachedSource | null | undefined
          return s && (s.id === value || s._id === value)
        })
        if (found) return found as CachedSource
      } else if (typeof data === "object") {
        const s = data as CachedSource
        if (s && (s.id === value || s._id === value)) {
          return s
        }
      }
    }
    return null
  })()

  useEffect(() => {
    if (!value) {
      setSelectedName("")
    } else {
      const name = selectedSource?.name || cachedSource?.name
      if (name) {
        setSelectedName(name)
      }
    }
  }, [value, selectedSource, cachedSource])

  const selectedFromSearch = results.find((r) => r.id === value)
  const isPersonalSelected =
    (selectedName?.toLowerCase() === "personal") ||
    (selectedSource?.slug === "personal") ||
    (selectedFromSearch?.slug === "personal") ||
    (cachedSource?.slug === "personal")

  const createMutation = useMutation(
    trpc.sources.create.mutationOptions({
      onSuccess: (source) => {
        queryClient.invalidateQueries({ queryKey: [["sources"]] })
        selectSource(source.id, source.name)
      },
    }),
  )

  function selectSource(id: string, name: string) {
    onChange(id)
    setSelectedName(name)
    setInputText("")
    setQuery("")
    setOpen(false)
  }

  function clearSource() {
    onChange("")
    setSelectedName("")
    setInputText("")
    setQuery("")
  }

  const trimmedInput = inputText.trim()
  const showDropdown = open && inputText.length > 0
  const hasResults = results.length > 0

  return (
    <div ref={containerRef} className="relative">
      {value && selectedName ? (
        <div className="flex items-center gap-2 px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-bg)]">
          <span className="flex-1 text-[var(--theme-fg)]">{selectedName}</span>
          <button type="button" onClick={clearSource} className="text-[var(--theme-fg-subtle)] hover:text-[var(--theme-fg)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="Search for a source..."
          value={inputText}
          onChange={(e) => {
            const val = e.target.value
            setInputText(val)
            if (!val.trim()) {
              setQuery("")
            } else {
              debouncedQuery(val.trim())
            }
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
        />
      )}

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg shadow-[var(--theme-shadow-md)] max-h-48 overflow-y-auto">
          {results.map((source) => (
            <li key={source.id}>
              <button
                type="button"
                onMouseDown={() => selectSource(source.id, source.name)}
                className="w-full text-left px-4 py-2 text-sm text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-colors"
              >
                {source.name}
                {source.url && (
                  <span className="ml-2 text-[var(--theme-fg-subtle)] text-xs truncate">{source.url}</span>
                )}
              </button>
            </li>
          ))}
          {!hasResults && trimmedInput.length > 0 && (
            <li>
              <button
                type="button"
                disabled={createMutation.isPending}
                onMouseDown={() => createMutation.mutate({ name: trimmedInput })}
                className="w-full text-left px-4 py-2 text-sm text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating…" : `Create "${trimmedInput}"`}
              </button>
            </li>
          )}
        </ul>
      )}

      {isPersonalSelected && (
        <div className="mt-4">
          <label htmlFor="personalSourceName" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">
            Personal Name
          </label>
          <input
            id="personalSourceName"
            type="text"
            placeholder="e.g. Aunt Mary"
            maxLength={80}
            value={personalSourceName || ""}
            onChange={(e) => onPersonalSourceNameChange(e.target.value)}
            aria-describedby="personalSourceName-helper"
            className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
          />
          <p id="personalSourceName-helper" className="mt-1.5 text-xs text-[var(--theme-fg-subtle)]">
            Only you can see this.
          </p>
        </div>
      )}
    </div>
  )
}
