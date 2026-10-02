import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'owner', tier: 'executive-chef', isAdmin: false } } }),
}))

interface Row {
  id: string
  recipientId: string
  recipientName: string
  addedAt: string
}

const server = vi.hoisted(() => ({
  shares: [] as Row[],
  shareCalls: [] as Array<{ recipientId: string }>,
  revokeCalls: [] as Array<{ shareId: string }>,
  shareImpl: undefined as undefined | ((vars: { recipientId: string }) => Promise<unknown>),
  revokeImpl: undefined as undefined | ((vars: { shareId: string }) => Promise<unknown>),
}))

const USERS = [
  { id: 'u-alice', name: 'Alice', email: 'alice@x.com' },
  { id: 'u-bob', name: 'Bob', email: 'bob@x.com' },
  { id: 'u-carol', name: 'Carol', email: 'carol@x.com' },
]

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sharing: {
      myLibraryShares: {
        queryKey: () => ['sharing', 'myLibraryShares'],
        queryOptions: () => ({
          queryKey: ['sharing', 'myLibraryShares'],
          queryFn: async () => server.shares.map((row) => ({ ...row })),
        }),
      },
      mySharedLibraries: {
        queryOptions: () => ({ queryKey: ['sharing', 'mySharedLibraries'], queryFn: async () => [] }),
      },
      shareLibrary: {
        mutationKey: () => ['sharing', 'shareLibrary'],
        mutationOptions: (opts: Record<string, unknown>) => ({
          mutationKey: ['sharing', 'shareLibrary'],
          mutationFn: (vars: { recipientId: string }) => {
            server.shareCalls.push(vars)
            return server.shareImpl!(vars)
          },
          ...opts,
        }),
      },
      revokeLibraryShare: {
        mutationKey: () => ['sharing', 'revokeLibraryShare'],
        mutationOptions: (opts: Record<string, unknown>) => ({
          mutationKey: ['sharing', 'revokeLibraryShare'],
          mutationFn: (vars: { shareId: string }) => {
            server.revokeCalls.push(vars)
            return server.revokeImpl!(vars)
          },
          ...opts,
        }),
      },
    },
    cookbooks: {
      myCollaborations: {
        queryOptions: () => ({ queryKey: ['cookbooks', 'myCollaborations'], queryFn: async () => [] }),
      },
    },
    users: {
      search: {
        queryOptions: (input: { query: string }) => ({
          queryKey: ['users', 'search', input.query],
          queryFn: async () => USERS.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(input.query.toLowerCase())),
        }),
      },
    },
  },
}))

import SharingSection from '@/components/account/SharingSection'
import { isOptimisticShareId } from '@/components/account/sharingUtils'

function row(name: string, id = `s-${name.toLowerCase()}`): Row {
  return { id, recipientId: `u-${name.toLowerCase()}`, recipientName: name, addedAt: '2026-01-01' }
}

function deferred<T = unknown>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  render(
    <QueryClientProvider client={queryClient}>
      <SharingSection />
    </QueryClientProvider>,
  )
  return queryClient
}

const sharesList = () => screen.getByRole('list', { name: /libraries you share/i })
const rowFor = (name: string) => within(sharesList()).getByText(name).closest('li') as HTMLLIElement
const rowNames = () =>
  within(sharesList())
    .getAllByRole('listitem')
    .map((li) => li.querySelector('p')?.textContent)
const searchInput = () => screen.getByLabelText(/search by email or name/i) as HTMLInputElement

/** Lets onMutate's awaited cancelQueries settle; never waits on the (deferred) network promise. */
const flushOptimistic = () => act(async () => new Promise<void>((resolve) => setTimeout(resolve, 0)))

async function invite(name: string) {
  fireEvent.change(searchInput(), { target: { value: 'x.com' } })
  const email = `${name.toLowerCase()}@x.com`
  const button = await screen.findByRole(
    'button',
    { name: (label) => label.includes(name) && label.includes(email) },
    { timeout: 2000 },
  )
  await act(async () => {
    fireEvent.click(button)
  })
  await flushOptimistic()
}

