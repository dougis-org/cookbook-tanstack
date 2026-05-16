import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import PageLayout, { AdSlot } from '../PageLayout'
import { TIER_PRICING } from '@/lib/tier-entitlements'

let mockSession: { session: { user: { tier?: string; isAdmin?: boolean } } | null } = {
  session: null,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockSession,
}))

vi.mock('@/lib/google-adsense', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google-adsense')>()
  return {
    ...actual,
    getGoogleAdSenseSlotId: () => '1234567890',
  }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>{children}</a>
    ),
  }
})

describe('PageLayout', () => {
  it('renders children', () => {
    render(<PageLayout><span>hello</span></PageLayout>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<PageLayout title="My Title"><span /></PageLayout>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<PageLayout description="A description"><span /></PageLayout>)
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('does not render title/description section when neither is provided', () => {
    render(<PageLayout><span>content</span></PageLayout>)
    expect(screen.queryByTestId('page-title-section')).toBeNull()
  })

  it('outer wrapper uses CSS variable tokens not dark: variants', () => {
    const { container } = render(<PageLayout><span /></PageLayout>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('dark:')
  })

  it('renders CSS grid container with responsive right rail', () => {
    const { container } = render(<PageLayout><span>content</span></PageLayout>)
    const grid = container.querySelector('.grid')
    expect(grid).not.toBeNull()
    expect(grid?.className).toContain('lg:grid-cols-[1fr_300px]')
  })

  it('right rail aside is present in DOM for ad-eligible pages', () => {
    const { container } = render(<PageLayout role="public-marketing"><span /></PageLayout>)
    const aside = container.querySelector('aside')
    expect(aside).not.toBeNull()
  })

  it('right rail aside is absent for non-ad-eligible pages', () => {
    const { container } = render(<PageLayout role="admin"><span /></PageLayout>)
    const aside = container.querySelector('aside')
    expect(aside).toBeNull()
  })

  it('right rail aside is hidden below lg breakpoint', () => {
    const { container } = render(<PageLayout role="public-marketing"><span /></PageLayout>)
    const aside = container.querySelector('aside')
    expect(aside?.className).toContain('hidden')
    expect(aside?.className).toContain('lg:block')
  })

  it('grid is single-column for non-ad-eligible pages', () => {
    const { container } = render(<PageLayout role="admin"><span /></PageLayout>)
    const grid = container.querySelector('.grid')
    expect(grid?.className).not.toContain('lg:grid-cols-[1fr_300px]')
  })
})

describe('AdSlot', () => {
  let originalProd: unknown
  let originalAdsenseEnabled: unknown

  beforeEach(() => {
    originalProd = (import.meta.env as Record<string, unknown>).PROD
    originalAdsenseEnabled = (import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED
    window.adsbygoogle = []
    mockSession = { session: null }
  })

  afterEach(() => {
    ;(import.meta.env as Record<string, unknown>).PROD = originalProd
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = originalAdsenseEnabled
    delete window.adsbygoogle
    document.querySelectorAll('script[src*="adsbygoogle"]').forEach((s) => s.remove())
    mockSession = { session: null }
  })

  it('renders ins element with correct AdSense attributes in production with flag on', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = 'true'
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const ins = document.querySelector('ins.adsbygoogle')
    expect(ins).not.toBeNull()
    expect(ins?.getAttribute('data-ad-slot')).toBe('1234567890')
    expect(ins?.getAttribute('data-ad-format')).toBe('auto')
    expect(ins?.getAttribute('data-full-width-responsive')).toBe('true')
  })

  it('renders SponsorSlot in dev mode for eligible role', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    expect(screen.getByTestId('sponsor-slot')).toBeInTheDocument()
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
  })

  it('renders SponsorSlot when VITE_ADSENSE_ENABLED is not set in prod', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = undefined
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    expect(screen.getByTestId('sponsor-slot')).toBeInTheDocument()
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
  })

  it('renders null for non-ad-eligible roles (admin page)', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="admin" position="top" />)
    })
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
    expect(screen.queryByTestId('sponsor-slot')).toBeNull()
  })

  it('renders null when session is prep-cook (paid user, showUserAds=false)', async () => {
    mockSession = { session: { user: { tier: 'prep-cook', isAdmin: false } } }
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="authenticated-home" position="top" />)
    })
    // isPageAdEligible gates paid users — AdSlot returns null before SponsorSlot
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
    expect(screen.queryByTestId('sponsor-slot')).toBeNull()
  })

  it('renders null when session is admin', async () => {
    mockSession = { session: { user: { tier: 'home-cook', isAdmin: true } } }
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="authenticated-home" position="top" />)
    })
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
    expect(screen.queryByTestId('sponsor-slot')).toBeNull()
  })

  it('SponsorSlot uses adblock-safe up-* class family only', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const slot = screen.getByTestId('sponsor-slot')
    expect(slot.className).toContain('up-card')
    // Collect all CSS class tokens from slot and its descendants
    const allClassTokens = [slot, ...Array.from(slot.querySelectorAll('*'))]
      .flatMap((el) => Array.from(el.classList))
      .join(' ')
    expect(allClassTokens).not.toMatch(/\bad-\w/)
    expect(allClassTokens).not.toMatch(/\bsponsor-\w/)
    expect(allClassTokens).not.toMatch(/\bpromo-\w/)
    expect(allClassTokens).not.toMatch(/\bbanner-\w/)
  })

  it('SponsorSlot contains up-media, up-body, up-cta elements', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const slot = screen.getByTestId('sponsor-slot')
    expect(slot.querySelector('.up-media')).not.toBeNull()
    expect(slot.querySelector('.up-body')).not.toBeNull()
    expect(slot.querySelector('.up-cta')).not.toBeNull()
  })

  it('SponsorSlot upgrade price matches TIER_PRICING prep-cook monthly', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = false
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const expectedPrice = `$${TIER_PRICING['prep-cook'].monthly!.toFixed(2)}/mo`
    expect(screen.getByText(expectedPrice)).toBeInTheDocument()
  })

  it('isPageAdEligible returns true for authenticated-home with home-cook session', async () => {
    const { isPageAdEligible } = await import('@/lib/ad-policy')
    const session = { user: { tier: 'home-cook', isAdmin: false } }
    expect(isPageAdEligible('authenticated-home', session as never)).toBe(true)
    expect(isPageAdEligible('authenticated-task', session as never)).toBe(true)
  })

  it('isPageAdEligible returns false for authenticated-home with prep-cook session', async () => {
    const { isPageAdEligible } = await import('@/lib/ad-policy')
    const session = { user: { tier: 'prep-cook', isAdmin: false } }
    expect(isPageAdEligible('authenticated-home', session as never)).toBe(false)
  })

  it('injects AdSense script into document.head on first adsense render', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = 'true'
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const script = document.querySelector<HTMLScriptElement>('script[src*="adsbygoogle.js"]')
    expect(script).not.toBeNull()
    expect(script?.async).toBe(true)
  })

  it('does not inject duplicate AdSense scripts on second slot', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = 'true'
    await act(async () => {
      render(
        <>
          <AdSlot role="public-marketing" position="top" />
          <AdSlot role="public-marketing" position="bottom" />
        </>,
      )
    })
    const scripts = document.querySelectorAll('script[src*="adsbygoogle.js"]')
    expect(scripts).toHaveLength(1)
  })

  it('pushes to adsbygoogle queue on mount in adsense mode', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = 'true'
    const pushSpy = vi.fn()
    window.adsbygoogle = { push: pushSpy } as unknown as typeof window.adsbygoogle
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    expect(pushSpy).toHaveBeenCalledWith({})
  })

  it('skips push when data-adsbygoogle-status is done', async () => {
    ;(import.meta.env as Record<string, unknown>).PROD = true
    ;(import.meta.env as Record<string, unknown>).VITE_ADSENSE_ENABLED = 'true'
    const pushSpy = vi.fn()
    window.adsbygoogle = { push: pushSpy } as unknown as typeof window.adsbygoogle
    let rerender!: (ui: React.ReactElement) => void
    await act(async () => {
      const result = render(<AdSlot role="public-marketing" position="top" />)
      rerender = result.rerender
      const ins = result.container.querySelector('ins')
      ins?.setAttribute('data-adsbygoogle-status', 'done')
    })
    const callsAfterMount = pushSpy.mock.calls.length
    await act(async () => {
      rerender(<AdSlot role="public-marketing" position="top" />)
    })
    expect(pushSpy).toHaveBeenCalledTimes(callsAfterMount)
  })
})
