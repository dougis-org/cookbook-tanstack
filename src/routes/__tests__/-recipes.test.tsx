import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/RecipeCard', () => ({
  default: () => null,
}))

vi.mock('@/components/recipes/filters/FilterRow1Quick', () => ({
  FilterRow1Quick: () => null,
}))

vi.mock('@/components/recipes/filters/FilterDropdowns', () => ({
  FilterDropdowns: () => null,
}))

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

function setLoggedIn(opts: { tier?: string; isLoggedIn?: boolean } = {}) {
  const tier = opts.tier ?? 'home-cook'
  const isLoggedIn = opts.isLoggedIn ?? true
  mockUseAuth.mockReturnValue({
    session: isLoggedIn ? { user: { id: 'u1', tier } } : null,
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

function setHomeCookAtLimit() {
  setRecipeCount(10)
  mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)
}

function setHomeCookBelowLimit() {
  setRecipeCount(7)
  mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)
}

function setSousChef() {
  setRecipeCount(10)
  mockUseTierEntitlements.mockReturnValue(SOUS_CHEF_ENTITLEMENTS)
}

describe('RecipesPage — tier affordances', () => {
  beforeEach(() => {
    setLoggedIn()
  })

  it('disables New Recipe button when home-cook user is at recipe limit', () => {
    setHomeCookAtLimit()
    render(<RecipesPage />)
    const btn = screen.getByRole('button', { name: /new recipe/i })
    expect(btn).toBeDisabled()
  })

  it('shows inline TierWall when home-cook user is at recipe limit', () => {
    setHomeCookAtLimit()
    render(<RecipesPage />)
    expect(screen.getAllByText(/limit/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/pricing')
  })

  it('enables New Recipe button when home-cook user is below limit', () => {
    setHomeCookBelowLimit()
    render(<RecipesPage />)
    const link = screen.getByRole('link', { name: /new recipe/i })
    expect(link).toBeInTheDocument()
    expect(link).not.toHaveAttribute('disabled')
  })

  it('hides Import Recipe entry point for home-cook', () => {
    setHomeCookBelowLimit()
    render(<RecipesPage />)
    expect(screen.queryByRole('link', { name: /import recipe/i })).not.toBeInTheDocument()
  })

  it('shows Import Recipe link for sous-chef', () => {
    setSousChef()
    setLoggedIn({ tier: 'sous-chef' })
    render(<RecipesPage />)
    expect(screen.getByRole('link', { name: /import recipe/i })).toBeInTheDocument()
  })
})
