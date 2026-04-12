import { createRouter } from '@tanstack/react-router'
import type { RouterContext } from '@/types/router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { session: null } satisfies RouterContext,

    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  return router
}
