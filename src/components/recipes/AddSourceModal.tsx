import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"

interface AddSourceModalProps {
  initialName?: string
  onClose: () => void
  onCreated: (source: { id: string; name: string }) => void
}

export default function AddSourceModal({
  initialName = "",
  onClose,
  onCreated,
}: AddSourceModalProps) {
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState("")
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const createMutation = useMutation(
    trpc.sources.create.mutationOptions({
      onSuccess: (source) => {
        queryClient.invalidateQueries({ queryKey: [["sources"]] })
        onCreated({ id: source.id, name: source.name })
      },
    }),
  )

  // Intentionally not a <form>: this modal renders inside RecipeForm's own
  // <form>, and a nested <form> risks submitting/navigating the outer form
  // instead of just running this mutation.
  function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    createMutation.mutate({
      name: trimmedName,
      url: url.trim() || undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Add New Source"
    >
      <div className="bg-[var(--theme-surface-raised)] rounded-lg shadow-[var(--theme-shadow-md)] p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-[var(--theme-fg)] mb-4">
          Add New Source
        </h2>
        <div onKeyDown={handleKeyDown}>
          <div className="mb-4">
            <label
              htmlFor="add-source-name"
              className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2"
            >
              Name
            </label>
            <input
              id="add-source-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="add-source-url"
              className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2"
            >
              URL (optional)
            </label>
            <input
              id="add-source-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
            />
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-500 mb-4">
              {createMutation.error?.message ?? "Failed to create source."}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name.trim()}
              className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Source"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
