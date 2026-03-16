import { z } from "zod";
import { ObjectId } from "mongodb";
import { protectedProcedure, router } from "../init";
import { getMongoClient } from "@/db";

interface UserDocument {
  _id: ObjectId;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function transformUserDoc(doc: UserDocument | Record<string, unknown>) {
  const typed = doc as UserDocument;
  return {
    id: typed._id.toHexString(),
    email: typed.email,
    emailVerified: typed.emailVerified,
    name: typed.name ?? null,
    image: typed.image ?? null,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt,
  };
}

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user is already populated from Better-Auth's session
    // Return it directly without additional database queries
    return ctx.user ?? null;
  }),

  updateProfile: protectedProcedure
    .input(
      z
        .object({
          name: z.string().min(1).max(255).optional(),
          image: z.string().url().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
          message: "At least one field must be provided",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getMongoClient().db();
      const usersCollection = db.collection("user");

      const userId = ctx.user.id;
      let objectId: ObjectId;
      try {
        objectId = new ObjectId(userId);
      } catch {
        // protectedProcedure ensures ctx.user exists, so an invalid ObjectId
        // indicates a problem with the session/context and should surface as an error.
        throw new Error("Invalid user ID in session context");
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.image !== undefined) {
        updateData.image = input.image;
      }

      // findOneAndUpdate with returnDocument: "after" returns the modified document,
      // or null if no document matched. The result structure is { value: doc | null }.
      const updated = await usersCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: "after" as const },
      );

      // Fallback: if findOneAndUpdate didn't return the document (either because
      // it wasn't found or due to driver quirks), update separately and query back.
      // This ensures we always return the final document state after the update.
      if (!updated || !updated.value) {
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: updateData },
        );
        const refreshed = await usersCollection.findOne({ _id: objectId });
        if (!refreshed) return null;
        return transformUserDoc(refreshed as UserDocument);
      }

      return transformUserDoc(updated.value as UserDocument);
    }),
});
