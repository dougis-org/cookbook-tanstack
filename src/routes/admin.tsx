import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'
import type { RouterContext } from '@/types/router'
import { Shield } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  beforeLoad: (opts: { context: RouterContext; location: { href: string } }) => {
    requireAuth()(opts)
    requireAdmin()(opts)
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-[var(--theme-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--theme-fg)]">Admin</h1>
        </div>
        <nav className="flex gap-4 mb-8 border-b border-[var(--theme-border)] pb-4">
          <Link
            to="/admin/users"
            className="text-sm text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
            activeProps={{ className: 'text-sm text-[var(--theme-accent)] font-medium' }}
          >
            Users
          </Link>
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
