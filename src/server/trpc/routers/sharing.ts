import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ObjectId } from "mongodb";
import { verifiedProcedure, router } from "../init";
import { execChefProcedure, objectId, sharingEligibleOwnerStages, userLookupStages, isDuplicateKeyError } from "./_helpers";
import { LibraryShare } from "@/db/models";
import { getBetterAuthCollection } from "@/db";

export const sharingRouter = router({
  shareLibrary: execChefProcedure
    .input(z.object({ recipientId: objectId }))
    .mutation(async ({ ctx, input }) => {
      if (!ObjectId.isValid(ctx.user.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid user ID in session context" });
      }
      if (new ObjectId(input.recipientId).equals(new ObjectId(ctx.user.id))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot share your library with yourself" });
      }

      const recipient = await getBetterAuthCollection("user").findOne(
        { _id: { $eq: new ObjectId(String(input.recipientId)) } },
        { projection: { _id: 1 } },
      );
      if (!recipient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      try {
        const grant = await new LibraryShare({
          ownerId: ctx.user.id,
          recipientId: input.recipientId,
          addedBy: ctx.user.id,
        }).save();

        return {
          id: grant.id as string,
          ownerId: grant.ownerId.toString(),
          recipientId: grant.recipientId.toString(),
          addedAt: grant.addedAt,
          addedBy: grant.addedBy.toString(),
        };
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          throw new TRPCError({ code: "CONFLICT", message: "Already sharing your library with this user" });
        }
        throw err;
      }
    }),

  revokeLibraryShare: verifiedProcedure
    .input(z.object({ shareId: objectId }))
    .mutation(async ({ ctx, input }) => {
      const grant = await LibraryShare.findById(input.shareId);
      if (!grant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
      }
      if (grant.ownerId.toString() !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your share" });
      }
      const result = await LibraryShare.deleteOne({ _id: grant._id });
      if (result.deletedCount === 0) {
        // Grant was deleted by a concurrent request between findById and deleteOne.
        throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
      }
      return { success: true };
    }),

  myLibraryShares: verifiedProcedure.query(async ({ ctx }) => {
    if (!ObjectId.isValid(ctx.user.id)) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await LibraryShare.aggregate<any>([
      { $match: { ownerId: { $eq: new ObjectId(ctx.user.id) } } },
      ...sharingEligibleOwnerStages(),
      ...userLookupStages("recipientId", "_recipient"),
      {
        $project: {
          recipientId: 1,
          addedAt: 1,
          recipientName: { $ifNull: ["$_recipient.name", ""] },
        },
      },
    ]);
    return rows.map((r) => ({
      id: (r._id as { toString(): string }).toString(),
      recipientId: (r.recipientId as { toString(): string }).toString(),
      recipientName: r.recipientName as string,
      addedAt: r.addedAt as Date,
    }));
  }),

  mySharedLibraries: verifiedProcedure.query(async ({ ctx }) => {
    if (!ObjectId.isValid(ctx.user.id)) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await LibraryShare.aggregate<any>([
      { $match: { recipientId: { $eq: new ObjectId(ctx.user.id) } } },
      ...sharingEligibleOwnerStages(),
      {
        $project: {
          ownerId: 1,
          addedAt: 1,
          ownerName: { $ifNull: ["$_owner.name", ""] },
        },
      },
    ]);
    return rows.map((r) => ({
      id: (r._id as { toString(): string }).toString(),
      ownerId: (r.ownerId as { toString(): string }).toString(),
      ownerName: r.ownerName as string,
      addedAt: r.addedAt as Date,
    }));
  }),
});
