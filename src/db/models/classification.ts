import mongoose, { Schema } from "mongoose";

const classificationSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Classification: mongoose.Model<any> =
  mongoose.models.Classification ||
  mongoose.model<any>("Classification", classificationSchema);
