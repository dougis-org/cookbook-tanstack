import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { username, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { getMongoClient } from "@/db";
import { sendEmail } from "@/lib/mail";
import { publishPendingRecipes } from "@/server/recipes/pendingRecipes";
import React from "react";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";

function requiredBetterAuthUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error("BETTER_AUTH_URL is not set");
  }
  return url;
}

export const auth = betterAuth({
  trustedOrigins:
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
  // Workaround for nested MongoDB dependency versions (mongoose has its own mongodb package).
  // Cast through unknown to avoid incompatible driver type declarations while retaining runtime behavior.
  database: mongodbAdapter(
    getMongoClient().db() as unknown as import("mongodb").Db,
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password: ${url}`,
        react: React.createElement(PasswordResetEmail, { url }),
      }).catch((error) => {
        console.error("Failed to send reset password email:", error);
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Verify your email address: ${url}`,
        react: React.createElement(VerificationEmail, { url, name: user.name ?? undefined }),
      }).catch((error) => {
        console.error("Failed to send verification email:", error);
      });
    },
    afterEmailVerification: async (user) => {
      await publishPendingRecipes(user.id);
    },
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
      theme: {
        type: "string" as const,
        defaultValue: "dark",
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
    jwt(),
    oauthProvider({
      loginPage: "/auth/login",
      consentPage: "/oauth/consent",
      scopes: ["openid", "profile", "email", "offline_access", "read:own-content"],
      // Pins the only valid token audience to this app's own baseURL. This is
      // also this app's mitigation for GHSA-p2fr-6hmx-4528 (moderate,
      // unpatched as of @better-auth/oauth-provider 1.6.x — fixed only in the
      // 1.7.0-beta.4+ pre-release, which requires a breaking `npx auth
      // migrate` schema migration not taken in this change): with a single
      // audience and no dynamic client registration enabled, there is no
      // "other" audience for the described unbound-resource-indicator issue
      // to redirect a token to. `src/server/alexa/token-validation.ts`
      // independently re-checks `audience` on every verification as
      // defense-in-depth.
      validAudiences: [requiredBetterAuthUrl()],
    }),
    tanstackStartCookies(), // must be last
  ],
});

export type Auth = typeof auth;
