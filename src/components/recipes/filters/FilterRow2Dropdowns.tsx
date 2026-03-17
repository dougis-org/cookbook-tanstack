import { type FilterConfig } from '@/lib/filterConfig'

interface Classification {
  id: string
  name: string
}

interface Source {
  id: string
  name: string
}

interface FilterRow2DropdownsProps {
  classificationId: string | undefined
  sourceId: string | undefined
  classifications: Classification[] | undefined
  sources: Source[] | undefined
  updateSearch: (updates: { classificationId?: string; sourceId?: string }) => void
  filterConfig?: FilterConfig
  counts?: {
    classificationCounts?: Record<string, number>
    sourceCounts?: Record<string, number>
  }
}

/**
 * FilterRow2Dropdowns - Primary filter dropdowns
 *
 * Displays dropdown selectors for Classification (Category) and Source filters.
 * Counts can be optionally displayed next to each option if provided.
 * Filters rendered are configurable via filterConfig.
 */
export function FilterRow2Dropdowns({
  classificationId,
  sourceId,
  classifications,
  sources,
  updateSearch,
  filterConfig,
  counts,
}: FilterRow2DropdownsProps) {
  const showClassification = !filterConfig || filterConfig.row2Filters.includes('classificationId')
  const showSource = !filterConfig || filterConfig.row2Filters.includes('sourceId')

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-row-2-dropdowns">
      {showClassification && (
        <select
          value={classificationId ?? ''}
          onChange={(e) => updateSearch({ classificationId: e.target.value || undefined })}
          aria-label="Filter by category"
          data-testid="filter-dropdown-classification"
          className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {classifications?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {counts?.classificationCounts?.[c.id] ? ` (${counts.classificationCounts[c.id]})` : ''}
            </option>
          ))}
        </select>
      )}

      {showSource && (
        <select
          value={sourceId ?? ''}
          onChange={(e) => updateSearch({ sourceId: e.target.value || undefined })}
          aria-label="Filter by source"
          data-testid="filter-dropdown-source"
          className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="">All Sources</option>
          {sources?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {counts?.sourceCounts?.[s.id] ? ` (${counts.sourceCounts[s.id]})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default FilterRow2Dropdowns
