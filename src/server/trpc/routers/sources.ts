import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../init";
import { Recipe, Source } from "@/db/models";
import { objectId, escapeRegex } from "./_helpers";
import { slugify } from "@/lib/slugify";

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSourceSummary = (doc: any) => ({
  id: doc._id.toString(),
  name: doc.name as string,
  url: (doc.url ?? null) as string | null,
  slug: (doc.slug ?? null) as string | null,
});

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
      ...toSourceSummary(s),
      recipeCount: countMap.get(s._id.toString()) ?? 0,
    }));
  }),

  listPage: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(100).default(100),
      }),
    )
    .query(async ({ input }) => {
      // Fetch one extra document to detect whether a next page exists without
      // an extra round trip or a stale nextCursor when the count is an exact
      // multiple of the page size.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = (await Source.find()
        .sort({ name: 1 })
        .skip(input.cursor)
        .limit(input.limit + 1)
        .lean()) as any[];
      const hasNextPage = docs.length > input.limit;
      const items = hasNextPage ? docs.slice(0, input.limit) : docs;
      return {
        items: items.map(toSourceSummary),
        nextCursor: hasNextPage ? input.cursor + items.length : null,
      };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(255),
        limit: z.number().int().min(1).max(100).default(100),
      }),
    )
    .query(async ({ input }) => {
      const escaped = escapeRegex(input.query);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = (await Source.find({ name: { $regex: escaped, $options: "i" } })
        .sort({ name: 1 })
        .limit(input.limit)
        .lean()) as any[];
      return docs.map(toSourceSummary);
    }),

  byId: publicProcedure
    .input(z.object({ id: objectId }))
    .query(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (await Source.findById(input.id).lean()) as any;
      if (!source) return null;
      return toSourceSummary(source);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const slug = slugify(input.name);
      if (!slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Source name must contain alphanumeric characters to generate a valid slug",
        });
      }
      try {
        const source = await new Source({
          name: input.name,
          url: input.url ?? null,
          slug,
        }).save();
        return {
          id: source._id.toString(),
          name: source.name,
          url: source.url ?? null,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        };
      } catch (err: unknown) {
        if (isDuplicateKeyError(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A source with this slug already exists",
          });
        }
        throw err;
      }
    }),
});
