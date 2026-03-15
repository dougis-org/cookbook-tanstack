import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICookbookRecipeEntry {
  recipeId: Types.ObjectId;
  orderIndex?: number;
}

export interface ICookbook extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  isPublic: boolean;
  imageUrl?: string;
  recipes: ICookbookRecipeEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const cookbookSchema = new Schema<ICookbook>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String },
    isPublic: { type: Boolean, default: true },
    imageUrl: { type: String },
    recipes: [
      {
        recipeId: {
          type: Schema.Types.ObjectId,
          ref: "Recipe",
          required: true,
        },
        orderIndex: { type: Number },
      },
    ],
  },
  { timestamps: true },
);

cookbookSchema.index({ userId: 1 });

export const Cookbook: Model<ICookbook> =
  (mongoose.models.Cookbook as Model<ICookbook>) ||
  mongoose.model<ICookbook>("Cookbook", cookbookSchema);
