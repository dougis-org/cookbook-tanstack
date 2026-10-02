/**
 * Defensive against a malformed query response: never renders a crash on a
 * non-array value, and drops any row that isn't a plain object with a
 * string `id` (every row shape this component consumes has one) rather than
 * trusting the array's contents wholesale. Logs when it has to drop
 * anything, so a real API-contract break doesn't look indistinguishable
 * from "genuinely has nothing to show" in a bug report.
 */
export function toArray<T extends { id: string }>(value: unknown): T[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    console.error("SharingSection: expected an array from a sharing/collaboration query, got", value)
    return []
  }
  const rows = value.filter(
    (row): row is T => typeof row === "object" && row !== null && typeof (row as { id?: unknown }).id === "string",
  )
  if (rows.length !== value.length) {
    console.error(
      `SharingSection: dropped ${value.length - rows.length} malformed row(s) from a sharing/collaboration query response`,
    )
  }
  return rows
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toISOString().split("T")[0]
}

const OPTIMISTIC_ID_PREFIX = "optimistic-"

/** A share row is pending while it carries a client-made temp id (no server grant exists yet). */
export function isOptimisticShareId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function optimisticShareId(recipientId: string): string {
  return `${OPTIMISTIC_ID_PREFIX}${recipientId}`
}
