import mongoose from 'mongoose'

export type ObjectIdType = mongoose.Types.ObjectId

export const timestamps = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
