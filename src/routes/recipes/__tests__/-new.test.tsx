import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'
import { createRouterMock } from '@/test-helpers/mocks'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  ...createRouterMock(),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/recipes/RecipeForm', () => ({ default: () => null }))

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

vi.mock('@/lib/trpc', () => ({
  trpc: {
    usage: {
      getOwned: {
        queryOptions: () => ({ queryKey: ['usage', 'getOwned'] }),
      },
    },
  },
}))

import { Route } from '@/routes/recipes/new'

describe('/recipes/new — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/recipes/new')
  })
})

describe('NewRecipePage component blockage at 100% capacity', () => {
  const NewRecipePageComponent = Route.options.component

  function mockHomeCookPlan() {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      session: { user: { tier: 'home-cook' } },
    })

    mockUseTierEntitlements.mockReturnValue({
      tier: 'home-cook',
      recipeLimit: 10,
      cookbookLimit: 1,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockHomeCookPlan()
  })

  it('renders correctly and does not display TierWall when under 100% capacity', () => {
    mockUseQuery.mockReturnValue({
      data: { recipeCount: 5, cookbookCount: 0 },
      isLoading: false,
    })

    if (!NewRecipePageComponent) throw new Error('NewRecipePageComponent is undefined')
    render(<NewRecipePageComponent />)

    // No plan limit warning modal should be shown
    expect(screen.queryByText(/Plan limit reached/i)).not.toBeInTheDocument()
  })

  it('renders loading state while usage data is loading', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    if (!NewRecipePageComponent) throw new Error('NewRecipePageComponent is undefined')
    render(<NewRecipePageComponent />)

    expect(screen.getByText(/Loading plan details/i)).toBeInTheDocument()
    expect(screen.queryByText(/Plan limit reached/i)).not.toBeInTheDocument()
  })

  it('blocks page entry and immediately renders TierWall modal when at 100% capacity, and redirects when dismissed', async () => {
    mockUseQuery.mockReturnValue({
      data: { recipeCount: 10, cookbookCount: 1 },
      isLoading: false,
    })

    if (!NewRecipePageComponent) throw new Error('NewRecipePageComponent is undefined')
    render(<NewRecipePageComponent />)

    // Plan limit warning modal should be shown
    expect(screen.getByText(/Plan limit reached/i)).toBeInTheDocument()
    expect(screen.getByText(/Today vs Prep Cook/i)).toBeInTheDocument()

    // Clicking "Not now" redirects the user back to /recipes
    const notNowBtn = screen.getByRole('button', { name: /not now/i })
    await userEvent.click(notNowBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/recipes' })
  })
})
