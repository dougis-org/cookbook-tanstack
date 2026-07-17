import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Settings } from "lucide-react"
import { requireAuth } from "@/lib/auth-guard"
import PageLayout from "@/components/layout/PageLayout"
import { useAuth } from "@/hooks/useAuth"
import { authClient } from "@/lib/auth-client"
import { DEFAULT_THEME, isValidThemeId, THEMES } from "@/contexts/ThemeContext"
import type { AuthErrorContext } from "@/components/auth/types"

const DEFAULT_ERROR_MESSAGE = "Unable to save. Try again."

export const Route = createFileRoute("/account_/settings")({
  beforeLoad: requireAuth(),
  component: SettingsPage,
})

type SaveStatus = "idle" | "saving" | "success" | "error"

export function SettingsPage() {
  const { session, isPending } = useAuth()
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME)
  const [hasEdited, setHasEdited] = useState(false)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE)

  useEffect(() => {
    if (hasEdited) return
    const sessionTheme = session?.user?.theme
    if (isValidThemeId(sessionTheme)) {
      setSelectedTheme(sessionTheme)
    }
  }, [session, hasEdited])

  function selectTheme(id: (typeof THEMES)[number]["id"]) {
    setHasEdited(true)
    setSelectedTheme(id)
    setStatus("idle")
  }

  if (isPending) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto py-12 px-6">
          <div data-testid="settings-loading" className="animate-pulse space-y-3">
            <div className="h-8 w-1/3 rounded bg-[var(--theme-border)]" />
            <div className="h-24 w-full rounded bg-[var(--theme-border)]" />
          </div>
        </div>
      </PageLayout>
    )
  }

  async function handleSave() {
    const themeToSave = isValidThemeId(selectedTheme) ? selectedTheme : DEFAULT_THEME
    setStatus("saving")
    await authClient.updateUser(
      { theme: themeToSave },
      {
        onSuccess: () => setStatus("success"),
        onError: (ctx: AuthErrorContext) => {
          console.error("Failed to save theme preference:", ctx.error)
          setErrorMessage(ctx.error.message || DEFAULT_ERROR_MESSAGE)
          setStatus("error")
        },
      },
    )
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="flex items-center gap-4 mb-8">
          <Settings className="w-10 h-10 text-[var(--theme-accent)]" />
          <h1 className="text-3xl font-bold text-[var(--theme-fg)]">Settings</h1>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--theme-fg)] mb-1">Theme</h2>
            <p className="text-sm text-[var(--theme-fg-muted)]">
              Choose how My CookBooks looks on this device.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") {
                return
              }
              e.preventDefault()
              const currentIndex = THEMES.findIndex((t) => t.id === selectedTheme)
              const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
              const nextIndex = (currentIndex + delta + THEMES.length) % THEMES.length
              const nextTheme = THEMES[nextIndex]
              selectTheme(nextTheme.id)
              const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
              buttons[nextIndex]?.focus()
            }}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selectedTheme === t.id}
                tabIndex={selectedTheme === t.id ? 0 : -1}
                onClick={() => selectTheme(t.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] ${
                  selectedTheme === t.id
                    ? "border-[var(--theme-accent)] bg-[var(--theme-surface-hover)] text-[var(--theme-fg)]"
                    : "border-[var(--theme-border)] text-[var(--theme-fg-muted)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving"}
              className="rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
            {status === "success" && (
              <p data-testid="settings-success" className="text-sm text-[var(--theme-fg-muted)]">
                Saved.
              </p>
            )}
            {status === "error" && (
              <p data-testid="settings-error" role="alert" className="text-sm text-[var(--theme-error)]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
