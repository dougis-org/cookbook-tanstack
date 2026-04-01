import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PrintButton from "../PrintButton"

describe("PrintButton", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders a button with 'Print' label", () => {
    render(<PrintButton />)
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
  })

  it("renders the Printer icon inside the button", () => {
    const { container } = render(<PrintButton />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("calls window.print() when clicked", async () => {
    render(<PrintButton />)
    await userEvent.click(screen.getByRole("button", { name: /print/i }))
    expect(window.print).toHaveBeenCalledOnce()
  })

  it("has print:hidden class to hide itself during printing", () => {
    render(<PrintButton />)
    const button = screen.getByRole("button", { name: /print/i })
    expect(button).toHaveClass("print:hidden")
  })
})
