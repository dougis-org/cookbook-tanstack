import { Utensils, BookOpen, Timer } from 'lucide-react'

type BadgeVariant = 'meal' | 'course' | 'preparation'

const variantStyles: Record<BadgeVariant, string> = {
  meal: 'bg-amber-500/60 text-amber-900 border-amber-500/60',
  course: 'bg-violet-500/60 text-violet-900 border-violet-500/60',
  preparation: 'bg-emerald-500/60 text-emerald-900 border-emerald-500/60',
}

const variantIcons: Record<BadgeVariant, React.ReactNode> = {
  meal: <Utensils className="w-3 h-3" aria-hidden="true" />,
  course: <BookOpen className="w-3 h-3" aria-hidden="true" />,
  preparation: <Timer className="w-3 h-3" aria-hidden="true" />,
}

interface TaxonomyBadgeProps {
  name: string
  variant: BadgeVariant
}

export default function TaxonomyBadge({ name, variant }: TaxonomyBadgeProps) {
  return (
    <span
      data-testid="taxonomy-badge-span"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {variantIcons[variant]}
      {name}
    </span>
  )
}
