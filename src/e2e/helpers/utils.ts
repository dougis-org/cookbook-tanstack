/**
 * Generates a unique, cryptographically secure suffix for test resources.
 * Format: ${Date.now()}${crypto.randomUUID().slice(0, 8)} (no separator — safe for usernames)
 */
export function getUniqueSuffix(): string {
  return `${Date.now()}${crypto.randomUUID().slice(0, 8)}`;
}
