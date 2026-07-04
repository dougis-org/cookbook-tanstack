import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Save, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import { useAuth } from '@/hooks/useAuth'
import RecipeNotesUpgradeNudge from '@/components/recipes/RecipeNotesUpgradeNudge'

interface NoteData {
  hasNote: boolean
  note: { body: string; updatedAt: Date } | null
}

interface NoteBodyProps {
  isEditing: boolean
  data: NoteData | undefined
  editBody: string
  setEditBody: (v: string) => void
  saveError: string
  isPending: boolean
  savedBody: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onSave: () => void
  onCancel: () => void
  onAddNote: () => void
}

const NoteBody = ({
  isEditing,
  data,
  editBody,
  setEditBody,
  saveError,
  isPending,
  savedBody,
  textareaRef,
  onSave,
  onCancel,
  onAddNote,
}: NoteBodyProps) => {
  if (isEditing) {
    return (
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
            onClick={onSave}
            disabled={isPending || editBody === savedBody}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (data?.note?.body.trim()) {
    return <p className="whitespace-pre-wrap text-[var(--theme-fg)]">{data.note.body}</p>
  }

  return (
    <button
      onClick={onAddNote}
      className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors inline-flex items-center gap-2"
    >
      <Pencil className="w-4 h-4" />
      Add a note
    </button>
  )
}

interface EditButtonProps {
  visible: boolean
  onEdit: () => void
}

const EditButton = ({ visible, onEdit }: EditButtonProps) => {
  if (!visible) return null
  return (
    <button
      aria-label="Edit note"
      onClick={onEdit}
      className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
    >
      <Pencil className="w-4 h-4" />
    </button>
  )
}

const PrivateRecipeNotes = ({ recipeId }: { recipeId: string }) => {
  const { isLoggedIn } = useAuth()
  const { canUsePrivateRecipeNotes } = useTierEntitlements()
  const queryClient = useQueryClient()

  const queryOptions = trpc.privateRecipeNotes.get.queryOptions({ recipeId })

  const { data, isLoading, isError } = useQuery({
    ...queryOptions,
    enabled: isLoggedIn,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [saveError, setSaveError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
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

  if (!isLoggedIn) return <div className="mt-8 print:hidden"><RecipeNotesUpgradeNudge state="anonymous" /></div>
  if (isError) return null

  if (!canUsePrivateRecipeNotes) {
    if (isLoading) return null
    if (data?.hasNote) return <div className="mt-8 print:hidden"><RecipeNotesUpgradeNudge state="hidden-by-downgrade" /></div>
    return <div className="mt-8 print:hidden"><RecipeNotesUpgradeNudge state="below-tier" /></div>
  }

  if (isLoading) {
    return (
      <div
        data-testid="private-notes-skeleton"
        className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-sm)] p-6 mt-8 print:hidden animate-pulse h-28"
      />
    )
  }

  const savedBody = data?.note?.body ?? ''

  const handleEdit = () => {
    setEditBody(savedBody)
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
        <EditButton visible={!isEditing && Boolean(data?.note?.body?.trim())} onEdit={handleEdit} />
      </div>

      <NoteBody
        isEditing={isEditing}
        data={data}
        editBody={editBody}
        setEditBody={setEditBody}
        saveError={saveError}
        isPending={upsertMutation.isPending}
        savedBody={savedBody}
        textareaRef={textareaRef}
        onSave={handleSave}
        onCancel={handleCancel}
        onAddNote={handleEdit}
      />
    </div>
  )
}

export default PrivateRecipeNotes
