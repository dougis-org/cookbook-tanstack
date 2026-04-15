import { createFileRoute } from "@tanstack/react-router"
import { User } from "lucide-react"
import type { RedirectReason } from "@/lib/auth-guard"
import { REDIRECT_REASON_MESSAGES } from "@/lib/auth-guard"
import PageLayout from "@/components/layout/PageLayout"

export const Route = createFileRoute("/account")({
  component: AccountPage,
  validateSearch: (search: Record<string, unknown>): { reason?: RedirectReason } => ({
    reason:
      search.reason === "auth-required" || search.reason === "tier-limit-reached"
        ? search.reason
        : undefined,
  }),
})

function AccountPage() {
  const { reason } = Route.useSearch()

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <User className="w-16 h-16 text-[var(--theme-accent)] mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-[var(--theme-fg)] mb-4">Account</h1>
        {reason && (
          <p className="text-[var(--theme-fg-muted)] mb-6">
            {REDIRECT_REASON_MESSAGES[reason]}
          </p>
        )}
        <p className="text-[var(--theme-fg-subtle)]">
          Account management is coming soon.
        </p>
      </div>
    </PageLayout>
  )
}
