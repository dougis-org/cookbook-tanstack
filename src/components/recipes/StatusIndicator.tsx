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
          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          <span className="text-[var(--theme-fg-subtle)]">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400 font-medium">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400 font-medium">Failed to save</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-cyan-500 hover:text-cyan-400 underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}
