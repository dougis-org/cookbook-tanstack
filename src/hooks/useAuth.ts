import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'

const rootRoute = getRouteApi('__root__')

export function useAuth() {
  const { session: serverSession } = rootRoute.useRouteContext()
  const { data: session, isPending } = useSession()
  const effectiveSession = session ?? serverSession ?? null

  return {
    session: effectiveSession,
    isPending: isPending && !effectiveSession,
    isLoggedIn: !!effectiveSession?.user,
    userId: effectiveSession?.user?.id ?? null,
  }
}
