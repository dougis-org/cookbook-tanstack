import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock()
})

import RecipeNotesUpgradeNudge from "../RecipeNotesUpgradeNudge"

describe("RecipeNotesUpgradeNudge", () => {
  it('state="anonymous" renders correct copy', () => {
    render(<RecipeNotesUpgradeNudge state="anonymous" />)
    expect(
      screen.getByText("Login or register to save private notes on any recipe.")
    ).toBeInTheDocument()
  })

  it('state="anonymous" renders Login link to /auth/login', () => {
    render(<RecipeNotesUpgradeNudge state="anonymous" />)
    const link = screen.getByRole("link", { name: /login/i })
    expect(link).toHaveAttribute("href", "/auth/login")
  })

  it('state="below-tier" renders correct copy', () => {
    render(<RecipeNotesUpgradeNudge state="below-tier" />)
    expect(
      screen.getByText(
        "Private notes are part of Sous Chef. Upgrade to add notes to any recipe you can view."
      )
    ).toBeInTheDocument()
  })

  it('state="below-tier" renders Upgrade link to /pricing', () => {
    render(<RecipeNotesUpgradeNudge state="below-tier" />)
    const link = screen.getByRole("link", { name: /upgrade/i })
    expect(link).toHaveAttribute("href", "/pricing")
  })

  it('state="hidden-by-downgrade" renders correct copy', () => {
    render(<RecipeNotesUpgradeNudge state="hidden-by-downgrade" />)
    expect(
      screen.getByText(
        "Your notes are saved. Upgrade to Sous Chef to see and edit them again."
      )
    ).toBeInTheDocument()
  })

  it('state="hidden-by-downgrade" renders Upgrade link to /pricing', () => {
    render(<RecipeNotesUpgradeNudge state="hidden-by-downgrade" />)
    const link = screen.getByRole("link", { name: /upgrade/i })
    expect(link).toHaveAttribute("href", "/pricing")
  })

})
