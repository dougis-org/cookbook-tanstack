import { z } from "zod";
import { publicProcedure, router } from "../init";
import { Classification, Recipe } from "@/db/models";

export const classificationsRouter = router({
  list: publicProcedure.query(async () => {
    const classificationDocs = await Classification.find().lean();

    const withCounts = await Promise.all(
      classificationDocs.map(async (c) => {
        const recipeCount = await Recipe.countDocuments({
          classificationId: c._id,
        });
        return { ...c, recipeCount };
      }),
    );

    return withCounts;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const classification = await Classification.findById(input.id).lean();
      return classification ?? null;
    }),
});
