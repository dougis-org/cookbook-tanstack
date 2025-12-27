interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-gray-400 text-lg">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
