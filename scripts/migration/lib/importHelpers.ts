export const DEFAULT_ADMIN_PLACEHOLDER = "__DEFAULT_ADMIN__";

export interface BaseTransformedDocument {
  _id: string;
  legacyId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TaxonomyDocument extends BaseTransformedDocument {
  name: string | null;
  description?: string | null;
  slug?: string | null;
  url?: string | null;
}

export interface RecipeDocument extends BaseTransformedDocument {
  userId: string;
  legacyOwnerId: number | null;
  legacyOwnerSource: string | null;
  name: string | null;
  ingredients: string | null;
  instructions: string | null;
  notes: string | null;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  sourceId: string | null;
  classificationId: string | null;
  dateAdded: string | null;
  calories: number | null;
  fat: number | null;
  cholesterol: number | null;
  sodium: number | null;
  protein: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  marked: boolean;
  mealIds: string[];
  courseIds: string[];
  preparationIds: string[];
}

export interface CookbookDocument extends BaseTransformedDocument {
  userId: string;
  legacyOwnerId: number | null;
  legacyOwnerSource: string | null;
  name: string | null;
  description: string | null;
  isPublic: boolean;
  imageUrl: string | null;
  recipes: Array<{ recipeId: string; orderIndex: number }>;
}

export interface FailureRecord {
  severity: "partial" | "blocking";
  collection: string;
  legacyId?: number;
  reason: string;
}

export function prepareTaxonomyDocument(
  document: TaxonomyDocument,
  ObjectId: typeof import("mongoose").Types.ObjectId,
  collectionName: string,
  allowUrl: boolean,
) {
  if (!document.name?.trim()) {
    return {
      document: null,
      failure: {
        severity: "partial" as const,
        collection: collectionName,
        legacyId: document.legacyId,
        reason: "Required name is missing after transformation.",
      },
    };
  }

  const prepared: Record<string, unknown> = {
    _id: new ObjectId(document._id),
    name: document.name,
    createdAt: parseDate(document.createdAt),
    updatedAt: parseDate(document.updatedAt),
  };

  if (Object.hasOwn(document, "description")) {
    prepared.description = document.description ?? null;
  }

  if (Object.hasOwn(document, "slug")) {
    prepared.slug = document.slug ?? null;
  }

  if (allowUrl) {
    prepared.url = document.url ?? null;
  }

  return { document: prepared };
}

export function prepareRecipeDocument(
  document: RecipeDocument,
  adminUserId: string,
  ObjectId: typeof import("mongoose").Types.ObjectId,
) {
  if (!document.name?.trim()) {
    return {
      document: null,
      failure: {
        severity: "partial" as const,
        collection: "recipes",
        legacyId: document.legacyId,
        reason: "Required recipe name is missing after transformation.",
      },
    };
  }

  if (document.userId !== DEFAULT_ADMIN_PLACEHOLDER) {
    return {
      document: null,
      failure: {
        severity: "partial" as const,
        collection: "recipes",
        legacyId: document.legacyId,
        reason: `Unexpected transformed owner placeholder: ${document.userId}`,
      },
    };
  }

  return {
    document: {
      _id: new ObjectId(document._id),
      userId: new ObjectId(adminUserId),
      name: document.name,
      ingredients: document.ingredients,
      instructions: document.instructions,
      notes: document.notes,
      servings: document.servings,
      prepTime: document.prepTime,
      cookTime: document.cookTime,
      difficulty: document.difficulty,
      sourceId: parseObjectId(document.sourceId, ObjectId),
      classificationId: parseObjectId(document.classificationId, ObjectId),
      dateAdded: parseDate(document.dateAdded),
      calories: document.calories,
      fat: document.fat,
      cholesterol: document.cholesterol,
      sodium: document.sodium,
      protein: document.protein,
      imageUrl: document.imageUrl,
      isPublic: document.isPublic,
      marked: document.marked,
      mealIds: document.mealIds.map((value) => new ObjectId(value)),
      courseIds: document.courseIds.map((value) => new ObjectId(value)),
      preparationIds: document.preparationIds.map(
        (value) => new ObjectId(value),
      ),
      createdAt: parseDate(document.createdAt),
      updatedAt: parseDate(document.updatedAt),
    },
  };
}

export function prepareCookbookDocument(
  document: CookbookDocument,
  adminUserId: string,
  ObjectId: typeof import("mongoose").Types.ObjectId,
) {
  if (!document.name?.trim()) {
    return {
      document: null,
      failure: {
        severity: "partial" as const,
        collection: "cookbooks",
        legacyId: document.legacyId,
        reason: "Required cookbook name is missing after transformation.",
      },
    };
  }

  if (document.userId !== DEFAULT_ADMIN_PLACEHOLDER) {
    return {
      document: null,
      failure: {
        severity: "partial" as const,
        collection: "cookbooks",
        legacyId: document.legacyId,
        reason: `Unexpected transformed owner placeholder: ${document.userId}`,
      },
    };
  }

  return {
    document: {
      _id: new ObjectId(document._id),
      userId: new ObjectId(adminUserId),
      name: document.name,
      description: document.description,
      isPublic: document.isPublic,
      imageUrl: document.imageUrl,
      recipes: document.recipes.map((recipe) => ({
        recipeId: new ObjectId(recipe.recipeId),
        orderIndex: recipe.orderIndex,
      })),
      createdAt: parseDate(document.createdAt),
      updatedAt: parseDate(document.updatedAt),
    },
  };
}

export function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

export function parseObjectId(
  value: string | null,
  ObjectId: typeof import("mongoose").Types.ObjectId,
) {
  return value ? new ObjectId(value) : null;
}
