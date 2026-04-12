import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import { Recipe, Source } from "@/db/models";
import { objectId } from "./_helpers";

/** Escapes regex metacharacters so user input is treated as a literal substring. */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const sourcesRouter = router({
  list: publicProcedure.query(async () => {
    const [docs, counts] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Source.find().lean() as Promise<any[]>,
      Recipe.aggregate<{ _id: unknown; count: number }>([
        { $match: { isPublic: true } },
        { $group: { _id: "$sourceId", count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(counts.map((c) => [c._id?.toString(), c.count]));
    return docs.map((s) => ({
      id: s._id.toString(),
      name: s.name as string,
      url: (s.url ?? null) as string | null,
      recipeCount: countMap.get(s._id.toString()) ?? 0,
    }));
  }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const escaped = escapeRegex(input.query.trim());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = (await Source.find({ name: { $regex: escaped, $options: "i" } })
        .sort({ name: 1 })
        .limit(10)
        .lean()) as any[];
      return docs.map((s) => ({
        id: s._id.toString(),
        name: s.name as string,
        url: (s.url ?? null) as string | null,
      }));
    }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (await Source.findById(input.id).lean()) as any;
      if (!source) return null;
      return {
        id: source._id.toString(),
        name: source.name as string,
        url: (source.url ?? null) as string | null,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const source = await new Source({
        name: input.name,
        url: input.url ?? null,
      }).save();
      return {
        id: source._id.toString(),
        name: source.name,
        url: source.url ?? null,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      };
    }),
});
