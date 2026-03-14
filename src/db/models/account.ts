import mongoose, { Schema } from "mongoose";

const accountSchema = new Schema(
  {
    accountId: { type: String, required: true },
    providerId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    idToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
    scope: { type: String },
    password: { type: String },
  },
  { timestamps: true, collection: "account" },
);

export const Account =
  mongoose.models.Account ||
  mongoose.model("Account", accountSchema, "account");
