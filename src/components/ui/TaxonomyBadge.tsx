type BadgeVariant = 'meal' | 'course' | 'preparation'

const variantStyles: Record<BadgeVariant, string> = {
  meal: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  course: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  preparation: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

interface TaxonomyBadgeProps {
  name: string
  variant: BadgeVariant
}

export default function TaxonomyBadge({ name, variant }: TaxonomyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {name}
    </span>
  )
}