async function revoke(name: string) {
  await act(async () => {
    fireEvent.click(within(rowFor(name)).getByRole('button', { name: /revoke/i }))
  })
  await flushOptimistic()
}

beforeEach(() => {
  server.shares = [row('Alice')]
  server.shareCalls = []
  server.revokeCalls = []
  server.shareImpl = () => new Promise(() => {})
  server.revokeImpl = () => new Promise(() => {})
})

describe('isOptimisticShareId', () => {
  it('T13a: is true only for ids with the optimistic- prefix', () => {
    expect(isOptimisticShareId('optimistic-u-bob')).toBe(true)
    expect(isOptimisticShareId('s-bob')).toBe(false)
    expect(isOptimisticShareId('64b0c0ffee')).toBe(false)
  })
})

describe('SharingSection — optimistic invite', () => {
  it('T7/T8/T9/T13b/T20: shows a pending row at once, clears and keeps the input enabled, no Revoke', async () => {
    renderSection()
    await screen.findByText('Alice')

    await invite('Bob')

    const bob = rowFor('Bob')
    expect(bob).toHaveAttribute('aria-busy', 'true')
    expect(within(bob).getByText('Sharing…')).toBeInTheDocument()
    expect(within(bob).queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument()
    expect(within(rowFor('Alice')).getByRole('button', { name: /revoke/i })).toBeInTheDocument()
    expect(searchInput().value).toBe('')
    expect(searchInput()).not.toBeDisabled()
    expect(screen.getAllByText('Sharing…')).toHaveLength(1)
    expect(server.shareCalls).toEqual([{ recipientId: 'u-bob' }])
  })

  it('T10/T21: on rejection removes the pending row and announces an error naming the recipient', async () => {
    const gate = deferred()
    server.shareImpl = () => gate.promise
    renderSection()
    await screen.findByText('Alice')
    await invite('Bob')

    await act(async () => {
      gate.reject(new Error('Already sharing your library with this user'))
    })

    await waitFor(() => expect(within(sharesList()).queryByText('Bob')).not.toBeInTheDocument())
    expect(rowNames()).toEqual(['Alice'])
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Bob')
    expect(alert).toHaveTextContent('Already sharing your library with this user')
  })

  it('T11: on success and refetch the row becomes a normal row', async () => {
    const gate = deferred()
    server.shareImpl = () => gate.promise
    renderSection()
    await screen.findByText('Alice')
    await invite('Bob')

    server.shares = [row('Alice'), { ...row('Bob', 's-bob'), addedAt: '2026-02-02' }]
    await act(async () => {
      gate.resolve({})
    })

    await waitFor(() => expect(rowFor('Bob')).not.toHaveAttribute('aria-busy', 'true'))
    expect(within(rowFor('Bob')).getByText(/2026-02-02/)).toBeInTheDocument()
    expect(within(rowFor('Bob')).getByRole('button', { name: /revoke/i })).toBeInTheDocument()
  })

  it('T12/T19: a second invite fires while the first is pending; first failing removes only its row', async () => {
    const bobGate = deferred()
    const carolGate = deferred()
    server.shareImpl = ({ recipientId }) => (recipientId === 'u-bob' ? bobGate.promise : carolGate.promise)
    renderSection()
    await screen.findByText('Alice')

    await invite('Bob')
    expect(searchInput()).not.toBeDisabled()
    await invite('Carol')

    expect(server.shareCalls).toEqual([{ recipientId: 'u-bob' }, { recipientId: 'u-carol' }])
    expect(rowNames()).toEqual(['Alice', 'Bob', 'Carol'])
    expect(rowFor('Bob')).toHaveAttribute('aria-busy', 'true')
    expect(rowFor('Carol')).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      bobGate.reject(new Error('nope'))
    })
    await waitFor(() => expect(rowNames()).toEqual(['Alice', 'Carol']))
    expect(rowFor('Carol')).toHaveAttribute('aria-busy', 'true')

    server.shares = [row('Alice'), row('Carol')]
    await act(async () => {
      carolGate.resolve({})
    })
    await waitFor(() => expect(rowFor('Carol')).not.toHaveAttribute('aria-busy', 'true'))
    expect(rowNames()).toEqual(['Alice', 'Carol'])
  })

  it('T13: selecting an already-listed recipient adds no duplicate row', async () => {
    renderSection()
    await screen.findByText('Alice')

    await invite('Alice')

    expect(rowNames()).toEqual(['Alice'])
    expect(rowFor('Alice')).not.toHaveAttribute('aria-busy', 'true')
  })
})

