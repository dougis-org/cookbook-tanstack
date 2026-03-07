import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import { Source } from "@/db/models";

export const sourcesRouter = router({
  list: publicProcedure.query(async () => {
    return Source.find().lean();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const trimmed = input.query.trim();
      return Source.find({ name: { $regex: trimmed, $options: "i" } })
        .sort({ name: 1 })
        .limit(10)
        .lean();
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const source = await Source.findById(input.id).lean();
      return source ?? null;
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
      return source.toObject();
    }),
});
