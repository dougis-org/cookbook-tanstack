import React from 'react'
import { isAdEligible, PageRole } from '@/lib/ad-policy'
import {
  GOOGLE_ADSENSE_ACCOUNT,
  GOOGLE_ADSENSE_SCRIPT_SRC,
  getGoogleAdSenseSlotId,
  type GoogleAdSenseSlotPosition,
} from '@/lib/google-adsense'
import { useAuth } from '@/hooks/useAuth'

declare global {
  interface Window {
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
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${GOOGLE_ADSENSE_SCRIPT_SRC}"]`,
  )

  if (existingScript) {
    return existingScript
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = GOOGLE_ADSENSE_SCRIPT_SRC
  document.head.appendChild(script)

  return script
}

export function AdSlot({
  role,
  position,
}: {
  role: PageRole
  position: GoogleAdSenseSlotPosition
}) {
  const { session } = useAuth()
  const slotId = getGoogleAdSenseSlotId(position)
  const adRef = React.useRef<HTMLElement | null>(null)
  const isEligible = import.meta.env.PROD && !!slotId && isAdEligible(role, session)

  React.useEffect(() => {
    if (!isEligible || !slotId || !adRef.current) {
      return
    }

    const adElement = adRef.current
    const script = ensureGoogleAdSenseScript()
    const requestAd = () => {
      if (adElement.dataset.adsbygoogleStatus === 'done') {
        return
      }

      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to request Google AdSense slot', error)
        }

        // Ignore push errors that can happen before the AdSense library finishes initializing.
      }
    }

    if (Array.isArray(window.adsbygoogle)) {
      requestAd()
      return
    }

    script.addEventListener('load', requestAd, { once: true })

    return () => {
      script.removeEventListener('load', requestAd)
    }
  }, [isEligible, slotId])

  if (!role || !isEligible || !slotId) {
    return null
  }

  return (
    <div
      data-testid={`ad-slot-${position}`}
      className="my-8 overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 p-2"
    >
      <ins
        ref={(node) => {
          adRef.current = node
        }}
        className="adsbygoogle block"
        data-ad-client={GOOGLE_ADSENSE_ACCOUNT}
        data-ad-format="auto"
        data-ad-slot={slotId}
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
