import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import type { Context } from "./context"
import type { UserTier } from "@/types/user"
import { hasAtLeastTier } from "@/types/user"

export type AppErrorCause =
  | { type: 'tier-wall'; reason: 'count-limit' | 'private-content' | 'import' }
  | { type: 'ownership' }
  | { type: 'email-not-verified' }

const TIER_WALL_REASONS = new Set(['count-limit', 'private-content', 'import'])

export function extractAppError(cause: unknown): AppErrorCause | null {
  if (cause === null || cause === undefined || typeof cause !== 'object') {
    return null
  }
  const c = cause as Record<string, unknown>
  if (c.type === 'tier-wall' && typeof c.reason === 'string' && TIER_WALL_REASONS.has(c.reason)) {
    return { type: 'tier-wall', reason: c.reason as 'count-limit' | 'private-content' | 'import' }
  }
  if (c.type === 'ownership') {
    return { type: 'ownership' }
  }
  if (c.type === 'email-not-verified') {
    return { type: 'email-not-verified' }
  }
  return null
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        appError: extractAppError(error.cause),
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({ ctx: { ...ctx, user: ctx.user, session: ctx.session } })
})

/**
 * Procedure factory that requires the caller to be authenticated and have at
 * least the specified tier. Admins always pass regardless of tier.
 *
 * Usage: `tierProcedure('sous-chef').query(...)` or `.mutation(...)`
 */
export function tierProcedure(tier: UserTier) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!hasAtLeastTier({ tier: ctx.user.tier, isAdmin: ctx.user.isAdmin ?? false }, tier)) {
      throw new TRPCError({ code: "FORBIDDEN" })
    }
    return next({ ctx })
  })
}

/**
 * Procedure that requires the caller to be authenticated and have a verified email.
 * Treats undefined emailVerified as verified (legacy compatibility).
 */
export const verifiedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.emailVerified === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Email verification required",
      cause: { type: 'email-not-verified' },
    })
  }
  return next({ ctx })
})

/**
 * Procedure that requires the caller to be an admin.
 *
 * @future No procedures use this yet. Implemented with real enforcement logic
 * so it is safe to wire up when an admin procedure is added.
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  return next({ ctx })
})
