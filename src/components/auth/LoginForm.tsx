import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { validateEmail } from "@/lib/validation"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"

interface FieldErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
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
        onSuccess: () => navigate({ to: "/" }),
        onError: (ctx) => setError(ctx.error.message || "Invalid credentials"),
      },
    )

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} />
      <FormInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" required error={fieldErrors.password} />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-300">Remember me</span>
        </label>
        <Link to="/auth/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
          Forgot password?
        </Link>
      </div>

      <FormSubmitButton isLoading={isLoading} label="Sign In" loadingLabel="Signing in..." />
      <p className="text-center text-gray-400 text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/auth/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">Create one</Link>
      </p>
    </form>
  )
}
