import { createAuthClient } from "better-auth/react"
import { usernameClient, inferAdditionalFields, emailVerificationClient } from "better-auth/client/plugins"
import type { Auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    inferAdditionalFields<Auth>(),
    emailVerificationClient(),
  ],
})

export const { useSession, signIn, signUp, signOut } = authClient
