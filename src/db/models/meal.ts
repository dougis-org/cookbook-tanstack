import mongoose, { Schema } from 'mongoose'

const mealSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
)

export const Meal = mongoose.models.Meal || mongoose.model('Meal', mealSchema)
