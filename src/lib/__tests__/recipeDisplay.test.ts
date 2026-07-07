import { describe, it, expect } from "vitest"
import { formatMinutesOrNA } from "@/lib/recipeDisplay"

describe("formatMinutesOrNA", () => {
  it("returns N/A for null", () => {
    expect(formatMinutesOrNA(null)).toBe("N/A")
  })

  it("returns N/A for undefined", () => {
    expect(formatMinutesOrNA(undefined)).toBe("N/A")
  })

  it("returns N/A for 0", () => {
    expect(formatMinutesOrNA(0)).toBe("N/A")
  })

  it("returns the value with the default ' min' unit", () => {
    expect(formatMinutesOrNA(15)).toBe("15 min")
  })

  it("returns the value with an 'm' unit when specified", () => {
    expect(formatMinutesOrNA(15, "m")).toBe("15m")
  })
})
