import React from 'react'
import { isPageAdEligible, PageRole } from '@/lib/ad-policy'
import {
  GOOGLE_ADSENSE_ACCOUNT,
  GOOGLE_ADSENSE_SCRIPT_SRC,
  getGoogleAdSenseSlotId,
  type GoogleAdSenseSlotPosition,
} from '@/lib/google-adsense'
import { useAuth } from '@/hooks/useAuth'
import SponsorSlot from '@/components/ads/SponsorSlot'
import type { EntitlementTier } from '@/lib/tier-entitlements'
import { TIER_LIMITS } from '@/lib/tier-entitlements'

declare global {
  interface Window {
    /** Global queue consumed by the async Google AdSense library for slot requests. */
    adsbygoogle?: unknown[]
  }
}

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  role?: PageRole
}

function ensureGoogleAdSenseScript() {
  if (document.querySelector(`script[src="${GOOGLE_ADSENSE_SCRIPT_SRC}"]`)) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = GOOGLE_ADSENSE_SCRIPT_SRC
  document.head.appendChild(script)
}

export function AdSlot({
  role,
  position,
}: {
  role: PageRole
  position: GoogleAdSenseSlotPosition
}) {
  const { session } = useAuth()
  const adRef = React.useRef<HTMLModElement | null>(null)
  const adPushedRef = React.useRef(false)
  const adConfig = React.useMemo(() => {
    const slotId = getGoogleAdSenseSlotId(position)

    if (!isPageAdEligible(role, session)) return null

    if (!import.meta.env.PROD) return { slotId, mode: 'sponsor' as const }
    if (import.meta.env.VITE_ADSENSE_ENABLED !== 'true' || !slotId) {
      return { slotId: null, mode: 'sponsor' as const }
    }
    return { slotId, mode: 'adsense' as const }
  }, [position, role, session])

  React.useEffect(() => {
    if (!adConfig || adConfig.mode !== 'adsense') {
      adPushedRef.current = false
      return
    }

    if (!adRef.current || adPushedRef.current) {
      return
    }

    const adElement = adRef.current

    if (adElement.getAttribute('data-adsbygoogle-status') === 'done') {
      return
    }

    ensureGoogleAdSenseScript()

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      adPushedRef.current = true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to request Google AdSense slot', error)
      }
    }
  }, [adConfig])

  if (!adConfig) {
    return null
  }

  if (adConfig.mode === 'adsense') {
    return (
      <div className="my-8 overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 p-2">
        <ins
          ref={adRef}
          className="adsbygoogle block"
          data-ad-client={GOOGLE_ADSENSE_ACCOUNT}
          data-ad-format="auto"
          data-ad-slot={adConfig.slotId}
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  // SponsorSlot only occupies the right-rail slot — top/bottom are real ad positions
  if (position !== 'right-rail') return null

  const rawTier = session ? (session.user.tier ?? 'home-cook') : 'anonymous'
  const tier: EntitlementTier | 'anonymous' = Object.hasOwn(TIER_LIMITS, rawTier)
    ? (rawTier as EntitlementTier)
    : 'home-cook'

  return <SponsorSlot tier={tier} />
}

export default function PageLayout({
  children,
  title,
  description,
  role = 'authenticated-task',
}: PageLayoutProps) {
  const { session } = useAuth()
  const showAds = isPageAdEligible(role, session)

  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="container mx-auto px-4 py-8">
        <div className={`grid grid-cols-1 ${showAds ? 'lg:grid-cols-[1fr_300px]' : ''} gap-8 items-start`}>
          <div>
            {(title || description) && (
              <div className="mb-8" data-testid="page-title-section">
                {title && (
                  <h1 className="text-4xl font-bold text-[var(--theme-fg)] mb-2">{title}</h1>
                )}
                {description && (
                  <p className="text-[var(--theme-fg-subtle)] text-lg">{description}</p>
                )}
              </div>
            )}

            <AdSlot role={role} position="top" />

            {children}

            <AdSlot role={role} position="bottom" />
          </div>

          {showAds && (
            <div className="hidden lg:block sticky top-8" data-testid="right-rail">
              <AdSlot role={role} position="right-rail" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
