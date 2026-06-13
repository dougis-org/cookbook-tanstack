import { slugify } from "../../../scripts/migration/lib/transformHelpers";
import { Source } from "@/db/models";

export async function backfillSourceSlugs() {
  const docs = await Source.find({ slug: { $exists: false } });

  if (docs.length === 0) {
    console.warn(
      "backfillSourceSlugs: no un-slugged documents found — already complete or collection is empty",
    );
    return;
  }

  let count = 0;
  for (const doc of docs) {
    const slug = slugify(doc.name);
    await doc.updateOne({ $set: { slug } });
    count++;
  }

  console.log(`backfillSourceSlugs: updated ${count} documents`);
}
