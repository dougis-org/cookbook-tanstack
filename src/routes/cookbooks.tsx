import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import CookbookCard from '@/components/cookbooks/CookbookCard'
import { Plus, X } from 'lucide-react'

export const Route = createFileRoute('/cookbooks')({
  component: CookbooksPage,
})

function CookbooksPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: cookbooks = [], isLoading } = useQuery(trpc.cookbooks.list.queryOptions())

  return (
    <PageLayout title="Cookbooks" description="Your recipe collections">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-400">{cookbooks.length} {cookbooks.length === 1 ? 'cookbook' : 'cookbooks'}</span>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Cookbook
        </button>
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
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            Create your first cookbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cookbooks.map((cb) => (
            <Link
              key={cb.id}
              to="/cookbooks/$cookbookId"
              params={{ cookbookId: cb.id }}
            >
              <CookbookCard
                cookbook={{
                  ...cb,
                  description: cb.description ?? null,
                  imageUrl: cb.imageUrl ?? null,
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}

interface CreateCookbookFormProps {
  onClose: () => void
}

function CreateCookbookForm({ onClose }: CreateCookbookFormProps) {
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
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">New Cookbook</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Cookbook"
            maxLength={255}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="create-ispublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
          />
          <label htmlFor="create-ispublic" className="text-sm text-gray-300">
            Public (visible to everyone)
          </label>
        </div>
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
