import { db } from "@/db"
import { auth } from "@/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: opts.req.headers })
  return { db, session: session?.session ?? null, user: session?.user ?? null }
}

export type Context = Awaited<ReturnType<typeof createContext>>
