import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"

export const Route = createFileRoute("/change-tier")({ component: ChangeTierPage })

export function ChangeTierPage() {
  return (
    <PageLayout title="Change Plan">
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-4">
          Plan changes coming soon
        </h2>
        <p className="text-[var(--theme-fg-muted)] mb-8">
          We are working on plan change options. Check back soon!
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
