import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: 'collaboration_invited' | 'collaboration_removed' | 'recipe_added' | 'recipe_removed';
  read: boolean;
  data?: {
    cookbookId?: Types.ObjectId;
    cookbookTitle?: string;
    recipeId?: Types.ObjectId;
    recipeTitle?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ['collaboration_invited', 'collaboration_removed', 'recipe_added', 'recipe_removed'],
      required: true,
    },
    read: { type: Boolean, default: false, required: true },
    data: {
      cookbookId: { type: Schema.Types.ObjectId, ref: "Cookbook" },
      cookbookTitle: { type: String },
      recipeId: { type: Schema.Types.ObjectId, ref: "Recipe" },
      recipeTitle: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes as requested:
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", notificationSchema);
