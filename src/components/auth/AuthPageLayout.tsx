import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"

interface AuthPageLayoutProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function AuthPageLayout({ icon: Icon, title, children, maxWidth = "max-w-md" }: AuthPageLayoutProps) {
  return (
    <PageLayout>
      <div className={`${maxWidth} mx-auto`}>
        <div className="bg-[var(--theme-surface)] rounded-xl p-8 shadow-xl border border-[var(--theme-border)]">
          <div className="flex items-center gap-3 mb-6">
            <Icon className="w-6 h-6 text-[var(--theme-accent)]" />
            <h2 className="text-2xl font-bold text-[var(--theme-fg)]">{title}</h2>
          </div>
          {children}
        </div>
      </div>
    </PageLayout>
  )
}
