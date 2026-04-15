import { createAuthClient } from "better-auth/react"
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins"
import type { Auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    inferAdditionalFields<Auth>(),
  ],
})

export const { useSession, signIn, signUp, signOut } = authClient
