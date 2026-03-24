import { useState } from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import CookbookCard from '@/components/cookbooks/CookbookCard'
import CookbookFields from '@/components/cookbooks/CookbookFields'
import { Plus, X } from 'lucide-react'

export const Route = createFileRoute('/cookbooks')({
  component: CookbooksPage,
})

export function CookbooksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const { data: cookbooks = [], isLoading } = useQuery(trpc.cookbooks.list.queryOptions())

  return (
    <PageLayout title="Cookbooks" description="Your recipe collections">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-400">
          {cookbooks.length} {cookbooks.length === 1 ? 'cookbook' : 'cookbooks'}
        </span>
        {isLoggedIn && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Cookbook
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-8">
          <CreateCookbookForm onClose={() => setShowCreate(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading cookbooks...</p>
        </div>
      ) : cookbooks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No cookbooks yet.</p>
          {isLoggedIn && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create your first cookbook
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cookbooks.map((cb) => (
            <Link key={cb.id} to="/cookbooks/$cookbookId" params={{ cookbookId: cb.id }}>
              <CookbookCard cookbook={{ ...cb, description: cb.description ?? null, imageUrl: cb.imageUrl ?? null }} />
            </Link>
          ))}
        </div>
      )}
      <Outlet />
    </PageLayout>
  )
}

function CreateCookbookForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation(
    trpc.cookbooks.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['cookbooks']] })
        onClose()
      },
      onError: (err) => setError(err.message),
    }),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined, isPublic })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Cookbook</h2>
        <button type="button" onClick={onClose} aria-label="Close create cookbook form" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CookbookFields
          name={name}
          description={description}
          isPublic={isPublic}
          checkboxId="create-ispublic"
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onIsPublicChange={setIsPublic}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
