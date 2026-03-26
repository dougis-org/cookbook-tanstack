import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CookbookStandalonePage } from "@/components/cookbooks/CookbookStandaloneLayout"

describe("CookbookStandalonePage", () => {
  it("renders children inside the container", () => {
    render(<CookbookStandalonePage><p>Test content</p></CookbookStandalonePage>)
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("applies max-w-2xl by default", () => {
    const { container } = render(<CookbookStandalonePage><span /></CookbookStandalonePage>)
    const inner = container.querySelector(".max-w-2xl")
    expect(inner).toBeInTheDocument()
    expect(inner).toHaveClass("print:max-w-4xl")
  })

  it("applies max-w-4xl when maxWidth is 4xl", () => {
    const { container } = render(<CookbookStandalonePage maxWidth="4xl"><span /></CookbookStandalonePage>)
    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument()
  })
})
