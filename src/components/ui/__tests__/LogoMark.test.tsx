import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import LogoMark from "../LogoMark"

describe("LogoMark", () => {
  it("renders an SVG element with a viewBox of 0 0 64 64 and defaults to size 24", () => {
    const { container } = render(<LogoMark />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64")
    expect(svg).toHaveAttribute("width", "24")
    expect(svg).toHaveAttribute("height", "24")
  })

  it("renders with custom size and className props", () => {
    const { container } = render(<LogoMark size={48} className="text-cyan-400" />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("width", "48")
    expect(svg).toHaveAttribute("height", "48")
    expect(svg).toHaveClass("text-cyan-400")
  })
})
