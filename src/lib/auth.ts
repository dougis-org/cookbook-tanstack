import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { username } from "better-auth/plugins";
import { getMongoClient } from "@/db";

export const auth = betterAuth({
  // Workaround for nested MongoDB dependency versions (mongoose has its own mongodb package).
  // We cast through unknown to ensure the adapter accepts the runtime DB object.
  // If dependencies are aligned, this cast can be removed.
  database: mongodbAdapter(
    getMongoClient().db() as unknown as import("mongodb").Db,
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
