import { createFileRoute, Link } from '@tanstack/react-router'
import { ChefHat, BookOpen, Search, Plus } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-cyan-400" />,
      title: 'Recipe Collection',
      description:
        'Browse and manage your favorite recipes. Organize by category, difficulty, and cooking time.',
      link: '/recipes',
    },
    {
      icon: <ChefHat className="w-12 h-12 text-cyan-400" />,
      title: 'Categories',
      description:
        'Explore recipes by category. From appetizers to desserts, find exactly what you need.',
      link: '/categories',
    },
    {
      icon: <Search className="w-12 h-12 text-cyan-400" />,
      title: 'Search & Filter',
      description:
        'Find recipes quickly with advanced search and filtering options by ingredients, time, and more.',
      link: '/recipes',
    },
    {
      icon: <Plus className="w-12 h-12 text-cyan-400" />,
      title: 'Create Recipes',
      description:
        'Add your own recipes to the collection. Share your culinary creations with detailed instructions.',
      link: '/recipes/new',
    },
  ]

  return (
    <PageLayout>
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <ChefHat className="w-24 h-24 md:w-32 md:h-32 text-cyan-400" />
            <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                CookBook
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Your Personal Recipe Management System
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Discover, create, and organize your favorite recipes. Built with TanStack Start
            for a modern, full-stack experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/recipes"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Browse Recipes
            </Link>
            <Link
              to="/recipes/new"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create Recipe
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
