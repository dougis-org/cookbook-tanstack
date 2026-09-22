// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { LibraryShare } from "@/db/models";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function makeIds() {
  return {
    ownerId: new Types.ObjectId(),
    recipientId: new Types.ObjectId(),
    addedBy: new Types.ObjectId(),
  };
}

describe("LibraryShare model — schema validation", () => {
  it("saves a valid grant", async () => {
    await withCleanDb(async () => {
      const { ownerId, recipientId, addedBy } = makeIds();
      const doc = await new LibraryShare({ ownerId, recipientId, addedBy }).save();
      expect(doc.ownerId.toString()).toBe(ownerId.toString());
      expect(doc.recipientId.toString()).toBe(recipientId.toString());
    });
  });

  it("requires ownerId", async () => {
    await withCleanDb(async () => {
      const { recipientId, addedBy } = makeIds();
      const doc = new LibraryShare({ recipientId, addedBy });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires recipientId", async () => {
    await withCleanDb(async () => {
      const { ownerId, addedBy } = makeIds();
      const doc = new LibraryShare({ ownerId, addedBy });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires addedBy", async () => {
    await withCleanDb(async () => {
      const { ownerId, recipientId } = makeIds();
      const doc = new LibraryShare({ ownerId, recipientId });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("defaults addedAt to the creation time when not supplied", async () => {
    await withCleanDb(async () => {
      const { ownerId, recipientId, addedBy } = makeIds();
      const before = Date.now();
      const doc = await new LibraryShare({ ownerId, recipientId, addedBy }).save();
      expect(doc.addedAt).toBeInstanceOf(Date);
      expect(doc.addedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });
});

describe("LibraryShare model — unique constraint", () => {
  it("throws a duplicate-key error on the same (ownerId, recipientId) pair; exactly one document exists", async () => {
    await withCleanDb(async () => {
      await LibraryShare.init();
      const { ownerId, recipientId, addedBy } = makeIds();
      await new LibraryShare({ ownerId, recipientId, addedBy }).save();
      const dup = new LibraryShare({ ownerId, recipientId, addedBy });
      await expect(dup.save()).rejects.toMatchObject({ code: 11000 });
      const count = await LibraryShare.countDocuments({ ownerId, recipientId });
      expect(count).toBe(1);
    });
  });

  it("allows the same ownerId shared with different recipients", async () => {
    await withCleanDb(async () => {
      const { ownerId, addedBy } = makeIds();
      const r1 = new Types.ObjectId();
      const r2 = new Types.ObjectId();
      await new LibraryShare({ ownerId, recipientId: r1, addedBy }).save();
      const doc = await new LibraryShare({ ownerId, recipientId: r2, addedBy }).save();
      expect(doc.recipientId.toString()).toBe(r2.toString());
    });
  });

  it("allows the same recipientId receiving from different owners", async () => {
    await withCleanDb(async () => {
      const { recipientId, addedBy } = makeIds();
      const o1 = new Types.ObjectId();
      const o2 = new Types.ObjectId();
      await new LibraryShare({ ownerId: o1, recipientId, addedBy }).save();
      const doc = await new LibraryShare({ ownerId: o2, recipientId, addedBy }).save();
      expect(doc.ownerId.toString()).toBe(o2.toString());
    });
  });
});

describe("LibraryShare model — indexes", () => {
  it("has an index on ownerId, on recipientId, and a unique index on the pair", async () => {
    await withCleanDb(async () => {
      await LibraryShare.init();
      const indexes = await LibraryShare.collection.getIndexes({ full: true }) as { key: Record<string, number>; unique?: boolean }[];
      const hasOwnerIndex = indexes.some((idx) => Object.keys(idx.key).length === 1 && "ownerId" in idx.key);
      const hasRecipientIndex = indexes.some((idx) => Object.keys(idx.key).length === 1 && "recipientId" in idx.key);
      const hasUniquePairIndex = indexes.some(
        (idx) => idx.unique && "ownerId" in idx.key && "recipientId" in idx.key,
      );
      expect(hasOwnerIndex).toBe(true);
      expect(hasRecipientIndex).toBe(true);
      expect(hasUniquePairIndex).toBe(true);
    });
  });
});

describe("LibraryShare model — documentation", () => {
  it("contains a comment explaining why grants are not deleted on downgrade", () => {
    const source = readFileSync(join(__dirname, "..", "library-share.ts"), "utf-8");
    expect(source.toLowerCase()).toMatch(/downgrade/);
    expect(source).toMatch(/design\.md/);
  });
});
