import { describe, it, expect } from "vitest"
import {
  resolvePrintPreferences,
  DEFAULT_PRINT_PREFERENCES,
  PRINT_PLACEMENT_KEYS,
  type PrintPlacement,
} from "@/lib/printPreferences"

const SECTION_TOGGLES = {
  printShowIngredients: true,
  printShowInstructions: true,
  printShowNotes: true,
  printShowPersonalNotes: true,
}

const NEW_ACCOUNT_DEFAULTS = {
  printCategory: "footer",
  printDifficulty: "none",
  printServings: "none",
  printPrepTime: "none",
  printCookTime: "none",
}

const LEGACY_SHOWN = {
  printCategory: "footer",
  printDifficulty: "header",
  printServings: "header",
  printPrepTime: "header",
  printCookTime: "header",
}

const LEGACY_HIDDEN = { ...LEGACY_SHOWN, printDifficulty: "none", printServings: "none", printPrepTime: "none", printCookTime: "none" }

describe("resolvePrintPreferences — defaults", () => {
  it("exposes the new-account defaults and no printShowMeta", () => {
    expect(DEFAULT_PRINT_PREFERENCES).toEqual({ ...NEW_ACCOUNT_DEFAULTS, ...SECTION_TOGGLES })
    expect("printShowMeta" in DEFAULT_PRINT_PREFERENCES).toBe(false)
  })

  it("resolves defaults for a null session", () => {
    expect(resolvePrintPreferences(null)).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves defaults for an undefined session", () => {
    expect(resolvePrintPreferences(undefined)).toEqual(DEFAULT_PRINT_PREFERENCES)
  })

  it("resolves a session with none of the new fields as legacy-shown (no data migration needed)", () => {
    expect(resolvePrintPreferences({ user: { id: "u1" } })).toEqual({ ...LEGACY_SHOWN, ...SECTION_TOGGLES })
  })
})

describe("resolvePrintPreferences — stored placements", () => {
  const placements: PrintPlacement[] = ["header", "footer", "none"]

  it.each(PRINT_PLACEMENT_KEYS.flatMap((key) => placements.map((p) => [key, p] as const)))(
    "returns stored %s = %s unchanged",
    (key, placement) => {
      const result = resolvePrintPreferences({ user: { [key]: placement } })
      expect(result[key]).toBe(placement)
    },
  )

  it("honors a mix of stored placements", () => {
    const result = resolvePrintPreferences({ user: { printCategory: "header", printPrepTime: "footer" } })
    expect(result.printCategory).toBe("header")
    expect(result.printPrepTime).toBe("footer")
  })
})

describe("resolvePrintPreferences — legacy printShowMeta", () => {
  it("printShowMeta true resolves the four meta items to header and Category to footer", () => {
    expect(resolvePrintPreferences({ user: { printShowMeta: true } })).toEqual({ ...LEGACY_SHOWN, ...SECTION_TOGGLES })
  })

  it("printShowMeta false resolves the four meta items to none", () => {
    expect(resolvePrintPreferences({ user: { printShowMeta: false } })).toEqual({ ...LEGACY_HIDDEN, ...SECTION_TOGGLES })
  })

  it("a stored new field wins over the legacy flag", () => {
    const result = resolvePrintPreferences({ user: { printShowMeta: false, printServings: "footer" } })
    expect(result.printServings).toBe("footer")
    expect(result.printDifficulty).toBe("none")
    expect(result.printPrepTime).toBe("none")
    expect(result.printCookTime).toBe("none")
  })

  it("does not expose printShowMeta on the resolved object", () => {
    expect("printShowMeta" in resolvePrintPreferences({ user: { printShowMeta: false } })).toBe(false)
  })
})

describe("resolvePrintPreferences — invalid values", () => {
  it.each(["sideways", 7, null, {}, true, ""])("treats %j as absent", (bad) => {
    const result = resolvePrintPreferences({
      user: { printCategory: bad, printDifficulty: bad, printServings: bad, printPrepTime: bad, printCookTime: bad },
    })
    expect(result).toEqual({ ...LEGACY_SHOWN, ...SECTION_TOGGLES })
  })

  it("invalid value falls back per the legacy rule when printShowMeta is false", () => {
    const result = resolvePrintPreferences({ user: { printShowMeta: false, printDifficulty: 7, printCategory: "sideways" } })
    expect(result.printDifficulty).toBe("none")
    expect(result.printCategory).toBe("footer")
  })

  it.each([null, undefined, "str", 5, [], { user: null }, { user: "x" }, { user: 7 }])(
    "never throws and returns a complete object for malformed session %j",
    (session) => {
      const result = resolvePrintPreferences(session as never)
      expect(Object.keys(result).sort()).toEqual(Object.keys(DEFAULT_PRINT_PREFERENCES).sort())
    },
  )
})

describe("resolvePrintPreferences — section toggles", () => {
  it("resolves a mix of true/false independently per toggle", () => {
    const result = resolvePrintPreferences({
      user: { printShowIngredients: true, printShowInstructions: false, printShowNotes: true, printShowPersonalNotes: false },
    })
    expect(result).toMatchObject({
      printShowIngredients: true,
      printShowInstructions: false,
      printShowNotes: true,
      printShowPersonalNotes: false,
    })
  })

  it("coerces a non-boolean toggle value to true", () => {
    expect(resolvePrintPreferences({ user: { printShowNotes: "true" } }).printShowNotes).toBe(true)
  })
})
