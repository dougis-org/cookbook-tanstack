import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { authClient } from "@/lib/auth-client"
import { DEFAULT_THEME, isValidThemeId, THEMES } from "@/contexts/ThemeContext"
import type { AuthErrorContext } from "@/components/auth/types"
import {
  DEFAULT_PRINT_PREFERENCES,
  PRINT_PLACEMENTS,
  resolvePrintPreferences,
  type PrintPlacement,
  type PrintPlacementKey,
  type PrintPreferences,
} from "@/lib/printPreferences"

const DEFAULT_ERROR_MESSAGE = "Unable to save. Try again."

type PrintToggleKey = Exclude<keyof PrintPreferences, PrintPlacementKey>

const PLACEMENT_LABELS: Record<PrintPlacement, string> = { header: "Header", footer: "Footer", none: "None" }

const PRINT_PLACEMENT_ELEMENTS: { key: PrintPlacementKey; label: string }[] = [
  { key: "printCategory", label: "Category" },
  { key: "printDifficulty", label: "Difficulty" },
  { key: "printServings", label: "Servings" },
  { key: "printPrepTime", label: "Prep time" },
  { key: "printCookTime", label: "Cook time" },
]

const PRINT_PREFERENCE_TOGGLES: { key: PrintToggleKey; label: string }[] = [
  { key: "printShowIngredients", label: "Ingredients" },
  { key: "printShowInstructions", label: "Instructions" },
  { key: "printShowNotes", label: "Notes" },
  { key: "printShowPersonalNotes", label: "Personal Notes" },
]

type SaveStatus = "idle" | "saving" | "success" | "error"

export default function PreferencesSection() {
  const { session, isPending } = useAuth()
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME)
  const [printPreferences, setPrintPreferences] = useState<PrintPreferences>(DEFAULT_PRINT_PREFERENCES)
  const [hasEdited, setHasEdited] = useState(false)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE)

  useEffect(() => {
    if (hasEdited) return
    const sessionTheme = session?.user?.theme
    if (isValidThemeId(sessionTheme)) {
      setSelectedTheme(sessionTheme)
    }
    setPrintPreferences(resolvePrintPreferences(session))
  }, [session, hasEdited])

  function selectTheme(id: (typeof THEMES)[number]["id"]) {
    setHasEdited(true)
    setSelectedTheme(id)
    setStatus("idle")
  }

  function selectPlacement(key: PrintPlacementKey, placement: PrintPlacement) {
    setHasEdited(true)
    setPrintPreferences((prev) => ({ ...prev, [key]: placement }))
    setStatus("idle")
  }

  function togglePrintPreference(key: PrintToggleKey) {
    setHasEdited(true)
    setPrintPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
    setStatus("idle")
  }

  if (isPending) {
    return (
      <div data-testid="settings-loading" className="animate-pulse space-y-3">
        <div className="h-8 w-1/3 rounded bg-[var(--theme-border)]" />
        <div className="h-24 w-full rounded bg-[var(--theme-border)]" />
      </div>
    )
  }

  async function handleSave() {
    const themeToSave = isValidThemeId(selectedTheme) ? selectedTheme : DEFAULT_THEME
    setStatus("saving")
    try {
      await authClient.updateUser(
        { theme: themeToSave, ...printPreferences },
        {
          onSuccess: () => setStatus("success"),
          onError: (ctx: AuthErrorContext) => {
            console.error("Failed to save theme preference:", ctx.error)
            setErrorMessage(ctx.error.message || DEFAULT_ERROR_MESSAGE)
            setStatus("error")
          },
        },
      )
    } catch (error) {
      // Defense-in-depth: onError above handles the documented Better-Auth
      // resolve-with-error contract. This catches the unexpected case where the
      // call itself rejects (e.g. a network-level exception), so the UI never
      // gets stuck on "saving" with no feedback.
      console.error("Unexpected error saving theme preference:", error)
      setErrorMessage(DEFAULT_ERROR_MESSAGE)
      setStatus("error")
    }
  }

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 space-y-6">
      <h2 className="text-xl font-bold text-[var(--theme-fg)]">Preferences</h2>
      <div>
        <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-1">Theme</h3>
        <p className="text-sm text-[var(--theme-fg-muted)]">
          Choose how My CookBooks looks. Your selection is saved to your account.
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

      <div>
        <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-1">Print Preferences</h3>
        <p className="text-sm text-[var(--theme-fg-muted)] mb-4">
          Choose which sections print with your recipes. Applies to both single-recipe and cookbook printing (Personal Notes only ever prints from a recipe's own page).
        </p>

        <h4 className="text-base font-bold text-[var(--theme-fg)] mb-1">Recipe details</h4>
        <p className="text-sm text-[var(--theme-fg-muted)] mb-3">
          Choose where each detail prints: in the header under the title, in the footer at the end of the recipe, or not at all.
        </p>
        <div
          data-testid="print-layout-sketch"
          aria-hidden="true"
          className="mb-4 max-w-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] p-3 space-y-2 text-xs text-[var(--theme-fg-muted)]"
        >
          <div data-testid="print-sketch-header" className="rounded border border-dashed border-[var(--theme-border)] px-2 py-1">
            Header: under the title
          </div>
          <div data-testid="print-sketch-body" className="rounded border border-[var(--theme-border-muted)] px-2 py-4 text-center">
            Ingredients and instructions
          </div>
          <div data-testid="print-sketch-footer" className="rounded border border-dashed border-[var(--theme-border)] px-2 py-1">
            Footer: end of the recipe
          </div>
        </div>
        <div className="space-y-3 mb-6">
          {PRINT_PLACEMENT_ELEMENTS.map(({ key, label }) => (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-lg border border-[var(--theme-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-[var(--theme-fg)]">{label}</span>
              <div
                role="radiogroup"
                aria-label={`${label} placement`}
                className="inline-flex gap-2"
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") {
                    return
                  }
                  e.preventDefault()
                  const currentIndex = PRINT_PLACEMENTS.indexOf(printPreferences[key])
                  const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
                  const nextIndex = (currentIndex + delta + PRINT_PLACEMENTS.length) % PRINT_PLACEMENTS.length
                  selectPlacement(key, PRINT_PLACEMENTS[nextIndex])
                  const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
                  buttons[nextIndex]?.focus()
                }}
              >
                {PRINT_PLACEMENTS.map((placement) => (
                  <button
                    key={placement}
                    type="button"
                    role="radio"
                    aria-checked={printPreferences[key] === placement}
                    tabIndex={printPreferences[key] === placement ? 0 : -1}
                    onClick={() => selectPlacement(key, placement)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] ${
                      printPreferences[key] === placement
                        ? "border-[var(--theme-accent)] bg-[var(--theme-surface-hover)] text-[var(--theme-fg)]"
                        : "border-[var(--theme-border)] text-[var(--theme-fg-muted)]"
                    }`}
                  >
                    {PLACEMENT_LABELS[placement]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h4 className="text-base font-bold text-[var(--theme-fg)] mb-3">Sections</h4>
        <div className="space-y-3">
          {PRINT_PREFERENCE_TOGGLES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--theme-border)] px-4 py-3 cursor-pointer"
            >
              <span className="text-sm font-medium text-[var(--theme-fg)]">{label}</span>
              <input
                type="checkbox"
                checked={printPreferences[key]}
                onChange={() => togglePrintPreference(key)}
                className="w-4 h-4 rounded border-[var(--theme-border)] bg-[var(--theme-surface-raised)] text-[var(--theme-accent)] accent-[var(--theme-accent)] focus:ring-[var(--theme-accent)]"
              />
            </label>
          ))}
        </div>
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
  )
}
