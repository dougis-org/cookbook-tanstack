import { Printer } from 'lucide-react'

export default function PrintButton({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Print"
      className="print:hidden inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] rounded-lg transition-colors"
    >
      <Printer className="w-4 h-4" />
      {showLabel && <span>Print</span>}
    </button>
  )
}
