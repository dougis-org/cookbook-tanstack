import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import PrivateRecipeNotes from '@/components/recipes/PrivateRecipeNotes'

const MAX_NOTE_LENGTH = 10000

interface RecipeFormPrivateNotesProps {
  recipeId: string | undefined
  publicNotes: string
  onMoved: () => void
}

export function combineNotes(existing: string, publicNotes: string): string {
  return existing.trim() ? `${existing}\n\n${publicNotes}` : publicNotes
}

export default function RecipeFormPrivateNotes({ recipeId, publicNotes, onMoved }: RecipeFormPrivateNotesProps) {
  const { isLoggedIn } = useAuth()
  const { canUsePrivateRecipeNotes } = useTierEntitlements()
  const queryClient = useQueryClient()
  const [isPanelEditing, setIsPanelEditing] = useState(false)
  const [moveError, setMoveError] = useState('')

  const queryOptions = trpc.privateRecipeNotes.get.queryOptions({ recipeId: recipeId ?? '' })
  const { data, isLoading, isError } = useQuery({
    ...queryOptions,
    enabled: Boolean(recipeId) && isLoggedIn && canUsePrivateRecipeNotes,
  })

  const moveMutation = useMutation(
    trpc.privateRecipeNotes.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey })
        onMoved()
      },
      onError: () => setMoveError('Could not move your notes. Please try again.'),
    }),
  )

  if (!recipeId) {
    return (
      <p className="text-sm text-[var(--theme-fg-muted)]">Save this recipe first to add private notes.</p>
    )
  }

  // Never offer Move without a successfully loaded private note: appending to an unknown body could overwrite it.
  const canMove = canUsePrivateRecipeNotes && !isError && Boolean(publicNotes.trim())

  const handleMove = () => {
    const body = combineNotes(data?.note?.body ?? '', publicNotes)
    if (body.length > MAX_NOTE_LENGTH) {
      setMoveError(`Your combined notes would exceed the ${MAX_NOTE_LENGTH} character limit.`)
      return
    }
    setMoveError('')
    moveMutation.mutate({ recipeId, body })
  }

  return (
    <div className="space-y-3">
      {canMove && (
        <div>
          <button
            type="button"
            onClick={handleMove}
            disabled={isLoading || isPanelEditing || moveMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Move to Private Notes
          </button>
          {moveError && <p className="text-[var(--theme-error)] text-sm mt-2">{moveError}</p>}
        </div>
      )}
      <PrivateRecipeNotes recipeId={recipeId} variant="embedded" onEditingChange={setIsPanelEditing} />
    </div>
  )
}
