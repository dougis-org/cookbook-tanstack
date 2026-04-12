import type { ImportedRecipeInput } from '@/lib/validation'

interface ImportPreviewModalProps {
  open: boolean
  recipe: ImportedRecipeInput | null
  versionMismatch: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
  isPending: boolean
}

export default function ImportPreviewModal({
  open,
  recipe,
  versionMismatch,
  error,
  onCancel,
  onConfirm,
  isPending,
}: ImportPreviewModalProps) {
  if (!open || !recipe) return null

  const ingredientCount = (recipe.ingredients ?? '')
    .split('\n')
    .filter((line) => line.trim().length > 0).length

  const instructionSummary = (recipe.instructions ?? '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, 3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Import preview">
      <div className="w-full max-w-xl rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] p-6 shadow-[var(--theme-shadow-md)]">
        <h2 className="text-xl font-semibold text-[var(--theme-fg)] mb-4">Import Preview</h2>

        {versionMismatch && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-200 text-sm">
            This file was exported with a different schema version. You can still continue.
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <dt className="text-[var(--theme-fg-muted)]">Title</dt>
            <dd className="text-[var(--theme-fg)]">{recipe.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-fg-muted)]">Servings</dt>
            <dd className="text-[var(--theme-fg)]">{recipe.servings ?? 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-fg-muted)]">Difficulty</dt>
            <dd className="text-[var(--theme-fg)] capitalize">{recipe.difficulty ?? 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-fg-muted)]">Ingredient Count</dt>
            <dd className="text-[var(--theme-fg)]">{ingredientCount}</dd>
          </div>
        </dl>

        <div className="mb-4">
          <p className="text-[var(--theme-fg-muted)] text-sm mb-1">Instruction Preview</p>
          {instructionSummary.length === 0 ? (
            <p className="text-[var(--theme-fg-subtle)] text-sm">No instructions provided</p>
          ) : (
            <ul className="list-disc list-inside text-[var(--theme-fg-muted)] text-sm space-y-1">
              {instructionSummary.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white disabled:opacity-60"
          >
            {isPending ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
