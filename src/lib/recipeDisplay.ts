/**
 * Formats a recipe's prep/cook time for display. `null`, `undefined`, and `0`
 * are all treated as "not applicable" per product decision (see
 * openspec/changes/add-na-cook-prep-time), not as three distinct states.
 */
export function formatMinutesOrNA(
  value: number | null | undefined,
  unit: " min" | "m" = " min",
): string {
  if (!value) return "N/A"
  return `${value}${unit}`
}
