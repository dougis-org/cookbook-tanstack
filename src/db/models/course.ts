import mongoose, { Schema } from 'mongoose'

const courseSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String, unique: true, required: true },
  },
  { timestamps: true },
)

export const Course =
  mongoose.models.Course || mongoose.model('Course', courseSchema)
