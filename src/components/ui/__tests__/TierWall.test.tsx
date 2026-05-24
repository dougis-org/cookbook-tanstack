import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const authMockFn = vi.fn()
const tierMockFn = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authMockFn(),
}))

vi.mock("@/hooks/useTierEntitlements", () => ({
  useTierEntitlements: () => tierMockFn(),
}))

import TierWall from "../TierWall"

function mockHomeCookPlan() {
  authMockFn.mockReturnValue({
    isLoggedIn: true,
    session: { user: { tier: 'home-cook' } },
    userId: 'user-1',
    loading: false,
  })
  tierMockFn.mockReturnValue({
    tier: 'home-cook',
    canCreatePrivate: false,
    canImport: false,
    recipeLimit: 10,
    cookbookLimit: 1,
  })
}

beforeEach(() => {
  mockHomeCookPlan()
})

describe("TierWall — inline display", () => {
  it("renders count-limit message and /pricing link", () => {
    render(<TierWall reason="count-limit" display="inline" />)
    expect(screen.getAllByText(/limit/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /upgrade/i })).toHaveAttribute("href", "/pricing")
  })

  it("renders private-content message mentioning sous chef", () => {
    render(<TierWall reason="private-content" display="inline" />)
    expect(screen.getAllByText(/sous.?chef/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /upgrade/i })).toHaveAttribute("href", "/pricing")
  })

  it("renders import message mentioning executive chef", () => {
    render(<TierWall reason="import" display="inline" />)
    expect(screen.getAllByText(/executive.?chef/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /upgrade/i })).toHaveAttribute("href", "/pricing")
  })
})

describe("TierWall — modal display", () => {
  it("renders /pricing link in modal", () => {
    render(<TierWall reason="count-limit" display="modal" onDismiss={vi.fn()} />)
    expect(screen.getByRole("link", { name: /upgrade/i })).toHaveAttribute("href", "/pricing")
  })

  it("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn()
    render(<TierWall reason="count-limit" display="modal" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole("button", { name: /dismiss|close|not now/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it("renders count-limit message in modal", () => {
    render(<TierWall reason="count-limit" display="modal" onDismiss={vi.fn()} />)
    expect(screen.getAllByText(/limit/i).length).toBeGreaterThan(0)
  })

  it("renders private-content message in modal", () => {
    render(<TierWall reason="private-content" display="modal" onDismiss={vi.fn()} />)
    expect(screen.getAllByText(/sous.?chef/i).length).toBeGreaterThan(0)
  })

  it("renders import message in modal", () => {
    render(<TierWall reason="import" display="modal" onDismiss={vi.fn()} />)
    expect(screen.getAllByText(/executive.?chef/i).length).toBeGreaterThan(0)
  })
})

describe("TierWall — resilience", () => {
  it("renders without crashing when onDismiss is omitted in modal mode", () => {
    render(<TierWall reason="count-limit" display="modal" />)
    expect(screen.getByRole("link", { name: /upgrade/i })).toBeInTheDocument()
  })
})

describe("TierWall — progressive paywall upgrades", () => {
  it("renders comparison table when display is modal and reason is count-limit", () => {
    render(<TierWall reason="count-limit" display="modal" onDismiss={vi.fn()} />)
    
    // Check for "Today vs Prep Cook"
    expect(screen.getByText(/Today vs Prep Cook/i)).toBeInTheDocument()
    
    // Check comparing recipes (10 vs 100)
    expect(screen.getByText("Recipes")).toBeInTheDocument()
    expect(screen.getAllByText("10")).toHaveLength(2) // Today's recipe limit and next tier's cookbook limit are both 10
    expect(screen.getByText("100")).toBeInTheDocument()

    // Check comparing cookbooks (1 vs 10)
    expect(screen.getByText("Cookbooks")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()

    // Check comparing price (Free vs $2.99/mo)
    expect(screen.getByText("Price")).toBeInTheDocument()
    expect(screen.getByText("Free")).toBeInTheDocument()
    expect(screen.getByText("$2.99/mo")).toBeInTheDocument()
  })

  it("does not render comparison table for other reasons (regression check)", () => {
    render(<TierWall reason="import" display="modal" onDismiss={vi.fn()} />)
    expect(screen.queryByText(/Today vs Prep Cook/i)).not.toBeInTheDocument()
  })
})
