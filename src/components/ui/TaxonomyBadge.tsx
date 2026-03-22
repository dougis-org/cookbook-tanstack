type BadgeVariant = 'meal' | 'course' | 'preparation'

const variantStyles: Record<BadgeVariant, string> = {
  meal: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  course: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  preparation: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
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
