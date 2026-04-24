import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"

export const Route = createFileRoute("/upgrade")({ component: UpgradePage })

export function UpgradePage() {
  return (
    <PageLayout title="Upgrade">
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-4">
          Upgrade plans coming soon
        </h2>
        <p className="text-[var(--theme-fg-muted)] mb-8">
          We are working on upgrade options. Check back soon!
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 text-[var(--theme-accent)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          View pricing
        </Link>
      </div>
    </PageLayout>
  )
}
