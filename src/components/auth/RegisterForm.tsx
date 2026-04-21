import { useState } from "react"
import { Link } from "@tanstack/react-router"
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <FormInput id="name" label="Name" value={name} onChange={setName} placeholder="Your display name (optional)" />
      <FormInput id="username" label="Username" value={username} onChange={setUsername} placeholder="Choose a unique username" required error={fieldErrors.username} />
      <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} />
      <FormInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required error={fieldErrors.password} />
      <FormSubmitButton isLoading={isLoading} label="Create Account" loadingLabel="Creating account..." />
      <p className="text-center text-[var(--theme-fg-subtle)] text-sm">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors">Sign in</Link>
      </p>
    </form>
  )
}
