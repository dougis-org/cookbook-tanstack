import { z } from "zod";
import { RECIPE_EXPORT_VERSION } from "@/lib/export";

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "Please enter a valid email";
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
}

export function validateUsername(username: string): string | undefined {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
}

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

export const importedRecipeSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().min(1).max(500),
  ingredients: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  prepTime: z.number().int().positive().nullable().optional(),
  cookTime: z.number().int().positive().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  sourceId: objectIdSchema.nullable().optional(),
  classificationId: objectIdSchema.nullable().optional(),
  dateAdded: z.string().optional(),
  calories: z.number().int().nonnegative().nullable().optional(),
  fat: z.number().nonnegative().nullable().optional(),
  cholesterol: z.number().nonnegative().nullable().optional(),
  sodium: z.number().nonnegative().nullable().optional(),
  protein: z.number().nonnegative().nullable().optional(),
  marked: z.boolean().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isPublic: z.boolean().optional(),
  mealIds: z.array(objectIdSchema).optional(),
  courseIds: z.array(objectIdSchema).optional(),
  preparationIds: z.array(objectIdSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  _version: z.string().default(RECIPE_EXPORT_VERSION),
});

export type ImportedRecipeInput = z.infer<typeof importedRecipeSchema>;
