import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import StatusIndicator from "../StatusIndicator"

describe("StatusIndicator", () => {
  it("should render nothing when status is idle", () => {
    const { container } = render(<StatusIndicator status="idle" />)
    expect(container.firstChild).toBeNull()
  })

  it("should render saving state", () => {
    render(<StatusIndicator status="saving" />)
    expect(screen.getByText("Saving...")).toBeDefined()
  })

  it("should render saved state", () => {
    render(<StatusIndicator status="saved" />)
    expect(screen.getByText("Saved")).toBeDefined()
  })

  it("should render error state", () => {
    render(<StatusIndicator status="error" />)
    expect(screen.getByText("Failed to save")).toBeDefined()
  })

  it("should render retry button in error state when onRetry is provided", () => {
    const onRetry = vi.fn()
    render(<StatusIndicator status="error" onRetry={onRetry} />)
    const retryBtn = screen.getByRole("button", { name: /retry/i })
    expect(retryBtn).toBeDefined()
    retryBtn.click()
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
