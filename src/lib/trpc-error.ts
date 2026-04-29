export type TierWallReason = 'count-limit' | 'private-content' | 'import'

const VALID_REASONS = new Set<TierWallReason>(['count-limit', 'private-content', 'import'])

export function getTierWallReason(error: unknown): TierWallReason | null {
  const appError = (error as { data?: { appError?: { type?: string; reason?: string } | null } })?.data?.appError
  if (appError?.type === 'tier-wall' && typeof appError.reason === 'string') {
    return VALID_REASONS.has(appError.reason as TierWallReason) ? appError.reason as TierWallReason : null
  }
  return null
}
