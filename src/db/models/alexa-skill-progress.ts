import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlexaSkillProgress extends Document {
  alexaUserId: string;
  recipeId: string;
  stepIndex: number;
  updatedAt: Date;
}

const alexaSkillProgressSchema = new Schema<IAlexaSkillProgress>(
  {
    alexaUserId: { type: String, required: true, unique: true },
    recipeId: { type: String, required: true },
    stepIndex: { type: Number, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const AlexaSkillProgress: Model<IAlexaSkillProgress> =
  (mongoose.models.AlexaSkillProgress as Model<IAlexaSkillProgress>) ||
  mongoose.model<IAlexaSkillProgress>("AlexaSkillProgress", alexaSkillProgressSchema);
