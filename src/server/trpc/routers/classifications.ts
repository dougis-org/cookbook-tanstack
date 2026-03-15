import { z } from "zod";
import { publicProcedure, router } from "../init";
import { Classification, Recipe } from "@/db/models";
import { objectId } from "./_helpers";

export const classificationsRouter = router({
  list: publicProcedure.query(async () => {
    // Single aggregation replaces N+1 countDocuments calls
    const [classificationDocs, counts] = await Promise.all([
      Classification.find().lean(),
      Recipe.aggregate<{ _id: unknown; count: number }>([
        { $group: { _id: "$classificationId", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(counts.map((c) => [c._id?.toString(), c.count]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return classificationDocs.map((c: any) => ({
      id: c._id.toString() as string,
      name: c.name as string,
      description: (c.description ?? null) as string | null,
      slug: c.slug as string,
      recipeCount: countMap.get(c._id.toString()) ?? 0,
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ input }) => {
      const classification = await Classification.findById(input.id).lean();
      if (!classification) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = classification as any;
      return {
        id: c._id.toString() as string,
        name: c.name as string,
        description: (c.description ?? null) as string | null,
        slug: c.slug as string,
      };
    }),
});
