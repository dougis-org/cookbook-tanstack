import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICookbookChapter {
  _id: Types.ObjectId;
  name: string;
  orderIndex: number;
}

export interface ICookbookRecipeEntry {
  recipeId: Types.ObjectId;
  orderIndex?: number;
  chapterId?: Types.ObjectId;
}

export interface ICookbook extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  isPublic: boolean;
  imageUrl?: string;
  hiddenByTier?: boolean;
  recipes: ICookbookRecipeEntry[];
  chapters: ICookbookChapter[];
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
    hiddenByTier: { type: Boolean, default: false },
    recipes: [
      {
        recipeId: {
          type: Schema.Types.ObjectId,
          ref: "Recipe",
          required: true,
        },
        orderIndex: { type: Number },
        chapterId: { type: Schema.Types.ObjectId },
      },
    ],
    chapters: [
      {
        name: { type: String, required: true },
        orderIndex: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

cookbookSchema.index({ userId: 1 });

export const Cookbook: Model<ICookbook> =
  (mongoose.models.Cookbook as Model<ICookbook>) ||
  mongoose.model<ICookbook>("Cookbook", cookbookSchema);
