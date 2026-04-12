import { useEffect, useRef } from "react"
import FormError from "@/components/ui/FormError"

interface DeleteConfirmModalProps {
  open: boolean
  recipeName: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
  error?: string
}

export default function DeleteConfirmModal({
  open,
  recipeName,
  onConfirm,
  onCancel,
  isPending,
  error,
}: DeleteConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) {
        onCancel()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onCancel, isPending])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-[var(--theme-surface-raised)] border border-[var(--theme-border)] rounded-xl p-6 max-w-md w-full mx-4 shadow-[var(--theme-shadow-md)]">
        <h2 id="delete-modal-title" className="text-xl font-bold text-[var(--theme-fg)] mb-4">Delete Recipe</h2>
        <p className="text-[var(--theme-fg-muted)] mb-6">
          Are you sure you want to delete <span className="font-semibold text-[var(--theme-fg)]">{recipeName}</span>? This action cannot be undone.
        </p>
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
