import { Printer } from 'lucide-react'

export default function PrintButton({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
    >
      <Printer className="w-4 h-4" />
      {showLabel && <span>Print</span>}
    </button>
  )
}
