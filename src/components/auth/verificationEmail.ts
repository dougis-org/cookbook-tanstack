import { authClient } from "@/lib/auth-client"

type AuthErrorResult = {
  error?: {
    message?: string
  } | null
}

const fallbackMessage = "Unable to send verification email"

function nonEmptyMessage(message: unknown) {
  return typeof message === "string" && message.trim().length > 0 ? message : undefined
}

export function getVerificationEmailErrorMessage(error: unknown) {
  if (error instanceof Error) return nonEmptyMessage(error.message) ?? fallbackMessage
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = nonEmptyMessage(error.message)
    if (message) return message
  }
  return fallbackMessage
}

export async function requestVerificationEmail(email: string) {
  const result = await authClient.sendVerificationEmail({
    email,
    callbackURL: "/auth/verify-email",
  })

  const possibleError = (result as AuthErrorResult | undefined)?.error
  if (possibleError) {
    throw new Error(nonEmptyMessage(possibleError.message) ?? fallbackMessage)
  }
}
