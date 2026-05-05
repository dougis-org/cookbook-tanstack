import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/lib/auth-guard', () => ({
  requireVerifiedAuth: () => () => ({}),
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

let mockCanImport = true
vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => ({ canImport: mockCanImport }),
}))

import { Route } from '@/routes/import/index'

describe('/import — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/import')
  })
})

describe('ImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanImport = true
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

    expect(screen.queryByText('Import requires Executive Chef')).not.toBeInTheDocument()
  })

  it('shows inline TierWall when canImport is false', async () => {
    mockCanImport = false

    const PageComponent = Route.options.component as () => React.ReactElement
    render(<PageComponent />)

    await waitFor(() => {
      expect(screen.getByText(/Import requires Executive Chef/)).toBeInTheDocument()
    })
  })

  it('does not render ImportDropzone when canImport is false', async () => {
    mockCanImport = false

    const PageComponent = Route.options.component as () => React.ReactElement
    render(<PageComponent />)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /select/i })).not.toBeInTheDocument()
    })
  })
})
