import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILibraryShare extends Document {
  ownerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  addedAt: Date;
  addedBy: Types.ObjectId;
}

const libraryShareSchema = new Schema<ILibraryShare>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

libraryShareSchema.index({ ownerId: 1 });
libraryShareSchema.index({ recipientId: 1 });
libraryShareSchema.index({ ownerId: 1, recipientId: 1 }, { unique: true });

// Grants are never deleted on owner tier downgrade: eligibility is evaluated live
// against the owner's current tier on every request (see design.md, Decision 3),
// so a re-upgrade restores access with no re-grant and no reconciliation job.
export const LibraryShare: Model<ILibraryShare> =
  (mongoose.models.LibraryShare as Model<ILibraryShare>) ||
  mongoose.model<ILibraryShare>("LibraryShare", libraryShareSchema);
