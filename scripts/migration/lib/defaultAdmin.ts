export interface AdminResolution {
  lookupMode: "id" | "email" | "username";
  lookupValue: string;
  resolvedId: string;
  email: string;
  username: string;
}

import { getBetterAuthCollection, toHexString } from "@/db";

export async function resolveDefaultAdminUser(
  ObjectId: {
    isValid: (value: string) => boolean;
    new (value: string): unknown;
  },
  commandName: string,
  mongoClient?: {
    db: () => {
      collection: (name: string) => {
        findOne: (filter: unknown) => Promise<unknown>;
      };
    };
  },
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

  // Resolve the admin user based on the selected lookup mode
  let resolvedId: string;
  let email = process.env.MIGRATION_DEFAULT_ADMIN_EMAIL || "";
  let username = process.env.MIGRATION_DEFAULT_ADMIN_USERNAME || "";

  if (selector.mode === "id") {
    // Direct ObjectId provided
    resolvedId = lookupValue;

    // If a client is available, verify that the ID exists in the BetterAuth user collection.
    if (mongoClient) {
      const usersCollection = getBetterAuthCollection("user", mongoClient.db());
      const idAsObjectId = new ObjectId(lookupValue);
      const resolvedUser = await usersCollection.findOne({ _id: idAsObjectId } as any);
      if (!resolvedUser) {
        throw new Error(
          `MIGRATION_DEFAULT_ADMIN_USER_ID ${lookupValue} does not correspond to an existing user`,
        );
      }
    }
  } else if (!mongoClient) {
    // Email or username mode requires database access
    throw new Error(
      `Cannot resolve admin by ${selector.mode} without MongoDB client. ` +
        `Either provide MIGRATION_DEFAULT_ADMIN_USER_ID as an ObjectId, ` +
        `or ensure mongoClient is passed to resolveDefaultAdminUser()`,
    );
  } else {
    // Query MongoDB for the user by email or username
    const usersCollection = getBetterAuthCollection("user", mongoClient.db());
    const query =
      selector.mode === "email"
        ? { email: lookupValue }
        : { username: lookupValue };

    const user = (await usersCollection.findOne(query as any)) as Record<
      string,
      unknown
    > | null;
    if (!user || !user._id) {
      throw new Error(`Could not find user with ${selector.mode} in database`);
    }

    // Extract the _id and convert to hex string if needed
    const candidateId = toHexString(user._id);
    if (!candidateId) {
      throw new Error("Invalid user ID format in database");
    }

    resolvedId = candidateId;

    email = typeof user.email === "string" ? user.email : email;
    username = typeof user.username === "string" ? user.username : username;
  }

  return {
    lookupMode: selector.mode,
    lookupValue,
    resolvedId,
    email,
    username,
  };
}
