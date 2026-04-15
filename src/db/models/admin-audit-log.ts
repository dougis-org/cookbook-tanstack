import mongoose, { Schema, type Document } from 'mongoose'
import type { UserTier } from '@/types/user'

export interface AdminAuditLogDocument extends Document {
  adminId: string
  adminEmail: string
  targetUserId: string
  targetEmail: string
  action: 'set-tier'
  before: { tier: UserTier }
  after: { tier: UserTier }
  createdAt: Date
  updatedAt: Date
}

const adminAuditLogSchema = new Schema<AdminAuditLogDocument>(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    targetUserId: { type: String, required: true },
    targetEmail: { type: String, required: true },
    action: { type: String, enum: ['set-tier'], required: true },
    before: {
      tier: { type: String, required: true },
    },
    after: {
      tier: { type: String, required: true },
    },
  },
  { timestamps: true },
)

export const AdminAuditLog =
  mongoose.models.AdminAuditLog ??
  mongoose.model<AdminAuditLogDocument>('AdminAuditLog', adminAuditLogSchema)
