import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { validateEmail, validatePassword, validateUsername } from "@/lib/validation"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"

interface FieldErrors {
  username?: string
  email?: string
  password?: string
}

export default function RegisterForm() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

    await authClient.signUp.email(
      { email, password, name: name || username, username },
      {
        onSuccess: () => navigate({ to: "/" }),
        onError: (ctx) => setError(ctx.error.message || "Registration failed"),
      },
    )

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <FormInput id="name" label="Name" value={name} onChange={setName} placeholder="Your display name (optional)" />
      <FormInput id="username" label="Username" value={username} onChange={setUsername} placeholder="Choose a unique username" required error={fieldErrors.username} />
      <FormInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} />
      <FormInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required error={fieldErrors.password} />
      <FormSubmitButton isLoading={isLoading} label="Create Account" loadingLabel="Creating account..." />
      <p className="text-center text-gray-400 text-sm">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign in</Link>
      </p>
    </form>
  )
}
