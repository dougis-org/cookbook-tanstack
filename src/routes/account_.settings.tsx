import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Settings } from "lucide-react"
import { requireAuth } from "@/lib/auth-guard"
import PageLayout from "@/components/layout/PageLayout"
import { useAuth } from "@/hooks/useAuth"
import { authClient } from "@/lib/auth-client"
import { DEFAULT_THEME, isValidThemeId, THEMES } from "@/contexts/ThemeContext"

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
    try {
      await authClient.updateUser({ theme: themeToSave })
      setStatus("success")
    } catch {
      setStatus("error")
    }
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
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selectedTheme === t.id}
                onClick={() => selectTheme(t.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
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
                Unable to save. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