describe('SharingSection — optimistic revoke', () => {
  beforeEach(() => {
    server.shares = [row('Alice'), row('Bob')]
  })

  it('T14/T17: removes the row immediately without a "Revoking…" label', async () => {
    renderSection()
    await screen.findByText('Alice')

    await revoke('Alice')

    expect(rowNames()).toEqual(['Bob'])
    expect(screen.queryByText('Revoking…')).not.toBeInTheDocument()
    expect(server.revokeCalls).toEqual([{ shareId: 's-alice' }])
  })

  it('T15: on rejection the row returns at its original index and an alert names it', async () => {
    const gate = deferred()
    server.revokeImpl = () => gate.promise
    renderSection()
    await screen.findByText('Alice')
    await revoke('Alice')

    await act(async () => {
      gate.reject(new Error('Server said no'))
    })

    await waitFor(() => expect(rowNames()).toEqual(['Alice', 'Bob']))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Alice')
    expect(alert).toHaveTextContent('Server said no')
  })

  it('T16: overlapping revokes — first rejecting restores only its row', async () => {
    const aliceGate = deferred()
    const bobGate = deferred()
    server.revokeImpl = ({ shareId }) => (shareId === 's-alice' ? aliceGate.promise : bobGate.promise)
    renderSection()
    await screen.findByText('Alice')
    await revoke('Alice')
    await revoke('Bob')
    expect(screen.getByTestId('shares-i-give-empty')).toBeInTheDocument()

    await act(async () => {
      aliceGate.reject(new Error('nope'))
    })

    await waitFor(() => expect(rowNames()).toEqual(['Alice']))
    expect(within(sharesList()).queryByText('Bob')).not.toBeInTheDocument()
  })

  it('overlapping invite and revoke: the revoke settling first keeps the pending invite row', async () => {
    const inviteGate = deferred()
    const revokeGate = deferred()
    server.shareImpl = () => inviteGate.promise
    server.revokeImpl = () => revokeGate.promise
    renderSection()
    await screen.findByText('Alice')

    await invite('Carol')
    await revoke('Alice')
    server.shares = [row('Bob')]
    await act(async () => {
      revokeGate.resolve({})
    })
    await flushOptimistic()

    expect(rowNames()).toEqual(['Bob', 'Carol'])
    expect(rowFor('Carol')).toHaveAttribute('aria-busy', 'true')
  })
})

describe('SharingSection — error reporting', () => {
  it('a later successful invite does not clear an earlier invite failure', async () => {
    const bobGate = deferred()
    const carolGate = deferred()
    server.shareImpl = ({ recipientId }) => (recipientId === 'u-bob' ? bobGate.promise : carolGate.promise)
    renderSection()
    await screen.findByText('Alice')
    await invite('Bob')
    await invite('Carol')

    await act(async () => {
      bobGate.reject(new Error('nope'))
    })
    server.shares = [row('Alice'), row('Carol')]
    await act(async () => {
      carolGate.resolve({})
    })

    await waitFor(() => expect(rowFor('Carol')).not.toHaveAttribute('aria-busy', 'true'))
    expect(screen.getByRole('alert')).toHaveTextContent('Bob')
  })
})
