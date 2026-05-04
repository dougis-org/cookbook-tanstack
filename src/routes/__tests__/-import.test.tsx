import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: () => () => ({}),
  requireVerifiedAuth: vi.fn(() => () => ({})),
}))

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/ImportDropzone', () => ({
  default: () => null,
}))

vi.mock('@/components/recipes/ImportPreviewModal', () => ({
  default: () => null,
}))

const mockUseMutation = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    recipes: {
      import: { mutationOptions: (opts: unknown) => opts },
    },
  },
}))

import { requireVerifiedAuth } from '@/lib/auth-guard'
import { Route } from '@/routes/import/index'

describe('/import — beforeLoad', () => {
  it('wires requireVerifiedAuth as the beforeLoad guard', () => {
    expect(vi.mocked(requireVerifiedAuth)).toHaveBeenCalled()
    expect(Route.options.beforeLoad).toBeDefined()
  })
})

describe('ImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows TierWall modal when import returns a tier-wall error', async () => {
    let capturedOnError: ((err: unknown) => void) | undefined
    mockUseMutation.mockImplementation((opts: { onError?: (err: unknown) => void }) => {
      capturedOnError = opts?.onError
      return { mutate: vi.fn(), isPending: false }
    })

    const PageComponent = Route.options.component as () => React.ReactElement
    render(<PageComponent />)

    expect(capturedOnError).toBeDefined()

    capturedOnError!({ data: { appError: { type: 'tier-wall', reason: 'import' } }, message: 'Import not allowed' })

    await waitFor(() => {
      expect(screen.getByText('Import requires Executive Chef')).toBeInTheDocument()
    })
  })

  it('does not show TierWall for non-tier import errors', async () => {
    let capturedOnError: ((err: unknown) => void) | undefined
    mockUseMutation.mockImplementation((opts: { onError?: (err: unknown) => void }) => {
      capturedOnError = opts?.onError
      return { mutate: vi.fn(), isPending: false }
    })

    const PageComponent = Route.options.component as () => React.ReactElement
    render(<PageComponent />)

    expect(capturedOnError).toBeDefined()

    capturedOnError!({ message: 'Server error' })

    // TierWall not shown; generic server error goes to ImportPreviewModal (not tested here)
    expect(screen.queryByText('Import requires Executive Chef')).not.toBeInTheDocument()
  })
})
