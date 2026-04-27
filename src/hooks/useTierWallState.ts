import { useCallback, useState } from 'react'

export type TierWallReason = 'count-limit' | 'private-content' | 'import'
export type ServerError = string | null

interface UseTierWallStateReturn {
  serverError: ServerError
  tierWallReason: TierWallReason | null
  setServerError: (error: ServerError) => void
  setTierWallReason: (reason: TierWallReason | null) => void
  clearErrors: () => void
  handleTierWallError: (reason: TierWallReason) => void
  handleServerError: (message: string) => void
}

export function useTierWallState(): UseTierWallStateReturn {
  const [serverError, setServerError] = useState<ServerError>(null)
  const [tierWallReason, setTierWallReason] = useState<TierWallReason | null>(null)

  const clearErrors = useCallback(() => {
    setServerError(null)
    setTierWallReason(null)
  }, [])

  const handleTierWallError = useCallback((reason: TierWallReason) => {
    setTierWallReason(reason)
    setServerError(null)
  }, [])

  const handleServerError = useCallback((message: string) => {
    setServerError(message)
    setTierWallReason(null)
  }, [])

  return {
    serverError,
    tierWallReason,
    setServerError,
    setTierWallReason,
    clearErrors,
    handleTierWallError,
    handleServerError,
  }
}