export const PRINT_PLACEMENTS = ["header", "footer", "none"] as const
export type PrintPlacement = (typeof PRINT_PLACEMENTS)[number]

export const PRINT_PLACEMENT_KEYS = [
  "printCategory",
  "printDifficulty",
  "printServings",
  "printPrepTime",
  "printCookTime",
] as const
export type PrintPlacementKey = (typeof PRINT_PLACEMENT_KEYS)[number]

export interface PrintPreferences extends Record<PrintPlacementKey, PrintPlacement> {
  printShowIngredients: boolean
  printShowInstructions: boolean
  printShowNotes: boolean
  printShowPersonalNotes: boolean
}

/** New-account defaults. `auth.ts` uses these as the `defaultValue`s for the same fields. */
export const DEFAULT_PRINT_PLACEMENTS: Record<PrintPlacementKey, PrintPlacement> = {
  printCategory: "footer",
  printDifficulty: "none",
  printServings: "none",
  printPrepTime: "none",
  printCookTime: "none",
}

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = {
  ...DEFAULT_PRINT_PLACEMENTS,
  printShowIngredients: true,
  printShowInstructions: true,
  printShowNotes: true,
  printShowPersonalNotes: true,
}

type SessionLike = { user?: unknown } | null | undefined

// Per design Decision 3 / reliability requirement: only a strict `false`
// suppresses a section. Missing, undefined, null, or any non-boolean value
// resolves to `true` (shown) so malformed session data never silently hides
// print content.
function resolveShown(value: unknown): boolean {
  return value !== false
}

function isPlacement(value: unknown): value is PrintPlacement {
  return typeof value === "string" && (PRINT_PLACEMENTS as readonly string[]).includes(value)
}

// Legacy `printShowMeta` (design Decision 2): when a placement field is absent
// or invalid, Prep, Cook, Servings and Difficulty follow the old flag
// (strict `false` => none, anything else => header). Category has no legacy
// equivalent and uses its default.
function resolvePlacement(user: Record<string, unknown>, key: PrintPlacementKey): PrintPlacement {
  const stored = user[key]
  if (isPlacement(stored)) return stored
  if (key === "printCategory") return DEFAULT_PRINT_PLACEMENTS.printCategory
  return user.printShowMeta === false ? "none" : "header"
}

export function resolvePrintPreferences(session: SessionLike): PrintPreferences {
  const rawUser = session && typeof session === "object" ? session.user : undefined
  if (!rawUser || typeof rawUser !== "object") return { ...DEFAULT_PRINT_PREFERENCES }
  const user = rawUser as Record<string, unknown>
  return {
    printCategory: resolvePlacement(user, "printCategory"),
    printDifficulty: resolvePlacement(user, "printDifficulty"),
    printServings: resolvePlacement(user, "printServings"),
    printPrepTime: resolvePlacement(user, "printPrepTime"),
    printCookTime: resolvePlacement(user, "printCookTime"),
    printShowIngredients: resolveShown(user.printShowIngredients),
    printShowInstructions: resolveShown(user.printShowInstructions),
    printShowNotes: resolveShown(user.printShowNotes),
    printShowPersonalNotes: resolveShown(user.printShowPersonalNotes),
  }
}
