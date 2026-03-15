import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../init";
import { visibilityFilter, verifyOwnership, objectId } from "./_helpers";
import { Cookbook, Recipe } from "@/db/models";
// Side-effect import registers Classification model for Recipe.populate()
import "@/db/models/classification";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cookbook = (await Cookbook.findOne({
        _id: input.id,
        ...visFilter,
      }).lean()) as any;

      if (!cookbook) return null;

      const recipeVisFilter = visibilityFilter(ctx.user);

      // Sort embedded recipe stubs by orderIndex, then fetch the actual Recipe docs
      const stubs: Array<{ recipeId: unknown; orderIndex: number }> =
        Array.isArray(cookbook.recipes)
          ? [...cookbook.recipes].sort((a, b) => a.orderIndex - b.orderIndex)
          : [];

      const recipeIds = stubs.map((s) => s.recipeId);

      const recipeDocs = await Recipe.find({
        _id: { $in: recipeIds },
        ...recipeVisFilter,
      })
        .populate("classificationId", "name")
        .lean();

      // Re-map to preserve orderIndex from the stub
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipeById = new Map(
        recipeDocs.map((r: any) => [r._id.toString(), r]),
      );
      const recipes = stubs
        .map((stub) => {
          const doc = recipeById.get(
            stub.recipeId != null ? String(stub.recipeId) : "",
          );
          if (!doc) return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = doc as any;
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
        id: cb._id.toString() as string,
        name: cb.name as string,
        description: (cb.description ?? null) as string | null,
        isPublic: cb.isPublic as boolean,
        imageUrl: (cb.imageUrl ?? null) as string | null,
        userId: cb.userId?.toString() as string,
        createdAt: cb.createdAt as Date,
        updatedAt: cb.updatedAt as Date,
        recipes,
      };
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
      const recipes = Array.isArray(cookbook.recipes) ? cookbook.recipes : [];
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

      const recipes = Array.isArray(cookbook.recipes) ? cookbook.recipes : [];

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
