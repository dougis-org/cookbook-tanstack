import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sharing: {
      myLibraryShares: {
        queryOptions: () => ({ queryKey: ['sharing', 'myLibraryShares'] }),
        queryKey: () => ['sharing', 'myLibraryShares'],
      },
      mySharedLibraries: {
        queryOptions: () => ({ queryKey: ['sharing', 'mySharedLibraries'] }),
      },
      shareLibrary: {
        mutationOptions: (opts: Record<string, unknown>) => ({ mutationKey: ['sharing', 'shareLibrary'], ...opts }),
      },
      revokeLibraryShare: {
        mutationOptions: (opts: Record<string, unknown>) => ({ mutationKey: ['sharing', 'revokeLibraryShare'], ...opts }),
      },
    },
    cookbooks: {
      myCollaborations: {
        queryOptions: () => ({ queryKey: ['cookbooks', 'myCollaborations'] }),
      },
    },
    users: {
      search: {
        queryOptions: (input: { query: string }) => ({ queryKey: ['users', 'search', input.query] }),
      },
    },
  },
}))

import SharingSection from '@/components/account/SharingSection'

function session(tier: string, isAdmin = false) {
  return { session: { user: { id: 'u1', tier, isAdmin } } }
}

type QueryStub = { data?: unknown; isLoading?: boolean }

/** Maps mockUseQuery calls (in call order) to canned results keyed by queryKey[0:2] join. */
function wireQueries(map: Record<string, QueryStub>) {
  mockUseQuery.mockImplementation((arg: { queryKey?: unknown[] }) => {
    const key = Array.isArray(arg?.queryKey) ? arg.queryKey.join('.') : ''
    const stub = map[key]
    return { data: stub?.data ?? [], isLoading: stub?.isLoading ?? false, isError: false }
  })
}

describe('SharingSection — list rendering', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseAuth.mockReturnValue(session('executive-chef'))
  })

  it('renders all three lists with empty states when every query returns []', () => {
    wireQueries({})
    render(<SharingSection />)
    expect(screen.getByTestId('shares-i-give-empty')).toBeInTheDocument()
    expect(screen.getByTestId('shared-with-me-empty')).toBeInTheDocument()
    expect(screen.getByTestId('my-collaborations-empty')).toBeInTheDocument()
  })

  it('renders seeded shares I give', () => {
    wireQueries({
      'sharing.myLibraryShares': { data: [{ id: 's1', recipientId: 'r1', recipientName: 'Alice', addedAt: '2026-01-01' }] },
    })
    render(<SharingSection />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders seeded shared-with-me entries', () => {
    wireQueries({
      'sharing.mySharedLibraries': { data: [{ id: 'sw1', ownerId: 'o1', ownerName: 'Bob', addedAt: '2026-01-01' }] },
    })
    render(<SharingSection />)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('links collaboration entries to /cookbooks/:id', () => {
    wireQueries({
      'cookbooks.myCollaborations': { data: [{ id: 'cb1', name: 'Family Favorites', role: 'editor' }] },
    })
    render(<SharingSection />)
    const link = screen.getByText('Family Favorites').closest('a')
    expect(link).toHaveAttribute('href', '/cookbooks/cb1')
  })
})

describe('SharingSection — gating matrix', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('Executive Chef sees everything, including the invite control', () => {
    mockUseAuth.mockReturnValue(session('executive-chef'))
    wireQueries({})
    render(<SharingSection />)
    expect(screen.getByLabelText(/search by email or name/i)).toBeInTheDocument()
    expect(screen.getByTestId('shared-with-me-empty')).toBeInTheDocument()
    expect(screen.getByTestId('my-collaborations-empty')).toBeInTheDocument()
  })

  it('non-Exec-Chef with a received share sees lists 2/3 but not the invite control', () => {
    mockUseAuth.mockReturnValue(session('home-cook'))
    wireQueries({
      'sharing.mySharedLibraries': { data: [{ id: 'sw1', ownerId: 'o1', ownerName: 'Bob', addedAt: '2026-01-01' }] },
    })
    render(<SharingSection />)
    expect(screen.queryByLabelText(/search by email or name/i)).not.toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByTestId('my-collaborations-empty')).toBeInTheDocument()
  })

  it('non-Exec-Chef with a collaboration sees lists 2/3 but not the invite control', () => {
    mockUseAuth.mockReturnValue(session('home-cook'))
    wireQueries({
      'cookbooks.myCollaborations': { data: [{ id: 'cb1', name: 'Family Favorites', role: 'viewer' }] },
    })
    render(<SharingSection />)
    expect(screen.queryByLabelText(/search by email or name/i)).not.toBeInTheDocument()
    expect(screen.getByText('Family Favorites')).toBeInTheDocument()
  })

  it('an admin on a lower tier sees the invite control, matching server-side hasAtLeastTier', () => {
    mockUseAuth.mockReturnValue(session('home-cook', true))
    wireQueries({})
    render(<SharingSection />)
    expect(screen.getByLabelText(/search by email or name/i)).toBeInTheDocument()
  })

  it('non-Exec-Chef with nothing shared sees the upgrade affordance instead of all three lists', () => {
    mockUseAuth.mockReturnValue(session('home-cook'))
    wireQueries({})
    render(<SharingSection />)
    expect(screen.queryByLabelText(/search by email or name/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('shared-with-me-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('my-collaborations-empty')).not.toBeInTheDocument()
    expect(screen.getByText(/upgrade to invite people to your collection/i)).toBeInTheDocument()
  })
})

describe('SharingSection — invite flow', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(session('executive-chef'))
  })

  it('invokes users.search with the debounced query after typing ≥2 characters', async () => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    wireQueries({
      'users.search.al': { data: [{ id: 'u2', name: 'Alice', email: 'alice@example.com' }] },
    })
    render(<SharingSection />)
    const input = screen.getByLabelText(/search by email or name/i)
    fireEvent.change(input, { target: { value: 'al' } })

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('does not flash "No users found" while the search query is still loading', async () => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    wireQueries({
      'users.search.al': { data: [], isLoading: true },
    })
    render(<SharingSection />)
    const input = screen.getByLabelText(/search by email or name/i)
    fireEvent.change(input, { target: { value: 'al' } })

    await waitFor(() => {
      expect(screen.queryByText('No users found.')).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('selecting a result calls shareLibrary with the recipient id', async () => {
    const mutate = vi.fn()
    mockUseMutation.mockReturnValue({ mutate, isPending: false })
    wireQueries({
      'users.search.al': { data: [{ id: 'u2', name: 'Alice', email: 'alice@example.com' }] },
    })
    render(<SharingSection />)
    const input = screen.getByLabelText(/search by email or name/i)
    fireEvent.change(input, { target: { value: 'al' } })

    await waitFor(() => screen.getByText('alice@example.com'))
    fireEvent.click(screen.getByText('alice@example.com'))

    expect(mutate).toHaveBeenCalledWith({ recipientId: 'u2' })
  })

  it('renders the scope-warning copy adjacent to the invite control', () => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    wireQueries({})
    render(<SharingSection />)
    expect(screen.getByText(/your entire collection, including private recipes/i)).toBeInTheDocument()
  })

  it('shows pending label and disables the field while sharing', () => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: true })
    wireQueries({})
    render(<SharingSection />)
    expect(screen.getByText('Sharing…')).toBeInTheDocument()
    expect(screen.getByLabelText(/search by email or name/i)).toBeDisabled()
  })
})

