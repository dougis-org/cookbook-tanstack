// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Source } from "@/db/models";

async function verifyPersonalSource() {
  const doc = await Source.findOne({ slug: "personal" });
  expect(doc).not.toBeNull();
  expect(doc?.name).toBe("Personal");
}

describe("Source model — slug field", () => {
  it("TC-1.1 — slug is required: save without slug rejects with ValidatorError", async () => {
    await withCleanDb(async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Source({ name: "Test Source" } as any).save(),
      ).rejects.toMatchObject({
        errors: { slug: { kind: "required" } },
      });
    });
  });

  it("TC-1.2 — slug uniqueness: duplicate slug rejects with duplicate key error", async () => {
    await withCleanDb(async () => {
      await new Source({ name: "Bon Appetit", slug: "bon-appetit" }).save();
      await expect(
        new Source({ name: "Bon Appetit 2", slug: "bon-appetit" }).save(),
      ).rejects.toMatchObject({ code: 11000 });
    });
  });

  it("TC-1.3 — slug index exists", async () => {
    await withCleanDb(async () => {
      await Source.init(); // ensure Mongoose has built indexes before inspecting
      const indexes = await Source.collection.indexes();
      const slugIndex = indexes.find((idx) => "slug" in idx.key);
      expect(slugIndex).toBeDefined();
      expect(slugIndex).toMatchObject({ unique: true });
    });
  });
});

describe("backfillSourceSlugs()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-2.1 — derives slug from name", async () => {
    await withCleanDb(async () => {
      // Insert without slug via raw collection to bypass Mongoose required validation
      await Source.collection.insertOne({ name: "Bon Appetit", createdAt: new Date(), updatedAt: new Date() });

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();

      const doc = await Source.findOne({ name: "Bon Appetit" });
      expect(doc?.slug).toBe("bon-appetit");
    });
  });

  it("TC-2.2 — .com source name produces run-together slug", async () => {
    await withCleanDb(async () => {
      await Source.collection.insertOne({ name: "allrecipies.com", createdAt: new Date(), updatedAt: new Date() });

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();

      const doc = await Source.findOne({ name: "allrecipies.com" });
      expect(doc?.slug).toBe("allrecipiescom");
    });
  });

  it("TC-2.3 — special characters slugified correctly", async () => {
    await withCleanDb(async () => {
      await Source.collection.insertMany([
        { name: "C&H Sugar", createdAt: new Date(), updatedAt: new Date() },
        { name: "Baker's", createdAt: new Date(), updatedAt: new Date() },
        { name: "Dad (Massenburg)", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();

      const docs = await Source.find({}).lean();
      const slugs = docs.map((d) => d.slug).sort();
      expect(slugs).toContain("ch-sugar");
      expect(slugs).toContain("bakers");
      expect(slugs).toContain("dad-massenburg");
    });
  });

  it("TC-2.4 — idempotent: running twice leaves slug unchanged", async () => {
    await withCleanDb(async () => {
      await Source.collection.insertOne({ name: "Bon Appetit", createdAt: new Date(), updatedAt: new Date() });

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();
      const after1 = await Source.findOne({ name: "Bon Appetit" });
      const slug1 = after1?.slug;

      await backfillSourceSlugs();
      const after2 = await Source.findOne({ name: "Bon Appetit" });
      expect(after2?.slug).toBe(slug1);
    });
  });

  it("TC-2.5 — skips already-slugged documents", async () => {
    await withCleanDb(async () => {
      // One document already has a slug
      await new Source({ name: "Pre-Slugged", slug: "pre-slugged" }).save();
      // One without
      await Source.collection.insertOne({ name: "No Slug Yet", createdAt: new Date(), updatedAt: new Date() });

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();

      const preSlug = await Source.findOne({ name: "Pre-Slugged" });
      expect(preSlug?.slug).toBe("pre-slugged");

      const newSlug = await Source.findOne({ name: "No Slug Yet" });
      expect(newSlug?.slug).toBe("no-slug-yet");
    });
  });

  it("TC-2.6 — logs warning when zero documents need updating", async () => {
    await withCleanDb(async () => {
      const warnSpy = vi.spyOn(console, "warn");

      const { backfillSourceSlugs } = await import("@/db/seeds/sources");
      await backfillSourceSlugs();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("no un-slugged documents found"),
      );
    });
  });
});

describe("seedSources()", () => {
  it("TC-3.1 — Verify seedSources() inserts a Source document with slug: 'personal' and name: 'Personal' when the database is empty", async () => {
    await withCleanDb(async () => {
      const { seedSources } = await import("@/db/seeds/sources");

      const initialCount = await Source.countDocuments({ slug: "personal" });
      expect(initialCount).toBe(0);

      await seedSources();

      await verifyPersonalSource();
    });
  });

  it("TC-3.2 — Verify seedSources() is idempotent", async () => {
    await withCleanDb(async () => {
      const { seedSources } = await import("@/db/seeds/sources");

      await seedSources();
      await seedSources();
      await seedSources();

      const count = await Source.countDocuments({ slug: "personal" });
      expect(count).toBe(1);

      const docs = await Source.find({ slug: "personal" });
      expect(docs.length).toBe(1);
      expect(docs[0].name).toBe("Personal");
    });
  });
});

describe("db:seed Integration", () => {
  it("TC-4.1 — Verify running the full db:seed entrypoint seeds the Personal source correctly", async () => {
    await withCleanDb(async () => {
      const initialCount = await Source.countDocuments({ slug: "personal" });
      expect(initialCount).toBe(0);

      // Use a dynamic import to get the main function and run it
      const { main } = await import("../seeds/index");
      await main();

      await verifyPersonalSource();
    });
  });
});

