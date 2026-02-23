import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { trpc } from "@/lib/trpc"

interface SourceSelectorProps {
  value: string
  initialName?: string
  onChange: (id: string) => void
}

export default function SourceSelector({ value, initialName = "", onChange }: SourceSelectorProps) {
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
        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900">
          <span className="flex-1 text-white">{selectedName}</span>
          <button type="button" onClick={clearSource} className="text-gray-400 hover:text-white">
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
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
        />
      )}

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((source) => (
            <li key={source.id}>
              <button
                type="button"
                onMouseDown={() => selectSource(source.id, source.name)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
              >
                {source.name}
                {source.url && (
                  <span className="ml-2 text-gray-400 text-xs truncate">{source.url}</span>
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
                className="w-full text-left px-4 py-2 text-sm text-cyan-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating…" : `Create "${trimmedInput}"`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
