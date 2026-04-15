import { randomUUID } from "node:crypto";

/**
 * Generates a unique, cryptographically secure suffix for test resources.
 * Format: ${Date.now()}${randomUUID().slice(0, 8)} (no separator — safe for usernames)
 */
export function getUniqueSuffix(): string {
  return `${Date.now()}${randomUUID().slice(0, 8)}`;
}
