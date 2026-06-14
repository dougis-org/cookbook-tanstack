import { slugify } from "@/lib/slugify";
import { Source } from "@/db/models";

export async function backfillSourceSlugs() {
  const docs = await Source.find({ slug: { $exists: false } });

  if (docs.length === 0) {
    console.warn(
      "backfillSourceSlugs: no un-slugged documents found — already complete or collection is empty",
    );
    return;
  }

  const bulkOps = docs.map((doc) => {
    const slug = slugify(doc.name);
    if (!slug) {
      throw new Error(
        `backfillSourceSlugs: source "${doc.name}" (${doc._id}) produced an empty slug — fix the name before backfilling`,
      );
    }
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { slug } },
      },
    };
  });

  await Source.bulkWrite(bulkOps);
  console.log(`backfillSourceSlugs: updated ${docs.length} documents`);
}
