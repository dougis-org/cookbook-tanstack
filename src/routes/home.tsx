import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, BookOpen, Layers, Settings } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { requireAuth } from '@/lib/auth-guard'

export const Route = createFileRoute('/home')({
  beforeLoad: requireAuth(),
  component: HomePageComponent,
})

const SHORTCUTS = [
  {
    title: 'Create Recipe',
    description: 'Add a new recipe to your collection',
    to: '/recipes/new',
    icon: <Plus className="w-6 h-6" />,
  },
  {
    title: 'Import Recipe',
    description: 'Import from a URL',
    to: '/recipes/import',
    icon: <Plus className="w-6 h-6" />,
  },
]

const DISCOVERY = [
  { title: 'All Recipes', to: '/recipes', icon: <BookOpen className="w-6 h-6" /> },
  { title: 'Cookbooks', to: '/cookbooks', icon: <Layers className="w-6 h-6" /> },
  { title: 'Categories', to: '/categories', icon: <Settings className="w-6 h-6" /> },
]

export function HomePageComponent() {
  return (
    <PageLayout role="authenticated-home">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-bold text-[var(--theme-fg)] mb-8">Welcome Home</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section>
            <h2 className="text-2xl font-semibold text-[var(--theme-fg)] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4">
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="flex items-start gap-4 p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:border-[var(--theme-accent)] transition-colors"
                >
                  <div className="p-2 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-lg">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--theme-fg)]">{s.title}</h3>
                    <p className="text-sm text-[var(--theme-fg-subtle)]">{s.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--theme-fg)] mb-4">Discovery</h2>
            <div className="grid grid-cols-1 gap-4">
              {DISCOVERY.map((d) => (
                <Link
                  key={d.to}
                  to={d.to}
                  className="flex items-center gap-4 p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:border-[var(--theme-accent)] transition-colors"
                >
                  <div className="p-2 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-lg">
                    {d.icon}
                  </div>
                  <span className="font-medium text-[var(--theme-fg)]">{d.title}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
