import { useState, useCallback, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import CardImage from '@/components/ui/CardImage'
import CookbookFields from '@/components/cookbooks/CookbookFields'
import { SortableRecipeCard, StaticRecipeCard } from '@/components/cookbooks/CookbookRecipeCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { GripVertical, X, Plus, Pencil, Trash2, List, Printer, ChevronDown, ChevronRight } from 'lucide-react'
import { useRecipeSearch } from '@/hooks/useRecipeSearch'
import { useScrollSentinel } from '@/hooks/useScrollSentinel'

const EMPTY_CHAPTER_PREFIX = 'empty:'

const multiContainerCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  const emptyChapterHits = pointerHits.filter(
    (hit) => typeof hit.id === 'string' && hit.id.startsWith(EMPTY_CHAPTER_PREFIX),
  )
  return emptyChapterHits.length > 0 ? emptyChapterHits : closestCenter(args)
}

export const Route = createFileRoute('/cookbooks/$cookbookId')({
  component: CookbookDetailPage,
})

// ─── Pure helpers (module-level) ──────────────────────────────────────────────

function computeChapterReorder(
  activeId: string,
  overId: string,
  activeChapterId: string,
  overChapterId: string,
  sortedChapters: Chapter[],
  getIds: (chapterId: string) => string[],
): Map<string, string[]> {
  const currentActive = getIds(activeChapterId)
  const currentOver = getIds(overChapterId)

  if (activeChapterId === overChapterId) {
    const newIds = arrayMove(
      currentActive,
      currentActive.indexOf(activeId),
      currentActive.indexOf(overId),
    )
    return new Map(sortedChapters.map((ch) => [ch.id, ch.id === activeChapterId ? newIds : getIds(ch.id)]))
  }

  // Cross-chapter move
  const newActiveIds = currentActive.filter((id) => id !== activeId)
  const overIndex = currentOver.indexOf(overId)
  // overIndex === -1 means the chapter is empty; insert at end. Otherwise insert at overIndex.
  const insertAt = overIndex === -1 ? currentOver.length : overIndex
  const newOverIds = [...currentOver.slice(0, insertAt), activeId, ...currentOver.slice(insertAt)]
  return new Map(
    sortedChapters.map((ch) => {
      if (ch.id === activeChapterId) return [ch.id, newActiveIds]
      if (ch.id === overChapterId) return [ch.id, newOverIds]
      return [ch.id, getIds(ch.id)]
    })
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chapter {
  id: string
  name: string
  orderIndex: number
}

interface CookbookRecipe {
  id: string
  name: string
  imageUrl?: string | null
  prepTime?: number | null
  cookTime?: number | null
  servings?: number | null
  classificationName?: string | null
  orderIndex?: number | null
  chapterId?: string | null
}

/** Discriminated union replaces four separate boolean/nullable modal states. */
type Modal =
  | { kind: 'none' }
  | { kind: 'addRecipe' }
  | { kind: 'editCookbook' }
  | { kind: 'deleteCookbook' }
  | { kind: 'removeRecipe'; recipe: CookbookRecipe }
  | { kind: 'renameChapter'; chapter: Chapter }
  | { kind: 'deleteChapter'; chapter: Chapter }

// ─── Shared modal overlay with a11y and keyboard handling ─────────────────────

function DialogOverlay({
  labelId,
  onClose,
  isPending,
  children,
}: {
  labelId: string
  onClose: () => void
  isPending?: boolean
  children: React.ReactNode
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isPending])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
    >
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CookbookDetailPage() {
  const { cookbookId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  // localOrder: chapter-aware map of chapterId → recipeIds[], or null when no chapters
  const [localOrder, setLocalOrder] = useState<Map<string, string[]> | null>(null)
  // localChapterOrder: chapter ids in sorted order (for collapsed DnD)
  const [localChapterOrder, setLocalChapterOrder] = useState<string[] | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Track active drag item for DragOverlay
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const closeModal = () => setModal({ kind: 'none' })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [['cookbooks']] })
  }

  const { userId } = useAuth()

  const { data: cookbook, isLoading } = useQuery(
    trpc.cookbooks.byId.queryOptions({ id: cookbookId }),
  )

  const isOwner = userId === cookbook?.userId

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

  const createChapterMutation = useMutation(
    trpc.cookbooks.createChapter.mutationOptions({
      onSuccess: () => { invalidate(); closeModal() },
    }),
  )

  const renameChapterMutation = useMutation(
    trpc.cookbooks.renameChapter.mutationOptions({
      onSuccess: () => { invalidate(); closeModal() },
    }),
  )

  const deleteChapterMutation = useMutation(
    trpc.cookbooks.deleteChapter.mutationOptions({
      onSuccess: () => { invalidate(); closeModal(); setLocalOrder(null); setLocalChapterOrder(null) },
    }),
  )

  const reorderChaptersMutation = useMutation(trpc.cookbooks.reorderChapters.mutationOptions())

  const recipes: CookbookRecipe[] = cookbook?.recipes ?? []
  const chapters: Chapter[] = (cookbook?.chapters ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex)
  const hasChapters = chapters.length > 0

  // Sorted chapter IDs (with optimistic local override)
  const sortedChapterIds = localChapterOrder ?? chapters.map((c) => c.id)
  const sortedChapters = sortedChapterIds
    .map((id) => chapters.find((c) => c.id === id))
    .filter((c): c is Chapter => c !== undefined)

  // Build per-chapter recipe lists from localOrder or from server data
  function getRecipeIdsForChapter(chapterId: string): string[] {
    if (localOrder) return localOrder.get(chapterId) ?? []
    return recipes
      .filter((r) => r.chapterId === chapterId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((r) => r.id)
  }

  function getRecipesForChapter(chapterId: string): CookbookRecipe[] {
    const ids = getRecipeIdsForChapter(chapterId)
    return ids.map((id) => recipes.find((r) => r.id === id)).filter((r): r is CookbookRecipe => r !== undefined)
  }

  // Flat ordered recipes (for no-chapter case)
  const flatOrderedIds = localOrder?.get('flat') ?? recipes.map((r) => r.id)
  const flatOrderedRecipes = flatOrderedIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is CookbookRecipe => r !== undefined)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ─── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      if (!hasChapters) {
        // Flat reorder (no chapters)
        const currentIds = localOrder?.get('flat') ?? recipes.map((r) => r.id)
        const newOrder = arrayMove(
          currentIds,
          currentIds.indexOf(active.id as string),
          currentIds.indexOf(over.id as string),
        )
        setLocalOrder(new Map([['flat', newOrder]]))
        reorderMutation.mutate(
          { cookbookId, recipeIds: newOrder },
          { onSuccess: () => { invalidate(); setLocalOrder(null) }, onError: () => setLocalOrder(null) },
        )
        return
      }

      // Chapter-aware reorder
      // Detect which chapter each item belongs to; also handle drops onto empty chapter containers
      const activeChapterId = (active.data.current as { sortable?: { containerId?: string } })?.sortable?.containerId
      const overIdStr = String(over.id)
      const overChapterId =
        (over.data.current as { sortable?: { containerId?: string } })?.sortable?.containerId ??
        (overIdStr.startsWith(EMPTY_CHAPTER_PREFIX) ? overIdStr.slice(EMPTY_CHAPTER_PREFIX.length) : undefined)

      if (!activeChapterId || !overChapterId) return

      const newLocalOrder = computeChapterReorder(
        active.id as string,
        over.id as string,
        activeChapterId,
        overChapterId,
        sortedChapters,
        getRecipeIdsForChapter,
      )

      setLocalOrder(newLocalOrder)
      const chaptersPayload = sortedChapters.map((ch) => ({
        chapterId: ch.id,
        recipeIds: newLocalOrder.get(ch.id) ?? [],
      }))
      reorderMutation.mutate(
        { cookbookId, chapters: chaptersPayload },
        { onSuccess: () => { invalidate(); setLocalOrder(null) }, onError: () => setLocalOrder(null) },
      )
    },
    [cookbookId, hasChapters, localOrder, recipes, sortedChapters, reorderMutation],
  )

  const handleChapterDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const currentIds = localChapterOrder ?? chapters.map((c) => c.id)
      const newOrder = arrayMove(
        currentIds,
        currentIds.indexOf(active.id as string),
        currentIds.indexOf(over.id as string),
      )
      setLocalChapterOrder(newOrder)
      reorderChaptersMutation.mutate(
        { cookbookId, chapterIds: newOrder },
        { onSuccess: () => { invalidate(); setLocalChapterOrder(null) }, onError: () => setLocalChapterOrder(null) },
      )
    },
    [cookbookId, chapters, localChapterOrder, reorderChaptersMutation],
  )

  // Active drag recipe (for DragOverlay)
  const activeDragRecipe = activeDragId ? recipes.find((r) => r.id === activeDragId) : null

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
      <Breadcrumb items={[{ label: 'Cookbooks', to: '/cookbooks' }, { label: cookbook.name }]} />
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white">{cookbook.name}</h1>
            {cookbook.description && (
              <p className="text-gray-300 mt-2 max-w-2xl">{cookbook.description}</p>
            )}
            <p className="text-gray-400 text-sm mt-2">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              {hasChapters && (
                <> · {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</>
              )}
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
            <Link
              to="/cookbooks/$cookbookId/print"
              params={{ cookbookId }}
              search={{ displayonly: undefined }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </Link>
            {isOwner && (
              <>
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
              </>
            )}
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
          chapters={chapters}
          onClose={() => { closeModal(); setLocalOrder(null) }}
        />
      )}

      {modal.kind === 'renameChapter' && (
        <RenameChapterModal
          chapter={modal.chapter}
          isPending={renameChapterMutation.isPending}
          onSave={(name) => renameChapterMutation.mutate({ cookbookId, chapterId: modal.chapter.id, name })}
          onClose={closeModal}
        />
      )}

      {modal.kind === 'deleteChapter' && (
        <ConfirmModal
          title="Delete Chapter"
          body={
            <>
              Delete chapter <strong className="text-white">{modal.chapter.name}</strong>?
              {chapters.length > 1
                ? ' All recipes in this chapter will be moved to the first remaining chapter.'
                : ' All recipes will become unchaptered.'}
            </>
          }
          confirmLabel="Delete"
          danger
          isPending={deleteChapterMutation.isPending}
          onConfirm={() => deleteChapterMutation.mutate({ cookbookId, chapterId: modal.chapter.id })}
          onCancel={closeModal}
        />
      )}

      {/* Recipe list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Recipes</h2>
            {isOwner && hasChapters && (
              <button
                onClick={() => setIsCollapsed((v) => !v)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isCollapsed ? 'Expand recipe list' : 'Collapse to chapter view'}
                title={isCollapsed ? 'Expand' : 'Collapse chapters'}
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => createChapterMutation.mutate({ cookbookId })}
                disabled={createChapterMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                New Chapter
              </button>
              <button
                onClick={() => setModal({ kind: 'addRecipe' })}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </button>
            </div>
          )}
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No recipes in this cookbook yet.</p>
            {isOwner && (
              <button
                onClick={() => setModal({ kind: 'addRecipe' })}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
              >
                Add your first recipe
              </button>
            )}
          </div>
        ) : isCollapsed && isOwner && hasChapters ? (
          /* Collapsed mode: chapter rows are sortable */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
            <SortableContext items={sortedChapterIds} strategy={verticalListSortingStrategy}>
              {sortedChapters.map((chapter) => (
                <SortableChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  recipeCount={getRecipeIdsForChapter(chapter.id).length}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : hasChapters ? (
          /* Expanded mode with chapters */
          <DndContext
            sensors={sensors}
            collisionDetection={multiContainerCollision}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {sortedChapters.map((chapter) => {
              const chapterRecipes = getRecipesForChapter(chapter.id)
              const chapterRecipeIds = getRecipeIdsForChapter(chapter.id)
              return (
                <div key={chapter.id} className="space-y-2" data-testid={`chapter-section-${chapter.id}`}>
                  <ChapterHeader
                    chapter={chapter}
                    isOwner={isOwner}
                    onRename={() => setModal({ kind: 'renameChapter', chapter })}
                    onDelete={() => setModal({ kind: 'deleteChapter', chapter })}
                  />
                  {isOwner ? (
                    chapterRecipes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SortableContext items={chapterRecipeIds} strategy={rectSortingStrategy} id={chapter.id}>
                          {chapterRecipes.map((recipe, index) => (
                            <SortableRecipeCard
                              key={recipe.id}
                              recipe={recipe}
                              index={index}
                              onRemove={() => setModal({ kind: 'removeRecipe', recipe })}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    ) : (
                      <EmptyChapterDropZone chapterId={chapter.id} />
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chapterRecipes.map((recipe, index) => (
                        <StaticRecipeCard key={recipe.id} recipe={recipe} index={index} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {isOwner && activeDragRecipe && (
              <DragOverlay>
                <div className="opacity-90 shadow-xl">
                  <StaticRecipeCard recipe={activeDragRecipe} index={0} />
                </div>
              </DragOverlay>
            )}
          </DndContext>
        ) : isOwner ? (
          /* Flat (no chapters) sortable list */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SortableContext items={flatOrderedIds} strategy={rectSortingStrategy}>
                {flatOrderedRecipes.map((recipe, index) => (
                  <SortableRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    onRemove={() => setModal({ kind: 'removeRecipe', recipe })}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        ) : (
          /* Flat static list (non-owner, no chapters) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flatOrderedRecipes.map((recipe, index) => (
              <StaticRecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

// ─── Empty Chapter Drop Zone ──────────────────────────────────────────────────

function EmptyChapterDropZone({ chapterId }: { chapterId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${EMPTY_CHAPTER_PREFIX}${chapterId}` })
  return (
    <div
      ref={setNodeRef}
      className={`text-sm pl-3 py-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-500'
      }`}
    >
      Drop a recipe here
    </div>
  )
}

// ─── Chapter Header ────────────────────────────────────────────────────────────

function ChapterHeader({
  chapter,
  isOwner,
  onRename,
  onDelete,
}: {
  chapter: Chapter
  isOwner: boolean
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-1 group">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{chapter.name}</h3>
      {isOwner && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            onClick={onRename}
            className="text-gray-500 hover:text-cyan-400 transition-colors"
            aria-label={`Rename ${chapter.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-400 transition-colors"
            aria-label={`Delete ${chapter.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sortable Chapter Row (collapsed mode) ────────────────────────────────────

function SortableChapterRow({ chapter, recipeCount }: { chapter: Chapter; recipeCount: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 bg-[var(--theme-surface)] rounded-lg shadow-sm p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder chapter"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="font-medium text-white">{chapter.name}</p>
        <p className="text-xs text-gray-400">{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</p>
      </div>
    </div>
  )
}

// ─── Rename Chapter Modal ─────────────────────────────────────────────────────

function RenameChapterModal({
  chapter,
  isPending,
  onSave,
  onClose,
}: {
  chapter: Chapter
  isPending: boolean
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(chapter.name)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <DialogOverlay labelId="rename-chapter-title" onClose={onClose} isPending={isPending}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
        <ModalHeader title="Rename Chapter" titleId="rename-chapter-title" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            autoFocus
            aria-label="Chapter name"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DialogOverlay>
  )
}

// ─── Add Recipe Modal ─────────────────────────────────────────────────────────

function AddRecipeModal({
  cookbookId,
  existingRecipeIds,
  chapters,
  onClose,
}: {
  cookbookId: string
  existingRecipeIds: string[]
  chapters: Chapter[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id ?? '')

  const { inputValue, onSearchChange, recipes, hasNextPage, fetchNextPage, isFetchingNextPage } = useRecipeSearch()
  const sentinelRef = useScrollSentinel(fetchNextPage, hasNextPage && !isFetchingNextPage)

  const addMutation = useMutation(
    trpc.cookbooks.addRecipe.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['cookbooks']] })
        onClose()
      },
    }),
  )

  const existingSet = new Set(existingRecipeIds)
  const available = recipes.filter((r) => !existingSet.has(r.id))

  function handleAdd(recipeId: string) {
    const payload: { cookbookId: string; recipeId: string; chapterId?: string } = { cookbookId, recipeId }
    if (chapters.length > 0) payload.chapterId = selectedChapterId
    addMutation.mutate(payload)
  }

  return (
    <DialogOverlay labelId="add-recipe-title" onClose={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <ModalHeader title="Add Recipe" titleId="add-recipe-title" onClose={onClose} />
        <div className="p-4 space-y-3">
          {chapters.length > 0 && (
            <div>
              <label htmlFor="add-recipe-chapter" className="block text-sm font-medium text-gray-300 mb-1">Chapter</label>
              <select
                id="add-recipe-chapter"
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
          )}
          <input
            type="text"
            placeholder="Search recipes…"
            aria-label="Search recipes"
            value={inputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            autoFocus={chapters.length === 0}
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {available.length === 0 ? (
            <li className="text-center py-8 text-gray-400">
              {inputValue.trim() ? 'No matching recipes found.' : 'All your recipes are already in this cookbook.'}
            </li>
          ) : (
            available.map((r) => (
              <li key={r.id}>
                <button
                  disabled={addMutation.isPending}
                  onClick={() => handleAdd(r.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <CardImage src={r.imageUrl} alt={r.name} className="h-10 w-10 bg-gray-600 rounded overflow-hidden flex-shrink-0" />
                  <span className="flex-1 text-white font-medium truncate">{r.name}</span>
                  <Plus className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                </button>
              </li>
            ))
          )}
          {isFetchingNextPage && (
            <li className="text-center py-2 text-gray-400">Loading…</li>
          )}
          <li aria-hidden="true"><div ref={sentinelRef} className="h-px w-full" /></li>
        </ul>
      </div>
    </DialogOverlay>
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
    <DialogOverlay labelId="edit-cookbook-title" onClose={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <ModalHeader title="Edit Cookbook" titleId="edit-cookbook-title" onClose={onClose} />
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
    </DialogOverlay>
  )
}

// ─── Shared modal header ──────────────────────────────────────────────────────

function ModalHeader({ title, titleId, onClose }: { title: string; titleId: string; onClose: () => void }) {
  return (
    <div className="flex justify-between items-center p-5 border-b border-slate-700">
      <h2 id={titleId} className="text-lg font-bold text-white">{title}</h2>
      <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-white">
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
  const titleId = 'confirm-modal-title'
  const btnClass = danger ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-500 hover:bg-cyan-600'
  return (
    <DialogOverlay labelId={titleId} onClose={onCancel} isPending={isPending}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 id={titleId} className="text-lg font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-300 mb-6">{body}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`px-5 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 text-white ${btnClass}`}
          >
            {isPending ? `${confirmLabel.replace(/e$/, '')}ing…` : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </DialogOverlay>
  )
}

// Named exports for testing
export { ChapterHeader, AddRecipeModal }
