import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSearch, mockCreateFileRoute, mockLink, mockNavigate } = vi.hoisted(() => ({
  mockUseSearch: vi.fn().mockReturnValue({}),
  mockCreateFileRoute: vi.fn().mockImplementation((path: string) => (opts: any) => ({
    ...opts,
    useSearch: mockUseSearch,
    options: opts,
  })),
  mockLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  mockNavigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    createFileRoute: mockCreateFileRoute,
    Link: mockLink,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/RecipeCard', () => ({ default: () => null }))
vi.mock('@/components/recipes/filters/FilterRow1Quick', () => ({ FilterRow1Quick: () => null }))
vi.mock('@/components/recipes/filters/FilterDropdowns', () => ({ FilterDropdowns: () => null }))
vi.mock('@/components/ui/TierWall', () => ({ default: () => <span>Limit reached</span> }))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseTierEntitlements = vi.fn()
vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => mockUseTierEntitlements(),
}))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => {
  const empty = (opts?: unknown) => ({ queryKey: ['empty', opts] })
  return {
    trpc: {
      recipes: {
        list: { queryOptions: (opts?: unknown) => ({ queryKey: ['recipes', opts] }) },
      },
      usage: {
        getOwned: { queryOptions: (opts?: unknown) => ({ queryKey: ['usage', 'getOwned', opts] }) },
      },
      classifications: { list: { queryOptions: empty } },
      sources: { list: { queryOptions: empty } },
      meals: { list: { queryOptions: empty } },
      courses: { list: { queryOptions: empty } },
      preparations: { list: { queryOptions: empty } },
    },
  }
})

import { RecipesPage } from '@/routes/recipes/index'

const HOME_COOK_ENTITLEMENTS = { tier: 'home-cook', canCreatePrivate: false, canImport: false, recipeLimit: 10, cookbookLimit: 1 }
const SOUS_CHEF_ENTITLEMENTS = { tier: 'sous-chef', canCreatePrivate: true, canImport: true, recipeLimit: 500, cookbookLimit: 25 }

function setLoggedIn(opts: { emailVerified?: boolean; isLoggedIn?: boolean } = {}) {
  const isLoggedIn = opts.isLoggedIn ?? true
  mockUseAuth.mockReturnValue({
    session: isLoggedIn ? { user: { id: 'u1', emailVerified: opts.emailVerified ?? true } } : null,
    isPending: false,
    isLoggedIn,
    userId: isLoggedIn ? 'u1' : null,
  })
}

function setRecipeCount(total: number) {
  mockUseQuery.mockImplementation((opts: unknown) => {
    const key = JSON.stringify((opts as { queryKey: unknown[] }).queryKey)
    if (key.includes('recipes')) {
      return { data: { items: [], total, page: 1, pageSize: 20 }, isLoading: false }
    }
    if (key.includes('usage')) {
      return { data: { recipeCount: total, cookbookCount: 0 }, isLoading: false }
    }
    return { data: [], isLoading: false }
  })
}

describe('RecipesPage — toolbar controls (verified user)', () => {
  beforeEach(() => {
    setLoggedIn({ emailVerified: true })
    mockUseSearch.mockReturnValue({})
  })

  it('shows Import Recipe link when user can import', () => {
    setRecipeCount(5)
    mockUseTierEntitlements.mockReturnValue(SOUS_CHEF_ENTITLEMENTS)

    render(<RecipesPage />)

    expect(screen.getByRole('link', { name: /import recipe/i })).toBeInTheDocument()
  })

  it('hides Import Recipe link when user cannot import', () => {
    setRecipeCount(5)
    mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)

    render(<RecipesPage />)

    expect(screen.queryByRole('link', { name: /import recipe/i })).not.toBeInTheDocument()
  })

  it('disables New Recipe button when at recipe limit', () => {
    setRecipeCount(10)
    mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)

    render(<RecipesPage />)

    expect(screen.getByRole('button', { name: /new recipe/i })).toBeDisabled()
  })

  it('shows New Recipe link when below recipe limit', () => {
    setRecipeCount(5)
    mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)

    render(<RecipesPage />)

    expect(screen.getByRole('link', { name: /new recipe/i })).toBeInTheDocument()
  })
})

describe('RecipesPage — verification gate', () => {
  it('shows Verify Email CTA when unverified', () => {
    setLoggedIn({ emailVerified: false })
    setRecipeCount(0)
    mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)
    mockUseSearch.mockReturnValue({})

    render(<RecipesPage />)

    expect(screen.getByRole('link', { name: /verify email to create/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /create your first recipe/i })).not.toBeInTheDocument()
  })

  it('shows Create Recipe button when verified', () => {
    setLoggedIn({ emailVerified: true })
    setRecipeCount(0)
    mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)
    mockUseSearch.mockReturnValue({})

    render(<RecipesPage />)

    expect(screen.getByRole('link', { name: /create your first recipe/i })).toBeInTheDocument()
  })
})
