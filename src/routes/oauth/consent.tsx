import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ShieldCheck } from "lucide-react"
import { requireAuth } from "@/lib/auth-guard"
import { parseConsentRequest, buildConsentDecisionBody } from "@/lib/oauth-consent"
import PageLayout from "@/components/layout/PageLayout"

export const Route = createFileRoute("/oauth/consent")({
  beforeLoad: requireAuth(),
  component: ConsentPage,
  validateSearch: (search: Record<string, unknown>) => parseConsentRequest(search),
})

function ConsentPage() {
  const request = Route.useSearch()
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")

  async function submit(decision: "accept" | "deny") {
    setStatus("submitting")
    try {
      const response = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildConsentDecisionBody(decision, request)),
      })
      if (!response.ok) {
        setStatus("error")
        return
      }
      const data: { redirect?: boolean; url?: string } = await response.json()
      if (data.redirect && data.url) {
        window.location.href = data.url
        return
      }
      setStatus("idle")
    } catch {
      setStatus("error")
    }
  }

  return (
    <PageLayout
      title="Authorize App Access"
      description="Review what this app is requesting before you continue."
    >
      <div className="mx-auto max-w-md rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-shadow-sm)]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6 text-[var(--theme-accent)]" />
          <h2 className="font-display text-lg font-semibold text-[var(--theme-fg)]">
            {request.clientId ?? "An app"} wants to connect
          </h2>
        </div>
        <p className="mt-4 text-sm text-[var(--theme-fg-muted)]">
          This will let the app access:
        </p>
        <p className="mt-1 rounded-md bg-[var(--theme-surface-hover)] p-3 text-sm text-[var(--theme-fg)]">
          {request.scope ?? "No scopes requested"}
        </p>
        {status === "error" && (
          <p className="mt-4 text-sm text-red-500">
            Something went wrong recording your decision. Please try again.
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => submit("deny")}
            disabled={status === "submitting"}
            className="flex-1 rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-hover)]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => submit("accept")}
            disabled={status === "submitting"}
            className="flex-1 rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
          >
            Allow
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
