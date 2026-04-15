import { createAuthClient } from "better-auth/react"
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})

export const { useSession, signIn, signUp, signOut } = authClient
