import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICollaborator extends Document {
  cookbookId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'editor' | 'viewer';
  addedAt: Date;
  addedBy: Types.ObjectId;
}

const collaboratorSchema = new Schema<ICollaborator>({
  cookbookId: { type: Schema.Types.ObjectId, ref: "Cookbook", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ['editor', 'viewer'], required: true },
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

collaboratorSchema.index({ userId: 1 });
collaboratorSchema.index({ cookbookId: 1 });
collaboratorSchema.index({ cookbookId: 1, userId: 1 }, { unique: true });

export const Collaborator: Model<ICollaborator> =
  (mongoose.models.Collaborator as Model<ICollaborator>) ||
  mongoose.model<ICollaborator>("Collaborator", collaboratorSchema);
