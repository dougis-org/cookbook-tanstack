import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../init";

/**
 * Builds a Mongoose filter enforcing visibility for user-owned content.
 * Public docs are always visible; private docs only visible to their owner.
 */
export function visibilityFilter(user: { id: string } | null) {
  if (user) {
    return { $or: [{ isPublic: true }, { userId: user.id }] };
  }
  return { isPublic: true };
}

/**
 * Fetch a record and verify the current user owns it.
 * Throws NOT_FOUND or FORBIDDEN as appropriate.
 */
export async function verifyOwnership<T extends { userId: unknown }>(
  fetchRecord: () => Promise<T | null>,
  userId: string,
  label: string,
): Promise<T> {
  const existing = await fetchRecord();
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: `${label} not found` });
  }
  if (existing.userId?.toString() !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Not your ${label.toLowerCase()}`,
    });
  }
  return existing;
}

/**
 * Creates a simple read-only taxonomy router with a single `list` procedure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTaxonomyRouter(Model: any) {
  return router({
    list: publicProcedure.query(async () => {
      return Model.find().lean();
    }),
  });
}
