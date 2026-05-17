import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ChefHat, BookOpen, Search } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/home' })
    }
  },
  component: HomePage,
})

export function HomePage() {
  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-[var(--theme-accent)]" />,
      title: 'Recipe Collection',
      description:
        'Browse and manage your favorite recipes. Organize by category, difficulty, and cooking time.',
      link: '/recipes',
    },
    {
      icon: <ChefHat className="w-12 h-12 text-[var(--theme-accent)]" />,
      title: 'Categories',
      description:
        'Explore recipes by category. From appetizers to desserts, find exactly what you need.',
      link: '/categories',
    },
    {
      icon: <Search className="w-12 h-12 text-[var(--theme-accent)]" />,
      title: 'Search & Filter',
      description:
        'Find recipes quickly with advanced search and filtering options by ingredients, time, and more.',
      link: '/recipes',
    },
  ]

  return (
    <PageLayout role="public-marketing">
      <section className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <ChefHat className="w-24 h-24 md:w-32 md:h-32 text-[var(--theme-accent)]" />
            <h1 className="text-5xl md:text-7xl brand-wordmark">
              My CookBooks
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-[var(--theme-fg-muted)] mb-4 font-light">
            Your Personal Recipe Management System
          </p>
          <p className="text-lg text-[var(--theme-fg-subtle)] max-w-3xl mx-auto mb-8">
            Discover, create, and organize your favorite recipes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/recipes"
              className="px-8 py-3 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Browse Recipes
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-3 border-2 border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white font-semibold rounded-lg transition-colors"
            >
              View Plans and Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-[var(--theme-fg)] text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="bg-[var(--theme-surface)] shadow-[var(--theme-shadow-sm)] backdrop-blur-sm border border-[var(--theme-border)] rounded-xl p-6 hover:border-[var(--theme-accent)]/50 transition-all duration-300 hover:shadow-[var(--theme-shadow-md)]"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-[var(--theme-fg)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--theme-fg-subtle)] leading-relaxed">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
