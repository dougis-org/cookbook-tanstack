import { BookOpen } from 'lucide-react'
import CardImage from '@/components/ui/CardImage'

interface CookbookCardProps {
  cookbook: {
    id: string
    name: string
    description?: string | null
    isPublic: boolean
    imageUrl?: string | null
    recipeCount?: number
    chapterCount?: number
  }
}

export default function CookbookCard({ cookbook }: CookbookCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      <CardImage src={cookbook.imageUrl} alt={cookbook.name} className="h-40 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {!cookbook.imageUrl && <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />}
          <span className="truncate min-w-0 flex-1">{cookbook.name}</span>
        </h3>
        {cookbook.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
            {cookbook.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cookbook.recipeCount ?? 0} {cookbook.recipeCount === 1 ? 'recipe' : 'recipes'}
            {(cookbook.chapterCount ?? 0) > 0 && (
              <> · {cookbook.chapterCount} {cookbook.chapterCount === 1 ? 'chapter' : 'chapters'}</>
            )}
          </p>
          {!cookbook.isPublic && (
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-gray-300 rounded">Private</span>
          )}
        </div>
      </div>
    </div>
  )
}
