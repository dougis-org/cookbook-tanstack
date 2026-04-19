import React from 'react'
import { isAdEligible, PageRole } from '@/lib/ad-policy'
import { useAuth } from '@/hooks/useAuth'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  role?: PageRole
}

export function AdSlot({ role, position }: { role: PageRole; position: string }) {
  const { session } = useAuth()
  
  if (!role || !isAdEligible(role, session)) {
    return null
  }

  return (
    <div 
      data-testid={`ad-slot-${position}`}
      className="my-8 p-4 border-2 border-dashed border-[var(--theme-border)] rounded-lg text-center bg-[var(--theme-surface)]"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-fg-muted)]">
        Advertisement Groundwork ({position})
      </p>
    </div>
  )
}

export default function PageLayout({ 
  children, 
  title, 
  description,
  role = 'authenticated-task'
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="container mx-auto px-4 py-8">
        {(title || description) && (
          <div className="mb-8" data-testid="page-title-section">
            {title && (
              <h1 className="text-4xl font-bold text-[var(--theme-fg)] mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-[var(--theme-fg-subtle)] text-lg">{description}</p>
            )}
          </div>
        )}
        
        <AdSlot role={role} position="top" />
        
        {children}
        
        <AdSlot role={role} position="bottom" />
      </div>
    </div>
  )
}
