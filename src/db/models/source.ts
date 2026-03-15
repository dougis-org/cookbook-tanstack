import mongoose, { Schema } from "mongoose";

const sourceSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Source: mongoose.Model<any> =
  mongoose.models.Source || mongoose.model<any>("Source", sourceSchema);
