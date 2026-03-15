import mongoose, { Schema } from "mongoose";

const recipeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 500 },
    ingredients: { type: String },
    instructions: { type: String },
    notes: { type: String },
    servings: { type: Number },
    prepTime: { type: Number },
    cookTime: { type: Number },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    sourceId: { type: Schema.Types.ObjectId, ref: "Source" },
    classificationId: { type: Schema.Types.ObjectId, ref: "Classification" },
    dateAdded: { type: Date, default: Date.now },
    calories: { type: Number },
    fat: { type: Number },
    cholesterol: { type: Number },
    sodium: { type: Number },
    protein: { type: Number },
    imageUrl: { type: String },
    isPublic: { type: Boolean, default: true },
    marked: { type: Boolean, default: false },
    mealIds: [{ type: Schema.Types.ObjectId, ref: "Meal" }],
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    preparationIds: [{ type: Schema.Types.ObjectId, ref: "Preparation" }],
  },
  { timestamps: true },
);

recipeSchema.index({ userId: 1 });
recipeSchema.index({ name: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Recipe: mongoose.Model<any> =
  mongoose.models.Recipe || mongoose.model<any>("Recipe", recipeSchema);
