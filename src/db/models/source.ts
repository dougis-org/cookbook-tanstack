import mongoose, { Schema } from 'mongoose'

const sourceSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String },
  },
  { timestamps: true },
)

export const Source =
  mongoose.models.Source || mongoose.model('Source', sourceSchema)
