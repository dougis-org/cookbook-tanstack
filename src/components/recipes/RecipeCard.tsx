import { Heart, User } from 'lucide-react'
import type { Recipe } from '@/types/recipe'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import CardImage from '@/components/ui/CardImage'

interface RecipeCardProps {
  recipe: Pick<Recipe, 'id' | 'name' | 'imageUrl' | 'prepTime' | 'cookTime' | 'difficulty' | 'notes' | 'classificationId'> & {
    classificationName?: string | null
  }
  marked?: boolean
  isOwner?: boolean
}

export default function RecipeCard({ recipe, marked, isOwner }: RecipeCardProps) {
  return (
    <div data-testid="recipe-card" className="bg-[var(--theme-surface)] rounded-lg shadow-[var(--theme-shadow-sm)] overflow-hidden hover:shadow-[var(--theme-shadow-md)] transition-shadow">
      <CardImage src={recipe.imageUrl} alt={recipe.name} className="h-48 bg-[var(--theme-surface-hover)]" data-testid="recipe-card-image" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            {recipe.classificationId && recipe.classificationName && (
              <div className="mb-2">
                <ClassificationBadge
                  classificationId={recipe.classificationId}
                  classificationName={recipe.classificationName}
                />
              </div>
            )}
            <h3 className="text-xl font-semibold text-[var(--theme-fg)]">
              {recipe.name}
            </h3>
          </div>
          <div className="flex items-center">
            {isOwner && (
              <User
                className="w-4 h-4 shrink-0 ml-2 mt-1 text-[var(--theme-accent)] print:hidden"
                role="img"
                aria-label="You own this"
              />
            )}
            {marked !== undefined && (
              <Heart
                data-testid="heart-icon"
                className={`w-5 h-5 shrink-0 ml-2 mt-1 ${marked ? 'fill-red-500 text-red-500' : 'text-[var(--theme-fg-muted)]'}`} /* theme-intentional: heart/like affordance */
                role="img"
                aria-label={marked ? 'Recipe saved' : 'Recipe not saved'}
              />
            )}
          </div>
        </div>
        {recipe.notes && (
          <p className="text-[var(--theme-fg-muted)] text-sm line-clamp-2 mb-3">
            {recipe.notes}
          </p>
        )}
        <div className="flex justify-between items-center text-sm text-[var(--theme-fg-subtle)]">
          <div className="flex gap-3">
            {recipe.prepTime && (
              <span>Prep: {recipe.prepTime} min</span>
            )}
            {recipe.cookTime && (
              <span>Cook: {recipe.cookTime} min</span>
            )}
          </div>
          {recipe.difficulty && (
            <span className="capitalize px-2 py-1 bg-[var(--theme-surface-hover)] rounded">
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
