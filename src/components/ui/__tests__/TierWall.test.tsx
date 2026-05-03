import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock()
})

import TierWall from "../TierWall"

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
