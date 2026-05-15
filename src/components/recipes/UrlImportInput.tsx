import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export interface UrlImportInputProps {
  onSubmit: (url: string) => void
  isPending: boolean
  error?: string | null
}

export function UrlImportInput({
  onSubmit,
  isPending,
  error,
}: UrlImportInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = () => {
    const trimmedUrl = url.trim()
    if (trimmedUrl) {
      onSubmit(trimmedUrl)
      setUrl('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste recipe URL (e.g., https://www.allrecipes.com/recipe/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 bg-[var(--theme-surface-raised)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-fg)] placeholder-[var(--theme-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending}
          type="button"
          className="px-4 py-2.5 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Importing...' : 'Import URL'}
        </button>
      </div>
      {error && (
        <div role="alert" className="rounded-md bg-[var(--theme-error)]/10 p-3 text-sm text-[var(--theme-error)]">
          {error}
        </div>
      )}
    </div>
  )
}
