import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClassification extends Document {
  name: string;
  description?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const classificationSchema = new Schema<IClassification>(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

export const Classification: Model<IClassification> =
  (mongoose.models.Classification as Model<IClassification>) ||
  mongoose.model<IClassification>("Classification", classificationSchema);
