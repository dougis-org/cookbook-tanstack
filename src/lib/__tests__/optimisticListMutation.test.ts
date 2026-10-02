import { describe, it, expect, vi } from 'vitest'
import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { optimisticListMutation } from '@/lib/optimisticListMutation'

const queryKey = ['items']
const mutationKey = ['items', 'mutate']

function makeClient(initial?: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (initial) queryClient.setQueryData(queryKey, initial)
  return queryClient
}

function appendHelper(queryClient: QueryClient) {
  return optimisticListMutation<string, string, string | undefined>({
    queryClient,
    queryKey,
    mutationKeys: [mutationKey],
    apply: (list, item) => ({ list: [...list, item], context: item }),
    revert: (list, _item, added) => list.filter((entry) => entry !== added),
  })
}

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('optimisticListMutation', () => {
  it('T1: onMutate cancels in-flight queries for the key before applying', async () => {
    const queryClient = makeClient(['a', 'b'])
    const order: string[] = []
    vi.spyOn(queryClient, 'cancelQueries').mockImplementation(async () => {
      order.push('cancel')
    })
    const setSpy = vi.spyOn(queryClient, 'setQueryData')
    setSpy.mockImplementation(((...args: unknown[]) => {
      order.push('set')
      return (QueryClient.prototype.setQueryData as (...a: unknown[]) => unknown).apply(queryClient, args)
    }) as never)

    await appendHelper(queryClient).onMutate('c')

    expect(queryClient.cancelQueries).toHaveBeenCalledWith({ queryKey })
    expect(order).toEqual(['cancel', 'set'])
    expect(queryClient.getQueryData(queryKey)).toEqual(['a', 'b', 'c'])
  })

  it('T2: onMutate returns the context produced by apply', async () => {
    const queryClient = makeClient(['a'])
    const context = await appendHelper(queryClient).onMutate('c')
    expect(context).toBe('c')
  })

  it('T3: onError reverts with (currentList, vars, context)', async () => {
    const queryClient = makeClient(['a', 'b'])
    const revert = vi.fn((list: string[], _vars: string, added: string | undefined) => list.filter((e) => e !== added))
    const helper = optimisticListMutation<string, string, string | undefined>({
      queryClient,
      queryKey,
      mutationKeys: [mutationKey],
      apply: (list, item) => ({ list: [...list, item], context: item }),
      revert,
    })
    const context = await helper.onMutate('c')
    expect(queryClient.getQueryData(queryKey)).toEqual(['a', 'b', 'c'])

    helper.onError(new Error('boom'), 'c', context)

    expect(revert).toHaveBeenCalledWith(['a', 'b', 'c'], 'c', 'c')
    expect(queryClient.getQueryData(queryKey)).toEqual(['a', 'b'])
  })

  it('T4: revert is by inverse and keeps unrelated optimistic changes', async () => {
    const queryClient = makeClient(['a', 'b'])
    const helper = appendHelper(queryClient)
    const ctxC = await helper.onMutate('c')
    await helper.onMutate('d')

    helper.onError(new Error('boom'), 'c', ctxC)

    expect(queryClient.getQueryData(queryKey)).toEqual(['a', 'b', 'd'])
  })

  it('T6: apply and revert tolerate an empty cache entry', async () => {
    const queryClient = makeClient()
    const helper = appendHelper(queryClient)
    const context = await helper.onMutate('c')
    expect(queryClient.getQueryData(queryKey)).toEqual(['c'])

    helper.onError(new Error('boom'), 'c', context)
    expect(queryClient.getQueryData(queryKey)).toEqual([])
  })

  it('T5: invalidates only once, when the last mutation of the key settles', async () => {
    const queryClient = makeClient(['a'])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const first = deferred()
    const second = deferred()
    const helper = appendHelper(queryClient)

    const run = (item: string, gate: ReturnType<typeof deferred>) => {
      const observer = new MutationObserver<void, Error, string, string | undefined>(queryClient, {
        mutationKey,
        mutationFn: () => gate.promise,
        ...helper,
      })
      const result = observer.mutate(item).catch(() => undefined)
      return result
    }

    const p1 = run('b', first)
    const p2 = run('c', second)
    await vi.waitFor(() => expect(queryClient.isMutating({ mutationKey })).toBe(2))

    first.resolve()
    await p1
    expect(invalidate).not.toHaveBeenCalled()

    second.resolve()
    await p2
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey })
  })

  it('T5b: a lone failing mutation reverts and still invalidates', async () => {
    const queryClient = makeClient(['a'])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const gate = deferred()
    const observer = new MutationObserver<void, Error, string, string | undefined>(queryClient, {
      mutationKey,
      mutationFn: () => gate.promise,
      ...appendHelper(queryClient),
    })

    const result = observer.mutate('b').catch(() => undefined)
    await vi.waitFor(() => expect(queryClient.getQueryData(queryKey)).toEqual(['a', 'b']))
    gate.reject(new Error('nope'))
    await result

    expect(queryClient.getQueryData(queryKey)).toEqual(['a'])
    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it('T5c: waits for in-flight mutations under any of the listed keys', async () => {
    const queryClient = makeClient(['a'])
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const otherKey = ['items', 'other']
    const helper = optimisticListMutation<string, string, string | undefined>({
      queryClient,
      queryKey,
      mutationKeys: [mutationKey, otherKey],
      apply: (list, item) => ({ list: [...list, item], context: item }),
      revert: (list, _item, added) => list.filter((entry) => entry !== added),
    })
    const first = deferred()
    const second = deferred()
    const run = (key: string[], gate: ReturnType<typeof deferred>, item: string) =>
      new MutationObserver<void, Error, string, string | undefined>(queryClient, {
        mutationKey: key,
        mutationFn: () => gate.promise,
        ...helper,
      })
        .mutate(item)
        .catch(() => undefined)

    const p1 = run(mutationKey, first, 'b')
    const p2 = run(otherKey, second, 'c')
    await vi.waitFor(() => expect(queryClient.isMutating()).toBe(2))

    first.resolve()
    await p1
    expect(invalidate).not.toHaveBeenCalled()
    second.resolve()
    await p2
    expect(invalidate).toHaveBeenCalledTimes(1)
  })
})
