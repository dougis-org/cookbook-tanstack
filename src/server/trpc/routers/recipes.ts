import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../init";
import { visibilityFilter, verifyOwnership, objectId } from "./_helpers";
import { Recipe, RecipeLike } from "@/db/models";

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
  imageUrl: z.string().url().optional(),
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
          classificationId: objectId.optional(),
          sourceId: objectId.optional(),
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
        filter.isPublic = input.isPublic;
      } else {
        Object.assign(filter, visibilityFilter(ctx.user));
      }

      if (input?.classificationId)
        filter.classificationId = input.classificationId;
      if (input?.sourceId) filter.sourceId = input.sourceId;
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

      if (input?.markedByMe && ctx.user) {
        const likedDocs = await RecipeLike.find({ userId: ctx.user.id })
          .select("recipeId")
          .lean();
        const likedIds = likedDocs.map((l) => l.recipeId);
        filter._id = { $in: likedIds };
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

      const page = input?.page ?? 1;
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

      const items = rawItems.map((r) => ({
        ...r,
        id: r._id.toString(),
        classificationName:
          (r.classificationId as { name?: string } | null)?.name ?? null,
      }));

      return { items, total, page, pageSize };
    }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ ctx, input }) => {
      const visFilter = visibilityFilter(ctx.user);
      const recipe = await Recipe.findOne({ _id: input.id, ...visFilter })
        .populate("classificationId", "name slug")
        .populate("sourceId", "name url")
        .populate("mealIds", "name")
        .populate("courseIds", "name")
        .populate("preparationIds", "name")
        .lean();

      if (!recipe) return null;

      type PopRef = { _id?: unknown; name?: string; url?: string } | null;
      const cls = recipe.classificationId as PopRef;
      const src = recipe.sourceId as PopRef;
      type PopItem = { _id?: unknown; name?: string };

      return {
        ...recipe,
        id: recipe._id.toString(),
        classificationName: cls?.name ?? null,
        sourceName: src?.name ?? null,
        sourceUrl: src?.url ?? null,
        meals: ((recipe.mealIds as PopItem[]) ?? []).map((m) => ({
          id: m._id?.toString(),
          name: m.name,
        })),
        courses: ((recipe.courseIds as PopItem[]) ?? []).map((c) => ({
          id: c._id?.toString(),
          name: c.name,
        })),
        preparations: ((recipe.preparationIds as PopItem[]) ?? []).map((p) => ({
          id: p._id?.toString(),
          name: p.name,
        })),
      };
    }),

  create: protectedProcedure
    .input(recipeFields.merge(taxonomyIds))
    .mutation(async ({ ctx, input }) => {
      const { mealIds, courseIds, preparationIds, ...fields } = input;
      const recipe = await new Recipe({
        ...fields,
        userId: ctx.user.id,
        mealIds: mealIds ?? [],
        courseIds: courseIds ?? [],
        preparationIds: preparationIds ?? [],
      }).save();
      return {
        ...recipe.toObject({ virtuals: true }),
        userId: recipe.userId?.toString(),
      };
    }),

  update: protectedProcedure
    .input(
      z
        .object({ id: objectId })
        .merge(recipeFields.partial())
        .merge(taxonomyIds),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        () => Recipe.findById(input.id).lean(),
        ctx.user.id,
        "Recipe",
      );

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
        { new: true },
      ).lean();

      return doc ? { ...doc, id: doc._id.toString() } : null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: objectId }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        () => Recipe.findById(input.id).lean(),
        ctx.user.id,
        "Recipe",
      );
      await Recipe.findByIdAndDelete(input.id);
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
});
