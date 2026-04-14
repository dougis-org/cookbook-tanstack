import { Check, Loader2, AlertCircle } from "lucide-react"
import { AutoSaveStatus } from "@/hooks/useAutoSave"

interface StatusIndicatorProps {
  status: AutoSaveStatus
  onRetry?: () => void
}

export default function StatusIndicator({ status, onRetry }: StatusIndicatorProps) {
  if (status === "idle") return null

  return (
    <div className="flex items-center gap-2 text-sm transition-opacity duration-300">
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-[var(--theme-accent)]" />
          <span className="text-[var(--theme-fg-subtle)]">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-[var(--theme-success)]" />
          <span className="text-[var(--theme-success)] font-medium">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-[var(--theme-error)]" />
          <span className="text-[var(--theme-error)] font-medium">Failed to save</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}
