import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import RecipeForm from '@/components/recipes/RecipeForm'

export const Route = createFileRoute('/recipes/new')({
  component: NewRecipePage,
})

function NewRecipePage() {
  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>
      </div>

      <RecipeForm />
    </PageLayout>
  )
}
