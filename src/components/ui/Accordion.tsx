import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultOpenId?: string
}

export default function Accordion({ items, defaultOpenId }: AccordionProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.id}
          open={item.id === defaultOpenId}
          className="group border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface)] overflow-hidden"
        >
          <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none font-semibold text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
            <span>{item.title}</span>
            <ChevronDown className="h-5 w-5 flex-shrink-0 text-[var(--theme-fg-muted)] transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-6 pb-4 pt-2 text-sm text-[var(--theme-fg-muted)] border-t border-[var(--theme-border-muted)]">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  )
}
