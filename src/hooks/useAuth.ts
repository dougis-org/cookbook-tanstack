import { useSession } from '@/lib/auth-client'

export function useAuth() {
  const { data: session, isPending } = useSession()
  return {
    session,
    isPending,
    isLoggedIn: !!session?.user,
    userId: session?.user?.id ?? null,
  }
}
