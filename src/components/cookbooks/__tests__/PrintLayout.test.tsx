import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrintLayout } from '@/components/cookbooks/PrintLayout'

describe('PrintLayout', () => {
  it('renders children in a wrapper div', () => {
    const { getByText } = render(
      <PrintLayout>
        <span>hello</span>
      </PrintLayout>,
    )
    expect(getByText('hello')).toBeInTheDocument()
  })

  it('wrapper has white background CSS variable override', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.style.getPropertyValue('--theme-bg')).toBe('white')
  })

  it('wrapper overrides all theme tokens including --theme-surface-hover', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.style.getPropertyValue('--theme-surface-hover')).toBe('#e5e7eb')
    expect(div.style.getPropertyValue('--theme-border-muted')).toBe('#f3f4f6')
  })

  it('wrapper has dark foreground CSS variable override', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.style.getPropertyValue('--theme-fg')).toBe('#111827')
  })

  it('wrapper does not apply any print: classes', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('print:')
  })

  it('wrapper does not apply any dark: classes', () => {
    const { container } = render(<PrintLayout><span /></PrintLayout>)
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('dark:')
  })

  it('html class is unchanged after mount and unmount', () => {
    document.documentElement.className = 'dark'
    const { unmount } = render(<PrintLayout><span /></PrintLayout>)
    expect(document.documentElement.className).toBe('dark')
    unmount()
    expect(document.documentElement.className).toBe('dark')
    document.documentElement.className = ''
  })
})
