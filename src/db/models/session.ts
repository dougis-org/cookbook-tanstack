import mongoose, { Schema } from 'mongoose'

const sessionSchema = new Schema(
  {
    expiresAt: { type: Date, required: true },
    token: { type: String, unique: true, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export const Session =
  mongoose.models.Session || mongoose.model('Session', sessionSchema)
