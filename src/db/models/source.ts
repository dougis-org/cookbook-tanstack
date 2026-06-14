import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISource extends Document {
  name: string;
  url?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true },
    url: { type: String },
    // sparse: true allows the unique index to coexist with pre-backfill documents
    // that have no slug field. Mongoose required:true only enforces at the JS layer;
    // MongoDB's unique index would otherwise reject multiple null-slug docs at creation time.
    slug: { type: String, required: true, unique: true, sparse: true },
  },
  { timestamps: true },
);

export const Source: Model<ISource> =
  (mongoose.models.Source as Model<ISource>) ||
  mongoose.model<ISource>("Source", sourceSchema);
