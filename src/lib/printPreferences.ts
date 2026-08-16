export interface PrintPreferences {
  printShowMeta: boolean
  printShowIngredients: boolean
  printShowInstructions: boolean
  printShowNotes: boolean
  printShowPersonalNotes: boolean
}

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = {
  printShowMeta: true,
  printShowIngredients: true,
  printShowInstructions: true,
  printShowNotes: true,
  printShowPersonalNotes: true,
}

type SessionLike = { user?: Record<string, unknown> | null } | null | undefined

// Per design Decision 3 / reliability requirement: only a strict `false`
// suppresses a section. Missing, undefined, null, or any non-boolean value
// resolves to `true` (shown) so malformed session data never silently hides
// print content.
function resolveShown(value: unknown): boolean {
  return value !== false
}

export function resolvePrintPreferences(session: SessionLike): PrintPreferences {
  const user = session?.user
  return {
    printShowMeta: resolveShown(user?.printShowMeta),
    printShowIngredients: resolveShown(user?.printShowIngredients),
    printShowInstructions: resolveShown(user?.printShowInstructions),
    printShowNotes: resolveShown(user?.printShowNotes),
    printShowPersonalNotes: resolveShown(user?.printShowPersonalNotes),
  }
}
