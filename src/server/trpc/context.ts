import { auth } from "@/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { Types } from "mongoose"
import { Collaborator, LibraryShare } from "@/db/models"
import { userLookupStages } from "./routers/_helpers"

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
    query: { disableCookieCache: true },
  })

  const hasValidUser = Boolean(session?.user && Types.ObjectId.isValid(session.user.id))

  // Single query per authenticated request; avoids N+1 on every visibilityFilter call.
  // Runs concurrently with the sharedOwnerIds existence guard below — the two are
  // independent, and this one is allowed to throw (see the sharedOwnerIds comment
  // for why that block does not).
  const collabPromise = hasValidUser
    ? Collaborator.find({ userId: session!.user.id }, { cookbookId: 1 }).lean()
    : Promise.resolve([])

  // Live at every request (see design.md, Decision 1) — not cached, not denormalized.
  // Fails closed on lookup failure — sharedOwnerIds stays [] rather than propagating
  // (see design.md, Decision 4) — unlike the adjacent collabCookbookIds block, which
  // still throws. #677 tracks the deliberate follow-up decision on whether to
  // retrofit collabCookbookIds to match.
  const grantsExistPromise = hasValidUser
    ? LibraryShare.exists({ recipientId: session!.user.id }).catch((err: unknown) => {
        console.error('[context.sharedOwnerIds] Library-share lookup failed; failing closed:', err)
        return 'failed' as const
      })
    : Promise.resolve(null)

  const [collabs, grantsExist] = await Promise.all([collabPromise, grantsExistPromise])
  const collabCookbookIds = collabs.map((c) => c.cookbookId.toString())

  let sharedOwnerIds: string[] = []
  if (grantsExist && grantsExist !== 'failed') {
    try {
      const eligibleOwners = await LibraryShare.aggregate<{ ownerId: Types.ObjectId }>([
        { $match: { recipientId: new Types.ObjectId(session!.user.id) } },
        ...userLookupStages("ownerId", "_owner"),
        { $match: { "_owner.tier": "executive-chef" } },
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
