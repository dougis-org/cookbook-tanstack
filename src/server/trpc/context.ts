import { auth } from "@/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { Types } from "mongoose"
import { Collaborator, LibraryShare } from "@/db/models"
import { userLookupStages } from "./routers/_helpers"
import { SHARING_OWNER_TIER } from "@/lib/tier-entitlements"

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
    query: { disableCookieCache: true },
  })

  const hasValidUser = Boolean(session?.user && Types.ObjectId.isValid(session.user.id))

  // Single query per authenticated request; avoids N+1 on every visibilityFilter call.
  let collabCookbookIds: string[] = []
  if (hasValidUser) {
    const collabs = await Collaborator.find({ userId: session!.user.id }, { cookbookId: 1 }).lean()
    collabCookbookIds = collabs.map((c) => c.cookbookId.toString())
  }

  // Live at every request (see design.md, Decision 1) — not cached, not denormalized.
  // Exactly one query beyond the collabCookbookIds lookup above: the initial $match on
  // the indexed recipientId returns empty in one round trip for a caller with no
  // grants (the $lookup never executes), so there is no separate existence guard.
  // Fails closed on lookup failure — sharedOwnerIds stays [] rather than propagating
  // (see design.md, Decision 4) — unlike the adjacent collabCookbookIds block above,
  // which still throws. #677 tracks the deliberate follow-up decision on whether to
  // retrofit collabCookbookIds to match.
  let sharedOwnerIds: string[] = []
  if (hasValidUser) {
    try {
      const eligibleOwners = await LibraryShare.aggregate<{ ownerId: Types.ObjectId }>([
        { $match: { recipientId: new Types.ObjectId(session!.user.id) } },
        ...userLookupStages("ownerId", "_owner"),
        { $match: { "_owner.tier": SHARING_OWNER_TIER } },
        { $project: { ownerId: 1 } },
      ])
      sharedOwnerIds = eligibleOwners.map((o) => o.ownerId.toString())
    } catch (err) {
      console.error('[context.sharedOwnerIds] Library-share lookup failed; failing closed:', err)
      sharedOwnerIds = []
    }
  }

  return { session: session?.session ?? null, user: session?.user ?? null, collabCookbookIds, sharedOwnerIds }
}

export type Context = Awaited<ReturnType<typeof createContext>>
