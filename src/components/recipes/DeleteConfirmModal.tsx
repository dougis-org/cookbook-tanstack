interface DeleteConfirmModalProps {
  open: boolean
  recipeName: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

export default function DeleteConfirmModal({
  open,
  recipeName,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Delete Recipe</h2>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete <span className="font-semibold text-white">{recipeName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
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
