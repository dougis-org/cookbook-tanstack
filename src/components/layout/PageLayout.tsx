import React from 'react'
import { isPageAdEligible, PageRole } from '@/lib/ad-policy'
import {
  GOOGLE_ADSENSE_ACCOUNT,
  GOOGLE_ADSENSE_SCRIPT_SRC,
  getGoogleAdSenseSlotId,
  type GoogleAdSenseSlotPosition,
} from '@/lib/google-adsense'
import { useAuth } from '@/hooks/useAuth'

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

    if (!import.meta.env.PROD || !slotId || !isPageAdEligible(role, session)) {
      return null
    }

    return { slotId }
  }, [position, role, session])

  React.useEffect(() => {
    if (!adConfig) {
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

  return (
    <div
      data-testid={`ad-slot-${position}`}
      className="my-8 overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 p-2"
    >
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

export default function PageLayout({
  children,
  title,
  description,
  role = 'authenticated-task',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="container mx-auto px-4 py-8">
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
    </div>
  )
}
