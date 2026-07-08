// skipcq: JS-0067 -- ES module scope function, not a global; DeepSource's
// global-scope check misidentifies module-scoped exports.
/**
 * `null`, `undefined`, and `0` are all "not applicable" for a recipe's
 * prep/cook time per product decision (see openspec/changes/add-na-cook-prep-time),
 * not three distinct states. This is the single source of truth for that
 * rule — both display formatting (below) and RecipeForm's N/A toggle
 * defaulting use this predicate so the definition can't drift between them.
 */
export function isTimeNA(value: number | null | undefined): boolean {
  return value == null || value === 0
}

// skipcq: JS-0067 -- ES module scope function, not a global; DeepSource's
// global-scope check misidentifies module-scoped exports.
/**
 * Formats a recipe's prep/cook time for display.
 */
export function formatMinutesOrNA(
  value: number | null | undefined = undefined,
  unit: " min" | "m" = " min",
): string {
  if (isTimeNA(value)) return "N/A"
  return `${value}${unit}`
}
