// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { LibraryShare } from "@/db/models";
import { seedUserWithBetterAuth, makeAuthCaller, makeAnonCaller } from "./test-helpers";

const seedUser = seedUserWithBetterAuth;

async function setTier(userId: string, tier: string) {
  const { getBetterAuthCollection } = await import("@/db");
  await getBetterAuthCollection("user").updateOne(
    { _id: new Types.ObjectId(userId) },
    { $set: { tier } },
  );
}

/** Seed an owner + recipient pair with a grant between them, optionally setting the owner's tier. */
async function seedGrant(opts: { ownerTier?: string } = {}) {
  const owner = await seedUser();
  if (opts.ownerTier) await setTier(owner.id, opts.ownerTier);
  const recipient = await seedUser();
  const grant = await LibraryShare.create({ ownerId: owner.id, recipientId: recipient.id, addedBy: owner.id });
  return { owner, recipient, grant };
}

/** Seed a grant whose owner has since dropped from executive-chef to sous-chef and back. */
async function seedDowngradedThenRestoredGrant() {
  const { owner, recipient } = await seedGrant({ ownerTier: "executive-chef" });
  await setTier(owner.id, "sous-chef");
  await setTier(owner.id, "executive-chef");
  return { owner, recipient };
}

/** Assert a revokeLibraryShare call is rejected with `code` and the grant survives. */
async function expectRevokeRejected(
  caller: Awaited<ReturnType<typeof makeAuthCaller>> | Awaited<ReturnType<typeof makeAnonCaller>>,
  shareId: string,
  code: string,
) {
  await expect(caller.sharing.revokeLibraryShare({ shareId })).rejects.toMatchObject({ code });
  expect(await LibraryShare.findById(shareId)).not.toBeNull();
}

describe("sharing.shareLibrary", () => {
  it("creates a grant with correct ownerId, recipientId, addedBy, and populated addedAt", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const recipient = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const result = await caller.sharing.shareLibrary({ recipientId: recipient.id });

      expect(result.ownerId).toBe(owner.id);
      expect(result.recipientId).toBe(recipient.id);
      expect(result.addedBy).toBe(owner.id);
      expect(result.addedAt).toBeInstanceOf(Date);

      const row = await LibraryShare.findOne({ ownerId: owner.id, recipientId: recipient.id });
      expect(row).not.toBeNull();
    });
  });

  it.each(["home-cook", "prep-cook", "sous-chef"])(
    "throws FORBIDDEN for a %s caller and creates no row",
    async (tier) => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        const recipient = await seedUser();
        const caller = await makeAuthCaller(owner.id, { tier });

        await expect(
          caller.sharing.shareLibrary({ recipientId: recipient.id }),
        ).rejects.toMatchObject({ code: "FORBIDDEN" });

        const row = await LibraryShare.findOne({ ownerId: owner.id, recipientId: recipient.id });
        expect(row).toBeNull();
      });
    },
  );

  it("throws UNAUTHORIZED for an unauthenticated caller", async () => {
    await withCleanDb(async () => {
      const recipient = await seedUser();
      const caller = await makeAnonCaller();

      await expect(
        caller.sharing.shareLibrary({ recipientId: recipient.id }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  it("throws BAD_REQUEST for a self-share and creates no row", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await expect(
        caller.sharing.shareLibrary({ recipientId: owner.id }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const row = await LibraryShare.findOne({ ownerId: owner.id, recipientId: owner.id });
      expect(row).toBeNull();
    });
  });

  it("throws BAD_REQUEST for a self-share even when recipientId is upper-cased hex", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await expect(
        caller.sharing.shareLibrary({ recipientId: owner.id.toUpperCase() }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const row = await LibraryShare.findOne({ ownerId: owner.id, recipientId: owner.id });
      expect(row).toBeNull();
    });
  });

  it("throws NOT_FOUND for a non-existent recipient id and creates no row", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });
      const fakeRecipientId = "a".repeat(24);

      await expect(
        caller.sharing.shareLibrary({ recipientId: fakeRecipientId }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const row = await LibraryShare.findOne({ ownerId: owner.id, recipientId: fakeRecipientId });
      expect(row).toBeNull();
    });
  });

  it("throws CONFLICT for a duplicate pair and leaves exactly one row", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const recipient = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await caller.sharing.shareLibrary({ recipientId: recipient.id });

      await expect(
        caller.sharing.shareLibrary({ recipientId: recipient.id }),
      ).rejects.toMatchObject({ code: "CONFLICT" });

      const count = await LibraryShare.countDocuments({ ownerId: owner.id, recipientId: recipient.id });
      expect(count).toBe(1);
    });
  });
});

