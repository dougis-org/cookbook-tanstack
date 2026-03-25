import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../init";
import { visibilityFilter, verifyOwnership, objectId } from "./_helpers";
import { Cookbook, Recipe } from "@/db/models";
// Side-effect imports register models needed for Recipe.populate() chains
import "@/db/models/classification";
import "@/db/models/source";
import "@/db/models/meal";
import "@/db/models/course";
import "@/db/models/preparation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pluckIds(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (arr as any[])
    .map((item) => (item?._id ?? item)?.toString())
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pluckItems(arr: unknown): { id: string; name: string }[] {
  if (!Array.isArray(arr)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (arr as any[])
    .map((item) => {
      const id = (item?._id ?? item)?.toString();
      const name = item?.name;
      if (typeof id !== "string" || id.length === 0 || typeof name !== "string") return null;
      return { id, name: name as string };
    })
    .filter((entry): entry is { id: string; name: string } => entry !== null);
}

/** Build a lookup map from recipe docs keyed by stringified _id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function indexByStringId(docs: any[]): Map<string, any> {
  return new Map(docs.map((r) => [r._id.toString(), r]));
}

/** Resolve the recipe doc for a stub, or null if not found. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docFromStub(stub: { recipeId: unknown }, map: Map<string, any>): any | null {
  return map.get(stub.recipeId != null ? String(stub.recipeId) : "") ?? null;
}

/** Shared cookbook shape fields returned by both byId and printById. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cookbookCoreFields(cb: any) {
  return {
    id: cb._id.toString() as string,
    name: cb.name as string,
    description: (cb.description ?? null) as string | null,
    isPublic: cb.isPublic as boolean,
  };
}

/** Safe accessor for the embedded recipes array on a lean cookbook doc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRecipeStubs(cookbook: any): Array<{ recipeId: unknown; orderIndex: number }> {
  return Array.isArray(cookbook.recipes) ? cookbook.recipes : [];
}

async function fetchCookbookWithOrderedStubs(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visFilter: Record<string, any>,
): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookbook: any;
  stubs: Array<{ recipeId: unknown; orderIndex: number }>;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookbook = (await Cookbook.findOne({ _id: id, ...visFilter }).lean()) as any;
  if (!cookbook) return null;
  const stubs: Array<{ recipeId: unknown; orderIndex: number }> = Array.isArray(cookbook.recipes)
    ? [...cookbook.recipes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : [];
  return { cookbook, stubs };
}

export const cookbooksRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const docs = await Cookbook.find(visibilityFilter(ctx.user))
      .sort({ name: 1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs.map((cb: any) => ({
      id: cb._id.toString() as string,
      name: cb.name as string,
      description: (cb.description ?? null) as string | null,
      isPublic: cb.isPublic as boolean,
      imageUrl: (cb.imageUrl ?? null) as string | null,
      recipeCount: Array.isArray(cb.recipes) ? cb.recipes.length : 0,
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ ctx, input }) => {
      const visFilter = visibilityFilter(ctx.user);
      const row = await fetchCookbookWithOrderedStubs(input.id, visFilter);
      if (!row) return null;

      const { cookbook, stubs } = row;
      const recipeVisFilter = visibilityFilter(ctx.user);

      // Fetch the actual Recipe docs for the ordered stubs
      const recipeIds = stubs.map((s) => s.recipeId);

      const recipeDocs = await Recipe.find({
        _id: { $in: recipeIds },
        ...recipeVisFilter,
      })
        .populate("classificationId", "name")
        .lean();

      // Re-map to preserve orderIndex from the stub
      const recipeById = indexByStringId(recipeDocs);
      const recipes = stubs
        .map((stub) => {
          const d = docFromStub(stub, recipeById);
          if (!d) return null;
          return {
            id: d._id.toString() as string,
            name: d.name as string,
            imageUrl: (d.imageUrl ?? null) as string | null,
            prepTime: (d.prepTime ?? null) as number | null,
            cookTime: (d.cookTime ?? null) as number | null,
            servings: (d.servings ?? null) as number | null,
            classificationName:
              (d.classificationId as { name?: string } | null)?.name ??
              (null as string | null),
            orderIndex: stub.orderIndex,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cb = cookbook as any;
      return {
        ...cookbookCoreFields(cb),
        imageUrl: (cb.imageUrl ?? null) as string | null,
        userId: cb.userId?.toString() as string,
        createdAt: cb.createdAt as Date,
        updatedAt: cb.updatedAt as Date,
        recipes,
      };
    }),

  printById: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ ctx, input }) => {
      const visFilter = visibilityFilter(ctx.user);
      const row = await fetchCookbookWithOrderedStubs(input.id, visFilter);
      if (!row) return null;

      const { cookbook, stubs } = row;
      const recipeIds = stubs.map((s) => s.recipeId);

      const recipeDocs = await Recipe.find({
        _id: { $in: recipeIds },
        ...visFilter,
      })
        .populate("classificationId", "name")
        .populate("sourceId", "name url")
        .populate("mealIds", "name")
        .populate("courseIds", "name")
        .populate("preparationIds", "name")
        .lean();

      const recipeById = indexByStringId(recipeDocs);

      const recipes = stubs
        .map((stub) => {
          const d = docFromStub(stub, recipeById);
          if (!d) return null;
          const cls = d.classificationId as { _id?: unknown; name?: string } | null;
          const src = d.sourceId as { _id?: unknown; name?: string; url?: string } | null;
          return {
            id: d._id.toString() as string,
            name: d.name as string,
            userId: d.userId?.toString() as string,
            ingredients: (d.ingredients ?? null) as string | null,
            instructions: (d.instructions ?? null) as string | null,
            notes: (d.notes ?? null) as string | null,
            prepTime: (d.prepTime ?? null) as number | null,
            cookTime: (d.cookTime ?? null) as number | null,
            servings: (d.servings ?? null) as number | null,
            difficulty: (d.difficulty ?? null) as 'easy' | 'medium' | 'hard' | null,
            sourceId: src?._id != null ? String(src._id) : (null as string | null),
            classificationId: cls?._id != null ? String(cls._id) : (null as string | null),
            classificationName: (cls?.name ?? null) as string | null,
            sourceName: (src?.name ?? null) as string | null,
            sourceUrl: (src?.url ?? null) as string | null,
            dateAdded: (d.dateAdded ?? null) as Date | null,
            calories: (d.calories ?? null) as number | null,
            fat: (d.fat ?? null) as number | null,
            cholesterol: (d.cholesterol ?? null) as number | null,
            sodium: (d.sodium ?? null) as number | null,
            protein: (d.protein ?? null) as number | null,
            imageUrl: null as null,
            isPublic: d.isPublic as boolean,
            marked: (d.marked ?? false) as boolean,
            mealIds: pluckIds(d.mealIds),
            courseIds: pluckIds(d.courseIds),
            preparationIds: pluckIds(d.preparationIds),
            meals: pluckItems(d.mealIds),
            courses: pluckItems(d.courseIds),
            preparations: pluckItems(d.preparationIds),
            createdAt: d.createdAt as Date,
            updatedAt: d.updatedAt as Date,
            orderIndex: stub.orderIndex,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cb = cookbook as any;
      return { ...cookbookCoreFields(cb), recipes };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        isPublic: z.boolean().default(true),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cookbook = await new Cookbook({
        userId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        isPublic: input.isPublic,
        imageUrl: input.imageUrl ?? null,
        recipes: [],
      }).save();
      return {
        ...cookbook.toObject({ virtuals: true }),
        userId: cookbook.userId?.toString(),
      };
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          id: objectId,
          name: z.string().min(1).max(255).optional(),
          description: z.string().max(500).optional(),
          isPublic: z.boolean().optional(),
          imageUrl: z.string().url().optional(),
        })
        .refine(
          (data) => {
            const { id: _, ...rest } = data;
            return Object.keys(rest).length > 0;
          },
          { message: "At least one field to update must be provided" },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        async () =>
          (await Cookbook.findById(input.id).lean()) as {
            userId: unknown;
          } | null,
        ctx.user.id,
        "Cookbook",
      );

      const { id, ...data } = input;
      const updated = await Cookbook.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true },
      ).lean();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: objectId }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        async () =>
          (await Cookbook.findById(input.id).lean()) as {
            userId: unknown;
          } | null,
        ctx.user.id,
        "Cookbook",
      );
      await Cookbook.findByIdAndDelete(input.id);
      return { success: true };
    }),

  addRecipe: protectedProcedure
    .input(z.object({ cookbookId: objectId, recipeId: objectId }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cookbook = await verifyOwnership(
        async () => (await Cookbook.findById(input.cookbookId).lean()) as any,
        ctx.user.id,
        "Cookbook",
      );

      const recipeVisFilter = visibilityFilter(ctx.user);
      const accessible = await Recipe.findOne({
        _id: input.recipeId,
        ...recipeVisFilter,
      })
        .select("_id")
        .lean();
      if (!accessible) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
      }

      // Check for duplicate, then push with next orderIndex
      const recipes = getRecipeStubs(cookbook);
      const alreadyIn = recipes.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.recipeId?.toString() === input.recipeId,
      );
      if (!alreadyIn) {
        await Cookbook.findByIdAndUpdate(input.cookbookId, {
          $push: {
            recipes: { recipeId: input.recipeId, orderIndex: recipes.length },
          },
        });
      }

      return { success: true };
    }),

  removeRecipe: protectedProcedure
    .input(z.object({ cookbookId: objectId, recipeId: objectId }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        async () =>
          (await Cookbook.findById(input.cookbookId).lean()) as {
            userId: unknown;
          } | null,
        ctx.user.id,
        "Cookbook",
      );
      await Cookbook.findByIdAndUpdate(input.cookbookId, {
        $pull: { recipes: { recipeId: input.recipeId } },
      });
      return { success: true };
    }),

  reorderRecipes: protectedProcedure
    .input(
      z.object({
        cookbookId: objectId,
        recipeIds: z
          .array(objectId)
          .min(1)
          .refine((ids) => new Set(ids).size === ids.length, {
            message: "Duplicate recipe IDs in reorder list",
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cookbook = await verifyOwnership(
        async () => (await Cookbook.findById(input.cookbookId).lean()) as any,
        ctx.user.id,
        "Cookbook",
      );

      const recipes = getRecipeStubs(cookbook);

      // Rebuild the recipes array with updated orderIndex values
      const updatedRecipes = recipes.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stub: any) => {
          const newIndex = input.recipeIds.indexOf(
            stub.recipeId?.toString() ?? "",
          );
          return {
            recipeId: stub.recipeId,
            orderIndex: newIndex >= 0 ? newIndex : stub.orderIndex,
          };
        },
      );

      await Cookbook.findByIdAndUpdate(input.cookbookId, {
        $set: { recipes: updatedRecipes },
      });

      return { success: true };
    }),
});
