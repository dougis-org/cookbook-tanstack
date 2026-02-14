import type { ClassificationWithCount } from '@/types/recipe'

interface CategoryCardProps {
  category: ClassificationWithCount
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      <div className="h-40 bg-gray-200 dark:bg-gray-700">
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No Image
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            {category.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {category.recipeCount} recipes
        </p>
      </div>
    </div>
  )
}
