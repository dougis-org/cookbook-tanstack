import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError("Email is required")
      return
    }
    setError("")
    setIsLoading(true)

    await authClient.forgetPassword(
      {
        email,
        redirectTo: "/auth/reset-password",
      },
      {
        onSuccess: () => {
          setIsSubmitted(true)
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Something went wrong")
        },
      },
    )

    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-300">
          If an account with that email exists, we&apos;ve sent you a password reset link.
        </p>
        <Link
          to="/auth/login"
          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </div>
      )}

      <p className="text-gray-400 text-sm">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        {error === "Email is required" && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? "Sending..." : "Send Reset Link"}
      </button>

      <p className="text-center text-gray-400 text-sm">
        <Link to="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
