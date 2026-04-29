import { z } from "zod";
import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { publicProcedure, router } from "../init";
import { Recipe, Cookbook } from "@/db/models";
import { getRecipeLimit, getCookbookLimit, TIER_LIMITS } from "@/lib/tier-entitlements";
import type { EntitlementTier } from "@/lib/tier-entitlements";

/** Validates a MongoDB ObjectId: a 24-character hexadecimal string. */
export const objectId = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid ID format");

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
  fetchRecord: () => PromiseLike<T | null>,
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

/** Shared predicate for counting non-hidden user-owned documents. */
function userContentFilter(userId: string) {
  return { userId, hiddenByTier: { $ne: true } }
}

/**
 * Returns the number of non-hidden recipes and cookbooks owned by a user.
 * Used by both `enforceContentLimit` and `usage.getOwned` to ensure count parity.
 */
export async function countUserContent(userId: string): Promise<{ recipeCount: number; cookbookCount: number }> {
  const [recipeCount, cookbookCount] = await Promise.all([
    Recipe.countDocuments(userContentFilter(userId)),
    Cookbook.countDocuments(userContentFilter(userId)),
  ])
  return { recipeCount, cookbookCount }
}

/**
 * Enforces tier-based content creation limits.
 * Admins bypass all limits. Missing tier defaults to 'home-cook'.
 *
 * Note: Recipe countDocuments has soft-delete middleware that auto-injects
 * { deleted: { $ne: true } } — deleted docs are already excluded.
 * hiddenByTier docs are explicitly excluded here so they don't block creates.
 */
export async function enforceContentLimit(
  userId: string,
  tier: string | undefined,
  isAdmin: boolean,
  resource: "recipes" | "cookbooks",
): Promise<void> {
  if (isAdmin) return;

  // Default missing or unrecognised tier to 'home-cook' (most restrictive authenticated tier).
  const effectiveTier = (tier != null && Object.prototype.hasOwnProperty.call(TIER_LIMITS, tier)
    ? tier
    : "home-cook") as EntitlementTier;
  const limit =
    resource === "recipes"
      ? getRecipeLimit(effectiveTier)
      : getCookbookLimit(effectiveTier);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Model = (resource === "recipes" ? Recipe : Cookbook) as unknown as mongoose.Model<any>;
  const count = await Model.countDocuments(userContentFilter(userId));

  if (count >= limit) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
      message: `${resource === "recipes" ? "Recipe" : "Cookbook"} limit reached for your plan`,
      cause: { type: 'tier-wall', reason: 'count-limit' },
    });
  }
}

/**
 * Creates a simple read-only taxonomy router with a single `list` procedure.
 * @param Model - The Mongoose model for the taxonomy (Meal, Course, Preparation)
 * @param arrayField - The Recipe field that references this taxonomy (e.g. "mealIds")
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTaxonomyRouter(Model: any, arrayField: 'mealIds' | 'courseIds' | 'preparationIds') {
  return router({
    list: publicProcedure.query(
      async (): Promise<{ id: string; name: string; slug: string; recipeCount: number }[]> => {
        const [docs, counts] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Model.find().lean() as Promise<any[]>,
          Recipe.aggregate<{ _id: unknown; count: number }>([
            { $match: { isPublic: true } },
            { $unwind: `$${arrayField}` },
            { $group: { _id: `$${arrayField}`, count: { $sum: 1 } } },
          ]),
        ]);
        const countMap = new Map(counts.map((c) => [c._id?.toString(), c.count]));
        return docs.map((doc) => ({
          id: doc._id.toString(),
          name: doc.name as string,
          slug: doc.slug as string,
          recipeCount: countMap.get(doc._id.toString()) ?? 0,
        }));
      },
    ),
  });
}
