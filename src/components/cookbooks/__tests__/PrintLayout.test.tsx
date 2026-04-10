import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { PrintLayout } from '@/components/cookbooks/PrintLayout'

describe('PrintLayout', () => {
  it('renders children', () => {
    const { getByText } = render(
      <PrintLayout>
        <span>hello</span>
      </PrintLayout>,
    )
    expect(getByText('hello')).toBeInTheDocument()
  })

  it('wrapper div has bg-white class', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    expect(container.firstChild).toHaveClass('bg-white')
  })

  it('wrapper div has text-gray-900 class', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    expect(container.firstChild).toHaveClass('text-gray-900')
  })

  it('wrapper div does not apply any print: classes', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('print:')
  })

  it('wrapper div does not apply any dark: classes', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('dark:')
  })
})

describe('PrintLayout dark-class management', () => {
  beforeEach(() => {
    document.documentElement.classList.add('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    delete document.documentElement.dataset['printLayoutDarkOverrideCount']
    delete document.documentElement.dataset['printLayoutDarkOverrideHadDark']
  })

  it('removes dark class from <html> on mount', () => {
    render(<PrintLayout><span /></PrintLayout>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores dark class on unmount', () => {
    const { unmount } = render(<PrintLayout><span /></PrintLayout>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    unmount()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not restore dark class if it was not present before mount', () => {
    document.documentElement.classList.remove('dark')
    const { unmount } = render(<PrintLayout><span /></PrintLayout>)
    unmount()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
