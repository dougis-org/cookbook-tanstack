import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISource extends Document {
  name: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true },
    url: { type: String },
  },
  { timestamps: true },
);

export const Source: Model<ISource> =
  (mongoose.models.Source as Model<ISource>) ||
  mongoose.model<ISource>("Source", sourceSchema);
