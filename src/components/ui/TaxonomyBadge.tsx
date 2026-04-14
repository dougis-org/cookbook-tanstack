type BadgeVariant = 'meal' | 'course' | 'preparation'

const variantStyles: Record<BadgeVariant, string> = {
  meal: 'bg-[color:var(--theme-badge-meal-bg)] text-[var(--theme-badge-meal-text)] border-[color:var(--theme-badge-meal-border)]',
  course: 'bg-[color:var(--theme-badge-course-bg)] text-[var(--theme-badge-course-text)] border-[color:var(--theme-badge-course-border)]',
  preparation: 'bg-[color:var(--theme-badge-prep-bg)] text-[var(--theme-badge-prep-text)] border-[color:var(--theme-badge-prep-border)]',
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
