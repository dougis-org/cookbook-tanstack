import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"

interface AuthPageLayoutProps {
  icon: LucideIcon
  title: string
  children: ReactNode
}

export default function AuthPageLayout({ icon: Icon, title, children }: AuthPageLayoutProps) {
  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <Icon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          {children}
        </div>
      </div>
    </PageLayout>
  )
}
