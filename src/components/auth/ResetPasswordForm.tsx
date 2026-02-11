import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { validatePassword } from "@/lib/validation"
import FormInput from "@/components/ui/FormInput"
import FormError from "@/components/ui/FormError"
import FormSubmitButton from "@/components/ui/FormSubmitButton"

interface ResetPasswordFormProps {
  token: string
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const passwordError = validatePassword(password)
    if (passwordError) { setError(passwordError); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }

    setError("")
    setIsLoading(true)

    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => navigate({ to: "/auth/login" }),
        onError: (ctx) => setError(ctx.error.message || "Failed to reset password"),
      },
    )

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <FormInput id="password" label="New Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />
      <FormInput id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat your password" required />
      <FormSubmitButton isLoading={isLoading} label="Reset Password" loadingLabel="Resetting..." />
      <p className="text-center text-gray-400 text-sm">
        <Link to="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Back to sign in</Link>
      </p>
    </form>
  )
}
