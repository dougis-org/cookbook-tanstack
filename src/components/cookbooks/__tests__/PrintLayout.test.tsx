import { describe, it, expect } from 'vitest'
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
