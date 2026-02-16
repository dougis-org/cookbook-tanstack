import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import CategoryCard from '@/components/categories/CategoryCard'

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { data: classifications, isLoading } = useQuery(
    trpc.classifications.list.queryOptions(),
  )

  return (
    <PageLayout
      title="Categories"
      description="Explore recipes by category"
    >
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classifications?.map((classification) => (
            <Link
              key={classification.id}
              to="/categories/$categoryId"
              params={{ categoryId: classification.id }}
            >
              <CategoryCard category={classification} />
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
