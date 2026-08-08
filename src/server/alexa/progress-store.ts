import { AlexaSkillProgress } from "@/db/models";

export interface SkillProgress {
  recipeId: string;
  stepIndex: number;
}

/** Loads the persisted step-navigation progress for an Alexa user, or null if none exists. */
export async function getProgress(alexaUserId: string): Promise<SkillProgress | null> {
  const doc = await AlexaSkillProgress.findOne({ alexaUserId }).lean();
  if (!doc) return null;
  return { recipeId: doc.recipeId, stepIndex: doc.stepIndex };
}

/** Persists (upserts) the current recipe/step for an Alexa user, keyed by their stable Alexa userId. */
export async function saveProgress(alexaUserId: string, progress: SkillProgress): Promise<void> {
  await AlexaSkillProgress.findOneAndUpdate(
    { alexaUserId },
    { $set: { recipeId: progress.recipeId, stepIndex: progress.stepIndex } },
    { upsert: true },
  );
}

/** Clears persisted progress for an Alexa user (e.g. once a recipe is completed). */
export async function clearProgress(alexaUserId: string): Promise<void> {
  await AlexaSkillProgress.deleteOne({ alexaUserId });
}
