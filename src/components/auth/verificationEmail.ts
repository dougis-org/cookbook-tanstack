import { authClient } from "@/lib/auth-client"

type AuthErrorResult = {
  error?: {
    message?: string
  } | null
}

export function getVerificationEmailErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }
  return "Unable to send verification email"
}

export async function requestVerificationEmail(email: string) {
  const result = await authClient.sendVerificationEmail({
    email,
    callbackURL: "/auth/verify-email",
  })

  const possibleError = (result as AuthErrorResult | undefined)?.error
  if (possibleError) {
    throw new Error(possibleError.message || "Unable to send verification email")
  }
}
