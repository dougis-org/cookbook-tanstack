import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Check } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { validateEmail, validatePassword, validateUsername } from "@/lib/validation"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"
import type { AuthErrorContext } from "@/components/auth/types"

interface FieldErrors {
  username?: string
  email?: string
  password?: string
}

const BENEFITS = [
  "Free forever — no credit card required",
  "Save up to 10 recipes",
  "Build a cookbook",
  "Print any recipe",
  "Browse hundreds of public recipes",
]

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: FieldErrors = {
      email: validateEmail(email),
      username: validateUsername(username),
      password: validatePassword(password),
    }
    const hasErrors = Object.values(errors).some(Boolean)
    setFieldErrors(errors)
    if (hasErrors) return

    setError("")
    setIsLoading(true)

    try {
      await authClient.signUp.email(
        { email, password, name: name || username, username, displayUsername: username },
        {
          onSuccess: () => setIsSubmitted(true),
          onError: (ctx: AuthErrorContext) => setError(ctx.error.message || "Registration failed"),
        },
      )
    } catch (signUpError) {
      setError(
        signUpError instanceof Error && signUpError.message
          ? signUpError.message
          : "Registration failed",
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--theme-fg)]">Check your email</h2>
          <p className="text-[var(--theme-fg-muted)]">
            We&apos;ve sent a verification link to <span className="font-medium text-[var(--theme-fg)]">{email}</span>.
          </p>
        </div>
        <Link to="/auth/login" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
      {/* Benefits Sidebar (first in JSX for mobile layout ordering) */}
      <div className="order-first md:order-last bg-[var(--theme-surface-raised)] border border-[var(--theme-border-muted)] rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-[var(--theme-fg)]">
          Why join My CookBooks?
        </h3>
        <ul className="space-y-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="group flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--theme-accent-subtle-bg)] flex items-center justify-center border border-[var(--theme-border-muted)] transition-transform duration-200 group-hover:scale-110">
                <Check className="w-3.5 h-3.5 text-[var(--theme-accent)]" aria-hidden="true" />
              </div>
              <span className="text-sm text-[var(--theme-fg-subtle)] transition-colors duration-200 group-hover:text-[var(--theme-fg)]">
                {benefit}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form (second in JSX for desktop layout ordering) */}
      <form onSubmit={handleSubmit} className="order-last md:order-first space-y-5" noValidate>
        <FormError message={error} />
        <FormInput id="name" label="Name" value={name} onChange={setName} placeholder="Your display name (optional)" />
        <FormInput id="username" label="Username" value={username} onChange={setUsername} placeholder="Choose a unique username" required error={fieldErrors.username} />
        <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} />
        <FormInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required error={fieldErrors.password} />
        <FormSubmitButton isLoading={isLoading} label="Create Account" loadingLabel="Creating account..." />
        
        {/* TODO: Replace <a> with <Link> for /terms once that route is created (#625) */}
        <p className="text-center text-xs text-[var(--theme-fg-subtle)] leading-relaxed">
          By creating an account you agree to our{" "}
          <a
            href="/terms"
            className="underline hover:text-[var(--theme-accent)] transition-colors"
          >
            Terms
          </a>{" "}
          and{" "}
          <Link
            to="/privacy-policy"
            className="underline hover:text-[var(--theme-accent)] transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-center text-[var(--theme-fg-subtle)] text-sm border-t border-[var(--theme-border-muted)] pt-4 mt-2">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
