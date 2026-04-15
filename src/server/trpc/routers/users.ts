import { z } from "zod";
import { ObjectId } from "mongodb";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../init";
import { getMongoClient, toHexString } from "@/db";
import type { UserTier } from "@/types/user";

interface UserDocument {
  _id: ObjectId;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tier?: UserTier;
  isAdmin?: boolean;
}

interface TransformedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  tier?: UserTier;
  isAdmin?: boolean;
}

export function transformUserDoc(
  doc: Record<string, unknown>,
): TransformedUser | null {
  // Validate required fields exist before transformation
  if (!doc || typeof doc !== "object") {
    return null;
  }

  const typed = doc as Partial<UserDocument> & {
    _id?: string | { toHexString?: () => string };
  };
  if (!typed._id) {
    return null;
  }

  const id = toHexString(typed._id);
  if (!id) {
    return null;
  }

  return {
    id,
    email: String(typed.email ?? ""),
    emailVerified: Boolean(typed.emailVerified),
    name: typeof typed.name === "string" ? typed.name : null,
    image: typeof typed.image === "string" ? typed.image : null,
    createdAt: typed.createdAt instanceof Date ? typed.createdAt : new Date(),
    updatedAt: typed.updatedAt instanceof Date ? typed.updatedAt : new Date(),
    tier: typed.tier,
    isAdmin: typed.isAdmin,
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
      const usersCollection = getMongoClient().db().collection("user");

      const userId = ctx.user.id;
      let objectId: ObjectId;
      try {
        objectId = new ObjectId(userId);
      } catch {
        // protectedProcedure ensures ctx.user exists, so an invalid ObjectId
        // indicates a problem with the session/context and should surface as an explicit error.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid user ID in session context",
        });
      }

      const updateData: Partial<
        Pick<UserDocument, "name" | "image" | "updatedAt">
      > = { updatedAt: new Date() };
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
      if (!updated) {
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: updateData },
        );
        const refreshed = await usersCollection.findOne({ _id: objectId });
        if (!refreshed) return null;
        return transformUserDoc(refreshed);
      }

      return transformUserDoc(updated);
    }),
});
