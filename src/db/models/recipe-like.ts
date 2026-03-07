import mongoose, { Schema } from 'mongoose'

const recipeLikeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  createdAt: { type: Date, default: Date.now },
})

recipeLikeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

export const RecipeLike =
  mongoose.models.RecipeLike || mongoose.model('RecipeLike', recipeLikeSchema)
