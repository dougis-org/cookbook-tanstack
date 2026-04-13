import type { ClassificationWithCount } from '@/types/recipe'

interface CategoryCardProps {
  category: ClassificationWithCount
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="bg-[var(--theme-surface)] rounded-lg shadow-[var(--theme-shadow-sm)] overflow-hidden hover:shadow-[var(--theme-shadow-md)] transition-shadow cursor-pointer">
      <div className="p-4">
        <h3 className="text-xl font-semibold text-[var(--theme-fg)] mb-2">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-[var(--theme-fg-muted)] text-sm mb-3">
            {category.description}
          </p>
        )}
        <p className="text-sm text-[var(--theme-fg-subtle)]">
          {category.recipeCount} recipes
        </p>
      </div>
    </div>
  )
}
