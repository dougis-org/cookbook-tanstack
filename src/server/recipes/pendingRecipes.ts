import { Recipe } from "@/db/models";

export async function publishPendingRecipes(userId: string): Promise<void> {
  await Recipe.updateMany(
    { userId, pendingVerification: true },
    { $unset: { pendingVerification: 1 } },
  );
}
