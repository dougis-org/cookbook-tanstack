import React from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Save, BookOpen, ArrowUpRight, Printer } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import LogoMark from '@/components/ui/LogoMark'
import { TIER_PRICING } from '@/lib/tier-entitlements'

interface ImageSlotProps extends React.HTMLAttributes<HTMLElement> {
  placeholder?: string
  children?: React.ReactNode
  id?: string
}

function ImageSlot({ children, ...props }: ImageSlotProps) {
  return React.createElement('image-slot', props, children)
}

const features = [
  {
    icon: <Save className="w-12 h-12 text-[var(--theme-accent)]" />,
    title: 'Save',
    description:
      'Capture any recipe in seconds. Title, ingredients, steps, your own notes.',
    link: '/auth/register',
  },
  {
    icon: <BookOpen className="w-12 h-12 text-[var(--theme-accent)]" />,
    title: 'Organize',
    description:
      'Sort into cookbooks. Tag by meal, course, prep. Find anything in a click.',
    link: '/auth/register',
  },
  {
    icon: <ArrowUpRight className="w-12 h-12 text-[var(--theme-accent)]" />,
    title: 'Import',
    description:
      'Bring recipes in from JSON exports or paste a URL. Available on Executive Chef.',
    link: '/auth/register',
  },
  {
    icon: <Printer className="w-12 h-12 text-[var(--theme-accent)]" />,
    title: 'Print',
    description:
      'Recipe and cookbook print layouts that look good on paper.',
    link: '/auth/register',
  },
]

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/home' })
    }
  },
  component: HomePage,
})

export function HomePage() {
  const prepCookMonthlyPrice = TIER_PRICING['prep-cook'].monthly?.toFixed(2) ?? '2.99'

  return (
    <PageLayout role="public-marketing">
      <section className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <LogoMark className="w-24 h-24 md:w-32 md:h-32 text-[var(--theme-accent)]" size="auto" />
            <h1 className="text-5xl md:text-7xl font-semibold brand-wordmark">
              My CookBooks
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-[var(--theme-fg-muted)] mb-4 font-light">
            Your Personal Recipe Management System
          </p>
          <p className="text-lg text-[var(--theme-fg-subtle)] max-w-3xl mx-auto mb-8">
            Save every recipe. Build cookbooks. Cook from any device.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="px-8 py-3 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              to="/recipes"
              className="px-8 py-3 border-2 border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-white font-semibold rounded-lg transition-colors"
            >
              Browse Public Recipes
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--theme-fg-muted)]">
            Plans start at ${prepCookMonthlyPrice}/mo.{' '}
            <Link to="/pricing" className="text-[var(--theme-accent)] hover:underline font-medium">
              View Plans
            </Link>
          </p>

          <ImageSlot
            id="landing-screenshot"
            placeholder="Add a screenshot of /recipes"
            className="block mt-12 md:mt-16 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-[var(--theme-shadow-md)] p-8 max-w-3xl mx-auto transition-shadow hover:shadow-[var(--theme-shadow-lg)]"
          >
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <BookOpen className="w-16 h-16 text-[var(--theme-accent)] mb-4 opacity-80" />
              <h3 className="text-2xl font-semibold text-[var(--theme-fg)] mb-2 font-display">
                Explore the Cooking Experience
              </h3>
              <p className="text-[var(--theme-fg-subtle)] text-sm max-w-md">
                This card represents the recipe application dashboard. Add a real screenshot of the /recipes view to fully showcase the interface.
              </p>
            </div>
          </ImageSlot>
        </div>
      </section>

      <section className="py-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-[var(--theme-fg)] text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.link}
              className="bg-[var(--theme-surface)] shadow-[var(--theme-shadow-sm)] backdrop-blur-sm border border-[var(--theme-border)] rounded-xl p-6 hover:border-[var(--theme-accent)]/50 transition-shadow hover:shadow-[var(--theme-shadow-md)]"
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
