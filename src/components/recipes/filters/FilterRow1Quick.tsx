import { type ReactNode } from 'react'
import { QUICK_FILTER_TOGGLE_CONFIGS } from './quickFilterConfigs'

interface FilterRow1QuickProps {
  myRecipes: boolean | undefined
  markedByMe: boolean | undefined
  hasImage: boolean | undefined
  isLoggedIn: boolean
  updateSearch: (updates: { myRecipes?: boolean; markedByMe?: boolean; hasImage?: boolean }) => void
}

function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        active ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

export function FilterRow1Quick({
  myRecipes,
  markedByMe,
  hasImage,
  isLoggedIn,
  updateSearch,
}: FilterRow1QuickProps) {
  const filterValuesMap = {
    myRecipes,
    markedByMe,
    hasImage,
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTER_TOGGLE_CONFIGS.map((cfg) => {
        if (cfg.requiresAuth && !isLoggedIn) return null

        const Icon = cfg.icon
        const isActive = !!filterValuesMap[cfg.key]

        return (
          <FilterToggle
            key={cfg.key}
            active={isActive}
            onClick={() =>
              updateSearch({ [cfg.filterKey]: isActive ? undefined : true })
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </FilterToggle>
        )
      })}
    </div>
  )
}

export default FilterRow1Quick
