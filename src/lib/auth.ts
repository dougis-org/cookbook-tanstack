import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { username } from "better-auth/plugins";
import { getMongoClient } from "@/db";

export const auth = betterAuth({
  // Workaround for nested MongoDB dependency versions (mongoose has its own mongodb package).
  // Cast through unknown to avoid incompatible driver type declarations while retaining runtime behavior.
  database: mongodbAdapter(
    getMongoClient().db() as unknown as import("mongodb").Db,
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      tier: {
        type: "string" as const,
        defaultValue: "home-cook",
        required: false,
      },
      isAdmin: {
        type: "boolean" as const,
        defaultValue: false,
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    username(),
    tanstackStartCookies(), // must be last
  ],
});
