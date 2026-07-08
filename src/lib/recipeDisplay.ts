/**
 * Formats a recipe's prep/cook time for display. `null`, `undefined`, and `0`
 * are all treated as "not applicable" per product decision (see
 * openspec/changes/add-na-cook-prep-time), not as three distinct states.
 */
// skipcq: JS-0067 -- ES module scope function, not a global; DeepSource's
// global-scope check misidentifies module-scoped exports.
export function formatMinutesOrNA(
  value: number | null | undefined = undefined,
  unit: " min" | "m" = " min",
): string {
  if (value == null || value === 0) return "N/A"
  return `${value}${unit}`
}
