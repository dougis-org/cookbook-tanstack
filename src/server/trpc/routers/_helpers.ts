import { eq, or } from "drizzle-orm"
import type { Column } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { publicProcedure, router } from "../init"

/**
 * Returns a SQL condition enforcing visibility for user-owned content.
 * Public rows are always visible; private rows only visible to their owner.
 */
export function visibilityFilter(
  isPublicCol: Column,
  userIdCol: Column,
  user: { id: string } | null,
) {
  if (user) {
    return or(eq(isPublicCol, true), eq(userIdCol, user.id))!
  }
  return eq(isPublicCol, true)
}

/**
 * Fetch a record and verify the current user owns it.
 * Throws NOT_FOUND or FORBIDDEN as appropriate.
 */
export async function verifyOwnership<T extends { userId: string }>(
  fetchRecord: () => Promise<T[]>,
  userId: string,
  label: string,
): Promise<T> {
  const [existing] = await fetchRecord()
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: `${label} not found` })
  }
  if (existing.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Not your ${label.toLowerCase()}`,
    })
  }
  return existing
}

/**
 * Sync a many-to-many junction table for a recipe.
 * Skips if `ids` is undefined (field not provided).
 * Deletes existing rows then inserts new ones.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncJunction(
  db: any,
  table: any,
  recipeIdCol: any,
  recipeId: string,
  ids: string[] | undefined,
  foreignKey: string,
) {
  if (ids === undefined) return
  const uniqueIds = [...new Set(ids)]
  await db.delete(table).where(eq(recipeIdCol, recipeId))
  if (uniqueIds.length) {
    await db
      .insert(table)
      .values(uniqueIds.map((id: string) => ({ recipeId, [foreignKey]: id })))
  }
}

/**
 * Creates a simple read-only taxonomy router with a single `list` procedure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTaxonomyRouter(table: any) {
  return router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.select().from(table)
    }),
  })
}
