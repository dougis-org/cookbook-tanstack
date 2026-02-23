import { useState, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import CookbookFields from '@/components/cookbooks/CookbookFields'
import { GripVertical, X, Plus, Pencil, Trash2, Printer, List } from 'lucide-react'

export const Route = createFileRoute('/cookbooks/$cookbookId')({
  component: CookbookDetailPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface CookbookRecipe {
  id: string
  name: string
  imageUrl?: string | null
  prepTime?: number | null
  cookTime?: number | null
  servings?: number | null
  classificationName?: string | null
  orderIndex?: number | null
}

/** Discriminated union replaces four separate boolean/nullable modal states. */
type Modal =
  | { kind: 'none' }
  | { kind: 'addRecipe' }
  | { kind: 'editCookbook' }
  | { kind: 'deleteCookbook' }
  | { kind: 'removeRecipe'; recipe: CookbookRecipe }

// ─── Page ─────────────────────────────────────────────────────────────────────

function CookbookDetailPage() {
  const { cookbookId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)

  const closeModal = () => setModal({ kind: 'none' })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [['cookbooks']] })

  const { data: cookbook, isLoading } = useQuery(
    trpc.cookbooks.byId.queryOptions({ id: cookbookId }),
  )

  const deleteMutation = useMutation(
    trpc.cookbooks.delete.mutationOptions({
      onSuccess: () => { invalidate(); navigate({ to: '/cookbooks' }) },
    }),
  )

  const removeMutation = useMutation(
    trpc.cookbooks.removeRecipe.mutationOptions({
      onSuccess: () => { invalidate(); closeModal(); setLocalOrder(null) },
    }),
  )

  const reorderMutation = useMutation(trpc.cookbooks.reorderRecipes.mutationOptions())

  const recipes: CookbookRecipe[] = cookbook?.recipes ?? []
  const orderedIds = localOrder ?? recipes.map((r) => r.id)
  const orderedRecipes = orderedIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is CookbookRecipe => r !== undefined)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const newOrder = arrayMove(
        orderedIds,
        orderedIds.indexOf(active.id as string),
        orderedIds.indexOf(over.id as string),
      )
      setLocalOrder(newOrder)
      reorderMutation.mutate(
        { cookbookId, recipeIds: newOrder },
        { onSuccess: () => { invalidate(); setLocalOrder(null) }, onError: () => setLocalOrder(null) },
      )
    },
    [cookbookId, orderedIds, queryClient, reorderMutation],
  )

  if (isLoading) {
    return <PageLayout><p className="text-gray-400 text-center py-12">Loading…</p></PageLayout>
  }

  if (!cookbook) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">Cookbook not found.</p>
          <Link to="/cookbooks" className="text-cyan-400 hover:text-cyan-300">Back to Cookbooks</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-gray-400 text-sm mb-1">
              <Link to="/cookbooks" className="hover:text-cyan-400 transition-colors">Cookbooks</Link>
              {' / '}
              <span className="text-gray-300">{cookbook.name}</span>
            </p>
            <h1 className="text-4xl font-bold text-white">{cookbook.name}</h1>
            {cookbook.description && (
              <p className="text-gray-300 mt-2 max-w-2xl">{cookbook.description}</p>
            )}
            <p className="text-gray-400 text-sm mt-2">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              {!cookbook.isPublic && (
                <span className="ml-3 px-2 py-0.5 text-xs bg-slate-700 text-gray-300 rounded">Private</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cookbooks/$cookbookId/toc"
              params={{ cookbookId }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <List className="w-4 h-4" />
              Table of Contents
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => setModal({ kind: 'editCookbook' })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setModal({ kind: 'deleteCookbook' })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {modal.kind === 'editCookbook' && (
        <EditCookbookModal cookbook={cookbook} onClose={closeModal} />
      )}

      {modal.kind === 'deleteCookbook' && (
        <ConfirmModal
          title="Delete Cookbook"
          body={<>Are you sure you want to permanently delete <strong className="text-white">{cookbook.name}</strong>? This cannot be undone.</>}
          confirmLabel="Delete"
          danger
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate({ id: cookbookId })}
          onCancel={closeModal}
        />
      )}

      {modal.kind === 'removeRecipe' && (
        <ConfirmModal
          title="Remove Recipe"
          body={<>Remove <strong className="text-white">{modal.recipe.name}</strong> from this cookbook?</>}
          confirmLabel="Remove"
          danger
          isPending={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate({ cookbookId, recipeId: modal.recipe.id })}
          onCancel={closeModal}
        />
      )}

      {modal.kind === 'addRecipe' && (
        <AddRecipeModal
          cookbookId={cookbookId}
          existingRecipeIds={recipes.map((r) => r.id)}
          onClose={() => { closeModal(); setLocalOrder(null) }}
        />
      )}

      {/* Recipe list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Recipes</h2>
          <button
            onClick={() => setModal({ kind: 'addRecipe' })}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Recipe
          </button>
        </div>

        {orderedRecipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No recipes in this cookbook yet.</p>
            <button
              onClick={() => setModal({ kind: 'addRecipe' })}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Add your first recipe
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              {orderedRecipes.map((recipe, index) => (
                <SortableRecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  onRemove={() => setModal({ kind: 'removeRecipe', recipe })}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </PageLayout>
  )
}

// ─── Sortable Recipe Row ──────────────────────────────────────────────────────

function SortableRecipeRow({
  recipe,
  index,
  onRemove,
}: {
  recipe: CookbookRecipe
  index: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: recipe.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <span className="text-gray-500 text-sm w-6 text-right flex-shrink-0">{index + 1}</span>

      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
        )}
      </div>

      <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="flex-1 min-w-0">
        <p className="font-medium text-white truncate hover:text-cyan-400 transition-colors">{recipe.name}</p>
        <p className="text-xs text-gray-400">
          {[
            recipe.prepTime && `Prep ${recipe.prepTime}m`,
            recipe.cookTime && `Cook ${recipe.cookTime}m`,
            recipe.servings && `${recipe.servings} servings`,
          ].filter(Boolean).join(' · ')}
        </p>
      </Link>

      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        aria-label={`Remove ${recipe.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Add Recipe Modal ─────────────────────────────────────────────────────────

function AddRecipeModal({
  cookbookId,
  existingRecipeIds,
  onClose,
}: {
  cookbookId: string
  existingRecipeIds: string[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: recipesResult } = useQuery(trpc.recipes.list.queryOptions({}))
  const allRecipes = recipesResult?.items ?? []

  const addMutation = useMutation(
    trpc.cookbooks.addRecipe.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['cookbooks']] })
        onClose()
      },
    }),
  )

  const available = allRecipes.filter(
    (r) =>
      !existingRecipeIds.includes(r.id) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <ModalHeader title="Add Recipe" onClose={onClose} />
        <div className="p-4">
          <input
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            autoFocus
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {available.length === 0 ? (
            <li className="text-center py-8 text-gray-400">
              {search ? 'No matching recipes.' : 'All your recipes are already in this cookbook.'}
            </li>
          ) : (
            available.map((r) => (
              <li key={r.id}>
                <button
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate({ cookbookId, recipeId: r.id })}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <div className="h-10 w-10 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                    {r.imageUrl && <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />}
                  </div>
                  <span className="flex-1 text-white font-medium truncate">{r.name}</span>
                  <Plus className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

// ─── Edit Cookbook Modal ──────────────────────────────────────────────────────

function EditCookbookModal({
  cookbook,
  onClose,
}: {
  cookbook: { id: string; name: string; description?: string | null; isPublic: boolean }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(cookbook.name)
  const [description, setDescription] = useState(cookbook.description ?? '')
  const [isPublic, setIsPublic] = useState(cookbook.isPublic)
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation(
    trpc.cookbooks.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['cookbooks']] })
        onClose()
      },
      onError: (err) => setError(err.message),
    }),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    updateMutation.mutate({ id: cookbook.id, name: name.trim(), description: description.trim() || undefined, isPublic })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <ModalHeader title="Edit Cookbook" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <CookbookFields
            name={name}
            description={description}
            isPublic={isPublic}
            checkboxId="edit-ispublic"
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onIsPublicChange={setIsPublic}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Shared modal header ──────────────────────────────────────────────────────

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex justify-between items-center p-5 border-b border-slate-700">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// ─── Generic Confirm Modal ────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  danger,
  isPending,
  onConfirm,
  onCancel,
}: {
  title: string
  body: React.ReactNode
  confirmLabel: string
  danger?: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-300 mb-6">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-5 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-500 hover:bg-cyan-600'
            }`}
          >
            {isPending ? `${confirmLabel}ing…` : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
