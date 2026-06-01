import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { Notification } from "@/db/models";
import { getMongoClient } from "@/db";
import { ObjectId } from "mongodb";
import { objectId } from "./_helpers";

export const notificationsRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    // Highly optimized index-only query using compound index { userId: 1, read: 1 }
    const count = await Notification.countDocuments({
      userId: ctx.user.id,
      read: false,
    });
    return count;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Query returning the 10 most recent notifications for the authenticated user, sorted by createdAt descending
    const docs = await Notification.find({ userId: ctx.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (docs.length === 0) {
      return [];
    }

    // Populate sender details (name, email) from the 'user' collection
    // Stringify ObjectIds first to ensure correct deduplication by string value
    const uniqueSenderIds = Array.from(new Set(docs.map((doc) => doc.senderId.toString())));
    const senderIds = uniqueSenderIds.map((id) => new ObjectId(id));
    const usersCollection = getMongoClient().db().collection("user");
    
    const senders = await usersCollection
      .find({ _id: { $in: senderIds } })
      .project({ name: 1, email: 1 })
      .toArray();

    const senderMap = new Map(
      senders.map((s) => [s._id.toString(), s])
    );

    return docs.map((doc) => {
      const senderDoc = senderMap.get(doc.senderId.toString());
      return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        senderId: doc.senderId.toString(),
        type: doc.type,
        read: doc.read,
        data: doc.data ? {
          cookbookId: doc.data.cookbookId?.toString(),
          cookbookTitle: doc.data.cookbookTitle,
          recipeId: doc.data.recipeId?.toString(),
          recipeTitle: doc.data.recipeTitle,
        } : undefined,
        sender: {
          id: doc.senderId.toString(),
          name: typeof senderDoc?.name === "string" ? senderDoc.name : "Unknown User",
          email: typeof senderDoc?.email === "string" ? senderDoc.email : "",
        },
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });
  }),

  markRead: protectedProcedure
    .input(
      z.object({
        id: objectId.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await Notification.updateOne(
          { _id: new ObjectId(input.id), userId: ctx.user.id },
          { $set: { read: true } }
        );
      } else {
        await Notification.updateMany(
          { userId: ctx.user.id, read: false },
          { $set: { read: true } }
        );
      }
      return { success: true };
    }),
});
