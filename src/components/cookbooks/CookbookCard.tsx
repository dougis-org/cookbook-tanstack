import { BookOpen } from 'lucide-react'

interface CookbookCardProps {
  cookbook: {
    id: string
    name: string
    description?: string | null
    isPublic: boolean
    imageUrl?: string | null
    recipeCount?: number
  }
}

export default function CookbookCard({ cookbook }: CookbookCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
        {cookbook.imageUrl ? (
          <img
            src={cookbook.imageUrl}
            alt={cookbook.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {!cookbook.isPublic && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-slate-900/70 text-gray-300 rounded">
            Private
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
          {cookbook.name}
        </h3>
        {cookbook.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
            {cookbook.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cookbook.recipeCount ?? 0} {cookbook.recipeCount === 1 ? 'recipe' : 'recipes'}
        </p>
      </div>
    </div>
  )
}
