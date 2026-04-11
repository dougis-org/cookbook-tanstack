import type { ReactNode } from 'react'

// Scopes print-safe CSS variable values to this subtree so that print output
// is always white-background / dark-text regardless of the active theme.
// No DOM side effects — CSS variable cascade replaces the old useLayoutEffect approach.
export function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={
        {
          '--theme-bg': 'white',
          '--theme-surface': '#f9fafb',
          '--theme-surface-raised': '#f3f4f6',
          '--theme-fg': '#111827',
          '--theme-fg-muted': '#4b5563',
          '--theme-fg-subtle': '#9ca3af',
          '--theme-border': '#e5e7eb',
          '--theme-border-muted': '#f3f4f6',
          '--theme-accent': '#0891b2',
          '--theme-accent-hover': '#0e7490',
          '--theme-accent-emphasis': '#155e75',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