describe('SharingSection — revoke flow', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(session('executive-chef'))
  })

  it('activating revoke calls revokeLibraryShare with the grant id', () => {
    const shareMutate = vi.fn()
    const revokeMutate = vi.fn()
    mockUseMutation.mockImplementation((opts: { mutationKey?: string[] }) => {
      if (opts.mutationKey?.[1] === 'revokeLibraryShare') return { mutate: revokeMutate, isPending: false }
      return { mutate: shareMutate, isPending: false }
    })
    wireQueries({
      'sharing.myLibraryShares': { data: [{ id: 's1', recipientId: 'r1', recipientName: 'Alice', addedAt: '2026-01-01' }] },
    })
    render(<SharingSection />)
    fireEvent.click(screen.getByText('Revoke'))
    expect(revokeMutate).toHaveBeenCalledWith({ shareId: 's1' })
  })

  it('shows pending label on the revoke control while pending', () => {
    mockUseMutation.mockImplementation((opts: { mutationKey?: string[] }) => {
      if (opts.mutationKey?.[1] === 'revokeLibraryShare') {
        return { mutate: vi.fn(), isPending: true, variables: { shareId: 's1' } }
      }
      return { mutate: vi.fn(), isPending: false }
    })
    wireQueries({
      'sharing.myLibraryShares': { data: [{ id: 's1', recipientId: 'r1', recipientName: 'Alice', addedAt: '2026-01-01' }] },
    })
    render(<SharingSection />)
    expect(screen.getByText('Revoking…')).toBeInTheDocument()
  })

  it('only shows the pending label on the row being revoked, not every row', () => {
    mockUseMutation.mockImplementation((opts: { mutationKey?: string[] }) => {
      if (opts.mutationKey?.[1] === 'revokeLibraryShare') {
        return { mutate: vi.fn(), isPending: true, variables: { shareId: 's1' } }
      }
      return { mutate: vi.fn(), isPending: false }
    })
    wireQueries({
      'sharing.myLibraryShares': {
        data: [
          { id: 's1', recipientId: 'r1', recipientName: 'Alice', addedAt: '2026-01-01' },
          { id: 's2', recipientId: 'r2', recipientName: 'Bob', addedAt: '2026-01-01' },
        ],
      },
    })
    render(<SharingSection />)
    expect(screen.getAllByText('Revoking…')).toHaveLength(1)
    expect(screen.getAllByText('Revoke')).toHaveLength(1)
  })
})
