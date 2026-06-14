import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRecipeNote extends Document {
  userId: Types.ObjectId;
  recipeId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipeNoteSchema = new Schema<IRecipeNote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipeId: { type: Schema.Types.ObjectId, ref: "Recipe", required: true },
    body: { type: String, required: true, maxlength: 10000, trim: true },
  },
  { timestamps: true }
);

recipeNoteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const RecipeNote: Model<IRecipeNote> =
  (mongoose.models.RecipeNote as Model<IRecipeNote>) ||
  mongoose.model<IRecipeNote>("RecipeNote", recipeNoteSchema);
