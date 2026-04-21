import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import PageLayout, { AdSlot } from '../PageLayout'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null }),
}))

vi.mock('@/lib/google-adsense', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google-adsense')>()
  return {
    ...actual,
    getGoogleAdSenseSlotId: () => '1234567890',
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
})

describe('AdSlot', () => {
  let originalProdValue: unknown

  beforeEach(() => {
    originalProdValue = (import.meta.env as Record<string, unknown>).PROD
    ;(import.meta.env as Record<string, unknown>).PROD = true
    window.adsbygoogle = []
  })

  afterEach(() => {
    ;(import.meta.env as Record<string, unknown>).PROD = originalProdValue
    delete window.adsbygoogle
    document.querySelectorAll('script[src*="adsbygoogle"]').forEach((s) => s.remove())
  })

  it('renders ins element with correct AdSense attributes in production', async () => {
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const ins = document.querySelector('ins.adsbygoogle')
    expect(ins).not.toBeNull()
    expect(ins?.getAttribute('data-ad-slot')).toBe('1234567890')
    expect(ins?.getAttribute('data-ad-format')).toBe('auto')
    expect(ins?.getAttribute('data-full-width-responsive')).toBe('true')
  })

  it('renders null for non-ad-eligible roles', async () => {
    await act(async () => {
      render(<AdSlot role="authenticated-task" position="top" />)
    })
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
  })

  it('injects AdSense script into document.head on first render', async () => {
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    const script = document.querySelector<HTMLScriptElement>('script[src*="adsbygoogle.js"]')
    expect(script).not.toBeNull()
    expect(script?.async).toBe(true)
  })

  it('does not inject duplicate AdSense scripts on second slot', async () => {
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

  it('pushes to adsbygoogle queue on mount', async () => {
    const pushSpy = vi.fn()
    window.adsbygoogle = { push: pushSpy } as unknown as typeof window.adsbygoogle
    await act(async () => {
      render(<AdSlot role="public-marketing" position="top" />)
    })
    expect(pushSpy).toHaveBeenCalledWith({})
  })

  it('skips push when data-adsbygoogle-status is done', async () => {
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
