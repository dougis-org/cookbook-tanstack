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
        return null;
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.image !== undefined) {
        updateData.image = input.image;
      }

      // First try findOneAndUpdate with returnDocument: "after"
      const updated = await usersCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: "after" as const },
      );

      // If that doesn't work, fall back to updateOne then findOne
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
