import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRecipe extends Document {
  userId: Types.ObjectId;
  name: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: "easy" | "medium" | "hard";
  sourceId?: Types.ObjectId;
  classificationId?: Types.ObjectId;
  dateAdded?: Date;
  calories?: number;
  fat?: number;
  cholesterol?: number;
  sodium?: number;
  protein?: number;
  imageUrl?: string;
  isPublic: boolean;
  deleted?: boolean;
  mealIds: Types.ObjectId[];
  courseIds: Types.ObjectId[];
  preparationIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
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
    deleted: { type: Boolean, default: false },
    mealIds: [{ type: Schema.Types.ObjectId, ref: "Meal" }],
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    preparationIds: [{ type: Schema.Types.ObjectId, ref: "Preparation" }],
  },
  { timestamps: true },
);

recipeSchema.index({ userId: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ deleted: 1 });

// Soft-delete middleware — automatically excludes soft-deleted recipes from all reads.
//
// (a) What it does: injects `{ deleted: { $ne: true } }` into every query filter and
//     prepends a `$match` stage to every aggregation pipeline.
// (b) Why `$ne: true` (not `{ deleted: false }`): existing documents that predate the
//     `deleted` field have no value for it. `$ne: true` matches absent, null, and false,
//     so no migration / backfill is needed. A non-sparse index on `deleted` is used so
//     that legacy documents (missing field) are included in the index and can be matched
//     efficiently by this filter.
// (c) Write path: the `delete` mutation uses `Recipe.updateOne()` to soft-delete.
//     `updateOne` does NOT trigger `pre('findOneAndUpdate')`, so it bypasses this
//     middleware cleanly. Never use `findByIdAndUpdate` for the soft-delete write.

const softDeleteFilter = { deleted: { $ne: true } };

for (const hook of [
  "find",
  "findOne",
  "findOneAndUpdate",
  "countDocuments",
] as const) {
  recipeSchema.pre(hook, function () {
    this.where(softDeleteFilter);
  });
}

recipeSchema.pre("aggregate", function () {
  this.pipeline().unshift({ $match: softDeleteFilter });
});

export const Recipe: Model<IRecipe> =
  (mongoose.models.Recipe as Model<IRecipe>) ||
  mongoose.model<IRecipe>("Recipe", recipeSchema);
