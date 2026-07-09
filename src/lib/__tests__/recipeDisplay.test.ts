import { describe, it, expect } from "vitest"
import { formatMinutesOrNA, isTimeNA } from "@/lib/recipeDisplay"

describe("isTimeNA", () => {
  it.each([null, undefined, 0])("returns true for %s", (value) => {
    expect(isTimeNA(value)).toBe(true)
  })

  it("returns false for a positive number", () => {
    expect(isTimeNA(15)).toBe(false)
  })
})

describe("formatMinutesOrNA", () => {
  it("returns N/A for null", () => {
    expect(formatMinutesOrNA(null)).toBe("N/A")
  })

  it("returns N/A for undefined", () => {
    expect(formatMinutesOrNA()).toBe("N/A")
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

  it("does not mask NaN as N/A, so invalid data stays visibly wrong", () => {
    expect(formatMinutesOrNA(NaN)).toBe("NaN min")
  })
})
