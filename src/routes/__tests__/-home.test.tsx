import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="page-layout">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}))

vi.mock('@/components/recipes/RecipeCard', () => ({
  default: ({ recipe }: { recipe: any }) => (
    <div data-testid={`recipe-card-${recipe.id}`}>
      {recipe.name}
    </div>
  ),
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
  return {
    trpc: {
      recipes: {
        list: { queryOptions: (opts?: unknown) => ({ queryKey: ['recipes', 'list', opts] }) },
      },
      usage: {
        getOwned: { queryOptions: (opts?: unknown) => ({ queryKey: ['usage', 'getOwned', opts] }) },
      },
    },
  }
})

import { HomePageComponent, Route } from '@/routes/home'

function setupMocks({
  name = 'Doug McDonald',
  tier = 'home-cook',
  recipeCount = 0,
  cookbookCount = 0,
  recipes = [] as any[],
  lastPaidActionAttempt = null as string | null,
} = {}) {
  mockUseAuth.mockReturnValue({
    isLoggedIn: true,
    session: { user: { id: 'u1', name, tier } },
  })

  mockUseTierEntitlements.mockReturnValue({
    tier,
    recipeLimit: tier === 'home-cook' ? 10 : 100,
    cookbookLimit: tier === 'home-cook' ? 1 : 10,
    canImport: tier === 'executive-chef',
    canCreatePrivate: tier === 'sous-chef' || tier === 'executive-chef',
  })

  mockUseQuery.mockImplementation((options: any) => {
    const key = options.queryKey
    if (key[0] === 'usage' && key[1] === 'getOwned') {
      return { data: { recipeCount, cookbookCount }, isLoading: false, isError: false }
    }
    if (key[0] === 'recipes' && key[1] === 'list') {
      return { data: { items: recipes, total: recipes.length }, isLoading: false, isError: false }
    }
    return { data: undefined, isLoading: false, isError: false }
  })

  if (lastPaidActionAttempt) {
    localStorage.setItem('last_paid_action_attempt', lastPaidActionAttempt)
  } else {
    localStorage.removeItem('last_paid_action_attempt')
  }
}

describe('/home', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock system time to: Sunday, May 24, 2026
    vi.setSystemTime(new Date('2026-05-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('beforeLoad', () => {
    it('redirects anonymous visitors (auth guard)', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        throw new Error('beforeLoad is not defined')
      }
      
      try {
        beforeLoad({ context: { session: null }, location: { href: '/home' } } as any)
        throw new Error('Should have thrown')
      } catch (err: any) {
        expect(err.type).toBe('redirect')
        expect(err.options.to).toBe('/auth/login')
        expect(err.options.search).toMatchObject({ reason: 'auth-required' })
      }
    })

    it('allows authenticated users', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        return
      }

      expect(() => {
        beforeLoad({ context: { session: { user: { id: 'u1' } } }, location: { href: '/home' } } as any)
      }).not.toThrow()
    })
  })

  describe('HomePageComponent — Greeting & Date', () => {
    it('renders Welcome back with the user first name', () => {
      setupMocks({ name: 'Doug McDonald' })
      render(<HomePageComponent />)
      expect(screen.getByRole('heading', { name: /welcome back, doug/i })).toBeInTheDocument()
    })

    it('handles first name extraction for a single name', () => {
      setupMocks({ name: 'Doug' })
      render(<HomePageComponent />)
      expect(screen.getByRole('heading', { name: /welcome back, doug/i })).toBeInTheDocument()
    })

    it('handles first name extraction for empty or missing name gracefully', () => {
      setupMocks({ name: '' })
      render(<HomePageComponent />)
      expect(screen.getByRole('heading', { name: /welcome back, chef/i })).toBeInTheDocument()
    })

    it('displays today date formatted nicely', () => {
      setupMocks()
      render(<HomePageComponent />)
      const expected = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date('2026-05-24T12:00:00Z'))
      expect(screen.getByText(expected, { exact: false })).toBeInTheDocument()
    })
  })

  describe('HomePageComponent — Usage Card', () => {
    it('renders recipes usage details with limit and progress bar', () => {
      setupMocks({ recipeCount: 7, tier: 'home-cook' })
      render(<HomePageComponent />)
      expect(screen.getByText('7 of 10')).toBeInTheDocument()
      expect(screen.getAllByText('Home Cook').length).toBeGreaterThan(0)
    })

    it('renders cookbooks usage details with limit and progress bar', () => {
      setupMocks({ cookbookCount: 1, tier: 'home-cook' })
      render(<HomePageComponent />)
      expect(screen.getByText('1 of 1')).toBeInTheDocument()
    })

    it('renders monthly creation block with number of recipes saved in current calendar month', () => {
      const thisMonthRecipes = [
        { id: 'r1', name: 'R1', createdAt: '2026-05-10T10:00:00Z' },
        { id: 'r2', name: 'R2', createdAt: '2026-05-20T10:00:00Z' },
      ]
      setupMocks({ recipes: thisMonthRecipes })
      render(<HomePageComponent />)
      expect(screen.getByText('This Month')).toBeInTheDocument()
      expect(screen.getByText('2 saved')).toBeInTheDocument()
    })

    it('correctly filters monthly recipes to only current calendar month (May 2026)', () => {
      const mixedRecipes = [
        { id: 'r1', name: 'R1', createdAt: '2026-05-10T10:00:00Z' }, // inside May 2026
        { id: 'r2', name: 'R2', createdAt: '2026-04-30T23:59:59Z' }, // outside
        { id: 'r3', name: 'R3', createdAt: '2026-06-01T00:00:00Z' }, // outside
        { id: 'r4', name: 'R4', createdAt: '2025-05-10T10:00:00Z' }, // outside (wrong year)
      ]
      setupMocks({ recipes: mixedRecipes })
      render(<HomePageComponent />)
      expect(screen.getByText('1 saved')).toBeInTheDocument()
    })

    it('renders recipes usage tile as a full link to /recipes', () => {
      setupMocks({ recipeCount: 7, tier: 'home-cook' })
      render(<HomePageComponent />)

      const recipesTile = screen.getByTestId('recipes-usage-tile-link')
      expect(recipesTile).toHaveAttribute('href', '/recipes')
    })

    it('renders cookbooks usage tile as a full link to /cookbooks', () => {
      setupMocks({ cookbookCount: 1, tier: 'home-cook' })
      render(<HomePageComponent />)

      const cookbooksTile = screen.getByTestId('cookbooks-usage-tile-link')
      expect(cookbooksTile).toHaveAttribute('href', '/cookbooks')
    })

    it('keeps discovery links to recipes and cookbooks', () => {
      setupMocks({ tier: 'home-cook' })
      render(<HomePageComponent />)

      expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute('href', '/recipes')
      expect(screen.getByRole('link', { name: 'Cookbooks' })).toHaveAttribute('href', '/cookbooks')
    })
  })

  describe('HomePageComponent — Quick Actions Row', () => {
    it('enables Import Recipe button for Executive Chef tier', () => {
      setupMocks({ tier: 'executive-chef' })
      render(<HomePageComponent />)
      
      const importButton = screen.getByRole('link', { name: /import recipe/i })
      expect(importButton).toBeInTheDocument()
      expect(importButton).not.toHaveClass('pointer-events-none')
      expect(importButton).not.toHaveAttribute('aria-disabled', 'true')
      expect(screen.queryByTestId('executive-chef-badge')).not.toBeInTheDocument()
    })

    it('disables Import Recipe button and renders Executive Chef badge for non-executive tier', () => {
      setupMocks({ tier: 'home-cook' })
      render(<HomePageComponent />)
      
      const importButton = screen.getByTestId('import-recipe-link')
      expect(importButton).toBeInTheDocument()
      expect(importButton).toHaveClass('pointer-events-none')
      expect(importButton).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByTestId('executive-chef-badge')).toBeInTheDocument()
    })
  })

  describe('HomePageComponent — Recently Saved Section', () => {
    it('renders top 4 recipe card previews when database has recipes', () => {
      const mockRecipes = [
        { id: 'r1', name: 'Spaghetti Carbonara' },
        { id: 'r2', name: 'Chicken Parmesan' },
        { id: 'r3', name: 'Tacos' },
        { id: 'r4', name: 'Salad' },
      ]
      setupMocks({ recipes: mockRecipes })
      render(<HomePageComponent />)

      expect(screen.getByTestId('recipe-card-r1')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-card-r2')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-card-r3')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-card-r4')).toBeInTheDocument()
      expect(screen.queryByText(/No recipes saved yet/)).not.toBeInTheDocument()
    })

    it('renders elegant empty state layout when user has 0 saved recipes', () => {
      setupMocks({ recipes: [] })
      render(<HomePageComponent />)

      expect(screen.getByText(/No recipes saved yet/)).toBeInTheDocument()
      expect(screen.getByText(/Create or import your first recipe to get started!/)).toBeInTheDocument()
    })
  })

  describe('HomePageComponent — Smart Contextual Upgrade Nudges', () => {
    it('shows cookbook limit reached nudge', () => {
      setupMocks({ cookbookCount: 1, recipeCount: 4, tier: 'home-cook' })
      render(<HomePageComponent />)

      expect(screen.getByText('Ready to build a second cookbook? Upgrade to Prep Cook.')).toBeInTheDocument()
      const upgradeBtn = screen.getByRole('link', { name: 'Upgrade — $2.99/mo' })
      expect(upgradeBtn).toBeInTheDocument()
      expect(upgradeBtn.getAttribute('href')).toBe('/pricing')
    })

    it('shows recipe limit approaching nudge when recipes >= 80%', () => {
      setupMocks({ cookbookCount: 0, recipeCount: 8, tier: 'home-cook' })
      render(<HomePageComponent />)

      expect(screen.getByText('Running out of room? Upgrade to Prep Cook to save up to 100 recipes.')).toBeInTheDocument()
    })

    it('shows recent paid action attempt nudge when timestamp is within 7 days', () => {
      // 3 days ago (current time is 2026-05-24) -> 2026-05-21
      setupMocks({
        cookbookCount: 0,
        recipeCount: 4,
        tier: 'home-cook',
        lastPaidActionAttempt: '2026-05-21T12:00:00Z',
      })
      render(<HomePageComponent />)

      expect(screen.getByText('Unlock premium capabilities with Prep Cook.')).toBeInTheDocument()
    })

    it('hides upgrade nudge banner when no warning thresholds are met', () => {
      setupMocks({
        cookbookCount: 0,
        recipeCount: 4,
        tier: 'home-cook',
        lastPaidActionAttempt: null,
      })
      render(<HomePageComponent />)

      expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument()
    })

    it('hides upgrade nudge banner when last_paid_action_attempt is older than 7 days', () => {
      // 8 days ago -> 2026-05-16
      setupMocks({
        cookbookCount: 0,
        recipeCount: 4,
        tier: 'home-cook',
        lastPaidActionAttempt: '2026-05-16T12:00:00Z',
      })
      render(<HomePageComponent />)

      expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument()
    })
  })
})
