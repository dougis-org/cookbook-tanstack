import { useState } from "react"
import { MailCheck, CheckCircle2 } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { getVerificationEmailErrorMessage, requestVerificationEmail } from "@/components/auth/verificationEmail"

interface PostSubmitVerifyGateProps {
  recipeId: string
  recipeName: string
  email: string
}

type ResendStatus = "idle" | "loading" | "success" | "error"

export default function PostSubmitVerifyGate({
  recipeId,
  recipeName,
  email,
}: PostSubmitVerifyGateProps) {
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle")
  const [resendError, setResendError] = useState("")

  async function handleResend() {
    setResendStatus("loading")
    setResendError("")
    try {
      await requestVerificationEmail(email)
      setResendStatus("success")
    } catch (error) {
      setResendError(getVerificationEmailErrorMessage(error))
      setResendStatus("error")
    }
  }

  return (
    <div data-testid="post-submit-verify-gate" className="flex flex-col items-center justify-center gap-6 py-12 px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-[var(--theme-accent)]/10 p-4">
          <MailCheck className="size-10 text-[var(--theme-accent)]" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[var(--theme-fg)]">
            Recipe saved — verify to publish
          </h2>
          <p className="max-w-md text-[var(--theme-fg-muted)]">
            <strong className="text-[var(--theme-fg)]">{recipeName}</strong> has been saved.
            It will be published automatically once you verify your email address.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] px-6 py-5 w-full max-w-sm">
        <p className="text-sm text-[var(--theme-fg-muted)]">
          A verification link was sent to <strong className="text-[var(--theme-fg)]">{email}</strong>.
        </p>
        {resendStatus === "success" ? (
          <div className="flex items-center gap-2 text-sm text-[var(--theme-success)]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Verification email resent!
          </div>
        ) : null}
        {resendStatus === "error" ? (
          <p role="alert" className="text-sm text-[var(--theme-error)]">{resendError}</p>
        ) : null}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === "loading" || resendStatus === "success"}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--theme-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
        </button>
      </div>

      <div className="flex gap-3 text-sm">
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId }}
          className="text-[var(--theme-accent)] hover:underline"
        >
          View pending recipe
        </Link>
        <span className="text-[var(--theme-fg-muted)]">·</span>
        <Link to="/recipes" className="text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] hover:underline">
          Back to recipes
        </Link>
      </div>
    </div>
  )
}
