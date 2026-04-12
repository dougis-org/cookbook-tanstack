import type { auth } from '@/lib/auth'

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

export interface RouterContext {
  session: AuthSession | null
}
