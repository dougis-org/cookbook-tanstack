import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { AlertTriangle, MailCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getVerificationEmailErrorMessage, requestVerificationEmail } from "@/components/auth/verificationEmail"

interface VerifyEmailPageProps {
  error?: string
}

type ResendStatus = "idle" | "loading" | "success" | "error"

export default function VerifyEmailPage({ error }: VerifyEmailPageProps) {
  const { session } = useAuth()
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle")
  const [resendError, setResendError] = useState("")
  const email = session?.user?.email
  const isVerified = session?.user?.emailVerified === true
  const hasError = Boolean(error)

  async function handleResend() {
    if (!email) return

    setResendStatus("loading")
    setResendError("")

    try {
      await requestVerificationEmail(email)
      setResendStatus("success")
    } catch (resendFailure) {
      setResendError(getVerificationEmailErrorMessage(resendFailure))
      setResendStatus("error")
    }
  }

  if (isVerified) {
    return (
      <div className="text-center space-y-4">
        <MailCheck className="mx-auto size-10 text-[var(--theme-success)]" aria-hidden="true" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--theme-fg)]">Email verified!</h2>
          <p className="text-[var(--theme-fg-muted)]">You can now access all features.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
        >
          Continue to app
        </Link>
      </div>
    )
  }

  if (hasError) {
    return (
      <VerificationState
        icon={<AlertTriangle className="mx-auto size-10 text-[var(--theme-error)]" aria-hidden="true" />}
        title="Verification link is invalid or has expired"
        description="Request a new verification email and use the latest link in your inbox."
        email={email}
        resendStatus={resendStatus}
        resendError={resendError}
        onResend={handleResend}
      />
    )
  }

  return (
    <VerificationState
      icon={<MailCheck className="mx-auto size-10 text-[var(--theme-accent)]" aria-hidden="true" />}
      title="Please verify your email"
      description="Use the verification link we sent to your inbox to finish setting up your account."
      email={email}
      resendStatus={resendStatus}
      resendError={resendError}
      onResend={handleResend}
    />
  )
}

function VerificationState({
  icon,
  title,
  description,
  email,
  resendStatus,
  resendError,
  onResend,
}: {
  icon: React.ReactNode
  title: string
  description: string
  email?: string
  resendStatus: ResendStatus
  resendError: string
  onResend: () => void
}) {
  return (
    <div className="text-center space-y-4">
      {icon}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[var(--theme-fg)]">{title}</h2>
        <p className="text-[var(--theme-fg-muted)]">{description}</p>
        {email ? <p className="text-sm text-[var(--theme-fg-subtle)]">{email}</p> : null}
      </div>
      <button
        type="button"
        onClick={onResend}
        disabled={!email || resendStatus === "loading"}
        className="inline-flex items-center justify-center rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--theme-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
      </button>
      {resendStatus === "success" ? (
        <p className="text-sm text-[var(--theme-success)]">Verification email sent!</p>
      ) : null}
      {resendStatus === "error" ? (
        <p role="alert" className="text-sm text-[var(--theme-error)]">{resendError}</p>
      ) : null}
    </div>
  )
}
