import { useState, useRef, useCallback, useEffect } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"

export function useRecipeSearch() {
  const [inputValue, setInputValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSearchChange = useCallback((value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchTerm(value), 300)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const query = useInfiniteQuery(
    trpc.recipes.list.infiniteQueryOptions(
      { pageSize: 20, search: searchTerm || undefined },
      {
        initialCursor: 1,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  )

  return {
    inputValue,
    onSearchChange,
    recipes: query.data?.pages.flatMap((p) => p.items) ?? [],
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
  }
}
