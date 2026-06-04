import { useState, useEffect } from "react"
import { Link, Check } from "lucide-react"

export default function ShareButton({ showLabel = true }: { showLabel?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href

    // 1. Primary: navigator.clipboard
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        return
      } catch {
        // Fall through to secondary fallback
      }
    }

    // 2. Secondary: execCommand fallback
    try {
      const textArea = document.createElement("textarea")
      textArea.value = url
      // Position offscreen to prevent layout shift or visual disturbance
      textArea.style.position = "absolute"
      textArea.style.left = "-9999px"
      textArea.style.top = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      if (successful) {
        setCopied(true)
        return
      }
    } catch {
      // Fall through to tertiary fallback
    }

    // 3. Tertiary: Standard browser alert
    window.alert(`Copy the link below:\n\n${url}`)
  }

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => {
      setCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Copied!" : "Share"}
      className={`print:hidden inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] rounded-lg transition-colors ${
        copied ? "text-[var(--theme-success)]" : "text-[var(--theme-fg)]"
      }`}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Link className="w-4 h-4" />
      )}
      {showLabel && <span>{copied ? "Copied!" : "Share"}</span>}
    </button>
  )
}
