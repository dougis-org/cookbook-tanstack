import { createFileRoute, Link } from '@tanstack/react-router'
import PageLayout from '@/components/layout/PageLayout'
import CategoryCard from '@/components/categories/CategoryCard'

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  // Placeholder data - will be replaced with actual data fetching
  const categories = [
    {
      id: '1',
      name: 'Appetizers',
      description: 'Start your meal with delicious starters',
      recipeCount: 15,
    },
    {
      id: '2',
      name: 'Main Courses',
      description: 'Hearty and satisfying main dishes',
      recipeCount: 32,
    },
    {
      id: '3',
      name: 'Desserts',
      description: 'Sweet treats to end your meal',
      recipeCount: 24,
    },
    {
      id: '4',
      name: 'Salads',
      description: 'Fresh and healthy salad recipes',
      recipeCount: 18,
    },
    {
      id: '5',
      name: 'Soups',
      description: 'Warming soups and stews',
      recipeCount: 12,
    },
    {
      id: '6',
      name: 'Beverages',
      description: 'Refreshing drinks and cocktails',
      recipeCount: 10,
    },
  ]

  return (
    <PageLayout
      title="Categories"
      description="Explore recipes by category"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to="/categories/$categoryId"
            params={{ categoryId: category.id }}
          >
            <CategoryCard category={category} />
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
