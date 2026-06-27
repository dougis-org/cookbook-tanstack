import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const { mockUseSearch } = vi.hoisted(() => ({
  mockUseSearch: vi.fn().mockReturnValue({ page: 1 }),
}))

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  const base = createRouterMock()
  return {
    ...base,
    createFileRoute: () => () => ({
      options: {},
      useParams: () => ({}),
      useSearch: () => mockUseSearch(),
    }),
  }
})

const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      auditLog: {
        list: {
          queryOptions: (opts: unknown) => ({ queryKey: ['admin', 'auditLog', 'list', opts] }),
        },
      },
    },
  },
}))

import { AdminAuditPage } from '@/routes/admin/audit'

// ─── Test data ───────────────────────────────────────────────────────────────

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'entry-1',
  createdAt: new Date('2024-03-15T10:30:00Z').toISOString(),
  adminEmail: 'admin@test.com',
  targetEmail: 'user@test.com',
  before: { tier: 'home-cook' },
  after: { tier: 'sous-chef' },
  ...overrides,
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AdminAuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearch.mockReturnValue({ page: 1 })
    mockUseQuery.mockReturnValue({ data: { entries: [], total: 0 }, isLoading: false })
  })

  it('renders table headers', () => {
    render(<AdminAuditPage />)
    expect(screen.getByText('Timestamp')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Target User')).toBeInTheDocument()
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
  })

  it('renders a populated entry row with correct data', () => {
    const entry = makeEntry()
    mockUseQuery.mockReturnValue({ data: { entries: [entry], total: 1 }, isLoading: false })

    render(<AdminAuditPage />)

    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
  })

  it('renders empty state message when no entries', () => {
    mockUseQuery.mockReturnValue({ data: { entries: [], total: 0 }, isLoading: false })

    render(<AdminAuditPage />)

    expect(screen.getByText('No audit log entries found')).toBeInTheDocument()
    // Only the empty-state row exists; no data rows with email addresses
    expect(screen.queryByText('admin@test.com')).not.toBeInTheDocument()
  })

  it('displays tier identifiers as human-readable names', () => {
    const entry = makeEntry({ before: { tier: 'home-cook' }, after: { tier: 'executive-chef' } })
    mockUseQuery.mockReturnValue({ data: { entries: [entry], total: 1 }, isLoading: false })

    render(<AdminAuditPage />)

    expect(screen.getByText('Home Cook')).toBeInTheDocument()
    expect(screen.getByText('Executive Chef')).toBeInTheDocument()

    const rows = document.querySelectorAll('tbody td')
    const cellTexts = Array.from(rows).map(td => td.textContent)
    expect(cellTexts).not.toContain('home-cook')
    expect(cellTexts).not.toContain('executive-chef')
  })

  it('disables Prev button on page 1 and enables Next when more pages exist', () => {
    const entries = Array.from({ length: 25 }, (_, i) => makeEntry({ id: `entry-${i}` }))
    mockUseQuery.mockReturnValue({ data: { entries, total: 60 }, isLoading: false })
    mockUseSearch.mockReturnValue({ page: 1 })

    render(<AdminAuditPage />)

    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })

  it('enables Prev button and disables Next on last page', () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry({ id: `entry-${i}` }))
    mockUseQuery.mockReturnValue({ data: { entries, total: 60 }, isLoading: false })
    mockUseSearch.mockReturnValue({ page: 3 })

    render(<AdminAuditPage />)

    expect(screen.getByRole('button', { name: /prev/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})
