import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

import Footer from "@/components/Footer"

describe("Footer", () => {
  it("has print:hidden class so it is hidden when printing", () => {
    render(<Footer />)
    expect(screen.getByRole("contentinfo")).toHaveClass("print:hidden")
  })

  it("renders a computed copyright year, not a hardcoded literal", () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByRole("contentinfo")).toHaveTextContent(`© ${year} My CookBooks`)
  })

  it("links Terms to /terms", () => {
    render(<Footer />)
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms")
  })

  it("links Privacy Policy to /privacy-policy", () => {
    render(<Footer />)
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    )
  })

  it("separates items with the · (U+00B7) delimiter", () => {
    render(<Footer />)
    const separators = screen.getAllByText("·")
    expect(separators).toHaveLength(2)
    separators.forEach((sep) => expect(sep).toHaveAttribute("aria-hidden", "true"))
  })
})
