import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../init";
import { objectId } from "./_helpers";
import { recipesRouter } from "./recipes";
import { cookbooksRouter } from "./cookbooks";
import { validateAlexaAccessToken } from "@/server/alexa/token-validation";
import type { Context } from "../context";

// A router scoped to just the read paths the adapter delegates to (not
// appRouter itself, to avoid a circular import between this file and
// ../router.ts, which composes alexaRouter alongside recipes/cookbooks).
const readRouter = router({ recipes: recipesRouter, cookbooks: cookbooksRouter });

/**
 * Read-only adapter surface for the Alexa skill (design.md Decision 2). Wraps
 * the existing `recipes`/`cookbooks` read procedures rather than duplicating
 * query logic — no mutation procedures are exposed here. Tier/entitlement
 * enforcement is inherited for free from `visibilityFilter`'s `hiddenByTier`
 * exclusion, the same mechanism the web app's read paths already rely on.
 */

function anonContext(): Context {
  return { session: null, user: null, collabCookbookIds: [] };
}

async function authedContext(token: string | undefined | null): Promise<Context> {
  const result = await validateAlexaAccessToken(token);
  if (!result) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing or invalid Alexa access token" });
  }
  return {
    session: { id: "alexa-oauth" } as unknown as Context["session"],
    user: { id: result.userId } as unknown as Context["user"],
    collabCookbookIds: [],
  };
}

/** Splits free-text ingredients/instructions into a flat list of non-empty lines. */
function splitNonEmptyLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export const alexaRouter = router({
  searchRecipes: publicProcedure
    .input(
      z
        .object({
          query: z.string().optional(),
          mealIds: z.array(objectId).optional(),
          courseIds: z.array(objectId).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const caller = readRouter.createCaller(anonContext());
      const result = await caller.recipes.list({
        isPublic: true,
        search: input?.query,
        mealIds: input?.mealIds,
        courseIds: input?.courseIds,
        pageSize: 10,
      });
      return {
        items: result.items.map((r) => ({
          id: r.id,
          name: r.name,
          imageUrl: (r.imageUrl ?? null) as string | null,
        })),
      };
    }),

  recipeDetail: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ input }) => {
      const caller = readRouter.createCaller(anonContext());
      const recipe = await caller.recipes.byId({ id: input.id });
      if (!recipe) return null;
      return {
        id: recipe.id,
        name: recipe.name,
        servings: recipe.servings,
        imageUrl: recipe.imageUrl ?? null,
        ingredients: splitNonEmptyLines(recipe.ingredients),
        steps: splitNonEmptyLines(recipe.instructions),
      };
    }),

  myRecipes: publicProcedure
    .input(z.object({ token: z.string(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const ctx = await authedContext(input.token);
      const caller = readRouter.createCaller(ctx);
      const result = await caller.recipes.list({
        userId: ctx.user!.id,
        search: input.search,
        pageSize: 20,
      });
      return { items: result.items.map((r) => ({ id: r.id, name: r.name })) };
    }),

  myCookbooks: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const ctx = await authedContext(input.token);
      const caller = readRouter.createCaller(ctx);
      const cookbooks = await caller.cookbooks.list();
      return {
        items: cookbooks
          .filter((cb) => cb.userId === ctx.user!.id)
          .map((cb) => ({ id: cb.id, name: cb.name })),
      };
    }),

  cookbookDetail: publicProcedure
    .input(z.object({ token: z.string(), id: objectId }))
    .query(async ({ input }) => {
      const ctx = await authedContext(input.token);
      const caller = readRouter.createCaller(ctx);
      const cookbook = await caller.cookbooks.byId({ id: input.id });
      if (!cookbook) return null;
      return {
        id: cookbook.id,
        name: cookbook.name,
        chapters: cookbook.chapters,
        recipes: cookbook.recipes.map((r) => ({ id: r.id, name: r.name })),
      };
    }),
});

/**
 * Convenience caller for in-process callers (e.g. the skill route) that don't
 * have a real request context. None of alexaRouter's procedures read `ctx` —
 * each builds its own internal anon/authed context — so this dummy context is
 * never actually consulted.
 */
export const alexaAdapter = alexaRouter.createCaller(anonContext());