describe("sharing.revokeLibraryShare", () => {
  it("owner revokes and the row is deleted", async () => {
    await withCleanDb(async () => {
      const { owner, grant } = await seedGrant({ ownerTier: "executive-chef" });
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const result = await caller.sharing.revokeLibraryShare({ shareId: grant.id });

      expect(result).toEqual({ success: true });
      expect(await LibraryShare.findById(grant.id)).toBeNull();
    });
  });

  it("throws FORBIDDEN for a non-owner and the grant survives", async () => {
    await withCleanDb(async () => {
      const { grant } = await seedGrant();
      const other = await seedUser();
      const caller = await makeAuthCaller(other.id);

      await expectRevokeRejected(caller, grant.id, "FORBIDDEN");
    });
  });

  it("throws FORBIDDEN when the recipient attempts to revoke their own received grant, and it survives", async () => {
    await withCleanDb(async () => {
      const { recipient, grant } = await seedGrant();
      const caller = await makeAuthCaller(recipient.id);

      await expectRevokeRejected(caller, grant.id, "FORBIDDEN");
    });
  });

  it("throws NOT_FOUND for a non-existent grant id", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const caller = await makeAuthCaller(owner.id);
      const fakeShareId = "a".repeat(24);

      await expect(
        caller.sharing.revokeLibraryShare({ shareId: fakeShareId }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  it("allows a downgraded owner to revoke their own grant (not tier-gated)", async () => {
    await withCleanDb(async () => {
      const { owner, grant } = await seedGrant();
      const caller = await makeAuthCaller(owner.id, { tier: "sous-chef" });

      const result = await caller.sharing.revokeLibraryShare({ shareId: grant.id });

      expect(result).toEqual({ success: true });
    });
  });

  it("throws UNAUTHORIZED for an unauthenticated caller", async () => {
    await withCleanDb(async () => {
      const { grant } = await seedGrant();
      const caller = await makeAnonCaller();

      await expectRevokeRejected(caller, grant.id, "UNAUTHORIZED");
    });
  });

  it("deletes only the targeted grant, leaving sibling grants for the same owner intact", async () => {
    await withCleanDb(async () => {
      const { owner, grant: grantA } = await seedGrant({ ownerTier: "executive-chef" });
      const recipientB = await seedUser();
      const grantB = await LibraryShare.create({ ownerId: owner.id, recipientId: recipientB.id, addedBy: owner.id });
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await caller.sharing.revokeLibraryShare({ shareId: grantA.id });

      expect(await LibraryShare.findById(grantA.id)).toBeNull();
      expect(await LibraryShare.findById(grantB.id)).not.toBeNull();
    });
  });
});

describe("sharing.myLibraryShares", () => {
  it("returns grants given, with the recipient's display name", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedGrant({ ownerTier: "executive-chef" });
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows).toHaveLength(1);
      expect(rows[0].recipientId).toBe(recipient.id);
      expect(rows[0].recipientName).toBe(recipient.name);
    });
  });

  it("excludes a grant whose owner is currently below executive-chef", async () => {
    await withCleanDb(async () => {
      const { owner } = await seedGrant();
      await setTier(owner.id, "sous-chef");
      const caller = await makeAuthCaller(owner.id, { tier: "sous-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows).toHaveLength(0);
      expect(await LibraryShare.countDocuments({ ownerId: owner.id })).toBe(1);
    });
  });

  it("re-includes the grant once the owner is restored to executive-chef, with no new grant row", async () => {
    await withCleanDb(async () => {
      const { owner } = await seedDowngradedThenRestoredGrant();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows).toHaveLength(1);
      expect(await LibraryShare.countDocuments({ ownerId: owner.id })).toBe(1);
    });
  });

  it("never exposes email or tier for the recipient", async () => {
    await withCleanDb(async () => {
      const { owner } = await seedGrant({ ownerTier: "executive-chef" });
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows[0]).not.toHaveProperty("email");
      expect(rows[0]).not.toHaveProperty("tier");
    });
  });

  it("throws UNAUTHORIZED for an unauthenticated caller", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();

      await expect(caller.sharing.myLibraryShares()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  it("returns an empty array when the caller has no grants", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows).toEqual([]);
    });
  });

  it("returns exactly the caller's own grants, one row per recipient, excluding an unrelated owner's grants", async () => {
    await withCleanDb(async () => {
      const { owner, recipient: recipientA } = await seedGrant({ ownerTier: "executive-chef" });
      const recipientB = await seedUser();
      await LibraryShare.create({ ownerId: owner.id, recipientId: recipientB.id, addedBy: owner.id });
      await seedGrant({ ownerTier: "executive-chef" }); // unrelated owner/recipient pair
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const rows = await caller.sharing.myLibraryShares();

      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.recipientId).sort()).toEqual([recipientA.id, recipientB.id].sort());
    });
  });
});

describe("sharing.mySharedLibraries", () => {
  it("returns grants received, with the owner's display name", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedGrant({ ownerTier: "executive-chef" });
      const caller = await makeAuthCaller(recipient.id);

      const rows = await caller.sharing.mySharedLibraries();

      expect(rows).toHaveLength(1);
      expect(rows[0].ownerId).toBe(owner.id);
      expect(rows[0].ownerName).toBe(owner.name);
    });
  });

  it("excludes a grant whose owner is currently below executive-chef", async () => {
    await withCleanDb(async () => {
      const { recipient } = await seedGrant();
      const caller = await makeAuthCaller(recipient.id);

      const rows = await caller.sharing.mySharedLibraries();

      expect(rows).toHaveLength(0);
    });
  });

  it("re-includes the grant once the owner is restored to executive-chef, with no new grant row", async () => {
    await withCleanDb(async () => {
      const { recipient } = await seedDowngradedThenRestoredGrant();
      const caller = await makeAuthCaller(recipient.id);

      const rows = await caller.sharing.mySharedLibraries();

      expect(rows).toHaveLength(1);
      expect(await LibraryShare.countDocuments({ recipientId: recipient.id })).toBe(1);
    });
  });

  it("never exposes email or tier for the owner, and a non-executive-chef recipient can still call it", async () => {
    await withCleanDb(async () => {
      const { recipient } = await seedGrant({ ownerTier: "executive-chef" });
      const caller = await makeAuthCaller(recipient.id, { tier: "home-cook" });

      const rows = await caller.sharing.mySharedLibraries();

      expect(rows).toHaveLength(1);
      expect(rows[0]).not.toHaveProperty("email");
      expect(rows[0]).not.toHaveProperty("tier");
    });
  });
});
