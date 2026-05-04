import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

const mockMutate = vi.fn()

vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      users: {
        list: {
          queryOptions: () => ({ queryKey: ['admin', 'users', 'list'] }),
          queryKey: () => ['admin', 'users', 'list'],
        },
        setTier: {
          mutationOptions: (opts: unknown) => opts,
        },
      },
    },
  },
}))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { AdminUsersPage } from '@/routes/admin/users'

// ─── Test data ───────────────────────────────────────────────────────────────

const ADMIN_ID = 'admin-000'
const USER_A_ID = 'user-aaa'
const USER_B_ID = 'user-bbb'

const mockUsers = [
  { id: ADMIN_ID, email: 'admin@test.com', name: 'Admin User', tier: 'sous-chef' },
  { id: USER_A_ID, email: 'alice@test.com', name: 'Alice', tier: 'home-cook' },
  { id: USER_B_ID, email: 'bob@test.com', name: null, tier: 'prep-cook' },
]

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { user: { id: ADMIN_ID } } })
    mockUseQuery.mockReturnValue({ data: mockUsers })
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
  })

  it('renders a table row for each user returned by admin.users.list', () => {
    render(<AdminUsersPage />)
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
  })

  it('each row displays user email, name (or "—" when null/absent), and current tier label', () => {
    render(<AdminUsersPage />)
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument() // bob has null name
    // Tier badges rendered in <span> (tier column), may also appear as <option> in selects
    const sousChefBadge = screen.getAllByText('Sous Chef').find(
      (el) => el.tagName === 'SPAN',
    )
    expect(sousChefBadge).toBeInTheDocument()
  })

  it('tier selector is disabled for the row matching the current admin own user ID', () => {
    render(<AdminUsersPage />)
    const adminSelect = screen.getByLabelText('Change tier for admin@test.com')
    expect(adminSelect).toBeDisabled()
  })

  it('tier selector is enabled for all other user rows', () => {
    render(<AdminUsersPage />)
    const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
    const bobSelect = screen.getByLabelText('Change tier for bob@test.com')
    expect(aliceSelect).not.toBeDisabled()
    expect(bobSelect).not.toBeDisabled()
  })

  it('selecting a new tier for another user opens the confirmation modal', () => {
    render(<AdminUsersPage />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
    fireEvent.change(aliceSelect, { target: { value: 'sous-chef' } })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('confirmation modal displays old tier and new tier', () => {
    render(<AdminUsersPage />)
    const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
    fireEvent.change(aliceSelect, { target: { value: 'sous-chef' } })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Home Cook')
    expect(dialog).toHaveTextContent('Sous Chef')
    expect(dialog).toHaveTextContent('alice@test.com')
  })

  it('clicking Cancel in the modal closes it without calling the setTier mutation', () => {
    render(<AdminUsersPage />)
    fireEvent.change(screen.getByLabelText('Change tier for alice@test.com'), {
      target: { value: 'sous-chef' },
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('clicking Confirm in the modal calls admin.users.setTier with correct userId and tier', () => {
    render(<AdminUsersPage />)
    fireEvent.change(screen.getByLabelText('Change tier for alice@test.com'), {
      target: { value: 'sous-chef' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mockMutate).toHaveBeenCalledWith({ userId: USER_A_ID, tier: 'sous-chef' })
  })

  it('each row contains an audit log placeholder element with userId in data attribute', () => {
    render(<AdminUsersPage />)
    const auditLinks = screen.getAllByText(/View audit log/)
    expect(auditLinks).toHaveLength(mockUsers.length)
    expect(auditLinks[1]).toHaveAttribute('data-user-id', USER_A_ID)
  })

  it('confirmation modal shows warning when downgrading tier', () => {
    render(<AdminUsersPage />)
    const bobSelect = screen.getByLabelText('Change tier for bob@test.com')
    fireEvent.change(bobSelect, { target: { value: 'home-cook' } })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/⚠️ This will make all private recipes/)).toBeInTheDocument()
  })

  it('confirmation modal does not show warning when upgrading tier', () => {
    render(<AdminUsersPage />)
    const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
    fireEvent.change(aliceSelect, { target: { value: 'prep-cook' } })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText(/⚠️ This will make all private recipes/)).not.toBeInTheDocument()
  })

  it('Cancel button dismisses modal when warning is visible', () => {
    render(<AdminUsersPage />)
    const bobSelect = screen.getByLabelText('Change tier for bob@test.com')
    fireEvent.change(bobSelect, { target: { value: 'home-cook' } })
    expect(screen.getByText(/⚠️ This will make all private recipes/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('Confirm button calls setTier when warning is visible', () => {
    render(<AdminUsersPage />)
    const bobSelect = screen.getByLabelText('Change tier for bob@test.com')
    fireEvent.change(bobSelect, { target: { value: 'home-cook' } })
    expect(screen.getByText(/⚠️ This will make all private recipes/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mockMutate).toHaveBeenCalledWith({ userId: USER_B_ID, tier: 'home-cook' })
  })
})
