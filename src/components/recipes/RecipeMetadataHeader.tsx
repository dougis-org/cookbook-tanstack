import { Link } from 'lucide-react'
import ClassificationBadge from '@/components/ui/ClassificationBadge'

interface RecipeMetadataHeaderProps {
  classification?: {
    id: string
    name: string
  }
  source?: {
    name: string
    url?: string
  }
}

export default function RecipeMetadataHeader({
  classification,
  source,
}: RecipeMetadataHeaderProps) {
  return (
    <div
      data-testid="recipe-metadata-header"
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700"
    >
      {/* Category/Classification badge */}
      <div className="flex items-center">
        {classification ? (
          <ClassificationBadge
            classificationId={classification.id}
            classificationName={classification.name}
            linkable={false}
          />
        ) : null}
      </div>

      {/* Source */}
      {source && (
        <div
          data-testid="recipe-source"
          className="flex items-center gap-2"
        >
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <Link className="w-4 h-4" aria-hidden="true" />
              <span>{source.name}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Link className="w-4 h-4" aria-hidden="true" />
              <span>{source.name}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
