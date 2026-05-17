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
import { GripVertical, X, Plus, Pencil, Trash2, List, Printer, ChevronDown, ChevronRight, User, Users, ChevronUp } from 'lucide-react'
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

interface Collaborator {
  id: string
  userId: string
  name: string
  role: 'editor' | 'viewer'
  addedAt: Date
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
  | { kind: 'inviteCollaborator' }
  | { kind: 'removeCollaborator'; collaborator: Collaborator }

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
  const myCollabRole = !isOwner ? cookbook?.collaborators?.find(c => c.userId === userId)?.role : null
  const accessLevel: 'owner' | 'editor' | 'viewer' = isOwner ? 'owner' : (myCollabRole ?? 'viewer')
  const canEdit = accessLevel === 'owner' || accessLevel === 'editor'

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

  const addCollaboratorMutation = useMutation(
    trpc.cookbooks.addCollaborator.mutationOptions({
      onSuccess: () => { invalidate(); closeModal() },
    }),
  )
  const removeCollaboratorMutation = useMutation(
    trpc.cookbooks.removeCollaborator.mutationOptions({
      onSuccess: () => { invalidate(); closeModal() },
    }),
  )

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
    return <PageLayout><p className="text-[var(--theme-fg-subtle)] text-center py-12">Loading…</p></PageLayout>
  }

  if (!cookbook) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="text-[var(--theme-fg-subtle)] text-lg mb-4">Cookbook not found.</p>
          <Link to="/cookbooks" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)]">Back to Cookbooks</Link>
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
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-[var(--theme-fg)]">{cookbook.name}</h1>
              {isOwner && (
                <User
                  className="w-5 h-5 text-[var(--theme-accent)] print:hidden"
                  role="img"
                  aria-label="You own this"
                />
              )}
              {(cookbook.collaboratorCount ?? 0) > 0 && (
                <Users
                  className="w-4 h-4 text-[var(--theme-fg-muted)] print:hidden"
                  role="img"
                  aria-label={`Shared with ${cookbook.collaboratorCount} ${cookbook.collaboratorCount === 1 ? 'collaborator' : 'collaborators'}`}
                />
              )}
            </div>
            {cookbook.description && (
              <p className="text-[var(--theme-fg-muted)] mt-2 max-w-2xl">{cookbook.description}</p>
            )}
            <p className="text-[var(--theme-fg-muted)] text-sm mt-2">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              {hasChapters && (
                <> · {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</>
              )}
              {!cookbook.isPublic && (
                <span className="ml-3 px-2 py-0.5 text-xs bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)] rounded">Private</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cookbooks/$cookbookId/toc"
              params={{ cookbookId }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
            >
              <List className="w-4 h-4" />
              Table of Contents
            </Link>
            <Link
              to="/cookbooks/$cookbookId/print"
              params={{ cookbookId }}
              search={{ displayonly: undefined }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </Link>
            {isOwner && (
              <>
                <button
                  onClick={() => setModal({ kind: 'inviteCollaborator' })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Invite
                </button>
                <button
                  onClick={() => setModal({ kind: 'editCookbook' })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setModal({ kind: 'deleteCookbook' })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" /* theme-intentional: destructive action button */
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
          body={<>Are you sure you want to permanently delete <strong className="text-[var(--theme-fg)]">{cookbook.name}</strong>? This cannot be undone.</>}
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
          body={<>Remove <strong className="text-[var(--theme-fg)]">{modal.recipe.name}</strong> from this cookbook?</>}
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
              Delete chapter <strong className="text-[var(--theme-fg)]">{modal.chapter.name}</strong>?
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

      {modal.kind === 'inviteCollaborator' && (
        <InviteCollaboratorModal
          cookbookId={cookbookId}
          isPending={addCollaboratorMutation.isPending}
          onInvite={(userId, role) => addCollaboratorMutation.mutate({ cookbookId, userId, role })}
          onClose={closeModal}
        />
      )}

      {modal.kind === 'removeCollaborator' && (
        <ConfirmModal
          title="Remove Collaborator"
          body={<>Remove <strong className="text-[var(--theme-fg)]">{modal.collaborator.name}</strong> from this cookbook?</>}
          confirmLabel="Remove"
          danger
          isPending={removeCollaboratorMutation.isPending}
          onConfirm={() => removeCollaboratorMutation.mutate({ cookbookId, userId: modal.collaborator.userId })}
          onCancel={closeModal}
        />
      )}

      {/* Collaborators panel */}
      {((cookbook.collaborators?.length ?? 0) > 0 || isOwner) && (
        <CollaboratorsPanel
          collaborators={cookbook.collaborators ?? []}
          isOwner={isOwner}
          onInvite={() => setModal({ kind: 'inviteCollaborator' })}
          onRemove={(collaborator) => setModal({ kind: 'removeCollaborator', collaborator })}
        />
      )}

      {/* Recipe list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[var(--theme-fg)]">Recipes</h2>
            {canEdit && hasChapters && (
              <button
                onClick={() => setIsCollapsed((v) => !v)}
                className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
                aria-label={isCollapsed ? 'Expand recipe list' : 'Collapse to chapter view'}
                title={isCollapsed ? 'Expand' : 'Collapse chapters'}
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => createChapterMutation.mutate({ cookbookId })}
                disabled={createChapterMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                New Chapter
              </button>
              <button
                onClick={() => setModal({ kind: 'addRecipe' })}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </button>
            </div>
          )}
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--theme-fg-muted)] mb-4">No recipes in this cookbook yet.</p>
            {canEdit && (
              <button
                onClick={() => setModal({ kind: 'addRecipe' })}
                className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors"
              >
                Add your first recipe
              </button>
            )}
          </div>
        ) : isCollapsed && canEdit && hasChapters ? (
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
                    isOwner={canEdit}
                    onRename={() => setModal({ kind: 'renameChapter', chapter })}
                    onDelete={() => setModal({ kind: 'deleteChapter', chapter })}
                  />
                  {canEdit ? (
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
            {canEdit && activeDragRecipe && (
              <DragOverlay>
                <div className="opacity-90 shadow-xl">
                  <StaticRecipeCard recipe={activeDragRecipe} index={0} />
                </div>
              </DragOverlay>
            )}
          </DndContext>
        ) : canEdit ? (
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
        isOver ? 'border-[var(--theme-accent)] text-[var(--theme-accent)]' : 'border-[var(--theme-border)] text-[var(--theme-fg-subtle)]'
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
      <h3 className="text-sm font-semibold text-[var(--theme-fg-muted)] uppercase tracking-wider">{chapter.name}</h3>
      {isOwner && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            onClick={onRename}
            className="text-[var(--theme-fg-subtle)] hover:text-[var(--theme-accent)] transition-colors"
            aria-label={`Rename ${chapter.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="text-[var(--theme-fg-subtle)] hover:text-[var(--theme-error)] transition-colors"
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
        className="text-[var(--theme-fg-subtle)] hover:text-[var(--theme-fg-muted)] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder chapter"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="font-medium text-[var(--theme-fg)]">{chapter.name}</p>
        <p className="text-xs text-[var(--theme-fg-muted)]">{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</p>
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
      <div className="bg-[var(--theme-surface-raised)] rounded-xl shadow-[var(--theme-shadow-md)] border border-[var(--theme-border)] w-full max-w-sm">
        <ModalHeader title="Rename Chapter" titleId="rename-chapter-title" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
            autoFocus
            aria-label="Chapter name"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors">
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
      <div className="bg-[var(--theme-surface-raised)] rounded-xl shadow-[var(--theme-shadow-md)] border border-[var(--theme-border)] w-full max-w-lg max-h-[80vh] flex flex-col">
        <ModalHeader title="Add Recipe" titleId="add-recipe-title" onClose={onClose} />
        <div className="p-4 space-y-3">
          {chapters.length > 0 && (
            <div>
              <label htmlFor="add-recipe-chapter" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">Chapter</label>
              <select
                id="add-recipe-chapter"
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
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
            className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
            autoFocus={chapters.length === 0}
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {available.length === 0 ? (
            <li className="text-center py-8 text-[var(--theme-fg-muted)]">
              {inputValue.trim() ? 'No matching recipes found.' : 'All your recipes are already in this cookbook.'}
            </li>
          ) : (
            available.map((r) => (
              <li key={r.id}>
                <button
                  disabled={addMutation.isPending}
                  onClick={() => handleAdd(r.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] transition-colors disabled:opacity-50"
                >
                  <CardImage src={r.imageUrl} alt={r.name} className="h-10 w-10 bg-[var(--theme-surface-hover)] rounded overflow-hidden flex-shrink-0" />
                  <span className="flex-1 text-[var(--theme-fg)] font-medium truncate">{r.name}</span>
                  <Plus className="w-4 h-4 text-[var(--theme-accent)] flex-shrink-0" />
                </button>
              </li>
            ))
          )}
          {isFetchingNextPage && (
            <li className="text-center py-2 text-[var(--theme-fg-muted)]">Loading…</li>
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
      <div className="bg-[var(--theme-surface-raised)] rounded-xl shadow-[var(--theme-shadow-md)] border border-[var(--theme-border)] w-full max-w-md">
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
          {error && <p className="text-[var(--theme-error)] text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
              className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors">
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
    <div className="flex justify-between items-center p-5 border-b border-[var(--theme-border)]">
      <h2 id={titleId} className="text-lg font-bold text-[var(--theme-fg)]">{title}</h2>
      <button type="button" aria-label="Close" onClick={onClose} className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)]">
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
  const btnClass = danger ? 'bg-red-600 hover:bg-red-700' /* theme-intentional: danger/destructive action convention */ : 'bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)]'
  return (
    <DialogOverlay labelId={titleId} onClose={onCancel} isPending={isPending}>
      <div className="bg-[var(--theme-surface-raised)] rounded-xl shadow-[var(--theme-shadow-md)] border border-[var(--theme-border)] w-full max-w-sm p-6">
        <h2 id={titleId} className="text-lg font-bold text-[var(--theme-fg)] mb-3">{title}</h2>
        <p className="text-[var(--theme-fg-muted)] mb-6">{body}</p>
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
            className="px-5 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </DialogOverlay>
  )
}

// ─── Collaborators Panel ──────────────────────────────────────────────────────

function CollaboratorsPanel({
  collaborators,
  isOwner,
  onInvite,
  onRemove,
}: {
  collaborators: Collaborator[]
  isOwner: boolean
  onInvite: () => void
  onRemove: (collaborator: Collaborator) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--theme-surface-hover)] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--theme-fg-muted)]" />
          <span className="text-sm font-medium text-[var(--theme-fg)]">
            Collaborators
            {collaborators.length > 0 && (
              <span className="ml-2 text-[var(--theme-fg-muted)]">({collaborators.length})</span>
            )}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--theme-fg-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--theme-fg-muted)]" />}
      </button>

      {isOpen && (
        <div className="border-t border-[var(--theme-border)] px-4 py-3 space-y-2">
          {collaborators.length === 0 ? (
            <p className="text-sm text-[var(--theme-fg-muted)]">No collaborators yet.</p>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-[var(--theme-fg)]">{collab.name}</span>
                  <span className="ml-2 text-xs text-[var(--theme-fg-muted)] capitalize">{collab.role}</span>
                </div>
                {isOwner && (
                  <button
                    onClick={() => onRemove(collab)}
                    className="text-xs text-[var(--theme-fg-subtle)] hover:text-red-500 transition-colors"
                    aria-label={`Remove ${collab.name}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
          {isOwner && (
            <button
              onClick={onInvite}
              className="mt-2 text-sm text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
            >
              + Invite collaborator
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Invite Collaborator Modal ────────────────────────────────────────────────

function InviteCollaboratorModal({
  cookbookId: _cookbookId,
  isPending,
  onInvite,
  onClose,
}: {
  cookbookId: string
  isPending: boolean
  onInvite: (userId: string, role: 'editor' | 'viewer') => void
  onClose: () => void
}) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: searchResults = [] } = useQuery({
    ...trpc.users.search.queryOptions({ query: debouncedSearch }),
    enabled: debouncedSearch.length >= 2,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    onInvite(selectedUser.id, role)
  }

  return (
    <DialogOverlay labelId="invite-collaborator-title" onClose={onClose} isPending={isPending}>
      <div className="bg-[var(--theme-surface-raised)] rounded-xl shadow-[var(--theme-shadow-md)] border border-[var(--theme-border)] w-full max-w-md">
        <ModalHeader title="Invite Collaborator" titleId="invite-collaborator-title" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">Search by email or name</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSelectedUser(null) }}
              placeholder="Type to search…"
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
              autoFocus
              aria-label="Search users"
            />
            {debouncedSearch.length >= 2 && searchResults.length > 0 && !selectedUser && (
              <ul className="mt-1 border border-[var(--theme-border)] rounded-lg overflow-hidden">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(u); setSearchInput(u.name || u.email) }}
                      className="w-full text-left px-3 py-2 text-sm bg-[var(--theme-surface-raised)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                    >
                      <span className="font-medium text-[var(--theme-fg)]">{u.name}</span>
                      <span className="ml-2 text-[var(--theme-fg-muted)]">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {debouncedSearch.length >= 2 && searchResults.length === 0 && !selectedUser && (
              <p className="mt-1 text-sm text-[var(--theme-fg-muted)]">No users found.</p>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">Role</legend>
            <div className="flex gap-4">
              {(['editor', 'viewer'] as const).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="text-[var(--theme-accent)]"
                  />
                  <span className="text-sm text-[var(--theme-fg)] capitalize">{r}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!selectedUser || isPending}
              className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending ? 'Inviting…' : 'Invite'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DialogOverlay>
  )
}

// Named exports for testing
export { ChapterHeader, AddRecipeModal, CollaboratorsPanel, InviteCollaboratorModal }
