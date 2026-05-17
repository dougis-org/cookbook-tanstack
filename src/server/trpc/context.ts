import { auth } from "@/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { Types } from "mongoose"
import { Collaborator } from "@/db/models"

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
    query: { disableCookieCache: true },
  })

  // Single query per authenticated request; avoids N+1 on every visibilityFilter call.
  let collabCookbookIds: string[] = []
  if (session?.user && Types.ObjectId.isValid(session.user.id)) {
    const collabs = await Collaborator.find({ userId: session.user.id }, { cookbookId: 1 }).lean()
    collabCookbookIds = collabs.map((c) => c.cookbookId.toString())
  }

  return { session: session?.session ?? null, user: session?.user ?? null, collabCookbookIds }
}

export type Context = Awaited<ReturnType<typeof createContext>>
