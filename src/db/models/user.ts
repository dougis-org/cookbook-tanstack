import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    emailVerified: { type: Boolean, default: false },
    username: { type: String, unique: true, required: true },
    displayUsername: { type: String, required: true },
    name: { type: String },
    image: { type: String },
  },
  { timestamps: true, collection: "user" },
);

export const User =
  mongoose.models.User || mongoose.model("User", userSchema, "user");
