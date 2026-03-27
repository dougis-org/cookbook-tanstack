import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ConfirmDialog from "../ConfirmDialog"

describe("ConfirmDialog", () => {
  it("renders with the given message", () => {
    render(
      <ConfirmDialog message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.getByText("Are you sure?")).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog message="Are you sure?" onConfirm={onConfirm} onCancel={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "Discard Changes" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog message="Are you sure?" onConfirm={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole("button", { name: "Keep Editing" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("uses default labels when none are provided", () => {
    render(<ConfirmDialog message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Discard Changes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Keep Editing" })).toBeInTheDocument()
  })

  it("uses custom labels when provided", () => {
    render(
      <ConfirmDialog
        message="Are you sure?"
        confirmLabel="Yes, leave"
        cancelLabel="Go back"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: "Yes, leave" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument()
  })

  it("renders a full-screen overlay behind the card", () => {
    const { container } = render(
      <ConfirmDialog message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    const overlay = container.firstElementChild
    expect(overlay).toHaveClass("fixed", "inset-0")
  })
})
