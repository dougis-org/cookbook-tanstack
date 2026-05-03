import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, verifiedProcedure, router } from "../init";
import { visibilityFilter, verifyOwnership, objectId, enforceContentLimit } from "./_helpers";
import { Recipe, RecipeLike, Cookbook } from "@/db/models";
import mongoose from "mongoose";
// Side-effect imports register Mongoose models referenced in Recipe.populate()
import "@/db/models/source";
import "@/db/models/classification";
import "@/db/models/meal";
import "@/db/models/course";
import "@/db/models/preparation";
import { importedRecipeSchema } from "@/lib/validation";
import { canCreatePrivate, canImport } from "@/lib/tier-entitlements";

/** Escapes regex metacharacters so user input is treated as a literal substring. */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const recipeFields = z.object({
  name: z.string().min(1).max(500),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  sourceId: objectId.optional(),
  classificationId: objectId.optional(),
  calories: z.number().int().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  cholesterol: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isPublic: z.boolean().default(true),
});

const taxonomyIds = z.object({
  mealIds: z.array(objectId).optional(),
  courseIds: z.array(objectId).optional(),
  preparationIds: z.array(objectId).optional(),
});

export const recipesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          classificationIds: z.array(objectId).optional(),
          sourceIds: z.array(objectId).optional(),
          userId: objectId.optional(),
          isPublic: z.boolean().optional(),
          search: z.string().optional(),
          mealIds: z.array(objectId).optional(),
          courseIds: z.array(objectId).optional(),
          preparationIds: z.array(objectId).optional(),
          sort: z
            .enum([
              "name_asc",
              "name_desc",
              "newest",
              "oldest",
              "servings_asc",
              "servings_desc",
              "updated_desc",
            ])
            .optional(),
          cursor: z.number().int().positive().optional(),
          page: z.number().int().positive().optional(),
          pageSize: z.number().int().positive().max(100).optional(),
          markedByMe: z.boolean().optional(),
          hasImage: z.boolean().optional(),
          minServings: z.number().int().positive().optional(),
          maxServings: z.number().int().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};

      if (input?.isPublic !== undefined) {
        filter.isPublic = input.isPublic
        filter.hiddenByTier = { $ne: true }
      } else {
        Object.assign(filter, visibilityFilter(ctx.user));
      }

      if (input?.classificationIds?.length)
        filter.classificationId = { $in: input.classificationIds };
      if (input?.sourceIds?.length)
        filter.sourceId = { $in: input.sourceIds };
      if (input?.userId) filter.userId = input.userId;

      if (input?.search) {
        const term = escapeRegex(input.search.trim());
        if (term) {
          filter.$or = [
            { name: { $regex: term, $options: "i" } },
            { ingredients: { $regex: term, $options: "i" } },
          ];
        }
      }

      if (input?.hasImage) filter.imageUrl = { $exists: true, $ne: null };
      if (input?.minServings !== undefined)
        filter.servings = { ...filter.servings, $gte: input.minServings };
      if (input?.maxServings !== undefined)
        filter.servings = { ...filter.servings, $lte: input.maxServings };

      if (input?.mealIds?.length) filter.mealIds = { $in: input.mealIds };
      if (input?.courseIds?.length) filter.courseIds = { $in: input.courseIds };
      if (input?.preparationIds?.length)
        filter.preparationIds = { $in: input.preparationIds };

      let likedIds: Set<string> | null = null;
      if (ctx.user) {
        const likedDocs = await RecipeLike.find({ userId: ctx.user.id })
          .select("recipeId -_id")
          .lean();
        likedIds = new Set(likedDocs.map((l) => l.recipeId.toString()));
        if (input?.markedByMe) {
          if (likedIds.size === 0) {
            const page = input?.cursor ?? input?.page ?? 1;
            const pageSize = input?.pageSize ?? 20;
            return { items: [], total: 0, page, pageSize, nextCursor: undefined };
          }
          filter._id = { $in: [...likedIds] };
        }
      }

      const sortMap = {
        name_asc: { name: 1 },
        name_desc: { name: -1 },
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        servings_asc: { servings: 1 },
        servings_desc: { servings: -1 },
        updated_desc: { updatedAt: -1 },
      } as const;
      const sort = sortMap[input?.sort ?? "newest"];

      const page = input?.cursor ?? input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const [rawItems, total] = await Promise.all([
        Recipe.find(filter)
          .populate("classificationId", "name")
          .sort(sort)
          .skip(offset)
          .limit(pageSize)
          .lean(),
        Recipe.countDocuments(filter),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (rawItems as any[]).map((r) => ({
        ...r,
        id: r._id.toString() as string,
        userId: r.userId?.toString() as string,
        classificationId: ((r.classificationId?._id ?? r.classificationId)?.toString() ?? null) as string | null,
        classificationName:
          (r.classificationId as { name?: string } | null)?.name ?? null,
        hiddenByTier: (r.hiddenByTier ?? false) as boolean,
        marked: likedIds ? likedIds.has(r._id.toString()) : false,
      }));

      const nextCursor = page * pageSize < total ? page + 1 : undefined;
      return { items, total, page, pageSize, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ ctx, input }) => {
      const visFilter = visibilityFilter(ctx.user);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = (await Recipe.findOne({ _id: input.id, ...visFilter })
        .populate("classificationId", "name slug")
        .populate("sourceId", "name url")
        .populate("mealIds", "name")
        .populate("courseIds", "name")
        .populate("preparationIds", "name")
        .lean()) as any;

      if (!r) return null;

      // Same point-lookup as isMarked; kept separate — no abstraction needed yet.
      const marked = ctx.user
        ? !!(await RecipeLike.exists({ userId: ctx.user.id, recipeId: input.id }))
        : false;

      type PopItem = { _id: unknown; name: string };

      return {
        id: r._id.toString() as string,
        userId: r.userId.toString() as string,
        name: r.name as string,
        ingredients: (r.ingredients ?? null) as string | null,
        instructions: (r.instructions ?? null) as string | null,
        notes: (r.notes ?? null) as string | null,
        servings: (r.servings ?? null) as number | null,
        prepTime: (r.prepTime ?? null) as number | null,
        cookTime: (r.cookTime ?? null) as number | null,
        difficulty: (r.difficulty ?? null) as "easy" | "medium" | "hard" | null,
        sourceId: ((r.sourceId?._id ?? r.sourceId)?.toString() ?? null) as
          | string
          | null,
        classificationId: ((
          r.classificationId?._id ?? r.classificationId
        )?.toString() ?? null) as string | null,
        dateAdded: (r.dateAdded ?? null) as Date | null,
        calories: (r.calories ?? null) as number | null,
        fat: (r.fat ?? null) as number | null,
        cholesterol: (r.cholesterol ?? null) as number | null,
        sodium: (r.sodium ?? null) as number | null,
        protein: (r.protein ?? null) as number | null,
        imageUrl: (r.imageUrl ?? null) as string | null,
        isPublic: r.isPublic as boolean,
        hiddenByTier: (r.hiddenByTier ?? false) as boolean,
        marked,
        createdAt: r.createdAt as Date,
        updatedAt: r.updatedAt as Date,
        classificationName: (r.classificationId?.name ?? null) as string | null,
        sourceName: (r.sourceId?.name ?? null) as string | null,
        sourceUrl: (r.sourceId?.url ?? null) as string | null,
        mealIds: ((r.mealIds as PopItem[]) ?? []).map((m) => String(m._id)),
        courseIds: ((r.courseIds as PopItem[]) ?? []).map((c) => String(c._id)),
        preparationIds: ((r.preparationIds as PopItem[]) ?? []).map((p) => String(p._id)),
        meals: ((r.mealIds as PopItem[]) ?? []).map((m) => ({
          id: String(m._id),
          name: m.name,
        })),
        courses: ((r.courseIds as PopItem[]) ?? []).map((c) => ({
          id: String(c._id),
          name: c.name,
        })),
        preparations: ((r.preparationIds as PopItem[]) ?? []).map((p) => ({
          id: String(p._id),
          name: p.name,
        })),
      };
    }),

  create: verifiedProcedure
    .input(recipeFields.merge(taxonomyIds))
    .mutation(async ({ ctx, input }) => {
      await enforceContentLimit(ctx.user.id, ctx.user.tier ?? undefined, ctx.user.isAdmin ?? false, "recipes");
      const { mealIds, courseIds, preparationIds, ...fields } = input;

      let isPublic = fields.isPublic;
      if (!ctx.user.isAdmin && !canCreatePrivate(ctx.user.tier)) {
        isPublic = true;
      }

      const recipe = await new Recipe({
        ...fields,
        isPublic,
        userId: ctx.user.id,
        mealIds: mealIds ?? [],
        courseIds: courseIds ?? [],
        preparationIds: preparationIds ?? [],
      }).save();
      return {
        ...recipe.toObject(),
        id: recipe._id.toString(),
        userId: recipe.userId?.toString(),
      };
    }),

  update: verifiedProcedure
    .input(
      z
        .object({ id: objectId })
        .merge(recipeFields.partial())
        .merge(taxonomyIds),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        async () =>
          (await Recipe.findById(input.id).lean()) as {
            userId: unknown;
          } | null,
        ctx.user.id,
        "Recipe",
      );

      if (
        input.isPublic === false &&
        !ctx.user.isAdmin &&
        !canCreatePrivate(ctx.user.tier)
      ) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "Your current tier does not support private recipes.",
          cause: { type: 'tier-wall', reason: 'private-content' },
        });
      }

      const { id, mealIds, courseIds, preparationIds, ...data } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { ...data };
      if (mealIds !== undefined) updateData.mealIds = mealIds;
      if (courseIds !== undefined) updateData.courseIds = courseIds;
      if (preparationIds !== undefined)
        updateData.preparationIds = preparationIds;

      const doc = await Recipe.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: "after" },
      ).select('-marked').lean();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = doc as any;
      return d ? { ...d, id: d._id.toString() as string } : null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: objectId }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        async () =>
          (await Recipe.findById(input.id).lean()) as {
            userId: unknown;
          } | null,
        ctx.user.id,
        "Recipe",
      );

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // Use updateOne (not findByIdAndUpdate) to bypass the pre-find middleware
          await Recipe.updateOne({ _id: input.id }, { $set: { deleted: true } }, { session });
          await Cookbook.updateMany(
            { "recipes.recipeId": input.id },
            { $pull: { recipes: { recipeId: input.id } } },
            { session },
          );
          await RecipeLike.deleteMany({ recipeId: input.id }, { session });
        });
      } catch (error) {
        console.error("Recipe delete transaction failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete recipe. Please try again.",
        });
      } finally {
        await session.endSession();
      }

      return { success: true };
    }),

  isMarked: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return { marked: false };

      const exists = await RecipeLike.exists({
        userId: ctx.user.id,
        recipeId: input.id,
      });
      return { marked: !!exists };
    }),

  toggleMarked: protectedProcedure
    .input(z.object({ id: objectId }))
    .mutation(async ({ ctx, input }) => {
      const existing = await RecipeLike.findOne({
        userId: ctx.user.id,
        recipeId: input.id,
      });

      if (existing) {
        await RecipeLike.findByIdAndDelete(existing._id);
        return { marked: false };
      }

      await new RecipeLike({ userId: ctx.user.id, recipeId: input.id }).save();
      return { marked: true };
    }),

  import: verifiedProcedure
    .input(importedRecipeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.isAdmin && !canImport(ctx.user.tier)) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "Recipe import requires Executive Chef.",
          cause: { type: 'tier-wall', reason: 'import' },
        });
      }

      const parsedDate = input.dateAdded
        ? new Date(input.dateAdded)
        : new Date();
      if (Number.isNaN(parsedDate.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid dateAdded value",
        });
      }

      await enforceContentLimit(ctx.user.id, ctx.user.tier ?? undefined, ctx.user.isAdmin ?? false, "recipes");

      let isPublic = input.isPublic ?? true;
      if (!ctx.user.isAdmin && !canCreatePrivate(ctx.user.tier)) {
        isPublic = true;
      }

      const recipe = await new Recipe({
        name: input.name,
        userId: ctx.user.id,
        ingredients: input.ingredients ?? undefined,
        instructions: input.instructions ?? undefined,
        notes: input.notes ?? undefined,
        servings: input.servings ?? undefined,
        prepTime: input.prepTime ?? undefined,
        cookTime: input.cookTime ?? undefined,
        difficulty: input.difficulty ?? undefined,
        sourceId: input.sourceId ?? undefined,
        classificationId: input.classificationId ?? undefined,
        dateAdded: parsedDate,
        calories: input.calories ?? undefined,
        fat: input.fat ?? undefined,
        cholesterol: input.cholesterol ?? undefined,
        sodium: input.sodium ?? undefined,
        protein: input.protein ?? undefined,
        imageUrl: input.imageUrl ?? undefined,
        isPublic,
        mealIds: input.mealIds ?? [],
        courseIds: input.courseIds ?? [],
        preparationIds: input.preparationIds ?? [],
      }).save();

      return {
        id: recipe.id,
        name: recipe.name,
      };
    }),
});
