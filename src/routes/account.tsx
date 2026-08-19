import { createFileRoute } from "@tanstack/react-router"
import { User } from "lucide-react"
import type { RedirectReason } from "@/lib/auth-guard"
import { requireAuth } from "@/lib/auth-guard"
import PageLayout from "@/components/layout/PageLayout"
import ProfileSection from "@/components/account/ProfileSection"
import StatusSection from "@/components/account/StatusSection"
import PreferencesSection from "@/components/account/PreferencesSection"

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuth(),
  component: AccountPage,
  validateSearch: (search: Record<string, unknown>): { reason?: RedirectReason } => ({
    reason:
      search.reason === "auth-required" || search.reason === "tier-limit-reached"
        ? search.reason
        : undefined,
  }),
})

export function AccountPage() {
  const { reason } = Route.useSearch()

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-10">
        <div className="flex items-center gap-4">
          <User className="w-12 h-12 text-[var(--theme-accent)]" />
          <h1 className="text-3xl font-bold text-[var(--theme-fg)]">Account</h1>
        </div>
        <ProfileSection />
        <StatusSection reason={reason} />
        <PreferencesSection />
      </div>
    </PageLayout>
  )
}
