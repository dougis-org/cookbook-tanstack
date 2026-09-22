// @vitest-environment node
/**
 * Integration tests for ctx.sharedOwnerIds resolution (Share My Library foundation, #671).
 * Uses a real MongoDB instance to exercise the LibraryShare -> user aggregation directly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { seedUserWithBetterAuth } from "../routers/__tests__/test-helpers";
import { LibraryShare } from "@/db/models";

const mockGetSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

const fetchOpts = {
  req: new Request("http://localhost/api/trpc"),
  resHeaders: new Headers(),
  info: {} as never,
};

async function setTier(userId: string, tier: string) {
  const mongoose = (await import("mongoose")).default;
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection has no active database");
  await db.collection("user").updateOne({ _id: new Types.ObjectId(userId) }, { $set: { tier } });
}

function mockSessionWithUser(userId: string) {
  mockGetSession.mockResolvedValue({ session: { id: "s1" }, user: { id: userId } });
}

describe("createContext — ctx.sharedOwnerIds (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("includes an executive-chef owner's id in ctx.sharedOwnerIds", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "executive-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      mockSessionWithUser(recipient.id);

      const ctx = await createContext(fetchOpts);

      expect(ctx.sharedOwnerIds).toContain(owner.id);
    });
  });

  it("excludes an owner currently below executive-chef, without deleting the grant", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "sous-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      mockSessionWithUser(recipient.id);

      const ctx = await createContext(fetchOpts);

      expect(ctx.sharedOwnerIds).not.toContain(owner.id);
      const stillExists = await LibraryShare.findOne({ ownerId: owner.id, recipientId: recipient.id });
      expect(stillExists).not.toBeNull();
    });
  });

  it("re-includes an owner re-upgraded to executive-chef, with no new grant row created", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "executive-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      await setTier(owner.id, "sous-chef");
      await setTier(owner.id, "executive-chef");
      mockSessionWithUser(recipient.id);

      const ctx = await createContext(fetchOpts);

      expect(ctx.sharedOwnerIds).toContain(owner.id);
      const count = await LibraryShare.countDocuments({ ownerId: owner.id, recipientId: recipient.id });
      expect(count).toBe(1);
    });
  });

  it("yields [] and issues no LibraryShare aggregation for a caller with zero grant rows", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const recipient = await seedUserWithBetterAuth();
      mockSessionWithUser(recipient.id);
      const aggregateSpy = vi.spyOn(LibraryShare, "aggregate");

      const ctx = await createContext(fetchOpts);

      expect(ctx.sharedOwnerIds).toEqual([]);
      expect(aggregateSpy).not.toHaveBeenCalled();
    });
  });

  it("issues exactly one additional aggregation round trip, projecting only ownerId, for a caller with grants", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "executive-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      mockSessionWithUser(recipient.id);
      const aggregateSpy = vi.spyOn(LibraryShare, "aggregate");

      await createContext(fetchOpts);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      const pipeline = aggregateSpy.mock.calls[0]?.[0] as { $project?: Record<string, number> }[];
      const projectStage = pipeline.find((stage) => "$project" in stage);
      expect(projectStage).toBeDefined();
      expect(Object.keys(projectStage!.$project!)).toEqual(["ownerId"]);
    });
  });

  it("degrades to [] without throwing when the aggregation fails, and context creation still succeeds", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "executive-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      mockSessionWithUser(recipient.id);
      vi.spyOn(LibraryShare, "aggregate").mockImplementation(() => {
        throw new Error("forced aggregation failure");
      });

      const ctx = await createContext(fetchOpts);

      expect(ctx.sharedOwnerIds).toEqual([]);
    });
  });

  it("produces a visibility filter with no shared-owner clause when the aggregation fails", async () => {
    await withCleanDb(async () => {
      const { createContext } = await import("@/server/trpc/context");
      const { visibilityFilter } = await import("../routers/_helpers");
      const owner = await seedUserWithBetterAuth();
      const recipient = await seedUserWithBetterAuth();
      await setTier(owner.id, "executive-chef");
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
      mockSessionWithUser(recipient.id);
      vi.spyOn(LibraryShare, "aggregate").mockImplementation(() => {
        throw new Error("forced aggregation failure");
      });

      const ctx = await createContext(fetchOpts);
      const filter = visibilityFilter({ id: recipient.id }, ctx.collabCookbookIds, ctx.sharedOwnerIds) as { $or: object[] };

      const hasSharedClause = filter.$or.some(
        (c) => "userId" in c && "$in" in (c as { userId: { $in?: unknown } }).userId,
      );
      expect(hasSharedClause).toBe(false);
    });
  });

  it("does not change collabCookbookIds's existing throw-on-failure behavior", async () => {
    await withCleanDb(async () => {
      const { Collaborator } = await import("@/db/models");
      const { createContext } = await import("@/server/trpc/context");
      const recipient = await seedUserWithBetterAuth();
      mockSessionWithUser(recipient.id);
      vi.spyOn(Collaborator, "find").mockImplementation(() => {
        throw new Error("forced collaborator failure");
      });

      await expect(createContext(fetchOpts)).rejects.toThrow("forced collaborator failure");
    });
  });
});
