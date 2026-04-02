import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
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
})
