import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  to?: string
  params?: Record<string, string>
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-400 mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
            {isLast || !item.to ? (
              <span className={isLast ? 'text-gray-200 font-medium truncate max-w-[200px]' : ''}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                params={item.params}
                className="hover:text-cyan-400 transition-colors truncate max-w-[160px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
