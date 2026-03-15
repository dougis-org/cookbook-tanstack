import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import { Source } from "@/db/models";
import { objectId } from "./_helpers";

/** Escapes regex metacharacters so user input is treated as a literal substring. */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const sourcesRouter = router({
  list: publicProcedure.query(async () => {
    return Source.find().lean();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const escaped = escapeRegex(input.query.trim());
      return Source.find({ name: { $regex: escaped, $options: "i" } })
        .sort({ name: 1 })
        .limit(10)
        .lean();
    }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (await Source.findById(input.id).lean()) as any;
      if (!source) return null;
      return {
        id: source._id.toString() as string,
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
      return source.toObject();
    }),
});
