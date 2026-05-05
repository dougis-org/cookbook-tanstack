import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { getVerificationEmailErrorMessage } from "@/components/auth/verificationEmail"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react"

interface VerifyEmailPageProps {
  error?: string
  from?: string
}

export default function VerifyEmailPage({ error, from }: VerifyEmailPageProps) {
  const { session } = useAuth()
  const [resendStatus, setResendStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [resendError, setResendError] = useState<string | null>(null)

  const { data: profile } = useQuery({
    ...trpc.users.me.queryOptions(),
    enabled: session?.user?.emailVerified !== true && !!session,
  })

  // Use fresh profile data to detect verification without waiting for session cache to expire
  const isVerified = typeof profile?.emailVerified === 'boolean'
    ? profile.emailVerified
    : session?.user?.emailVerified === true

  const email = profile?.email || session?.user?.email || ""

  async function handleResend() {
    if (resendStatus === "pending" || !email) return

    setResendStatus("pending")
    setResendError(null)

    try {
      const result = await authClient.sendVerificationEmail(
        {
          email,
          callbackURL: `${window.location.origin}/auth/verify-email${from ? `?from=${encodeURIComponent(from)}` : ""}`,
        },
        {
          onSuccess: () => setResendStatus("success"),
          onError: (ctx) => {
            setResendStatus("error")
            setResendError(ctx.error.message || "Failed to resend email")
          },
        },
      )

      // BetterAuth can resolve with { error } without firing callbacks
      const resolvedError = (result as { error?: { message?: string } | null } | undefined)?.error
      if (resolvedError) {
        setResendStatus("error")
        setResendError(getVerificationEmailErrorMessage(resolvedError))
      }
    } catch (err) {
      setResendStatus("error")
      setResendError(getVerificationEmailErrorMessage(err))
    }
  }

  // Verification successful state
  if (isVerified) {
    return (
      <div className="text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-2">Email Verified!</h2>
        <p className="text-[var(--theme-fg-muted)] mb-8">
          Your email has been successfully verified. You now have full access to create and manage recipes.
        </p>
        <Link
          to={from || "/"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-accent)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // Error or Landing state
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {error === "expired" ? "The verification link has expired." : "Verification failed. The link may be invalid or already used."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-2">Verify your email</h2>
          <p className="text-[var(--theme-fg-muted)]">
            We&apos;ve sent a verification link to <span className="font-semibold text-[var(--theme-fg)]">{profile?.email || session?.user?.email || "your email"}</span>. Please check your inbox.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleResend}
          disabled={resendStatus === "pending" || !email}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] px-4 py-3 font-semibold text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
        >
          {resendStatus === "pending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend verification email"
          )}
        </button>

        {resendStatus === "success" && (
          <p className="text-center text-sm font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1">
            New verification link sent!
          </p>
        )}

        {resendStatus === "error" && (
          <p className="text-center text-sm font-medium text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
            {resendError}
          </p>
        )}

        <div className="pt-4 text-center">
          <Link
            to="/auth/login"
            className="text-sm font-medium text-[var(--theme-accent)] hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
