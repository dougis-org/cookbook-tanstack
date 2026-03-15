export interface AdminResolution {
  lookupMode: "id" | "email" | "username";
  lookupValue: string;
  resolvedId: string;
  email: string;
  username: string;
}

export async function resolveDefaultAdminUser(
  ObjectId: {
    isValid: (value: string) => boolean;
  },
  commandName: string,
): Promise<AdminResolution> {
  const selectors = [
    {
      key: "MIGRATION_DEFAULT_ADMIN_USER_ID",
      mode: "id" as const,
      field: "_id",
    },
    {
      key: "MIGRATION_DEFAULT_ADMIN_EMAIL",
      mode: "email" as const,
      field: "email",
    },
    {
      key: "MIGRATION_DEFAULT_ADMIN_USERNAME",
      mode: "username" as const,
      field: "username",
    },
  ].filter((selector) => process.env[selector.key]);

  if (selectors.length !== 1) {
    throw new Error(
      `Set exactly one of MIGRATION_DEFAULT_ADMIN_USER_ID, MIGRATION_DEFAULT_ADMIN_EMAIL, or MIGRATION_DEFAULT_ADMIN_USERNAME before running ${commandName}.`,
    );
  }

  const selector = selectors[0];
  const lookupValue = process.env[selector.key]!.trim();

  if (selector.mode === "id" && !ObjectId.isValid(lookupValue)) {
    throw new Error(
      `MIGRATION_DEFAULT_ADMIN_USER_ID is not a valid ObjectId: ${lookupValue}`,
    );
  }

  // For migration purposes, we accept the provided admin identifier.
  // The email and username will need to be set separately if using ID mode.
  const email = process.env.MIGRATION_DEFAULT_ADMIN_EMAIL || "";
  const username = process.env.MIGRATION_DEFAULT_ADMIN_USERNAME || "";

  return {
    lookupMode: selector.mode,
    lookupValue,
    resolvedId: selector.mode === "id" ? lookupValue : lookupValue,
    email,
    username,
  };
}
