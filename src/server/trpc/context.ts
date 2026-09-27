import { auth } from "@/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { TRPCError } from "@trpc/server"
import { Types } from "mongoose"
import { Collaborator, LibraryShare } from "@/db/models"
import { sharingEligibleOwnerStages } from "./routers/_helpers"

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
    query: { disableCookieCache: true },
  })

  const hasValidUser = Boolean(session?.user && Types.ObjectId.isValid(session.user.id))
  const userId = session?.user?.id

  // Lazy and scoped: the Collaborator lookup only runs when a `cookbooks.ts` procedure
  // actually calls getCollabCookbookIds(), never unconditionally for every authenticated
  // request — so recipes.ts/privateRecipeNotes.ts/alexa.ts never pay its failure risk.
  // Memoized per request: the first call's promise is cached in this closure, so repeated
  // reads (e.g. printById's three call sites) resolve to one underlying query. Unlike
  // sharedOwnerIds below, a lookup failure here is not swallowed to [] — degrading a real
  // collaborator to "no collaborations" is a silent access-scope reduction, so it rejects
  // with a retry-friendly TRPCError instead (full rationale: the scope-collab-cookbook-lookup
  // design notes, issue #677).
  let collabCookbookIdsPromise: Promise<string[]> | undefined
  function getCollabCookbookIds(): Promise<string[]> {
    if (!collabCookbookIdsPromise) {
      collabCookbookIdsPromise = (async () => {
        if (!hasValidUser) return []
        try {
          const collabs = await Collaborator.find({ userId }, { cookbookId: 1 }).lean()
          return collabs.map((c) => c.cookbookId.toString())
        } catch (err) {
          console.error('[context.collabCookbookIds] Collaborator lookup failed:', err)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to load cookbook collaborations. Please try again.",
            cause: err,
          })
        }
      })()
    }
    return collabCookbookIdsPromise
  }

  // Live at every request (see share-my-library design notes, Decision 1) — not cached,
  // not denormalized. Exactly one query beyond the collabCookbookIds lookup above: the
  // initial $match on the indexed recipientId returns empty in one round trip for a
  // caller with no grants (the $lookup never executes), so there is no separate
  // existence guard. Fails closed on lookup failure — sharedOwnerIds stays [] rather
  // than propagating — unlike the collabCookbookIds accessor above, which fails loud
  // with a TRPCError instead (a deliberate, now-documented asymmetry; see the
  // scope-collab-cookbook-lookup design notes, issue #677).
  let sharedOwnerIds: string[] = []
  if (hasValidUser) {
    try {
      const eligibleOwners = await LibraryShare.aggregate<{ ownerId: Types.ObjectId }>([
        { $match: { recipientId: new Types.ObjectId(session!.user.id) } },
        ...sharingEligibleOwnerStages(),
        { $project: { ownerId: 1 } },
      ])
      sharedOwnerIds = eligibleOwners.map((o) => o.ownerId.toString())
    } catch (err) {
      console.error('[context.sharedOwnerIds] Library-share lookup failed; failing closed:', err)
      sharedOwnerIds = []
    }
  }

  return { session: session?.session ?? null, user: session?.user ?? null, getCollabCookbookIds, sharedOwnerIds }
}

export type Context = Awaited<ReturnType<typeof createContext>>
