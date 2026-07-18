import { useState, type ReactNode } from "react"
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
  // Tracked in state (not derived from props on every render) so that a
  // parent re-render doesn't force the controlled `open` attribute back to
  // its initial value and silently collapse a section the user just opened.
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(defaultOpenId ? [defaultOpenId] : []),
  )

  function handleToggle(id: string, isOpen: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (isOpen) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.id}
          open={openIds.has(item.id)}
          onToggle={(e) => handleToggle(item.id, e.currentTarget.open)}
          className="group border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface)] overflow-hidden"
        >
          <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
            <span>{item.title}</span>
            <ChevronDown
              className="h-5 w-5 flex-shrink-0 text-[var(--theme-fg-muted)] transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-6 pb-4 pt-2 text-sm text-[var(--theme-fg-muted)] border-t border-[var(--theme-border-muted)]">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  )
}
