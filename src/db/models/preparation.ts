import mongoose, { Schema } from 'mongoose'

const preparationSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
)

export const Preparation =
  mongoose.models.Preparation ||
  mongoose.model('Preparation', preparationSchema)
