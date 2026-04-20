import { useState } from "react"
import { useRouterState } from "@tanstack/react-router"
import { MailCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getVerificationEmailErrorMessage, requestVerificationEmail } from "@/components/auth/verificationEmail"

type ResendStatus = "idle" | "loading" | "success" | "error"

export default function VerificationBanner() {
  const { session, isLoggedIn } = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle")
  const [resendError, setResendError] = useState("")

  if (!isLoggedIn || pathname.startsWith("/auth/")) return null
  if (session?.user?.emailVerified !== false) return null

  async function handleResend() {
    if (!session?.user?.email) return

    setResendStatus("loading")
    setResendError("")

    try {
      await requestVerificationEmail(session.user.email)
      setResendStatus("success")
    } catch (error) {
      setResendError(getVerificationEmailErrorMessage(error))
      setResendStatus("error")
    }
  }

  return (
    <div className="border-b border-[var(--theme-border)] bg-[var(--theme-surface-raised)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm text-[var(--theme-fg-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-[var(--theme-accent)]" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-[var(--theme-fg)]">Verify your email</p>
            <p>Check your inbox to finish verifying {session.user.email}.</p>
            {resendStatus === "success" ? (
              <p className="text-[var(--theme-success)]">Verification email sent!</p>
            ) : null}
            {resendStatus === "error" ? (
              <p role="alert" className="text-[var(--theme-error)]">{resendError}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === "loading"}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-accent)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--theme-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
        </button>
      </div>
    </div>
  )
}
