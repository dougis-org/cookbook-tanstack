import mongoose, { Schema } from 'mongoose'

const classificationSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
)

export const Classification =
  mongoose.models.Classification ||
  mongoose.model('Classification', classificationSchema)
