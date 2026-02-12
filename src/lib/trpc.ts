import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { QueryClient } from "@tanstack/react-query"
import superjson from "superjson"
import type { AppRouter } from "@/server/trpc/router"

function getBaseUrl() {
  if (typeof window !== "undefined") return ""
  // SSR: need absolute URL for server-side fetch
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// SSR-safe: reuse on the client, create fresh per request on the server
let browserQueryClient: QueryClient | undefined
export function getQueryClient() {
  if (typeof window === "undefined") return new QueryClient()
  if (!browserQueryClient) browserQueryClient = new QueryClient()
  return browserQueryClient
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: `${getBaseUrl()}/api/trpc`, transformer: superjson }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient: getQueryClient(),
})
