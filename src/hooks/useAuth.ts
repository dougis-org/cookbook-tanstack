import { createContext, createElement, useContext } from 'react'
import type { ReactNode } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'

const rootRoute = getRouteApi('__root__')

type AuthState = ReturnType<typeof resolveAuthState>

const AuthContext = createContext<AuthState | null>(null)

function resolveAuthState() {
  const { session: serverSession } = rootRoute.useRouteContext()
  const { data: session, isPending } = useSession()
  const effectiveSession = isPending
    ? session ?? serverSession ?? null
    : session ?? null

  return {
    session: effectiveSession,
    isPending: isPending && !effectiveSession,
    isLoggedIn: !!effectiveSession?.user,
    userId: effectiveSession?.user?.id ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = resolveAuthState()

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)

  return context ?? resolveAuthState()
}
