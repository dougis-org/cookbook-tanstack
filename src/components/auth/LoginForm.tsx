import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { validateEmail } from "@/lib/validation"
import { REDIRECT_REASON_MESSAGES, type RedirectReason } from "@/lib/auth-guard"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"

interface FieldErrors {
  email?: string
  password?: string
}

interface LoginFormProps {
  reason?: RedirectReason
  from?: string
}

function isSafeRedirectPath(path: string | undefined): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
}

export default function LoginForm({ reason, from }: LoginFormProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: FieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : "Password is required",
    }
    const hasErrors = Object.values(errors).some(Boolean)
    setFieldErrors(errors)
    if (hasErrors) return

    setError("")
    setIsLoading(true)

    await authClient.signIn.email(
      { email, password, rememberMe },
      {
        onSuccess: () => navigate({ to: isSafeRedirectPath(from) ? from : "/" }),
        onError: (ctx) => setError(ctx.error.message || "Invalid credentials"),
      },
    )

    setIsLoading(false)
  }

  const bannerMessage = reason && reason in REDIRECT_REASON_MESSAGES
    ? REDIRECT_REASON_MESSAGES[reason]
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {bannerMessage && (
        <div className="rounded-lg border border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/10 px-4 py-3 text-sm text-[var(--theme-accent)]">
          {bannerMessage}
        </div>
      )}
      <FormError message={error} />
      <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} />
      <FormInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" required error={fieldErrors.password} />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--theme-border)] bg-[var(--theme-surface-raised)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]"
          />
          <span className="text-sm text-[var(--theme-fg-muted)]">Remember me</span>
        </label>
        <Link to="/auth/forgot-password" className="text-sm text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors">
          Forgot password?
        </Link>
      </div>

      <FormSubmitButton isLoading={isLoading} label="Sign In" loadingLabel="Signing in..." />
      <p className="text-center text-[var(--theme-fg-subtle)] text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/auth/register" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors">Create one</Link>
      </p>
    </form>
  )
}
