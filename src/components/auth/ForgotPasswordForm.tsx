import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { validateEmail } from "@/lib/validation"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailError = validateEmail(email)
    setFieldError(emailError)
    if (emailError) return

    setError("")
    setIsLoading(true)

    await authClient.requestPasswordReset(
      { email, redirectTo: "/auth/reset-password" },
      {
        onSuccess: () => setIsSubmitted(true),
        onError: (ctx: { error: { message?: string } }) =>
          setError(ctx.error.message || "Something went wrong"),
      },
    )

    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <p className="text-[var(--theme-fg-muted)]">
          If an account with that email exists, we&apos;ve sent you a password reset link.
        </p>
        <Link to="/auth/login" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <p className="text-[var(--theme-fg-subtle)] text-sm">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
      <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldError} />
      <FormSubmitButton isLoading={isLoading} label="Send Reset Link" loadingLabel="Sending..." />
      <p className="text-center text-[var(--theme-fg-subtle)] text-sm">
        <Link to="/auth/login" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors">Back to sign in</Link>
      </p>
    </form>
  )
}
