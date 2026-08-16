import { describe, it, expect } from "vitest"
import { resolvePrintPreferences, DEFAULT_PRINT_PREFERENCES } from "@/lib/printPreferences"

describe("resolvePrintPreferences", () => {
  it("resolves all-true for a null session", () => {
    expect(resolvePrintPreferences(null)).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves all-true for undefined session", () => {
    expect(resolvePrintPreferences(undefined)).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves all-true for a session missing the printShow* fields", () => {
    expect(resolvePrintPreferences({ user: { id: "u1" } })).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves all-true when every field is explicitly true", () => {
    expect(
      resolvePrintPreferences({
        user: {
          printShowMeta: true,
          printShowIngredients: true,
          printShowInstructions: true,
          printShowNotes: true,
          printShowPersonalNotes: true,
        },
      }),
    ).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves a mix of true/false independently per field", () => {
    expect(
      resolvePrintPreferences({
        user: {
          printShowMeta: false,
          printShowIngredients: true,
          printShowInstructions: false,
          printShowNotes: true,
          printShowPersonalNotes: false,
        },
      }),
    ).toEqual({
      printShowMeta: false,
      printShowIngredients: true,
      printShowInstructions: false,
      printShowNotes: true,
      printShowPersonalNotes: false,
    })
  })

  it("coerces a non-boolean value (e.g. a stale string) to true", () => {
    expect(
      resolvePrintPreferences({ user: { printShowNotes: "true" as unknown as boolean } }),
    ).toEqual(DEFAULT_PRINT_PREFERENCES)
  })
})
