import { BookOpen, User, Users } from 'lucide-react'
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
    collaboratorCount?: number
  }
  isOwner?: boolean
  isCollaborator?: boolean
}

export default function CookbookCard({ cookbook, isOwner, isCollaborator: _isCollaborator }: CookbookCardProps) {
  return (
    <div className="bg-[var(--theme-surface)] rounded-lg shadow-[var(--theme-shadow-sm)] overflow-hidden hover:shadow-[var(--theme-shadow-md)] transition-shadow cursor-pointer">
      <CardImage src={cookbook.imageUrl} alt={cookbook.name} className="h-40 bg-[var(--theme-surface-hover)]" />
      <div className="p-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-[var(--theme-fg)] mb-1">
          {!cookbook.imageUrl && <BookOpen className="w-5 h-5 text-[var(--theme-fg-muted)] flex-shrink-0" />}
          <span className="truncate min-w-0 flex-1">{cookbook.name}</span>
        </h3>
        {cookbook.description && (
          <p className="text-[var(--theme-fg-muted)] text-sm line-clamp-2 mb-3">
            {cookbook.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOwner && (
              <User
                className="w-4 h-4 shrink-0 text-[var(--theme-accent)] print:hidden"
                role="img"
                aria-label="You own this"
              />
            )}
            {(cookbook.collaboratorCount ?? 0) > 0 && (
              <Users
                className="w-3.5 h-3.5 shrink-0 text-[var(--theme-fg-muted)] print:hidden"
                role="img"
                aria-label={`${cookbook.collaboratorCount} ${cookbook.collaboratorCount === 1 ? 'collaborator' : 'collaborators'}`}
              />
            )}
            <p className="text-sm text-[var(--theme-fg-subtle)]">
              {cookbook.recipeCount ?? 0} {cookbook.recipeCount === 1 ? 'recipe' : 'recipes'}
              {(cookbook.chapterCount ?? 0) > 0 && (
                <> · {cookbook.chapterCount} {cookbook.chapterCount === 1 ? 'chapter' : 'chapters'}</>
              )}
            </p>
          </div>
          {!cookbook.isPublic && (
            <span className="text-xs px-2 py-0.5 bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)] rounded">Private</span>
          )}
        </div>
      </div>
    </div>
  )
}
