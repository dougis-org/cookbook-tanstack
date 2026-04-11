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
    // dark: retained — categorical badge colour
    <span className="classification-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
      <Tag className="w-3 h-3" />
      {classificationName}
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
