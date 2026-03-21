import { Link } from '@tanstack/react-router'
import { Tag } from 'lucide-react'

interface ClassificationBadgeProps {
  classificationId: string
  classificationName: string
  /** When true, wraps in a Link to the category page; otherwise plain badge */
  linkable?: boolean
}

export default function ClassificationBadge({
  classificationId,
  classificationName,
  linkable = false,
}: ClassificationBadgeProps) {
  const badge = (
    <span 
      data-testid="category-badge"
      className="classification-badge inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-600 text-white"
    >
      <Tag className="w-3 h-3" aria-hidden="true" />
      {classificationName ? classificationName : null}
    </span>
  )

  if (linkable) {
    return (
      <Link
        to="/categories/$categoryId"
        params={{ categoryId: classificationId }}
        onClick={(e) => e.stopPropagation()}
        className="hover:opacity-80 transition-opacity"
      >
        {badge}
      </Link>
    )
  }

  return badge
}
