import { createContext, createElement, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'

const rootRoute = getRouteApi('__root__')

function useResolveAuthState() {
  const { session: serverSession } = rootRoute.useRouteContext()
  const { data: session, isPending } = useSession()
  const effectiveSession = isPending
    ? session ?? serverSession ?? null
    : session ?? null

  return useMemo(
    () => ({
      session: effectiveSession,
      isPending: isPending && !effectiveSession,
      isLoggedIn: !!effectiveSession?.user,
      userId: effectiveSession?.user?.id ?? null,
    }),
    [effectiveSession, isPending],
  )
}

type AuthState = ReturnType<typeof useResolveAuthState>

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useResolveAuthState()

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
