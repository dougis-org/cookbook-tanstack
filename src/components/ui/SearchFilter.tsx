import { RecipeFilters } from '@/types/recipe'

interface SearchFilterProps {
  filters: RecipeFilters
  onFiltersChange: (filters: RecipeFilters) => void
}

export default function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Search & Filter
      </h2>

      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Recipes
          </label>
          <input
            type="text"
            placeholder="Search by name or ingredients..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            value={filters.searchTerm || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            value={filters.category || ''}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {/* Categories will be populated here */}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            value={filters.difficulty || ''}
            onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value as any })}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Time Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Prep Time
            </label>
            <input
              type="number"
              placeholder="Minutes"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              value={filters.maxPrepTime || ''}
              onChange={(e) => onFiltersChange({ ...filters, maxPrepTime: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Cook Time
            </label>
            <input
              type="number"
              placeholder="Minutes"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              value={filters.maxCookTime || ''}
              onChange={(e) => onFiltersChange({ ...filters, maxCookTime: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <button
          className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          onClick={() => onFiltersChange({})}
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
