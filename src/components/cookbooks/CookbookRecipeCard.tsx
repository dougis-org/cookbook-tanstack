import { Link } from '@tanstack/react-router'
import { GripVertical, Lock, X } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CardImage from '@/components/ui/CardImage'
import { formatMinutesOrNA } from '@/lib/recipeDisplay'

export interface AvailableCookbookRecipe {
  unavailable?: false
  id: string
  name: string
  imageUrl?: string | null
  prepTime?: number | null
  cookTime?: number | null
  servings?: number | null
}

/** A cross-owner cookbook entry whose recipe is no longer visible to the caller
 * (revoked share, owner downgrade, or soft delete) — see design.md Decision 3. */
export interface UnavailableCookbookRecipe {
  unavailable: true
  id: string
}

export type CookbookRecipe = AvailableCookbookRecipe | UnavailableCookbookRecipe

function UnavailableCardBody({ index }: { index: number }) {
  return (
    <>
      <div className="h-32 w-full bg-[var(--theme-surface-hover)] flex items-center justify-center">
        <Lock className="w-6 h-6 text-[var(--theme-fg-subtle)]" aria-hidden="true" />
      </div>
      <div className="flex items-start gap-2 p-3">
        <span className="text-sm text-[var(--theme-fg-subtle)] flex-shrink-0 pt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--theme-fg-subtle)]">N/A</p>
        </div>
      </div>
    </>
  )
}

function metaLine(recipe: AvailableCookbookRecipe): string {
  return [
    `Prep ${formatMinutesOrNA(recipe.prepTime, 'm')}`,
    `Cook ${formatMinutesOrNA(recipe.cookTime, 'm')}`,
    recipe.servings && `${recipe.servings} servings`,
  ]
    .filter(Boolean)
    .join(' · ')
}

function CardBody({
  recipe,
  index,
  dragHandle,
}: {
  recipe: CookbookRecipe
  index: number
  dragHandle?: React.ReactNode
}) {
  if (recipe.unavailable) {
    return <UnavailableCardBody index={index} />
  }
  const meta = metaLine(recipe)
  return (
    <>
      <CardImage
        src={recipe.imageUrl}
        alt={recipe.name}
        className="h-32 w-full bg-[var(--theme-surface-hover)] overflow-hidden"
      />
      <div className="flex items-start gap-2 p-3">
        {dragHandle}
        <span className="text-sm text-[var(--theme-fg-subtle)] flex-shrink-0 pt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId: recipe.id }}
            className="font-medium text-[var(--theme-fg)] hover:text-[var(--theme-accent)] transition-colors truncate block"
          >
            {recipe.name}
          </Link>
          {meta && <p className="text-xs text-[var(--theme-fg-muted)] mt-0.5">{meta}</p>}
        </div>
      </div>
    </>
  )
}

export function SortableRecipeCard({
  recipe,
  index,
  onRemove,
}: {
  recipe: CookbookRecipe
  index: number
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: recipe.id,
    disabled: recipe.unavailable,
  })

  const dragHandle = recipe.unavailable ? undefined : (
    <button
      {...attributes}
      {...listeners}
      className="text-[var(--theme-fg-subtle)] hover:text-[var(--theme-fg-muted)] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none pt-0.5"
      aria-label="Drag to reorder"
    >
      <GripVertical className="w-5 h-5" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group bg-[var(--theme-surface)] rounded-lg shadow-sm overflow-hidden"
      data-testid="recipe-card"
    >
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-events-none group-hover:pointer-events-auto focus-visible:pointer-events-auto text-[var(--theme-fg-subtle)] hover:text-[var(--theme-error)] transition-opacity"
        aria-label={recipe.unavailable ? 'Remove unavailable recipe' : `Remove ${recipe.name}`}
      >
        <X className="w-4 h-4" />
      </button>
      <CardBody recipe={recipe} index={index} dragHandle={dragHandle} />
    </div>
  )
}

export function StaticRecipeCard({
  recipe,
  index,
}: {
  recipe: CookbookRecipe
  index: number
}) {
  return (
    <div className="bg-[var(--theme-surface)] rounded-lg shadow-sm overflow-hidden">
      <CardBody recipe={recipe} index={index} />
    </div>
  )
}
