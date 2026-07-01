import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Save, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'

const PrivateRecipeNotes = ({ recipeId }: { recipeId: string }) => {
  const { canUsePrivateRecipeNotes } = useTierEntitlements()
  const queryClient = useQueryClient()

  const queryOptions = trpc.privateRecipeNotes.get.queryOptions({ recipeId })

  const { data, isLoading, isError } = useQuery({
    ...queryOptions,
    enabled: canUsePrivateRecipeNotes,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [saveError, setSaveError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus()
  }, [isEditing])

  const upsertMutation = useMutation(
    trpc.privateRecipeNotes.upsert.mutationOptions({
      onMutate: async ({ body }) => {
        await queryClient.cancelQueries({ queryKey: queryOptions.queryKey })
        const snapshot = queryClient.getQueryData(queryOptions.queryKey)
        queryClient.setQueryData(queryOptions.queryKey, {
          hasNote: true,
          note: { body, updatedAt: new Date() },
        })
        return { snapshot }
      },
      onError: (_err, _vars, context) => {
        queryClient.setQueryData(queryOptions.queryKey, context?.snapshot)
        setSaveError('Failed to save note. Please try again.')
      },
      onSuccess: () => {
        setIsEditing(false)
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey })
      },
    }),
  )

  if (!canUsePrivateRecipeNotes) return null

  if (isError) return null

  if (isLoading) {
    return (
      <div
        data-testid="private-notes-skeleton"
        className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden animate-pulse h-28"
      />
    )
  }

  const handleEdit = () => {
    setEditBody(data?.note?.body ?? '')
    setSaveError('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveError('')
  }

  const handleSave = () => {
    setSaveError('')
    upsertMutation.mutate({ recipeId, body: editBody })
  }

  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold text-[var(--theme-fg)]">Private Notes</h2>
        {!isEditing && data?.note && (
          <button
            aria-label="Edit note"
            onClick={handleEdit}
            className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            aria-label="Private note content"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={6}
            maxLength={10000}
            className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-[var(--theme-fg-subtle)]">{editBody.length} / 10000</span>
          </div>
          {saveError && <p className="text-[var(--theme-error)] text-sm mt-2">{saveError}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending || editBody === (data?.note?.body ?? '')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={upsertMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : data?.note ? (
        <p className="whitespace-pre-wrap text-[var(--theme-fg)]">{data.note.body}</p>
      ) : (
        <button
          onClick={handleEdit}
          className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors inline-flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Add a note
        </button>
      )}
    </div>
  )
}

export default PrivateRecipeNotes
