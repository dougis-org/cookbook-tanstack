import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"
import PaginatedSingleSelectDropdown from "@/components/ui/PaginatedSingleSelectDropdown"
import type { PaginatedOption } from "@/components/ui/PaginatedSingleSelectDropdown"
import AddSourceModal from "./AddSourceModal"

interface RecipeSourcePickerProps {
  id?: string
  value: string
  initialName?: string
  onChange: (id: string) => void
  personalSourceName: string
  onPersonalSourceNameChange: (v: string) => void
}

export default function RecipeSourcePicker({
  id,
  value,
  initialName = "",
  onChange,
  personalSourceName,
  onPersonalSourceNameChange,
}: RecipeSourcePickerProps) {
  const [selectedName, setSelectedName] = useState(initialName)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const metaRef = useRef(new Map<string, PaginatedOption>())
  const lastSearchTextRef = useRef("")

  const handleSearchChange = useCallback((text: string) => {
    if (text) lastSearchTextRef.current = text
  }, [])

  const { data: selectedSource } = useQuery({
    ...trpc.sources.byId.queryOptions({ id: value }),
    enabled: !!value,
  })

  useEffect(() => {
    if (!value) {
      setSelectedName("")
      setSelectedSlug(null)
      return
    }
    if (metaRef.current.has(value)) return
    if (selectedSource) {
      setSelectedName(selectedSource.name)
      setSelectedSlug(selectedSource.slug ?? null)
    }
  }, [value, selectedSource])

  const isPersonalSelected = selectedSlug === "personal"

  const fetchPage = useCallback(
    async (cursor: number) => {
      const result = await queryClient.fetchQuery(
        trpc.sources.listPage.queryOptions({ cursor }),
      )
      for (const item of result.items) metaRef.current.set(item.id, item)
      return result
    },
    [queryClient],
  )

  const fetchSearch = useCallback(
    async (query: string) => {
      const items = await queryClient.fetchQuery(
        trpc.sources.search.queryOptions({ query }),
      )
      for (const item of items) metaRef.current.set(item.id, item)
      return items
    },
    [queryClient],
  )

  function handleChange(newId: string, newName: string) {
    onChange(newId)
    setSelectedName(newName)
    setSelectedSlug(newId ? (metaRef.current.get(newId)?.slug ?? null) : null)
  }

  function handleCreated(source: { id: string; name: string }) {
    metaRef.current.set(source.id, { id: source.id, name: source.name, slug: null })
    onChange(source.id)
    setSelectedName(source.name)
    setSelectedSlug(null)
    setIsModalOpen(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <PaginatedSingleSelectDropdown
            id={id}
            value={value}
            selectedName={selectedName}
            onChange={handleChange}
            onSearchChange={handleSearchChange}
            placeholder="Select a source…"
            emptyMessage="No sources found"
            fetchPage={fetchPage}
            fetchSearch={fetchSearch}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="whitespace-nowrap px-3 py-2 text-sm font-medium rounded-lg border border-[var(--theme-border)] text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-colors"
        >
          Add New Source
        </button>
      </div>

      {isPersonalSelected && (
        <div className="mt-4">
          <label
            htmlFor="personalSourceName"
            className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1"
          >
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
          <p
            id="personalSourceName-helper"
            className="mt-1.5 text-xs text-[var(--theme-fg-subtle)]"
          >
            Only you can see this.
          </p>
        </div>
      )}

      {isModalOpen && (
        <AddSourceModal
          initialName={lastSearchTextRef.current}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
