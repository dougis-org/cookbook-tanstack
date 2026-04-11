import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc'
import RecipeCard from '@/components/recipes/RecipeCard'

interface RelatedRecipesSectionProps {
  classificationId: string | null | undefined
  currentRecipeId: string
}

export default function RelatedRecipesSection({ classificationId, currentRecipeId }: RelatedRecipesSectionProps) {
  const { data } = useQuery({
    ...trpc.recipes.list.queryOptions({ classificationIds: classificationId ? [classificationId] : [], pageSize: 7 }),
    enabled: !!classificationId,
  })

  if (!classificationId) return null

  const related = (data?.items ?? [])
    .filter(r => r.id !== currentRecipeId)
    .slice(0, 6)

  if (related.length === 0) return null

  return (
    <section data-testid="related-recipes-section" className="mt-10 print:hidden">
      <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-6">Related Recipes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map(recipe => (
          <Link
            key={recipe.id}
            to="/recipes/$recipeId"
            params={{ recipeId: recipe.id }}
          >
            <RecipeCard recipe={recipe} marked={recipe.marked} />
          </Link>
        ))}
      </div>
    </section>
  )
}
