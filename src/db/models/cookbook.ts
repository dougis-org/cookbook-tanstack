import mongoose, { Schema } from 'mongoose'

const cookbookSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String },
    isPublic: { type: Boolean, default: true },
    imageUrl: { type: String },
    recipes: [
      {
        recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
        orderIndex: { type: Number },
      },
    ],
  },
  { timestamps: true },
)

cookbookSchema.index({ userId: 1 })

export const Cookbook =
  mongoose.models.Cookbook || mongoose.model('Cookbook', cookbookSchema)
