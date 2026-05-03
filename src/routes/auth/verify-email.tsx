import { createFileRoute } from "@tanstack/react-router"
import { MailCheck } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import VerifyEmailPage from "@/components/auth/VerifyEmailPage"

export function validateVerifyEmailSearch(
  search: Record<string, unknown>,
): { error?: string; from?: string } {
  let from: string | undefined
  if (typeof search.from === "string") {
    // Only allow relative paths starting with / or empty string
    // Reject absolute URLs (with protocol), protocol-relative URLs, and any XSS vectors like javascript:
    const isValidRelativePath = search.from === "" || (search.from.startsWith("/") && !search.from.includes("://") && !search.from.startsWith("//"))
    from = isValidRelativePath ? search.from : undefined
  }

  return {
    error: typeof search.error === "string" && search.error.length > 0 ? search.error : undefined,
    from,
  }
}

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailRoute,
  validateSearch: validateVerifyEmailSearch,
})

function VerifyEmailRoute() {
  const { error, from } = Route.useSearch()

  return (
    <AuthPageLayout icon={MailCheck} title="Email Verification">
      <VerifyEmailPage error={error} from={from} />
    </AuthPageLayout>
  )
}
