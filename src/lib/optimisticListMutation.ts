import type { MutationKey, QueryClient, QueryKey } from '@tanstack/react-query'

interface OptimisticListMutationOptions<TItem, TVars, TContext> {
  queryClient: QueryClient
  queryKey: QueryKey
  /** Every mutation key that writes to `queryKey`; the refetch waits for all of them to settle. */
  mutationKeys: MutationKey[]
  /** Returns the optimistic list plus anything `revert` needs to undo it. */
  apply: (list: TItem[], vars: TVars) => { list: TItem[]; context?: TContext }
  /** Inverse of `apply`, run against the *current* list so unrelated changes survive. */
  revert: (list: TItem[], vars: TVars, context: TContext | undefined) => TItem[]
}

/**
 * Builds `onMutate` / `onError` / `onSettled` for optimistic add/remove on a
 * list query. Rollback is by inverse operation (not snapshot restore) so
 * overlapping mutations don't erase each other, and the refetch is deferred
 * until the last mutation sharing any of `mutationKeys` settles.
 */
export function optimisticListMutation<TItem, TVars, TContext = undefined>({
  queryClient,
  queryKey,
  mutationKeys,
  apply,
  revert,
}: OptimisticListMutationOptions<TItem, TVars, TContext>) {
  const readList = () => queryClient.getQueryData<TItem[]>(queryKey) ?? []

  return {
    onMutate: async (vars: TVars): Promise<TContext | undefined> => {
      await queryClient.cancelQueries({ queryKey })
      // Nothing cached yet (initial load): writing here would hide the real
      // list behind a lone optimistic row. The settle-time refetch reconciles.
      if (queryClient.getQueryData(queryKey) === undefined) return undefined
      const { list, context } = apply(readList(), vars)
      queryClient.setQueryData<TItem[]>(queryKey, list)
      return context
    },
    onError: (_error: unknown, vars: TVars, context: TContext | undefined) => {
      if (queryClient.getQueryData(queryKey) === undefined) return
      queryClient.setQueryData<TItem[]>(queryKey, revert(readList(), vars, context))
    },
    onSettled: () => {
      // The settling mutation still counts itself while onSettled runs.
      const inFlight = mutationKeys.reduce((total, mutationKey) => total + queryClient.isMutating({ mutationKey }), 0)
      if (inFlight <= 1) {
        return queryClient.invalidateQueries({ queryKey })
      }
    },
  }
}
